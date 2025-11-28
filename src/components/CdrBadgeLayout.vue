<template>
  <div class="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 printable-hidden">
    <!-- Left Panel: Settings and Cropper -->
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">CDR排版工具</h1>

      <!-- Step 1: Settings -->
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-4">1. 输入设置</h2>

        <div class="space-y-4">
          <div>
            <label for="size-select" class="block text-sm font-medium text-gray-700">选择尺寸 (图片直径)</label>
            <select id="size-select" v-model.number="selectedSize" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
              <option v-for="(outer, inner) in sizeMap" :key="inner" :value="inner">{{ inner }}mm (外圈 {{ outer }}mm)</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="spacing-h" class="block text-sm font-medium text-gray-700">水平间距 (mm)</label>
              <input type="number" id="spacing-h" v-model.number="spacingH" step="0.1" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
            </div>
            <div>
              <label for="spacing-v" class="block text-sm font-medium text-gray-700">垂直间距 (mm)</label>
              <input type="number" id="spacing-v" v-model.number="spacingV" step="0.1" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="edge-padding-h" class="block text-sm font-medium text-gray-700">页面边缘留白-水平方向 (mm)</label>
              <input type="number" id="edge-padding-h" v-model.number="edgePaddingH" step="0.1" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
            </div>
            <div>
              <label for="edge-padding-v" class="block text-sm font-medium text-gray-700">页面边缘留白-垂直方向 (mm)</label>
              <input type="number" id="edge-padding-v" v-model.number="edgePaddingV" step="0.1" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="margin-top" class="block text-sm font-medium text-gray-700">上边缘 (mm)</label>
              <input type="number" id="margin-top" v-model.number="marginTop" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
            </div>
            <div>
              <label for="margin-bottom" class="block text-sm font-medium text-gray-700">下边缘 (mm)</label>
              <input type="number" id="margin-bottom" v-model.number="marginBottom" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="margin-left" class="block text-sm font-medium text-gray-700">左边缘 (mm)</label>
              <input type="number" id="margin-left" v-model.number="marginLeft" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
            </div>
            <div>
              <label for="margin-right" class="block text-sm font-medium text-gray-700">右边缘 (mm)</label>
              <input type="number" id="margin-right" v-model.number="marginRight" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
            </div>
          </div>

          <div>
            <label for="image-upload" class="block text-sm font-medium text-gray-700">上传图片</label>
            <input type="file" id="image-upload" @change="handleImageUpload" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
          </div>
        </div>
      </div>

      <!-- Step 2: Cropper -->
      <div v-if="imageSrc" class="p-4 border rounded-lg bg-white shadow-sm">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">2. 裁切图片</h2>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <label for="cropper-bg-color" class="text-sm font-medium text-gray-700">背景色:</label>
                <input type="color" id="cropper-bg-color" v-model="cropperBgColor" class="w-8 h-8 p-0 border rounded cursor-pointer" style="border-color: #ccc;">
              </div>
              <button @click="confirmCrop" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">确认裁切</button>
            </div>
        </div>
        <div class="cropper-container" :style="{ backgroundColor: cropperBgColor, height: '400px' }">
          <CustomCropper
            ref="cropper"
            :src="imageSrc"
            :background-color="cropperBgColor"
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
import { ref, onUnmounted } from 'vue';
import CustomCropper from './CustomCropper.vue';

// --- State ---
const sizeMap = {
  25: 35, 32: 44, 37: 49, 44: 54, 50: 61, 56: 66, 58: 70, 65: 76, 75: 86,
};
const selectedSize = ref(58);
const spacingH = ref(2.0);
const spacingV = ref(2.0);
const edgePaddingH = ref(2.0);
const edgePaddingV = ref(2.0);
const marginTop = ref(5);
const marginBottom = ref(5);
const marginLeft = ref(5);
const marginRight = ref(5);
const imageSrc = ref(null);
const croppedImageSrc = ref(null);
const a4Canvas = ref(null);
const cropper = ref(null);
const printableImage = ref(null);
const cropperBgColor = ref('#f3f4f6');

// --- Methods ---
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (imageSrc.value && imageSrc.value.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc.value);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIMENSION = 4096;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const aspectRatio = width / height;
          if (width > height) {
            width = MAX_DIMENSION;
            height = MAX_DIMENSION / aspectRatio;
          } else {
            height = MAX_DIMENSION;
            width = MAX_DIMENSION * aspectRatio;
          }
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(img, 0, 0, width, height);
          imageSrc.value = tempCanvas.toDataURL('image/png');
        } else {
          imageSrc.value = e.target.result;
        }
        croppedImageSrc.value = null;
      };
      img.onerror = () => {
        alert("图片加载失败，请检查文件是否损坏或尝试其他图片。");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

onUnmounted(() => {
  if (imageSrc.value && imageSrc.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageSrc.value);
  }
});

const confirmCrop = () => {
  if (cropper.value) {
    const croppedDataUrl = cropper.value.crop();
    croppedImageSrc.value = croppedDataUrl;
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
  const mmToPx = (mm) => (mm / MM_PER_INCH) * DPI;

  const canvas = a4Canvas.value;
  const ctx = canvas.getContext('2d');
  canvas.width = mmToPx(A4_WIDTH_MM);
  canvas.height = mmToPx(A4_HEIGHT_MM);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Get inner and outer diameters
  const innerDiameterMM = selectedSize.value;
  const outerDiameterMM = sizeMap[innerDiameterMM];
  const innerDiaPx = mmToPx(innerDiameterMM);
  const outerDiaPx = mmToPx(outerDiameterMM);

  // Draw corner markers (L-shaped lines)
  const markerLength = mmToPx(10);
  const markerLineWidth = mmToPx(0.6);
  const marginTopPx = mmToPx(marginTop.value);
  const marginBottomPx = mmToPx(marginBottom.value);
  const marginLeftPx = mmToPx(marginLeft.value);
  const marginRightPx = mmToPx(marginRight.value);

  ctx.strokeStyle = 'black';
  ctx.lineWidth = markerLineWidth;

  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(marginLeftPx, marginTopPx);
  ctx.lineTo(marginLeftPx + markerLength, marginTopPx);
  ctx.moveTo(marginLeftPx, marginTopPx);
  ctx.lineTo(marginLeftPx, marginTopPx + markerLength);
  ctx.stroke();

  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(canvas.width - marginRightPx, marginTopPx);
  ctx.lineTo(canvas.width - marginRightPx - markerLength, marginTopPx);
  ctx.moveTo(canvas.width - marginRightPx, marginTopPx);
  ctx.lineTo(canvas.width - marginRightPx, marginTopPx + markerLength);
  ctx.stroke();

  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(marginLeftPx, canvas.height - marginBottomPx);
  ctx.lineTo(marginLeftPx + markerLength, canvas.height - marginBottomPx);
  ctx.moveTo(marginLeftPx, canvas.height - marginBottomPx);
  ctx.lineTo(marginLeftPx, canvas.height - marginBottomPx - markerLength);
  ctx.stroke();

  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(canvas.width - marginRightPx, canvas.height - marginBottomPx);
  ctx.lineTo(canvas.width - marginRightPx - markerLength, canvas.height - marginBottomPx);
  ctx.moveTo(canvas.width - marginRightPx, canvas.height - marginBottomPx);
  ctx.lineTo(canvas.width - marginRightPx, canvas.height - marginBottomPx - markerLength);
  ctx.stroke();

  // Calculate layout area (apply edge padding inside the margins, allow 5mm overflow)
  const allowedOverflow = mmToPx(5);
  const edgePaddingHPx = mmToPx(edgePaddingH.value);
  const edgePaddingVPx = mmToPx(edgePaddingV.value);
  const effectiveWidth = canvas.width - marginLeftPx - marginRightPx - 2 * edgePaddingHPx + 2 * allowedOverflow;
  const effectiveHeight = canvas.height - marginTopPx - marginBottomPx - 2 * edgePaddingVPx + 2 * allowedOverflow;
  const spacingHPx = mmToPx(spacingH.value);
  const spacingVPx = mmToPx(spacingV.value);

  // Calculate how many badges fit (using outer diameter + spacing)
  const cols = Math.floor((effectiveWidth + spacingHPx) / (outerDiaPx + spacingHPx));
  const rows = Math.floor((effectiveHeight + spacingVPx) / (outerDiaPx + spacingVPx));

  if (cols === 0 || rows === 0) {
    alert('徽章尺寸过大，无法在A4纸上进行排版！');
    return;
  }

  // Calculate spacing to center the layout
  const totalBadgesWidth = cols * outerDiaPx + (cols - 1) * spacingHPx;
  const totalBadgesHeight = rows * outerDiaPx + (rows - 1) * spacingVPx;
  const startX = marginLeftPx + edgePaddingHPx - allowedOverflow + (effectiveWidth - totalBadgesWidth) / 2;
  const startY = marginTopPx + edgePaddingVPx - allowedOverflow + (effectiveHeight - totalBadgesHeight) / 2;

  const img = new Image();
  img.onload = () => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {

        const x = startX + c * (outerDiaPx + spacingHPx);
        const y = startY + r * (outerDiaPx + spacingVPx);

        // 1. Draw dashed outer circle
        ctx.save();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.arc(x + outerDiaPx / 2, y + outerDiaPx / 2, outerDiaPx / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 2. Draw inner image, clipped to a circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + outerDiaPx / 2, y + outerDiaPx / 2, innerDiaPx / 2, 0, Math.PI * 2);
        ctx.clip();
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
    printableImgEl.onload = () => window.print();
    printableImgEl.src = canvas.toDataURL('image/png');
  } else {
    alert('请先生成排版！');
  }
};

</script>

<style>
.a4-preview-container {
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
