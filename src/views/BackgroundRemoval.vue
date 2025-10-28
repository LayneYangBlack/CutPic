<template>
  <div class="p-4 md:p-8 space-y-6">
    <h1 class="text-2xl font-bold">一键抠图 (Google AI)</h1>
    <p class="text-sm text-gray-500">采用 Google MediaPipe 模型，在浏览器本地运行，处理速度取决于您的电脑配置。所有操作均在本地完成，图片不会上传至服务器。</p>

    <!-- Step 1: Upload Image -->
    <div class="p-4 border rounded-lg bg-white shadow-sm">
      <h2 class="text-lg font-semibold mb-2">1. 上传图片</h2>
      <input type="file" @change="handleImageUpload" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
    </div>

    <!-- Step 2: Select Model -->
    <div v-if="imageSrc" class="p-4 border rounded-lg bg-white shadow-sm">
      <h2 class="text-lg font-semibold mb-2">2. 选择模型 (处理人像时建议切换)</h2>
      <div class="flex items-center space-x-6">
        <label class="flex items-center cursor-pointer">
          <input type="radio" v-model="modelSelection" :value="1" name="model-type" class="form-radio h-4 w-4 text-blue-600">
          <span class="ml-2 text-gray-700">通用模型 (适合风景、物体)</span>
        </label>
        <label class="flex items-center cursor-pointer">
          <input type="radio" v-model="modelSelection" :value="0" name="model-type" class="form-radio h-4 w-4 text-blue-600">
          <span class="ml-2 text-gray-700">人像模型 (适合人物、自拍)</span>
        </label>
      </div>
    </div>

    <!-- Step 3: Process and Result -->
    <div v-if="imageSrc" class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Original Image -->
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-2">原始图片</h2>
        <div class="flex justify-center items-center">
            <img :src="imageSrc" ref="originalImageEl" class="max-w-full max-h-[50vh] rounded-lg shadow-md" alt="Original Image" @load="onImageLoad">
        </div>
      </div>

      <!-- Result -->
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <div class="flex justify-between items-center mb-2">
            <h2 class="text-lg font-semibold">处理结果</h2>
            <button v-if="resultSrc" @click="downloadImage" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm">下载结果</button>
        </div>
        <div class="flex justify-center items-center bg-gray-100 rounded-lg shadow-inner min-h-[300px] bg-dotted-pattern">
            <div v-if="isLoading" class="text-center">
                <p class="text-gray-600">{{ loadingMessage }}</p>
            </div>
            <canvas v-show="!isLoading" ref="resultCanvas" class="max-w-full max-h-[50vh] rounded-lg"></canvas>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

// --- Refs for state management ---
const imageSrc = ref(null);
const originalImageEl = ref(null);
const resultSrc = ref(null);
const resultCanvas = ref(null);
const isLoading = ref(false);
const loadingMessage = ref('请先上传图片');
const modelSelection = ref(1); // 1 for general, 0 for portrait

let selfieSegmentation = null;

// --- Lifecycle Hooks ---
onMounted(() => {
  loadingMessage.value = '正在初始化 AI 模型...';
  isLoading.value = true;

  // Instantiate the MediaPipe Selfie Segmentation model
  selfieSegmentation = new SelfieSegmentation({locateFile: (file) => {
    // Point to the local files copied to the public directory
    return `/${file}`;
  }});

  selfieSegmentation.setOptions({
    modelSelection: modelSelection.value,
  });

  selfieSegmentation.onResults(onResults);
  isLoading.value = false;
  loadingMessage.value = '模型准备就绪，请上传图片。';
});

// --- Watch for model changes ---
watch(modelSelection, (newValue) => {
  if (selfieSegmentation) {
    loadingMessage.value = `正在切换到 ${newValue === 0 ? '人像' : '通用'} 模型...`;
    isLoading.value = true;
    
    selfieSegmentation.setOptions({
      modelSelection: newValue,
    });

    // If an image is already loaded, re-process it
    if (originalImageEl.value && originalImageEl.value.src) {
      // Use a short timeout to allow the loading message to render
      setTimeout(() => onImageLoad(), 50);
    } else {
      isLoading.value = false;
    }
  }
});

// --- Event Handlers ---
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageSrc.value = e.target.result;
      resultSrc.value = null; // Reset result
    };
    reader.readAsDataURL(file);
  }
};

// Trigger processing when the new image has loaded into the <img> tag
const onImageLoad = async () => {
    if (!originalImageEl.value || !selfieSegmentation) return;
    
    isLoading.value = true;
    loadingMessage.value = 'AI 正在处理图片...';
    await selfieSegmentation.send({image: originalImageEl.value});
}

// --- Core Logic ---
function onResults(results) {
  const canvas = resultCanvas.value;
  const ctx = canvas.getContext('2d');

  const w = results.image.width;
  const h = results.image.height;
  canvas.width = w;
  canvas.height = h;

  ctx.save();
  ctx.clearRect(0, 0, w, h);
  
  // Draw the segmentation mask
  ctx.drawImage(results.segmentationMask, 0, 0, w, h);

  // Apply the mask to the original image
  ctx.globalCompositeOperation = 'source-in';
  ctx.drawImage(results.image, 0, 0, w, h);

  ctx.restore();

  resultSrc.value = canvas.toDataURL('image/png');
  isLoading.value = false;
}

const downloadImage = () => {
  if (!resultSrc.value) return;
  const link = document.createElement('a');
  link.href = resultSrc.value;
  link.download = 'background-removed-image.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

</script>

<style scoped>
.bg-dotted-pattern {
    background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,0.2) 1px, transparent 0);
    background-size: 16px 16px;
}
</style>
