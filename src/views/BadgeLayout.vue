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
            <label for="size-select" class="block text-sm font-medium text-gray-700">选择尺寸 (图片直径)</label>
            <select id="size-select" v-model="selectedSize" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
              <option v-for="(outer, inner) in sizeMap" :key="inner" :value="inner">{{ inner }}mm (外圈 {{ outer }}mm)</option>
            </select>
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
import { ref } from 'vue';
import CustomCropper from '../components/CustomCropper.vue';

// --- State ---
const sizeMap = {
  25: 32,
  32: 44,
  37: 49,
  44: 54,
  50: 61,
  56: 66,
  58: 70,
  65: 76,
  75: 86,
};
const selectedSize = ref(58);
const gapH = ref(2);
const gapV = ref(2);
const imageSrc = ref(null);
const croppedImageSrc = ref(null);
const a4Canvas = ref(null);
const cropper = ref(null);
const printableImage = ref(null);

// --- Methods ---
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        imageSrc.value = canvas.toDataURL('image/png');
        croppedImageSrc.value = null;
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
  const marginTopMM = 15;
  const marginLeftMM = 12;
  const marginRightMM = 12;
  const marginBottomMM = 15;

  const innerDiameterMM = selectedSize.value;
  const outerDiameterMM = sizeMap[innerDiameterMM];

  const mmToPx = (mm) => (mm / MM_PER_INCH) * DPI;

  const canvas = a4Canvas.value;
  const ctx = canvas.getContext('2d');

  canvas.width = mmToPx(A4_WIDTH_MM);
  canvas.height = mmToPx(A4_HEIGHT_MM);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const innerDiaPx = mmToPx(innerDiameterMM);
  const outerDiaPx = mmToPx(outerDiameterMM);
  const marginTopPx = mmToPx(marginTopMM);
  const marginLeftPx = mmToPx(marginLeftMM);
  const marginRightPx = mmToPx(marginRightMM);
  const marginBottomPx = mmToPx(marginBottomMM);
  const gapHPx = mmToPx(gapH.value);
  const gapVPx = mmToPx(gapV.value);

  const effectiveWidth = canvas.width - marginLeftPx - marginRightPx;
  const effectiveHeight = canvas.height - marginTopPx - marginBottomPx;

  // Layout calculation is based on the outer circle's diameter
  const itemWidth = outerDiaPx + gapHPx;
  const itemHeight = outerDiaPx + gapVPx;

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
        const x = marginLeftPx + c * itemWidth;
        const y = marginTopPx + r * itemHeight;

        // 1. Draw dashed outer circle
        ctx.save();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]); // Dash pattern: 4px line, 2px gap
        ctx.beginPath();
        ctx.arc(x + outerDiaPx / 2, y + outerDiaPx / 2, outerDiaPx / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 2. Draw inner image, clipped to a circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + outerDiaPx / 2, y + outerDiaPx / 2, innerDiaPx / 2, 0, Math.PI * 2);
        ctx.clip();
        // Draw the image centered within the outer circle area
        ctx.drawImage(img, x + (outerDiaPx - innerDiaPx) / 2, y + (outerDiaPx - innerDiaPx) / 2, innerDiaPx, innerDiaPx);
        ctx.restore();
      }
    }
  };
  img.src = croppedImageSrc.value;
};

const printLayout = () => {
  const canvas = a4Canvas.value;
  if (canvas && canvas.width > 1 && canvas.height > 1) {
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
  @page {
    /* 隐藏浏览器默认的页眉和页脚 */
    margin: 0;
    size: A4;
  }
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