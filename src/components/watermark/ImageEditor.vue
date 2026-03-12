<template>
  <div class="relative w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-300" style="height: 500px;">
    <!-- Canvas容器 -->
    <div class="relative w-full h-full flex items-center justify-center p-4">
      <!-- Canvas包装器 - 确保两个Canvas完全重叠 -->
      <div class="relative" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
        <!-- 图片Canvas（底层） -->
        <canvas
          ref="imageCanvas"
          class="absolute top-0 left-0"
        ></canvas>

        <!-- 绘制Canvas（顶层） -->
        <canvas
          ref="drawingCanvas"
          class="absolute top-0 left-0 cursor-crosshair"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        ></canvas>
      </div>
    </div>

    <!-- 工具提示 -->
    <div v-if="currentTool === 'erase'" class="absolute top-4 left-4 bg-white px-4 py-2 rounded shadow z-10">
      <p class="text-sm text-gray-600">按住鼠标左键涂抹需要擦除的水印区域</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { loadImage, fitImageSize } from '../../utils/imageUtils.js';
import { useCanvasHistory } from '../../composables/useCanvasHistory.js';

// Props
const props = defineProps({
  imageUrl: {
    type: String,
    required: true
  },
  currentTool: {
    type: String,
    default: 'erase', // 'crop' | 'erase'
    validator: (value) => ['crop', 'erase'].includes(value)
  },
  brushSize: {
    type: Number,
    default: 40
  }
});

// Emits
const emit = defineEmits(['mask-ready', 'crop-change']);

// DOM引用
const imageCanvas = ref(null);
const drawingCanvas = ref(null);

// 状态
const canvasWidth = ref(0);
const canvasHeight = ref(0);
const isDrawing = ref(false);
const lastPos = ref(null);

// 历史记录
const { saveState, undo, redo, canUndo, canRedo, clearHistory } = useCanvasHistory();

// 加载图片到Canvas
const loadImageToCanvas = async () => {
  if (!props.imageUrl) return;

  try {
    const img = await loadImage(props.imageUrl);

    // 计算适应容器的尺寸（最大容器尺寸减去padding）
    const maxWidth = 700;
    const maxHeight = 450;
    const fitted = fitImageSize(img.width, img.height, maxWidth, maxHeight);
    canvasWidth.value = fitted.width;
    canvasHeight.value = fitted.height;

    await nextTick();

    // 设置Canvas尺寸
    imageCanvas.value.width = fitted.width;
    imageCanvas.value.height = fitted.height;
    drawingCanvas.value.width = fitted.width;
    drawingCanvas.value.height = fitted.height;

    // 绘制图片
    const ctx = imageCanvas.value.getContext('2d');
    ctx.drawImage(img, 0, 0, fitted.width, fitted.height);

    // 清空绘制层
    const drawCtx = drawingCanvas.value.getContext('2d');
    drawCtx.clearRect(0, 0, fitted.width, fitted.height);

    // 清空历史记录
    clearHistory();

    // 保存初始状态
    saveState(drawingCanvas.value.toDataURL());
  } catch (error) {
    console.error('加载图片失败:', error);
  }
};

// 鼠标事件处理
const handleMouseDown = (e) => {
  if (props.currentTool !== 'erase') return;

  isDrawing.value = true;
  lastPos.value = getMousePos(e);
};

const handleMouseMove = (e) => {
  if (!isDrawing.value || props.currentTool !== 'erase') return;

  const currentPos = getMousePos(e);
  const ctx = drawingCanvas.value.getContext('2d');

  if (lastPos.value) {
    // 绘制纯红色画笔（确保RGB值）
    ctx.beginPath();
    ctx.strokeStyle = 'rgb(255, 0, 0)'; // 使用纯红色
    ctx.fillStyle = 'rgb(255, 0, 0)';
    ctx.globalAlpha = 1.0; // 完全不透明
    ctx.lineWidth = props.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPos.value.x, lastPos.value.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();

    // 在线条端点绘制圆形，确保连续
    ctx.beginPath();
    ctx.arc(currentPos.x, currentPos.y, props.brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  lastPos.value = currentPos;
};

const handleMouseUp = () => {
  if (!isDrawing.value) return;

  isDrawing.value = false;
  lastPos.value = null;

  // 保存当前状态到历史记录
  saveState(drawingCanvas.value.toDataURL());
};

// 获取鼠标在Canvas中的位置
const getMousePos = (e) => {
  const rect = drawingCanvas.value.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
};

// 撤销操作
const handleUndo = () => {
  const prevState = undo();
  if (prevState) {
    restoreCanvasState(prevState);
  }
};

// 重做操作
const handleRedo = () => {
  const nextState = redo();
  if (nextState) {
    restoreCanvasState(nextState);
  }
};

// 恢复Canvas状态
const restoreCanvasState = (dataUrl) => {
  const img = new Image();
  img.onload = () => {
    const ctx = drawingCanvas.value.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
    ctx.drawImage(img, 0, 0);
  };
  img.src = dataUrl;
};

// 清空蒙版
const clearMask = () => {
  const ctx = drawingCanvas.value.getContext('2d');
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  clearHistory();
  saveState(drawingCanvas.value.toDataURL());
};

// 获取蒙版Canvas
const getMaskCanvas = () => {
  return drawingCanvas.value;
};

// 获取蒙版DataURL
const getMaskDataURL = () => {
  return drawingCanvas.value.toDataURL();
};

// 暴露方法给父组件
defineExpose({
  handleUndo,
  handleRedo,
  clearMask,
  getMaskCanvas,
  getMaskDataURL,
  canUndo,
  canRedo
});

// 监听图片URL变化
watch(() => props.imageUrl, () => {
  loadImageToCanvas();
}, { immediate: true });

// 监听蒙版变化，通知父组件
watch(() => drawingCanvas.value, () => {
  if (drawingCanvas.value) {
    emit('mask-ready', drawingCanvas.value);
  }
}, { deep: true });
</script>

<style scoped>
/* 自定义样式 */
</style>
