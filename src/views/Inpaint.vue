<template>
  <div class="w-full max-w-4xl mx-auto">
    <!-- 1. 图片上传区域 -->
    <div v-if="!imageLoaded" class="flex items-center justify-center w-full">
      <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <svg class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">点击上传</span> 或拖拽图片到此</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP 等格式</p>
        </div>
        <input id="dropzone-file" type="file" class="hidden" @change="handleImageUpload" accept="image/*" />
      </label>
    </div>

    <!-- 2. 修复工作区 -->
    <div v-else class="space-y-4">
      <!-- 画布容器 -->
      <div class="relative mx-auto" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
        <canvas ref="imageCanvas" class="absolute top-0 left-0 border border-gray-300 rounded-lg"></canvas>
        <canvas 
          ref="drawingCanvas"
          class="absolute top-0 left-0 cursor-crosshair"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
        ></canvas>
      </div>

      <!-- 控制面板 -->
      <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4">
        <div>
          <label for="brush-size" class="block mb-2 text-sm font-medium">笔刷大小: {{ brushSize }}px</label>
          <input id="brush-size" type="range" min="5" max="100" v-model="brushSize" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
        </div>
        <div class="flex gap-4">
          <button @click="downloadImage" class="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">下载图片</button>
          <button @click="reset" class="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">重新上传</button>
        </div>
        <p v-if="isProcessing" class="text-sm text-center text-blue-500">正在处理中，请稍候...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import inpaint from '../adapters/inpainting.js';

// DOM 引用
const imageCanvas = ref(null);
const drawingCanvas = ref(null);

// 状态
const imageLoaded = ref(false);
const isDrawing = ref(false);
const isProcessing = ref(false);
const brushSize = ref(40);
const canvasWidth = ref(0);
const canvasHeight = ref(0);
let originalImage = null;
let currentImage = null; // To store the image file/blob for iterative inpainting

// 图片上传处理
const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      // Sanitize the image by drawing it to a canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const sanitizedDataUrl = canvas.toDataURL('image/png');

      originalImage = new Image();
      originalImage.onload = () => {
          // 限制最大尺寸
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let w = originalImage.width;
          let h = originalImage.height;

          if (w > MAX_WIDTH) {
            h = (h * MAX_WIDTH) / w;
            w = MAX_WIDTH;
          }
          if (h > MAX_HEIGHT) {
            w = (w * MAX_HEIGHT) / h;
            h = MAX_HEIGHT;
          }

          canvasWidth.value = Math.round(w);
          canvasHeight.value = Math.round(h);
          
          currentImage = originalImage; // Store the initial image
          imageLoaded.value = true;

          // 必须在下一个 tick 中更新 canvas，等待 DOM 更新
          nextTick(() => {
            setupCanvases();
          });
      };
      originalImage.src = sanitizedDataUrl;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};

// 设置画布
const setupCanvases = () => {
  // 设置图片画布
  imageCanvas.value.width = canvasWidth.value;
  imageCanvas.value.height = canvasHeight.value;
  const ctx = imageCanvas.value.getContext('2d');
  ctx.drawImage(originalImage, 0, 0, canvasWidth.value, canvasHeight.value);

  // 设置绘画画布
  drawingCanvas.value.width = canvasWidth.value;
  drawingCanvas.value.height = canvasHeight.value;
};

// 绘制逻辑
let lastPos = null;
const startDrawing = (e) => {
  isDrawing.value = true;
  lastPos = getMousePos(drawingCanvas.value, e);
};

const draw = (e) => {
  if (!isDrawing.value) return;
  
  const currentPos = getMousePos(drawingCanvas.value, e);
  const ctx = drawingCanvas.value.getContext('2d');
  
  if (lastPos) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();
  }
  lastPos = currentPos;
};

const stopDrawing = () => {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  lastPos = null;
  runInpainting();
};

// 获取鼠标在 canvas 中的位置
const getMousePos = (canvas, evt) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
};

// New inpainting function using the adapter
const runInpainting = async () => {
  isProcessing.value = true;
  try {
    const maskDataURL = drawingCanvas.value.toDataURL();

    const resultDataUrl = await inpaint(currentImage, maskDataURL);

    const resultImage = new Image();
    resultImage.onload = () => {
      currentImage = resultImage; // Update current image for next iteration
      const ctx = imageCanvas.value.getContext('2d');
      ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
      ctx.drawImage(resultImage, 0, 0, canvasWidth.value, canvasHeight.value);

      const drawingCtx = drawingCanvas.value.getContext('2d');
      drawingCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
    };
    resultImage.src = resultDataUrl;

  } catch (error) {
    console.error('Inpainting failed:', error);
    alert(`处理失败: ${error.message}`);
  } finally {
    isProcessing.value = false;
  }
};

// 重置
const reset = () => {
  imageLoaded.value = false;
  originalImage = null;
  currentImage = null;
  isProcessing.value = false;
  // 清理画布
  if (imageCanvas.value) {
    const imgCtx = imageCanvas.value.getContext('2d');
    imgCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  }
  if (drawingCanvas.value) {
    const drawCtx = drawingCanvas.value.getContext('2d');
    drawCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  }
  canvasWidth.value = 0;
  canvasHeight.value = 0;
};

// 下载
const downloadImage = () => {
  const link = document.createElement('a');
  link.download = 'inpainted-image.png';
  link.href = imageCanvas.value.toDataURL('image/png');
  link.click();
};

</script>