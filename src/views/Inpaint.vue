<template>
  <!-- Loading Modal -->
  <div v-if="isModelLoading" class="fixed inset-0 bg-white bg-opacity-80 flex flex-col justify-center items-center z-50">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
        <h2 class="text-xl font-semibold text-center mb-4">正在初始化修复模型...</h2>
        <p class="text-sm text-gray-600 text-center mb-2">首次加载需要下载约30MB的模型文件，请稍候。</p>
        <div class="w-full bg-gray-200 rounded-full">
            <div class="bg-blue-500 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" :style="{ width: modelLoadProgress + '%' }">
                {{ modelLoadProgress.toFixed(0) }}%
            </div>
        </div>
    </div>
  </div>

  <div class="w-full max-w-4xl mx-auto">
    <!-- 1. 图片上传区域 -->
    <div v-if="!imageLoaded" class="flex items-center justify-center w-full">
      <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <svg class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">点击上传</span> 或拖拽图片到此</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">支持多张图片 (PNG, JPG, WEBP)</p>
        </div>
        <input id="dropzone-file" type="file" class="hidden" @change="handleImageUpload" accept="image/*" multiple />
      </label>
    </div>

    <!-- 2. 修复工作区 -->
    <div v-else class="space-y-4">
      <p class="text-center text-gray-600">在第一张图上绘制蒙版，该蒙版将应用于所有上传的图片。</p>
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
        
        <!-- Batch Processing Progress -->
        <div v-if="isBatchProcessing" class="space-y-2">
            <p class="text-sm text-center text-blue-500">
              正在批量处理: {{ (batchProgress * 100).toFixed(0) }}% ({{ Math.round(batchProgress * imageList.length) }} / {{ imageList.length }})
            </p>
            <div class="w-full bg-gray-200 rounded-full">
                <div class="bg-blue-500 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" :style="{ width: (batchProgress * 100) + '%' }"></div>
            </div>
        </div>

        <div class="flex gap-4">
          <button @click="applyAndDownload" :disabled="isBatchProcessing || imageList.length === 0" class="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
            {{ isBatchProcessing ? '正在处理...' : '应用蒙版并下载ZIP' }}
          </button>
          <button @click="reset" class="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
            全部重置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import inpaint, { initInpaintSession } from '../adapters/inpainting.js';

// Model Loading State
const isModelLoading = ref(true);
const modelLoadProgress = ref(0);

// DOM 引用
const imageCanvas = ref(null);
const drawingCanvas = ref(null);

// 状态
const imageList = ref([]);
const isDrawing = ref(false);
const isBatchProcessing = ref(false);
const batchProgress = ref(0);
const brushSize = ref(40);
const canvasWidth = ref(0);
const canvasHeight = ref(0);

const imageLoaded = computed(() => imageList.value.length > 0);

// Initialize model on component mount
onMounted(() => {
    initInpaintSession((progress) => {
        modelLoadProgress.value = progress;
    }).then(() => {
        isModelLoading.value = false;
    }).catch(err => {
        console.error("Failed to initialize inpaint session:", err);
        alert("初始化修复模型失败，请刷新页面重试。错误: " + err.message);
    });
});

// 图片上传处理
const handleImageUpload = (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  imageList.value = Array.from(files).map((file, index) => ({
    id: Date.now() + index,
    file,
    originalSrc: null,
    processedSrc: null,
    status: 'pending', // pending, processing, done, error
  }));

  // Load the first image to the canvas for mask drawing
  loadFirstImageForMasking();
};

const loadFirstImageForMasking = () => {
  const firstImageItem = imageList.value[0];
  if (!firstImageItem) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    firstImageItem.originalSrc = event.target.result;
    drawImageToCanvas(firstImageItem.originalSrc);
  };
  reader.readAsDataURL(firstImageItem.file);
};

const drawImageToCanvas = (imageSrc) => {
    const img = new Image();
    img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let w = img.width;
        let h = img.height;

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
        
        nextTick(() => {
          // Setup image canvas
          imageCanvas.value.width = canvasWidth.value;
          imageCanvas.value.height = canvasHeight.value;
          const imgCtx = imageCanvas.value.getContext('2d');
          imgCtx.drawImage(img, 0, 0, canvasWidth.value, canvasHeight.value);

          // Setup drawing canvas
          drawingCanvas.value.width = canvasWidth.value;
          drawingCanvas.value.height = canvasHeight.value;
          const drawCtx = drawingCanvas.value.getContext('2d');
          drawCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
        });
    };
    img.src = imageSrc;
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
  // No longer runs inpainting automatically
};

// 获取鼠标在 canvas 中的位置
const getMousePos = (canvas, evt) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
};

// Batch Inpainting and Zipping
const applyAndDownload = async () => {
  if (imageList.value.length === 0) {
    alert('请先上传图片。');
    return;
  }

  const maskDataURL = drawingCanvas.value.toDataURL();
  
  // Check if mask is empty
  const maskCanvas = document.createElement('canvas');
  const maskCtx = maskCanvas.getContext('2d');
  maskCanvas.width = drawingCanvas.value.width;
  maskCanvas.height = drawingCanvas.value.height;
  const maskImage = new Image();
  maskImage.src = maskDataURL;
  await new Promise(resolve => maskImage.onload = resolve);
  maskCtx.drawImage(maskImage, 0, 0);
  const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  if (!maskData.data.some(channel => channel !== 0)) {
      alert('请先在图片上绘制需要修复的区域。');
      return;
  }


  isBatchProcessing.value = true;
  batchProgress.value = 0;

  try {
    for (let i = 0; i < imageList.value.length; i++) {
      const item = imageList.value[i];
      item.status = 'processing';

      // Ensure originalSrc is loaded
      if (!item.originalSrc) {
        item.originalSrc = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(item.file);
        });
      }
      
      const resultDataUrl = await inpaint(item.originalSrc, maskDataURL);
      item.processedSrc = resultDataUrl;
      item.status = 'done';
      batchProgress.value = (i + 1) / imageList.value.length;
    }

    await downloadZip();

  } catch (error) {
    console.error('Batch inpainting failed:', error);
    alert(`批量处理失败: ${error.message}`);
    const currentItem = imageList.value.find(item => item.status === 'processing');
    if (currentItem) currentItem.status = 'error';
  } finally {
    isBatchProcessing.value = false;
  }
};

const downloadZip = async () => {
    const processedImages = imageList.value.filter(item => item.status === 'done' && item.processedSrc);
    if (processedImages.length === 0) {
        alert('没有成功处理的图片可供下载。');
        return;
    }

    const zip = new window.JSZip();
    
    for (const item of processedImages) {
        const response = await fetch(item.processedSrc);
        const blob = await response.blob();
        // Ensure unique filenames if needed, here using original name
        const fileName = `inpainted_${item.file.name}`;
        zip.file(fileName, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = 'inpainted-images.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};


// 重置
const reset = () => {
  imageList.value = [];
  isBatchProcessing.value = false;
  batchProgress.value = 0;

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

</script>