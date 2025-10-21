<template>
  <div class="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 printable-hidden">
    <!-- Left Panel: Settings -->
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">徽章自动排版工具 (多图案版)</h1>

      <!-- Step 1: Global Settings -->
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-4">1. 全局设置</h2>
        <div class="grid grid-cols-2 gap-4">
          <!-- Mode Tabs -->
          <div class="flex border-b pt-2 col-span-2">
            <button @click="layoutMode = 'manual'" :class="{'border-blue-500 text-blue-600': layoutMode === 'manual', 'border-transparent text-gray-500': layoutMode !== 'manual'}" class="px-4 py-2 border-b-2 font-medium text-sm focus:outline-none">手动模式</button>
            <button @click="layoutMode = 'auto'" :class="{'border-blue-500 text-blue-600': layoutMode === 'auto', 'border-transparent text-gray-500': layoutMode !== 'auto'}" class="px-4 py-2 border-b-2 font-medium text-sm focus:outline-none">自动模式</button>
          </div>
          
          <div v-if="layoutMode === 'auto'" class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 animate-fade-in col-span-2">
            <p>自动模式将最大化利用纸张空间，并自动计算间隙，实现页面居中对齐。</p>
          </div>

          <div v-if="layoutMode === 'manual'" class="grid grid-cols-2 gap-4 col-span-2 animate-fade-in">
            <div>
              <label for="gapH" class="block text-sm font-medium text-gray-700">横向间隙 (mm)</label>
              <input type="number" id="gapH" v-model="gapH" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
            </div>
            <div>
              <label for="gapV" class="block text-sm font-medium text-gray-700">纵向间隙 (mm)</label>
              <input type="number" id="gapV" v-model="gapV" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Designs -->
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">2. 图案列表</h2>
          <button @click="addDesign" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">添加图案</button>
        </div>
        <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div v-if="badgeDesigns.length === 0" class="text-center text-gray-500 py-8">
            点击 "添加图案" 开始
          </div>
          <div v-for="design in badgeDesigns" :key="design.id" class="p-3 border rounded-md bg-gray-50 space-y-3">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
                <img v-if="design.croppedImageSrc" :src="design.croppedImageSrc" class="w-full h-full object-cover" alt="Cropped">
              </div>
              <div class="flex-grow text-sm font-medium">图案 #{{ design.id }}</div>
              <button @click="removeDesign(design.id)" class="text-red-500 hover:text-red-700 text-xs">移除</button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700">上传图片</label>
                <input type="file" @change="handleImageUpload($event, design)" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
              </div>
              <button @click="openCropper(design)" :disabled="!design.imageSrc" class="self-end px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 text-sm">
                裁切图片
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700">选择尺寸</label>
                <select v-model="design.size" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
                  <option v-for="(outer, inner) in sizeMap" :key="inner" :value="inner">{{ inner }}mm</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">打印数量</label>
                <input type="number" v-model.number="design.quantity" min="1" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cropper Section (conditional) -->
      <div v-if="activeDesign" class="p-4 border rounded-lg bg-white shadow-sm">
        <div class="flex justify-between items-center mb-2">
            <h2 class="text-lg font-semibold">裁切图案 #{{ activeDesign.id }}</h2>
            <div>
              <button @click="cancelCrop" class="px-4 py-2 text-gray-600 rounded hover:bg-gray-100 text-sm mr-2">取消</button>
              <button @click="confirmCrop" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">确认裁切</button>
            </div>
        </div>
        <div class="cropper-container bg-gray-100" style="height: 400px;">
          <CustomCropper
            ref="cropper"
            :src="activeDesign.imageSrc"
            :key="activeDesign.id" 
          />
        </div>
      </div>

    </div>

    <!-- Right Panel: A4 Preview -->
    <div class="p-4 border rounded-lg bg-white shadow-sm">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">3. A4 预览和打印</h2>
        <div class="flex gap-2">
            <button @click="generateLayout" :disabled="!allDesignsReady" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 text-sm">生成排版</button>
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
import { ref, computed } from 'vue';
import CustomCropper from './CustomCropper.vue';

// --- State ---
const layoutMode = ref('manual'); // 'manual' or 'auto'
const sizeMap = {
  25: 35, 32: 44, 37: 49, 44: 54, 50: 61, 56: 66, 58: 70, 65: 76, 75: 86,
};
const gapH = ref(2);
const gapV = ref(2);

const badgeDesigns = ref([]);
let nextDesignId = 1;

const cropper = ref(null);
const activeDesign = ref(null); // The design currently being cropped

const a4Canvas = ref(null);
const printableImage = ref(null);

const allDesignsReady = computed(() => badgeDesigns.value.length > 0 && badgeDesigns.value.every(d => d.croppedImageSrc));

// --- Methods ---

const addDesign = () => {
  badgeDesigns.value.push({
    id: nextDesignId++,
    imageSrc: null,
    croppedImageSrc: null,
    size: 58, // default size
    quantity: 1,
  });
};

const removeDesign = (id) => {
  badgeDesigns.value = badgeDesigns.value.filter(d => d.id !== id);
};

const handleImageUpload = (event, design) => {
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
        design.imageSrc = canvas.toDataURL('image/png');
        design.croppedImageSrc = null; // Reset crop when new image is uploaded
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const openCropper = (design) => {
  if (design.imageSrc) {
    activeDesign.value = design;
  } else {
    alert('请先上传图片！');
  }
};

const confirmCrop = () => {
  if (cropper.value && activeDesign.value) {
    activeDesign.value.croppedImageSrc = cropper.value.crop();
    activeDesign.value = null; // Hide cropper
  }
};

const cancelCrop = () => {
    activeDesign.value = null;
}

const generateLayout = () => {
    if (badgeDesigns.value.length === 0 || badgeDesigns.value.some(d => !d.croppedImageSrc)) {
        alert('请确保所有图案都已上传并裁切！');
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

    const allBadges = [];
    badgeDesigns.value.forEach(design => {
        for (let i = 0; i < (design.quantity || 1); i++) {
            allBadges.push({
                size: design.size,
                croppedImageSrc: design.croppedImageSrc,
                outerDiameter: sizeMap[design.size],
            });
        }
    });

    allBadges.sort((a, b) => b.outerDiameter - a.outerDiameter);

    const effectiveCanvasWidth = canvas.width - mmToPx(12 + 12); // A4_WIDTH_MM - marginLeftMM - marginRightMM
    const effectiveCanvasHeight = canvas.height - mmToPx(15 + 15); // A4_HEIGHT_MM - marginTopMM - marginBottomMM

    let currentX = 0; // Relative X
    let currentY = 0; // Relative Y
    let maxRowHeight = 0;
    let totalPackedWidth = 0;
    let totalPackedHeight = 0;

    const placedBadges = []; // Store {x, y, badge, img}

    const imageLoadPromises = allBadges.map(badge => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ badge, img });
            img.onerror = reject;
            img.src = badge.croppedImageSrc;
        });
    });

    Promise.all(imageLoadPromises).then(loadedImages => {
        loadedImages.forEach(({ badge, img }) => {
            const innerDiaPx = mmToPx(badge.size);
            const outerDiaPx = mmToPx(badge.outerDiameter);
            const currentGapHPx = layoutMode.value === 'manual' ? mmToPx(gapH.value) : mmToPx(2); // Default min gap for auto
            const currentGapVPx = layoutMode.value === 'manual' ? mmToPx(gapV.value) : mmToPx(2); // Default min gap for auto

            if (currentX + outerDiaPx > effectiveCanvasWidth && currentX !== 0) { // If it doesn't fit in current row, and it's not the very first item
                currentX = 0;
                currentY += maxRowHeight + currentGapVPx;
                maxRowHeight = 0;
            }

            placedBadges.push({
                x: currentX,
                y: currentY,
                badge,
                img,
                innerDiaPx,
                outerDiaPx
            });

            currentX += outerDiaPx + currentGapHPx;
            if (outerDiaPx > maxRowHeight) {
                maxRowHeight = outerDiaPx;
            }
            totalPackedWidth = Math.max(totalPackedWidth, currentX - currentGapHPx); // Max X reached by any badge
            totalPackedHeight = Math.max(totalPackedHeight, currentY + outerDiaPx); // Max Y reached by any badge
        });

        // Calculate centering offsets
        let offsetX = 0;
        let offsetY = 0;

        if (layoutMode.value === 'auto') {
            offsetX = (canvas.width - totalPackedWidth) / 2;
            offsetY = (canvas.height - totalPackedHeight) / 2;
        } else { // Manual mode, use fixed margins
            offsetX = mmToPx(12); // marginLeftMM
            offsetY = mmToPx(15); // marginTopMM
        }

        // Draw all placed badges with calculated offsets
        placedBadges.forEach(item => {
            const { x, y, badge, img, innerDiaPx, outerDiaPx } = item;

            const finalX = x + offsetX;
            const finalY = y + offsetY;

            // Check if badge is within canvas bounds after centering
            if (finalX + outerDiaPx > canvas.width || finalY + outerDiaPx > canvas.height || finalX < 0 || finalY < 0) {
                console.warn("Badge drawn outside canvas bounds after centering. Consider reducing gaps or badge sizes.");
                return;
            }

            // Draw dashed outer circle
            ctx.save();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 2]);
            ctx.beginPath();
            ctx.arc(finalX + outerDiaPx / 2, finalY + outerDiaPx / 2, outerDiaPx / 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // Draw inner image
            ctx.save();
            ctx.beginPath();
            ctx.arc(finalX + outerDiaPx / 2, finalY + outerDiaPx / 2, innerDiaPx / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, finalX + (outerDiaPx - innerDiaPx) / 2, finalY + (outerDiaPx - innerDiaPx) / 2, innerDiaPx, innerDiaPx);
            ctx.restore();
        });
    }).catch(error => {
        console.error("Error loading images for layout:", error);
        alert("加载图片时出错，无法生成排版。");
    });
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