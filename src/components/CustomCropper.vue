<template>
  <div class="custom-cropper-wrapper">
    <canvas ref="canvas" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp" @wheel.prevent="onWheel"></canvas>
    <div class="controls">
      <label for="zoom">缩放:</label>
      <button @click="zoomOut" class="zoom-btn">-</button>
      <input type="range" id="zoom" min="0.1" max="3" step="0.05" :value="zoom" @input="handleZoomSlider($event.target.value)">
      <button @click="zoomIn" class="zoom-btn">+</button>
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

const onMouseDown = (e) => {
  isDragging.value = true;
  lastDragPos.value = { x: e.clientX, y: e.clientY };
};

const onMouseMove = (e) => {
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

const onMouseUp = () => {
  isDragging.value = false;
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

const crop = () => {
    if (!image.value || !canvas.value) return null;

    const canvasEl = canvas.value;
    const radius = Math.min(canvasEl.width, canvasEl.height) / 2;
    const cropSize = radius * 2;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropSize;
    tempCanvas.height = cropSize;
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
    tempCtx.arc(radius, radius, radius, 0, Math.PI * 2);
    tempCtx.closePath();
    tempCtx.clip();

    // Fill the background color
    tempCtx.fillStyle = props.backgroundColor;
    tempCtx.fillRect(0, 0, cropSize, cropSize);

    // Calculate the source rectangle from the original image
    const imgXatCenter = (canvasEl.width / 2 - offset.value.x) / zoom.value;
    const imgYatCenter = (canvasEl.height / 2 - offset.value.y) / zoom.value;
    const imgRadius = radius / zoom.value;

    tempCtx.drawImage(
        image.value,
        imgXatCenter - imgRadius, // source x
        imgYatCenter - imgRadius, // source y
        imgRadius * 2, // source width
        imgRadius * 2, // source height
        0, // destination x
        0, // destination y
        cropSize, // destination width
        cropSize // destination height
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
}
canvas {
  width: 100%;
  height: 100%;
  cursor: grab;
}
canvas:active {
    cursor: grabbing;
}
.controls {
  position: absolute;
  bottom: 10px;
  width: 300px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.7);
  padding: 5px 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
label {
    flex-shrink: 0;
}
.zoom-btn {
    width: 24px;
    height: 24px;
    border: 1px solid #ccc;
    border-radius: 50%;
    background-color: white;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 22px;
    text-align: center;
}
.zoom-btn:hover {
    background-color: #f0f0f0;
}
</style>
