<template>
  <div class="custom-cropper-wrapper">
    <div class="preview-stage">
      <canvas
        ref="canvas"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @pointerleave="onPointerLeave"
        @wheel.prevent="onWheel"
        aria-label="图片裁剪预览"
      ></canvas>
    </div>
    <div class="controls">
      <label for="zoom">缩放</label>
      <button type="button" @click="zoomOut" class="zoom-btn" aria-label="缩小">-</button>
      <input type="range" id="zoom" min="0.1" max="3" step="0.05" :value="zoom" @input="handleZoomSlider($event.target.value)" aria-label="图片缩放">
      <button type="button" @click="zoomIn" class="zoom-btn" aria-label="放大">+</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  src: { type: String, required: true },
  backgroundColor: { type: String, default: '#ffffff' },
  // 出血/包边参考线：裁切圆 = 外圈（图案铺满包边），成品线按比例画在里面
  bleedEnabled: { type: Boolean, default: false },
  innerMm: { type: Number, default: 0 },
  outerMm: { type: Number, default: 0 },
  // 按最大规格输出，避免裁切后改大尺寸时再次把低分辨率图放大
  maxOuterMm: { type: Number, default: 0 },
});

const canvas = ref(null);
const image = ref(null);
const zoom = ref(1);
const offset = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const lastDragPos = ref({ x: 0, y: 0 });
const isInitialized = ref(false);
// 用户手动缩放/拖动后就保留他的取景，容器尺寸变化时不再自动重新适配
const userAdjusted = ref(false);
const activePointers = new Map();
let pinchStart = null;

let ctx = null;

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      const { width, height } = entry.contentRect;
      if (canvas.value.width !== width || canvas.value.height !== height) {
        canvas.value.width = width;
        canvas.value.height = height;
        // 图片已加载但还没适配过、或用户还没手动调过取景时，按新尺寸重新适配；
        // 否则保持用户当前的缩放/位移，只重画
        // （图片可能在容器定尺前就加载完成，若不重新适配会被画得很小且偏在角落）
        if (image.value && (!isInitialized.value || !userAdjusted.value)) {
            resetTransform();
        } else {
            redraw();
        }
      }
    }
  });

  resizeObserver.observe(canvas.value);

  onUnmounted(() => {
    resizeObserver.disconnect();
  });
});

watch(() => props.src, (newSrc) => {
  if (newSrc) {
    isInitialized.value = false;
    const img = new Image();
    // crossOrigin is not needed for blob URLs and might cause issues.
    // img.crossOrigin = 'Anonymous'; 
    img.onload = () => {
      image.value = img;
      // resetTransform() will be called either here if canvas is ready,
      // or by the ResizeObserver when it sizes the canvas.
      resetTransform();
    };
    img.onerror = () => {
      console.error("CustomCropper: Image failed to load.", { src: newSrc });
      alert("图片加载失败，请检查文件是否损坏或尝试其他图片。");
    };
    img.src = newSrc;
  }
}, { immediate: true });

// 尺寸/出血开关变化时重画参考线
watch(
  () => [props.bleedEnabled, props.innerMm, props.outerMm],
  () => redraw(),
);

// 成品线半径（画布坐标）：裁切圆 = 外圈，成品线按成品与外圈的比例内缩
const guideRadii = (canvasEl) => {
  const outer = Number(props.outerMm);
  const inner = Number(props.innerMm);
  if (!props.bleedEnabled || !outer || !inner || outer <= inner) return null;
  const cropRadius = Math.min(canvasEl.width, canvasEl.height) / 2;
  return { innerR: cropRadius * (inner / outer) };
};

const resetTransform = () => {
    if (image.value && canvas.value && canvas.value.width > 0) {
        const canvasRadius = Math.min(canvas.value.width, canvas.value.height) / 2;
        const imgMinDim = Math.min(image.value.width, image.value.height);

        if (imgMinDim > 0) {
            // Scale image to fit the circle crop area
            zoom.value = (canvasRadius * 2) / imgMinDim;

            // Center the image
            offset.value = {
                x: (canvas.value.width - image.value.width * zoom.value) / 2,
                y: (canvas.value.height - image.value.height * zoom.value) / 2,
            };
            isInitialized.value = true;
        } else {
            // Fallback for images with no dimensions, just center it.
            zoom.value = 1;
            offset.value = {
                x: (canvas.value.width - image.value.width) / 2,
                y: (canvas.value.height - image.value.height) / 2,
            };
        }
        userAdjusted.value = false;
    } else {
        // If canvas is not ready, do nothing. The ResizeObserver will call this function again.
        isInitialized.value = false;
        zoom.value = 1;
        offset.value = { x: 0, y: 0 };
    }
    redraw();
};
const redraw = () => {
  if (!ctx || !canvas.value || !canvas.value.width || !canvas.value.height) return;
  const canvasEl = canvas.value;

  // Clear canvas
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  // Draw the image with pan and zoom
  if (image.value) {
    ctx.save();
    ctx.drawImage(
      image.value,
      offset.value.x,
      offset.value.y,
      image.value.width * zoom.value,
      image.value.height * zoom.value
    );
    ctx.restore();
  }

  // Draw the circular stencil overlay
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  const radius = Math.min(canvasEl.width, canvasEl.height) / 2;
  // Outer rectangle (the dark area)
  ctx.rect(0, 0, canvasEl.width, canvasEl.height);
  // Carve out the circle
  ctx.arc(canvasEl.width / 2, canvasEl.height / 2, radius, 0, Math.PI * 2, true); // true for counter-clockwise
  ctx.fill();
  ctx.restore();

  // 成品线参考线：裁切圆即外圈（图案铺满包边），成品线以内才是压制后正面能看到的部分
  const guide = guideRadii(canvasEl);
  if (guide) {
    // 成品线以外到外圈都是包边（折到背面），压一层近不透明蒙层：
    // 图案颜色和参考线相近时也能看清线，同时一眼看出哪部分不会留在正面（蒙层只在预览里，不影响裁切结果）
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(canvasEl.width / 2, canvasEl.height / 2, radius, 0, Math.PI * 2);
    ctx.arc(canvasEl.width / 2, canvasEl.height / 2, guide.innerR, 0, Math.PI * 2, true); // 反向，挖掉成品圆
    ctx.fill();
    ctx.restore();
  }

  // Draw a white dashed border around the cropping circle for visibility
  ctx.save();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]); // Dashed line
  ctx.beginPath();
  ctx.arc(canvasEl.width / 2, canvasEl.height / 2, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  if (guide) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    // 成品线：压制后正面可见的边界，越线的内容都会被包边吃掉
    ctx.strokeStyle = '#6b7280';
    ctx.beginPath();
    ctx.arc(canvasEl.width / 2, canvasEl.height / 2, guide.innerR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
};

const getPointerDistance = (first, second) =>
  Math.hypot(second.x - first.x, second.y - first.y);

const getPointerMidpoint = (first, second) => ({
  x: (first.x + second.x) / 2,
  y: (first.y + second.y) / 2,
});

const startPinch = () => {
  const points = [...activePointers.values()];
  if (points.length < 2 || !canvas.value || !image.value) return;

  const [first, second] = points;
  const midpoint = getPointerMidpoint(first, second);
  const rect = canvas.value.getBoundingClientRect();
  const midpointOnCanvas = {
    x: midpoint.x - rect.left,
    y: midpoint.y - rect.top,
  };

  pinchStart = {
    distance: Math.max(getPointerDistance(first, second), 1),
    midpointOnCanvas,
    zoom: zoom.value,
    imagePoint: {
      x: (midpointOnCanvas.x - offset.value.x) / zoom.value,
      y: (midpointOnCanvas.y - offset.value.y) / zoom.value,
    },
  };
  isDragging.value = false;
};

const onPointerDown = (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault();
  canvas.value?.setPointerCapture?.(e.pointerId);
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activePointers.size >= 2) {
    startPinch();
  } else {
    isDragging.value = true;
    lastDragPos.value = { x: e.clientX, y: e.clientY };
  }
};

const onPointerMove = (e) => {
  if (!activePointers.has(e.pointerId)) return;
  e.preventDefault();
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activePointers.size >= 2) {
    if (!pinchStart) startPinch();
    const points = [...activePointers.values()];
    const [first, second] = points;
    const distance = Math.max(getPointerDistance(first, second), 1);
    const midpoint = getPointerMidpoint(first, second);
    const rect = canvas.value.getBoundingClientRect();
    const midpointOnCanvas = {
      x: midpoint.x - rect.left,
      y: midpoint.y - rect.top,
    };
    const newZoom = Math.max(
      0.1,
      Math.min(pinchStart.zoom * (distance / pinchStart.distance), 3),
    );

    offset.value.x = midpointOnCanvas.x - pinchStart.imagePoint.x * newZoom;
    offset.value.y = midpointOnCanvas.y - pinchStart.imagePoint.y * newZoom;
    zoom.value = newZoom;
    userAdjusted.value = true;
    redraw();
    return;
  }

  if (isDragging.value) {
    const dx = e.clientX - lastDragPos.value.x;
    const dy = e.clientY - lastDragPos.value.y;
    offset.value.x += dx;
    offset.value.y += dy;
    userAdjusted.value = true;
    lastDragPos.value = { x: e.clientX, y: e.clientY };
    redraw();
  }
};

const onPointerUp = (e) => {
  activePointers.delete(e.pointerId);
  if (canvas.value?.hasPointerCapture?.(e.pointerId)) {
    canvas.value.releasePointerCapture(e.pointerId);
  }

  if (activePointers.size >= 2) {
    startPinch();
  } else if (activePointers.size === 1) {
    const remaining = [...activePointers.values()][0];
    pinchStart = null;
    isDragging.value = true;
    lastDragPos.value = { x: remaining.x, y: remaining.y };
  } else {
    pinchStart = null;
    isDragging.value = false;
  }
};

const onPointerLeave = (e) => {
  // Pointer capture keeps an active touch/drag alive outside the canvas.
  if (e.pointerType === 'mouse' && !activePointers.has(e.pointerId)) {
    isDragging.value = false;
  }
};

const handleZoom = (newZoomValue, clientX, clientY) => {
    const oldZoom = zoom.value;
    const newZoom = Math.max(0.1, Math.min(newZoomValue, 3));

    if (newZoom === oldZoom || !canvas.value || !image.value) {
        return;
    }

    const canvasRect = canvas.value.getBoundingClientRect();
    const zoomCenterX = clientX != null ? clientX - canvasRect.left : canvas.value.width / 2;
    const zoomCenterY = clientY != null ? clientY - canvasRect.top : canvas.value.height / 2;

    const imgPoint = {
        x: (zoomCenterX - offset.value.x) / oldZoom,
        y: (zoomCenterY - offset.value.y) / oldZoom,
    };

    offset.value.x = zoomCenterX - imgPoint.x * newZoom;
    offset.value.y = zoomCenterY - imgPoint.y * newZoom;

    zoom.value = newZoom;
    userAdjusted.value = true;

    redraw();
}

const handleZoomSlider = (value) => {
    handleZoom(Number(value));
}

const zoomIn = () => {
    handleZoom(zoom.value + 0.02);
}

const zoomOut = () => {
    handleZoom(zoom.value - 0.02);
}

const onWheel = (e) => {
    const zoomFactor = e.deltaY < 0 ? 1.02 : 1 / 1.02;
    handleZoom(zoom.value * zoomFactor);
}

// 裁剪结果会直接用于 300 DPI 的 A4 排版，输出像素必须按成品外圈尺寸计算；
// 若沿用裁切框的 CSS 像素（约 400px），大尺寸徽章会在排版时被二次放大而发虚。
const CROP_OUTPUT_DPI = 300;
const MM_PER_INCH = 25.4;
// 留出余量，避免极端参数生成过大画布拖慢渲染；当前最大 86mm 外圈远低于该上限
const MAX_CROP_OUTPUT_PX = 2400;

const crop = () => {
    if (!image.value || !canvas.value) return null;

    const canvasEl = canvas.value;
    const displayRadius = Math.min(canvasEl.width, canvasEl.height) / 2;
    const displayCropSize = displayRadius * 2;
    const outerMm = Number(props.outerMm);
    const maxOuterMm = Number(props.maxOuterMm);
    const outputMm = Math.max(outerMm, maxOuterMm);
    const targetSize = outputMm > 0
        ? Math.min(
            MAX_CROP_OUTPUT_PX,
            Math.max(1, Math.round((outputMm / MM_PER_INCH) * CROP_OUTPUT_DPI)),
        )
        : Math.max(1, Math.round(displayCropSize));
    const targetRadius = targetSize / 2;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetSize;
    tempCanvas.height = targetSize;
    const tempCtx = tempCanvas.getContext('2d', {
        alpha: true,
        colorSpace: 'srgb',
        willReadFrequently: false
    });

    // 启用图像平滑，提升裁剪质量
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';

    // Create a circular clip on the temp canvas
    tempCtx.beginPath();
    tempCtx.arc(targetRadius, targetRadius, targetRadius, 0, Math.PI * 2);
    tempCtx.closePath();
    tempCtx.clip();

    // Fill the background color
    tempCtx.fillStyle = props.backgroundColor;
    tempCtx.fillRect(0, 0, targetSize, targetSize);

    // 取景参数仍按屏幕坐标计算，只把目标画布放大；
    // 这样用户看到的裁切范围不变，但输出保留原图细节。
    const imgXatCenter = (canvasEl.width / 2 - offset.value.x) / zoom.value;
    const imgYatCenter = (canvasEl.height / 2 - offset.value.y) / zoom.value;
    const imgRadius = displayRadius / zoom.value;

    tempCtx.drawImage(
        image.value,
        imgXatCenter - imgRadius, // source x
        imgYatCenter - imgRadius, // source y
        imgRadius * 2, // source width
        imgRadius * 2, // source height
        0, // destination x
        0, // destination y
        targetSize, // destination width
        targetSize // destination height
    );

    return tempCanvas.toDataURL('image/png');
};

// Expose the crop method to the parent component
defineExpose({ crop });

</script>

<style scoped>
.custom-cropper-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.preview-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}
canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
canvas:active {
    cursor: grabbing;
}
.controls {
  position: relative;
  flex: 0 0 auto;
  width: min(360px, calc(100% - 16px));
  margin: 8px auto 0;
  background: rgba(255, 255, 255, 0.92);
  padding: 6px 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
}
label {
    flex-shrink: 0;
}
.controls input[type='range'] {
    min-width: 0;
    flex: 1;
    accent-color: #2563eb;
}
.zoom-btn {
    width: 40px;
    height: 40px;
    min-width: 40px;
    border: 1px solid #ccc;
    border-radius: 50%;
    background-color: white;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 22px;
    text-align: center;
}
.zoom-btn:focus-visible,
.controls input[type='range']:focus-visible {
    outline: 3px solid rgba(37, 99, 235, 0.35);
    outline-offset: 2px;
}
.zoom-btn:hover {
    background-color: #f0f0f0;
}

@media (max-width: 639px) {
  .controls {
    width: min(270px, calc(100% - 16px));
    margin-top: 6px;
    padding: 4px 6px;
    gap: 5px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.88);
  }

  .controls label {
    font-size: 12px;
  }

  .zoom-btn {
    width: 32px;
    height: 32px;
    min-width: 32px;
    font-size: 17px;
    line-height: 18px;
  }

  .controls input[type='range'] {
    height: 24px;
  }
}
</style>
