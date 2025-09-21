<template>
  <div class="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 printable-hidden">
    <!-- Left Panel: Settings and Cropper -->
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">徽章自动排版工具</h1>

      <!-- Step 1: Settings -->
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-2">1. 输入设置</h2>
        <div class="space-y-4">
          <div>
            <label for="diameter" class="block text-sm font-medium text-gray-700">圆形直径 (mm)</label>
            <input type="number" id="diameter" v-model="diameter" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
          </div>
          <div>
            <label for="gapH" class="block text-sm font-medium text-gray-700">横向间隙 (mm)</label>
            <input type="number" id="gapH" v-model="gapH" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
          </div>
          <div>
            <label for="gapV" class="block text-sm font-medium text-gray-700">纵向间隙 (mm)</label>
            <input type="number" id="gapV" v-model="gapV" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
          </div>
          <div>
            <label for="image-upload" class="block text-sm font-medium text-gray-700">上传图片</label>
            <input type="file" id="image-upload" @change="handleImageUpload" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
          </div>
        </div>
      </div>

      <!-- Step 2: Cropper -->
      <div v-if="imageSrc" class="p-4 border rounded-lg bg-white shadow-sm">
        <div class="flex justify-between items-center mb-2">
            <h2 class="text-lg font-semibold">2. 裁切图片</h2>
            <button @click="confirmCrop" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">确认裁切</button>
        </div>
        <div class="cropper-container bg-gray-100" style="height: 400px;">
          <CustomCropper
            ref="cropper"
            :src="imageSrc"
          />
        </div>
      </div>

      <div v-if="croppedImageSrc" class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-2">裁切结果预览</h2>
        <img :src="croppedImageSrc" class="rounded-full mx-auto shadow-md" style="width: 128px; height: 128px;" alt="Cropped Image">
      </div>

    </div>

    <!-- Right Panel: A4 Preview -->
    <div class="p-4 border rounded-lg bg-white shadow-sm">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">3. A4 预览和打印</h2>
        <div class="flex gap-2">
            <button @click="generateLayout" :disabled="!croppedImageSrc" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 text-sm">生成排版</button>
            <button @click="printLayout" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">打印</button>
        </div>
      </div>
      <div class="bg-gray-200 p-2 a4-preview-container overflow-auto shadow-inner rounded">
        <canvas ref="a4Canvas"></canvas>
      </div>
    </div>
  </div>
  <img ref="printableImage" class="printable-area screen-hidden" alt="Printable Layout">
</template>

<script setup>
import { ref, nextTick } from 'vue';
import CustomCropper from '../components/CustomCropper.vue';

const diameter = ref(58);
const gapH = ref(2);
const gapV = ref(2);
const imageSrc = ref(null);
const croppedImageSrc = ref(null);
const a4Canvas = ref(null);
const cropper = ref(null);
const printableImage = ref(null);

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Sanitize the image by drawing it to a canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Use the sanitized PNG data URL
        imageSrc.value = canvas.toDataURL('image/png');
        croppedImageSrc.value = null; // Reset previous crop
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const confirmCrop = () => {
  if (cropper.value) {
    const dataUrl = cropper.value.crop();
    if (dataUrl) {
        croppedImageSrc.value = dataUrl;
    }
  }
};

const generateLayout = () => {
  if (!croppedImageSrc.value) {
    alert('请先确认裁切图片！');
    return;
  }

  const DPI = 300;
  const MM_PER_INCH = 25.4;
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const MARGIN_MM = 5;

  const mmToPx = (mm) => (mm / MM_PER_INCH) * DPI;

  const canvas = a4Canvas.value;
  const ctx = canvas.getContext('2d');

  canvas.width = mmToPx(A4_WIDTH_MM);
  canvas.height = mmToPx(A4_HEIGHT_MM);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const diaPx = mmToPx(diameter.value);
  const marginPx = mmToPx(MARGIN_MM);
  const gapHPx = mmToPx(gapH.value);
  const gapVPx = mmToPx(gapV.value);

  const effectiveWidth = canvas.width - (2 * marginPx);
  const effectiveHeight = canvas.height - (2 * marginPx);

  const itemWidth = diaPx + gapHPx;
  const itemHeight = diaPx + gapVPx;

  const cols = Math.floor((effectiveWidth + gapHPx) / itemWidth);
  const rows = Math.floor((effectiveHeight + gapVPx) / itemHeight);

  if (cols === 0 || rows === 0) {
      alert('徽章尺寸过大，无法在A4纸上进行排版！');
      return;
  }

  const img = new Image();
  img.onload = () => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = marginPx + c * itemWidth;
        const y = marginPx + r * itemHeight;
        ctx.drawImage(img, x, y, diaPx, diaPx);
      }
    }
  };
  img.src = croppedImageSrc.value;
};

const printLayout = () => {
  const canvas = a4Canvas.value;
  if (canvas && canvas.width > 1 && canvas.height > 1) { // Check if canvas has been drawn on
    const printableImgEl = printableImage.value;
    
    printableImgEl.onload = () => {
      window.print();
    };
    
    printableImgEl.src = canvas.toDataURL('image/png');

  } else {
    alert('请先生成排版！');
  }
};

</script>

<style>
.a4-preview-container {
  /* A4 aspect ratio */
  aspect-ratio: 210 / 297;
  width: 100%;
}

canvas {
  width: 100%;
  height: 100%;
}

.screen-hidden {
  position: absolute;
  top: -9999px;
  left: -9999px;
}

@media print {
  body * {
    visibility: hidden;
  }
  .printable-area, .printable-area * {
    visibility: visible;
  }
  .printable-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: auto;
  }
  .printable-hidden {
      display: none;
  }
}
</style>
