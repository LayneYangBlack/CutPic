<template>
  <div class="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 printable-hidden">
    <!-- Left Panel: Settings and Cropper -->
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">徽章自动排版工具</h1>

      <!-- Step 1: Settings -->
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-4">1. 输入设置</h2>

        <div class="space-y-4">
          <div>
            <label for="size-select" class="block text-sm font-medium text-gray-700">选择尺寸 (图片直径)</label>
            <select id="size-select" v-model="selectedSize" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
              <option v-for="(outer, inner) in sizeMap" :key="inner" :value="inner">{{ inner }}mm (外圈 {{ outer }}mm)</option>
            </select>
          </div>

          <div>
            <label for="print-quantity" class="block text-sm font-medium text-gray-700">打印数量 (可选)</label>
            <input type="number" id="print-quantity" v-model.number="printQuantity" placeholder="留空则打印整页" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
          </div>

          <!-- Mode Tabs -->
          <div class="flex border-b pt-2">
            <button @click="layoutMode = 'manual'" :class="{'border-blue-500 text-blue-600': layoutMode === 'manual', 'border-transparent text-gray-500': layoutMode !== 'manual'}" class="px-4 py-2 border-b-2 font-medium text-sm focus:outline-none">手动模式</button>
            <button @click="layoutMode = 'auto'" :class="{'border-blue-500 text-blue-600': layoutMode === 'auto', 'border-transparent text-gray-500': layoutMode !== 'auto'}" class="px-4 py-2 border-b-2 font-medium text-sm focus:outline-none">自动模式</button>
          </div>
          
          <div v-if="layoutMode === 'manual'" class="space-y-4 animate-fade-in">
            <div>
              <label for="gapH" class="block text-sm font-medium text-gray-700">横向间隙 (mm)</label>
              <input type="number" id="gapH" v-model="gapH" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
            </div>
            <div>
              <label for="gapV" class="block text-sm font-medium text-gray-700">纵向间隙 (mm)</label>
              <input type="number" id="gapV" v-model="gapV" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
            </div>
          </div>

          <div v-if="layoutMode === 'auto'" class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 animate-fade-in">
            <p>自动模式将最大化利用纸张空间，并自动计算间隙，实现页面居中对齐。</p>
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
const layoutMode = ref('manual'); // 'manual' or 'auto'
const sizeMap = {
  25: 32, 32: 44, 37: 49, 44: 54, 50: 61, 56: 66, 58: 70, 65: 76, 75: 86,
};
const selectedSize = ref(58);
const printQuantity = ref(null);
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
        canvas.getContext('2d').drawImage(img, 0, 0);
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
    croppedImageSrc.value = cropper.value.crop();
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

  // --- Add text label for the specification ---
  const innerDiameterMM = selectedSize.value;
  const outerDiameterMM = sizeMap[innerDiameterMM];
  ctx.save();
  ctx.fillStyle = 'black';
  ctx.font = '28px Arial'; // Font size in pixels
  const labelText = `规格: ${innerDiameterMM}mm`; // Simplified label
  const textMarginPx = mmToPx(3); // 3mm margin from edge
  ctx.fillText(labelText, textMarginPx, textMarginPx + 28); // Y-coordinate is margin + font size
  ctx.restore();
  // --- End of text label ---

  const innerDiaPx = mmToPx(innerDiameterMM);
  const outerDiaPx = mmToPx(outerDiameterMM);

  let cols, rows, startX, startY, itemSpacingX, itemSpacingY;

  if (layoutMode.value === 'auto') {
    // --- AUTO MODE LOGIC ---
    const minGapMM = selectedSize.value <= 32 ? 4 : 2;
    const minGapPx = mmToPx(minGapMM);
    cols = Math.floor((canvas.width + minGapPx) / (outerDiaPx + minGapPx));
    rows = Math.floor((canvas.height + minGapPx) / (outerDiaPx + minGapPx));
    if (cols === 0 || rows === 0) { alert('徽章尺寸过大，无法在A4纸上进行排版！'); return; }
    const totalBadgesWidth = cols * outerDiaPx;
    const remainingWidth = canvas.width - totalBadgesWidth;
    const horizontalGap = remainingWidth / (cols + 1);
    const totalBadgesHeight = rows * outerDiaPx;
    const remainingHeight = canvas.height - totalBadgesHeight;
    const verticalGap = remainingHeight / (rows + 1);
    startX = horizontalGap;
    startY = verticalGap;
    itemSpacingX = outerDiaPx + horizontalGap;
    itemSpacingY = outerDiaPx + verticalGap;
  } else {
    // --- MANUAL MODE LOGIC ---
    const marginTopMM = 15, marginLeftMM = 12, marginRightMM = 12, marginBottomMM = 15;
    const marginTopPx = mmToPx(marginTopMM), marginLeftPx = mmToPx(marginLeftMM), marginRightPx = mmToPx(marginRightMM), marginBottomPx = mmToPx(marginBottomMM);
    const gapHPx = mmToPx(gapH.value), gapVPx = mmToPx(gapV.value);
    const effectiveWidth = canvas.width - marginLeftPx - marginRightPx;
    const effectiveHeight = canvas.height - marginTopPx - marginBottomPx;
    itemSpacingX = outerDiaPx + gapHPx;
    itemSpacingY = outerDiaPx + gapVPx;
    cols = Math.floor((effectiveWidth + gapHPx) / itemSpacingX);
    rows = Math.floor((effectiveHeight + gapVPx) / itemSpacingY);
    if (cols === 0 || rows === 0) { alert('徽章尺寸过大，无法在A4纸上进行排版！'); return; }
    startX = marginLeftPx;
    startY = marginTopPx;
  }

  const img = new Image();
  img.onload = () => {
    let drawnCount = 0;
    const maxToDraw = (printQuantity.value && printQuantity.value > 0) ? printQuantity.value : (rows * cols);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (drawnCount >= maxToDraw) break;

        const x = startX + c * itemSpacingX;
        const y = startY + r * itemSpacingY;

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
        
        drawnCount++;
      }
      if (drawnCount >= maxToDraw) break;
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
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
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