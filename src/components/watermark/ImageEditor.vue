<template>
  <div
    class="relative w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-300"
    :style="{ height: containerHeight + 'px' }"
  >
    <div class="relative w-full h-full flex items-center justify-center p-4">
      <div
        ref="canvasWrapper"
        class="relative select-none"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      >
        <!-- 图片Canvas（底层） -->
        <canvas ref="imageCanvas" class="absolute top-0 left-0"></canvas>

        <!-- 遮罩Canvas（裁剪框 + 暗色遮罩，裁剪模式可见） -->
        <canvas
          ref="overlayCanvas"
          class="absolute top-0 left-0 pointer-events-none"
          :style="{ opacity: isCropMode ? 1 : 0 }"
        ></canvas>

        <!-- 交互Canvas（顶层：擦除 or 裁剪鼠标事件） -->
        <canvas
          ref="drawingCanvas"
          class="absolute top-0 left-0 cursor-crosshair"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseLeave"
        ></canvas>
      </div>
    </div>

    <!-- 工具提示 -->
    <div class="absolute top-4 left-4 bg-white px-3 py-1.5 rounded shadow z-10 text-xs text-gray-500">
      <template v-if="currentTool === 'erase'">按住鼠标左键涂抹需要擦除的水印区域</template>
      <template v-else-if="currentTool === 'crop-rect'">拖拽调整矩形裁剪框的位置和大小</template>
      <template v-else-if="currentTool === 'crop-circle'">拖拽调整圆形裁剪框的位置和大小</template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { loadImage, fitImageSize } from '../../utils/imageUtils.js';
import { useCanvasHistory } from '../../composables/useCanvasHistory.js';

const props = defineProps({
  imageUrl: { type: String, required: true },
  currentTool: {
    type: String,
    default: 'erase',
    validator: (v) => ['crop-rect', 'crop-circle', 'erase'].includes(v)
  },
  brushSize: { type: Number, default: 40 },
  containerHeight: { type: Number, default: 520 },
  targetWidth: { type: Number, default: 800 },
  targetHeight: { type: Number, default: 800 }
});

const emit = defineEmits(['mask-ready', 'crop-change']);

// DOM 引用
const canvasWrapper = ref(null);
const imageCanvas = ref(null);
const overlayCanvas = ref(null);
const drawingCanvas = ref(null);

// 显示尺寸（响应式，用于模板中 canvas 容器宽高）
const canvasWidth = ref(0);
const canvasHeight = ref(0);

// 原图尺寸（坐标映射用）
let origW = 0;
let origH = 0;

// 擦除状态
const isDrawing = ref(false);
let lastPos = null;

const { saveState, undo, redo, canUndo, canRedo, clearHistory } = useCanvasHistory();

const isCropMode = computed(() => props.currentTool === 'crop-rect' || props.currentTool === 'crop-circle');

// ── 裁剪框：普通变量，不走 Vue 响应式 ──
// 所有拖拽过程中的计算和渲染都不经过 Vue
let cropBox = null; // { x, y, width, height }
let cropAction = null;    // 'draw-new' | 'move' | 'resize-nw/ne/sw/se'
let cropDragStart = null; // { mouseX, mouseY, startX?, startY?, boxSnapshot? }
let rafId = null;
let pendingMousePos = null;

// 角手柄碰撞检测尺寸
const HANDLE_SIZE = 12;

// ────────────────────────────────────────────────────────────────
// 图片加载
// ────────────────────────────────────────────────────────────────

const loadImageToCanvas = async () => {
  if (!props.imageUrl) return;
  try {
    const img = await loadImage(props.imageUrl);
    origW = img.width;
    origH = img.height;

    const maxW = Math.min(700, canvasWrapper.value?.parentElement?.clientWidth - 32 || 700);
    const maxH = props.containerHeight - 70;
    const fitted = fitImageSize(img.width, img.height, maxW, maxH);
    canvasWidth.value = fitted.width;
    canvasHeight.value = fitted.height;

    await nextTick();

    [imageCanvas.value, overlayCanvas.value, drawingCanvas.value].forEach(c => {
      c.width = fitted.width;
      c.height = fitted.height;
    });

    imageCanvas.value.getContext('2d').drawImage(img, 0, 0, fitted.width, fitted.height);
    drawingCanvas.value.getContext('2d').clearRect(0, 0, fitted.width, fitted.height);

    initCropBox();
    renderOverlay();
    emitCropChange();

    clearHistory();
    saveState(drawingCanvas.value.toDataURL());
    emit('mask-ready', drawingCanvas.value);
  } catch (err) {
    console.error('加载图片失败:', err);
  }
};

// ────────────────────────────────────────────────────────────────
// 裁剪框初始化（按目标输出比例居中）
// ────────────────────────────────────────────────────────────────

const initCropBox = () => {
  const ratio = props.targetWidth / props.targetHeight;
  const canvasRatio = canvasWidth.value / canvasHeight.value;
  let boxW, boxH;
  if (ratio >= canvasRatio) {
    boxW = Math.round(canvasWidth.value * 0.9);
    boxH = Math.round(boxW / ratio);
  } else {
    boxH = Math.round(canvasHeight.value * 0.9);
    boxW = Math.round(boxH * ratio);
  }
  cropBox = {
    x: Math.round((canvasWidth.value - boxW) / 2),
    y: Math.round((canvasHeight.value - boxH) / 2),
    width: boxW,
    height: boxH
  };
};

// ────────────────────────────────────────────────────────────────
// 遮罩 + 裁剪框渲染（全部画在 overlayCanvas，零 Vue 响应式）
// ────────────────────────────────────────────────────────────────

const renderOverlay = () => {
  if (!overlayCanvas.value || !cropBox) return;
  const ctx = overlayCanvas.value.getContext('2d');
  const w = canvasWidth.value;
  const h = canvasHeight.value;
  const { x, y, width, height } = cropBox;
  const isCircle = props.currentTool === 'crop-circle';

  ctx.clearRect(0, 0, w, h);

  // 暗色遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, w, h);

  // 挖出裁剪区域
  ctx.globalCompositeOperation = 'destination-out';
  if (isCircle) {
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, width, height);
  }
  ctx.globalCompositeOperation = 'source-over';

  // 裁剪框边线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2;
  if (isCircle) {
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeRect(x, y, width, height);
  }

  // 四个角手柄（小白方块）
  ctx.fillStyle = 'white';
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1;
  const hs = HANDLE_SIZE;
  const handles = [
    { hx: x - hs / 2,         hy: y - hs / 2 },
    { hx: x + width - hs / 2, hy: y - hs / 2 },
    { hx: x - hs / 2,         hy: y + height - hs / 2 },
    { hx: x + width - hs / 2, hy: y + height - hs / 2 }
  ];
  handles.forEach(({ hx, hy }) => {
    ctx.fillRect(hx, hy, hs, hs);
    ctx.strokeRect(hx, hy, hs, hs);
  });
};

// ────────────────────────────────────────────────────────────────
// 发送裁剪区域（mouseup 时调用，不在拖拽中频繁触发）
// ────────────────────────────────────────────────────────────────

const emitCropChange = () => {
  if (!cropBox) return;
  const scaleX = origW / canvasWidth.value;
  const scaleY = origH / canvasHeight.value;
  emit('crop-change', {
    x: Math.round(cropBox.x * scaleX),
    y: Math.round(cropBox.y * scaleY),
    width: Math.round(cropBox.width * scaleX),
    height: Math.round(cropBox.height * scaleY),
    isCircle: props.currentTool === 'crop-circle'
  });
};

// ────────────────────────────────────────────────────────────────
// 鼠标命中检测（判断点击位置：角手柄 / 框内 / 框外）
// ────────────────────────────────────────────────────────────────

const hitTest = (px, py) => {
  if (!cropBox) return 'draw-new';
  const { x, y, width, height } = cropBox;
  const hs = HANDLE_SIZE;

  // 角手柄检测
  if (px >= x - hs && px <= x + hs && py >= y - hs && py <= y + hs) return 'resize-nw';
  if (px >= x + width - hs && px <= x + width + hs && py >= y - hs && py <= y + hs) return 'resize-ne';
  if (px >= x - hs && px <= x + hs && py >= y + height - hs && py <= y + height + hs) return 'resize-sw';
  if (px >= x + width - hs && px <= x + width + hs && py >= y + height - hs && py <= y + height + hs) return 'resize-se';

  // 框内（移动）
  if (px >= x && px <= x + width && py >= y && py <= y + height) return 'move';

  // 框外（重新绘制）
  return 'draw-new';
};

// ────────────────────────────────────────────────────────────────
// 鼠标事件
// ────────────────────────────────────────────────────────────────

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// 获取鼠标相对画布的坐标；crop 模式下 clamp 到画布范围，
// 这样鼠标出界后坐标贴边，实现最大化裁剪
const getMousePos = (e) => {
  const rect = drawingCanvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (isCropMode.value) {
    return { x: clamp(x, 0, rect.width), y: clamp(y, 0, rect.height) };
  }
  return { x, y };
};

// window 级别的拖拽监听，crop 拖拽时挂上，mouseup 后摘掉
// 目的：鼠标离开 canvas 后仍能收到 mousemove/mouseup
let globalMoveHandler = null;
let globalUpHandler = null;

const attachGlobalCropListeners = () => {
  globalMoveHandler = (e) => handleCropMouseMove(e);
  globalUpHandler = () => finishCropDrag();
  window.addEventListener('mousemove', globalMoveHandler);
  window.addEventListener('mouseup', globalUpHandler);
};

const detachGlobalCropListeners = () => {
  if (globalMoveHandler) { window.removeEventListener('mousemove', globalMoveHandler); globalMoveHandler = null; }
  if (globalUpHandler) { window.removeEventListener('mouseup', globalUpHandler); globalUpHandler = null; }
};

const finishCropDrag = () => {
  detachGlobalCropListeners();
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  pendingMousePos = null;
  cropAction = null;
  cropDragStart = null;
  emitCropChange();
};

const handleMouseDown = (e) => {
  const pos = getMousePos(e);
  if (isCropMode.value) {
    cropAction = hitTest(pos.x, pos.y);
    cropDragStart = {
      mouseX: pos.x,
      mouseY: pos.y,
      startX: pos.x,
      startY: pos.y,
      boxSnapshot: cropBox ? { ...cropBox } : null
    };
    // 挂 window 监听，保证拖出画布边界时仍能继续操作
    attachGlobalCropListeners();
  } else {
    isDrawing.value = true;
    lastPos = pos;
  }
};

const handleMouseMove = (e) => {
  // crop 模式由 window 监听接管，这里只处理擦除
  if (!isCropMode.value) handleEraseMouseMove(e);
};

const handleMouseUp = () => {
  // crop 模式由 window 监听的 finishCropDrag 处理
  if (!isCropMode.value) finishErase();
};

const handleMouseLeave = () => {
  if (!isCropMode.value) finishErase();
  // 裁剪模式：window 监听接管，离开画布不中断
};

// RAF 节流：记录最新位置，每帧只算一次，纯 canvas 操作，零 Vue 响应式
const handleCropMouseMove = (e) => {
  if (!cropAction || !cropDragStart) return;
  pendingMousePos = getMousePos(e);
  if (rafId) return;

  rafId = requestAnimationFrame(() => {
    rafId = null;
    const pos = pendingMousePos;
    if (!pos || !cropAction || !cropDragStart) return;

    const dx = pos.x - cropDragStart.mouseX;
    const dy = pos.y - cropDragStart.mouseY;
    // 锁定输出宽高比，圆形模式下也保证正圆（椭圆底层是正方形 bbox）
    const ratio = props.targetWidth / props.targetHeight;
    const MIN = 30;

    if (cropAction === 'draw-new') {
      // 以 x 轴距离为主，高度按比例算，防止随意拖出不规则形状
      const sx = cropDragStart.startX;
      const sy = cropDragStart.startY;
      const w = clamp(Math.abs(pos.x - sx), MIN, canvasWidth.value);
      const h = w / ratio;
      const nx = pos.x >= sx ? sx : sx - w;
      const ny = pos.y >= sy ? sy : sy - h;
      cropBox = {
        x: clamp(nx, 0, canvasWidth.value - w),
        y: clamp(ny, 0, canvasHeight.value - h),
        width: w,
        height: h
      };

    } else if (cropAction === 'move') {
      const snap = cropDragStart.boxSnapshot;
      cropBox = {
        ...snap,
        x: clamp(snap.x + dx, 0, canvasWidth.value - snap.width),
        y: clamp(snap.y + dy, 0, canvasHeight.value - snap.height)
      };

    } else if (cropAction.startsWith('resize-')) {
      const snap = cropDragStart.boxSnapshot;
      const handle = cropAction.replace('resize-', '');
      let newW, newH, newX, newY;

      // 统一以宽度为主驱动，高度由比例推算，始终锁定比例
      if (handle === 'se') {
        newW = clamp(snap.width + dx, MIN, canvasWidth.value - snap.x);
        newH = newW / ratio;
        newX = snap.x;
        newY = snap.y;
      } else if (handle === 'sw') {
        newW = clamp(snap.width - dx, MIN, snap.x + snap.width);
        newH = newW / ratio;
        newX = snap.x + snap.width - newW;
        newY = snap.y;
      } else if (handle === 'ne') {
        newW = clamp(snap.width + dx, MIN, canvasWidth.value - snap.x);
        newH = newW / ratio;
        newX = snap.x;
        newY = snap.y + snap.height - newH; // 底边固定，顶边随比例上移
      } else { // nw
        newW = clamp(snap.width - dx, MIN, snap.x + snap.width);
        newH = newW / ratio;
        newX = snap.x + snap.width - newW; // 右边固定，左边随比例左移
        newY = snap.y + snap.height - newH; // 底边固定，顶边随比例上移
      }

      // 超出画布边界时，反向约束（高度溢出则压缩宽度）
      if (newY < 0) { newY = 0; newH = snap.y + snap.height; newW = newH * ratio; }
      if (newX < 0) { newX = 0; }
      if (newY + newH > canvasHeight.value) { newH = canvasHeight.value - newY; newW = newH * ratio; }
      if (newX + newW > canvasWidth.value) { newW = canvasWidth.value - newX; newH = newW / ratio; }

      cropBox = { x: newX, y: newY, width: newW, height: newH };
    }

    renderOverlay();
  });
};

// ────────────────────────────────────────────────────────────────
// 擦除工具
// ────────────────────────────────────────────────────────────────

const handleEraseMouseMove = (e) => {
  if (!isDrawing.value) return;
  const pos = getMousePos(e);
  const ctx = drawingCanvas.value.getContext('2d');
  if (lastPos) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgb(255, 0, 0)';
    ctx.fillStyle = 'rgb(255, 0, 0)';
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = props.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, props.brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  lastPos = pos;
};

const finishErase = () => {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  lastPos = null;
  saveState(drawingCanvas.value.toDataURL());
};

// ────────────────────────────────────────────────────────────────
// 撤销 / 重做
// ────────────────────────────────────────────────────────────────

const handleUndo = () => {
  const s = undo();
  if (s) restoreEraseState(s);
};

const handleRedo = () => {
  const s = redo();
  if (s) restoreEraseState(s);
};

const restoreEraseState = (dataUrl) => {
  const img = new Image();
  img.onload = () => {
    const ctx = drawingCanvas.value.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
    ctx.drawImage(img, 0, 0);
  };
  img.src = dataUrl;
};

const clearMask = () => {
  drawingCanvas.value.getContext('2d').clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  clearHistory();
  saveState(drawingCanvas.value.toDataURL());
};

const getMaskCanvas = () => drawingCanvas.value;

// 获取裁剪区域（原图坐标）
const getCropArea = () => {
  if (!cropBox) return null;
  const scaleX = origW / canvasWidth.value;
  const scaleY = origH / canvasHeight.value;
  return {
    x: Math.round(cropBox.x * scaleX),
    y: Math.round(cropBox.y * scaleY),
    width: Math.round(cropBox.width * scaleX),
    height: Math.round(cropBox.height * scaleY),
    isCircle: props.currentTool === 'crop-circle'
  };
};

// 从外部恢复裁剪框（切换图片时由父组件调用）
const setCropBox = (area) => {
  if (!canvasWidth.value || !canvasHeight.value) return;
  if (!area) {
    initCropBox();
  } else {
    const scaleX = canvasWidth.value / origW;
    const scaleY = canvasHeight.value / origH;
    cropBox = {
      x: Math.round(area.x * scaleX),
      y: Math.round(area.y * scaleY),
      width: Math.round(area.width * scaleX),
      height: Math.round(area.height * scaleY)
    };
  }
  renderOverlay();
  emitCropChange();
};

defineExpose({ handleUndo, handleRedo, clearMask, getMaskCanvas, getCropArea, setCropBox, canUndo, canRedo });

// ────────────────────────────────────────────────────────────────
// 监听
// ────────────────────────────────────────────────────────────────

watch(() => props.imageUrl, () => loadImageToCanvas(), { immediate: true });

watch(() => props.currentTool, () => {
  if (isCropMode.value) {
    renderOverlay();
  } else {
    overlayCanvas.value?.getContext('2d').clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  }
  emitCropChange();
});

watch(drawingCanvas, (val) => { if (val) emit('mask-ready', val); });
</script>

<style scoped>
canvas { user-select: none; }
</style>
