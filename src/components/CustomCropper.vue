<template>
  <div class="custom-cropper-wrapper">
    <canvas ref="canvas" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp"></canvas>
    <div class="controls">
      <label for="zoom">缩放:</label>
      <input type="range" id="zoom" min="0.1" max="3" step="0.05" v-model.number="zoom" @input="onZoomChange">
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  src: { type: String, required: true },
});

const canvas = ref(null);
const image = ref(null);
const zoom = ref(1);
const offset = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const lastDragPos = ref({ x: 0, y: 0 });

let ctx = null;

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      const { width, height } = entry.contentRect;
      canvas.value.width = width;
      canvas.value.height = height;
      redraw();
    }
  });

  resizeObserver.observe(canvas.value);

  onUnmounted(() => {
    resizeObserver.disconnect();
  });
});

watch(() => props.src, (newSrc) => {
  if (newSrc) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      image.value = img;
      resetTransform();
      redraw();
    };
    img.src = newSrc;
  }
}, { immediate: true });

const resetTransform = () => {
    zoom.value = 1;
    if (image.value && canvas.value) {
        // Center the image
        offset.value = {
            x: (canvas.value.width - image.value.width) / 2,
            y: (canvas.value.height - image.value.height) / 2,
        };
    }
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
    lastDragPos.value = { x: e.clientX, y: e.clientY };
    redraw();
  }
};

const onMouseUp = () => {
  isDragging.value = false;
};

const onZoomChange = () => {
    redraw();
}

const crop = () => {
    if (!image.value || !canvas.value) return null;

    const canvasEl = canvas.value;
    const radius = Math.min(canvasEl.width, canvasEl.height) / 2;
    const cropSize = radius * 2;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropSize;
    tempCanvas.height = cropSize;
    const tempCtx = tempCanvas.getContext('2d');

    // Create a circular clip on the temp canvas
    tempCtx.beginPath();
    tempCtx.arc(radius, radius, radius, 0, Math.PI * 2);
    tempCtx.closePath();
    tempCtx.clip();

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
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.7);
  padding: 5px 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
}
</style>