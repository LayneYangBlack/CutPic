<template>
  <div class="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 printable-hidden">
    <!-- Left Panel: Settings -->
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">徽章自动排版工具 (多图案版)</h1>

      <!-- Step 1: 说明 -->
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-2">多图智能排版</h2>
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p class="mb-1">✨ <strong>智能排版规则：</strong></p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li>满张纸时自动使用 <strong>CDR模式</strong>（紧密排列，四角定位标记）</li>
            <li>不满张时自动使用 <strong>外圆切线模式</strong>（虚线外圆，方便手动裁剪）</li>
            <li>仅支持相同尺寸的徽章混合排版</li>
          </ul>
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
      <div v-if="activeDesign && !showHistorySelectionModal" class="p-4 border rounded-lg bg-white shadow-sm">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">裁切图案 #{{ activeDesign.id }}</h2>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <label for="multi-cropper-bg-color" class="text-sm font-medium text-gray-700">背景色:</label>
                <input type="color" id="multi-cropper-bg-color" v-model="cropperBgColor" class="w-8 h-8 p-0 border rounded cursor-pointer" style="border-color: #ccc;">
              </div>
              <div>
                <button @click="cancelCrop" class="px-4 py-2 text-gray-600 rounded hover:bg-gray-100 text-sm mr-2">取消</button>
                <button @click="confirmCrop" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">确认裁切</button>
              </div>
            </div>
        </div>
        <div class="cropper-container" :style="{ backgroundColor: cropperBgColor, height: '400px' }">
          <CustomCropper
            ref="cropper"
            :src="activeDesign.imageSrc"
            :key="activeDesign.id" 
            :background-color="cropperBgColor"
          />
        </div>
      </div>

      <!-- 裁剪历史记录 -->
      <div v-if="cropHistory.length > 0 && !activeDesign && !showHistorySelectionModal" class="p-4 border rounded-lg bg-white shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">裁剪历史</h2>
          <div class="flex items-center gap-3">
            <!-- 规格筛选下拉框 -->
            <select v-model="selectedFilter" class="px-3 py-1 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">全部 ({{ cropHistory.length }})</option>
              <option v-for="size in availableSizes" :key="size" :value="size">
                {{ size }}mm ({{ sizeCount[size] }})
              </option>
            </select>
            <button @click="clearHistory" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
              清空历史
            </button>
          </div>
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          <div v-for="item in filteredHistory" :key="item.id" class="relative group">
            <img
              :src="item.croppedImageSrc"
              class="w-full h-auto rounded-full border-2 border-gray-300 group-hover:border-blue-500 cursor-pointer"
              @click="useHistoryImageForDesign(item)"
              :title="`裁剪于: ${new Date(item.timestamp).toLocaleString()} 尺寸: ${item.metadata.size}mm`"
            />
            <div class="text-center text-xs text-gray-600 mt-1">{{ item.metadata.size }}mm</div>
            <button
              @click="removeCrop(item.id)"
              class="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              &times;
            </button>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-3">💡 点击历史图片可快速应用到新图案</p>
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

      <!-- 分页提示 -->
      <div v-if="generatedPages.length > 1" class="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
        已生成 {{ generatedPages.length }} 页排版，点击打印将打印所有页面
      </div>

      <div class="bg-gray-200 p-2 a4-preview-container overflow-auto shadow-inner rounded">
        <canvas ref="a4Canvas"></canvas>
      </div>

      <!-- 多页预览缩略图 -->
      <div v-if="generatedPages.length > 1" class="mt-4">
        <h3 class="text-sm font-semibold mb-2">所有页面预览：</h3>
        <div class="grid grid-cols-3 gap-2">
          <div v-for="(page, index) in generatedPages" :key="index" class="border rounded p-1 bg-white">
            <img :src="page" class="w-full h-auto" :alt="`第 ${index + 1} 页`">
            <p class="text-xs text-center text-gray-600 mt-1">第 {{ index + 1 }} 页</p>
          </div>
        </div>
      </div>
    </div>

    <!-- History Selection Modal -->
    <div v-if="showHistorySelectionModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div class="relative p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">选择裁剪图片</h3>
        <div class="mt-2">
          <p class="text-sm text-gray-500 mb-4">您可以选择从历史记录中加载，或者裁剪一张新图片。</p>
          
          <div class="flex justify-around mb-6">
            <button @click="openNewCropper" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">裁剪新图片</button>
          </div>

          <div v-if="cropHistory.length > 0">
            <div class="flex justify-between items-center mb-2">
              <h4 class="text-md font-medium text-gray-700">裁剪历史</h4>
              <!-- 规格筛选 -->
              <select v-model="modalSelectedFilter" class="px-2 py-1 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">全部 ({{ cropHistory.length }})</option>
                <option v-for="size in availableSizes" :key="size" :value="size">
                  {{ size }}mm ({{ sizeCount[size] }})
                </option>
              </select>
            </div>
            <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3 p-2 border rounded-md bg-gray-50 max-h-96 overflow-y-auto">
              <div v-for="item in modalFilteredHistory" :key="item.id" class="relative group">
                <img :src="item.croppedImageSrc" class="w-full h-auto rounded-full border-2 border-gray-300 group-hover:border-green-500 cursor-pointer" @click="selectFromHistory(item)" :title="`裁剪于: ${new Date(item.timestamp).toLocaleString()} 尺寸: ${item.metadata.size}mm`">
                <div class="text-center text-xs text-gray-600 mt-1">{{ item.metadata.size }}mm</div>
                <button @click="removeCrop(item.id)" class="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  &times;
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-500 py-4">
            暂无裁剪历史记录。
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button @click="cancelHistorySelection" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm">取消</button>
        </div>
      </div>
    </div>
  </div>
  <img ref="printableImage" class="printable-area screen-hidden" alt="Printable Layout">
</template>

<script setup>
import { ref, computed } from 'vue';
import CustomCropper from './CustomCropper.vue';
import { useCropHistory } from '../composables/useCropHistory.js'; // New import

// --- State ---
// 固定使用自动模式，不需要用户手动选择
const layoutMode = ref('auto'); // 固定为 'auto'
const drawMode = ref('auto'); // 固定为 'auto'（自动判断CDR或外圆切线）
const sizeMap = {
  25: 35, 32: 44, 37: 49, 44: 54, 50: 61, 56: 66, 58: 70, 65: 76, 75: 86,
};
// 移除手动间隙设置，使用默认值
// const gapH = ref(2);
// const gapV = ref(2);

// 自动模式下的默认间隙 (mm) - 外圆切线模式使用
const autoModeDefaultGap = ref(10);

const badgeDesigns = ref([]);
let nextDesignId = 1;

const cropper = ref(null);
const activeDesign = ref(null); // The design currently being cropped
const showHistorySelectionModal = ref(false); // New state for modal

const a4Canvas = ref(null);
const printableImage = ref(null);
const cropperBgColor = ref('#ffffff'); // 裁剪框默认背景色：白色
const generatedPages = ref([]); // 存储生成的多页canvas的dataURL数组

const allDesignsReady = computed(() => badgeDesigns.value.length > 0 && badgeDesigns.value.every(d => d.croppedImageSrc));

const { cropHistory, addCrop, removeCrop, clearHistory } = useCropHistory(); // Use composable

// 规格筛选功能
const selectedFilter = ref('all'); // 当前选中的规格筛选（用于主裁剪历史区）
const modalSelectedFilter = ref('all'); // 模态框中的规格筛选

// 计算属性：获取历史记录中存在的所有规格
const availableSizes = computed(() => {
  const sizes = new Set();
  cropHistory.value.forEach(item => {
    if (item.metadata && item.metadata.size) {
      sizes.add(item.metadata.size);
    }
  });
  return Array.from(sizes).sort((a, b) => a - b);
});

// 计算属性：统计每个规格的数量
const sizeCount = computed(() => {
  const counts = {};
  cropHistory.value.forEach(item => {
    if (item.metadata && item.metadata.size) {
      const size = item.metadata.size;
      counts[size] = (counts[size] || 0) + 1;
    }
  });
  return counts;
});

// 计算属性：根据筛选条件过滤历史记录（主区域）
const filteredHistory = computed(() => {
  if (selectedFilter.value === 'all') {
    return cropHistory.value;
  }
  return cropHistory.value.filter(
    item => item.metadata.size === Number(selectedFilter.value)
  );
});

// 计算属性：根据筛选条件过滤历史记录（模态框）
const modalFilteredHistory = computed(() => {
  if (modalSelectedFilter.value === 'all') {
    return cropHistory.value;
  }
  return cropHistory.value.filter(
    item => item.metadata.size === Number(modalSelectedFilter.value)
  );
});

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
    // Revoke previous blob URL if any, though design.imageSrc directly stores Base64 here.
    // If it ever switches to blob URL, this will be needed.
    // if (design.imageSrc && design.imageSrc.startsWith('blob:')) {
    //   URL.revokeObjectURL(design.imageSrc);
    // }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIMENSION = 4096; // Max dimension for either width or height
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
          // Create a temporary canvas for downscaling
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(img, 0, 0, width, height);
          design.imageSrc = tempCanvas.toDataURL('image/png'); // Convert downscaled image to data URL
          console.log(`MultiBadgeLayout: Image downscaled from ${img.width}x${img.height} to ${width}x${height}`);
        } else {
          // If image is not too large, use the original data URL
          design.imageSrc = e.target.result;
        }
        design.croppedImageSrc = null; // Reset crop when new image is uploaded
      };
      img.onerror = () => {
        console.error("MultiBadgeLayout: Image failed to load from FileReader result.", { src: e.target.result });
        alert("图片加载失败，请检查文件是否损坏或尝试其他图片。");
      };
      img.src = e.target.result; // Load image from FileReader result
    };
    reader.readAsDataURL(file);
  }
};

const openCropper = (design) => {
  if (design.imageSrc) {
    activeDesign.value = design;
    showHistorySelectionModal.value = true; // Show selection modal
  } else {
    alert('请先上传图片！');
  }
};

const selectFromHistory = (historyItem) => {
  if (activeDesign.value) {
    activeDesign.value.croppedImageSrc = historyItem.croppedImageSrc;
    activeDesign.value.size = historyItem.metadata.size; // Restore size
    showHistorySelectionModal.value = false;
    activeDesign.value = null; // Clear active design
  }
};

const openNewCropper = () => {
  showHistorySelectionModal.value = false;
  // activeDesign.value is already set by openCropper, so cropper will appear
};

const cancelHistorySelection = () => {
  showHistorySelectionModal.value = false;
  activeDesign.value = null; // Clear active design
};

const confirmCrop = () => {
  if (cropper.value && activeDesign.value) {
    const croppedDataUrl = cropper.value.crop();
    activeDesign.value.croppedImageSrc = croppedDataUrl;
    // 添加到裁剪历史记录
    addCrop(croppedDataUrl, { size: activeDesign.value.size });
    activeDesign.value = null; // Hide cropper
  }
};

const cancelCrop = () => {
    activeDesign.value = null;
}

// 从历史记录快速应用图片到新图案
const useHistoryImageForDesign = (historyItem) => {
  // 创建一个新的图案并使用历史图片
  const newDesign = {
    id: nextDesignId++,
    imageSrc: historyItem.croppedImageSrc, // 使用历史图片作为原图
    croppedImageSrc: historyItem.croppedImageSrc, // 直接使用历史裁剪结果
    size: historyItem.metadata.size, // 使用历史尺寸
    quantity: 1,
  };
  badgeDesigns.value.push(newDesign);
};

const generateLayout = () => {
    if (badgeDesigns.value.length === 0 || badgeDesigns.value.some(d => !d.croppedImageSrc)) {
        alert('请确保所有图案都已上传并裁切！');
        return;
    }

    // 1️⃣ 检查所有徽章尺寸是否一致
    const sizes = new Set(badgeDesigns.value.map(d => d.size));
    if (sizes.size > 1) {
        const sizeList = Array.from(sizes).sort((a, b) => a - b).join('mm, ') + 'mm';
        alert(`❌ 多图排版仅支持相同尺寸的徽章！\n\n当前图案包含多个尺寸：${sizeList}\n\n请删除不同尺寸的图案，或使用单图排版工具。`);
        return;
    }

    // New: Add all unique cropped images from current designs to history
    const uniqueCroppedImages = new Map(); // Use Map to store unique cropped images by their data URL + size
    badgeDesigns.value.forEach(design => {
      if (design.croppedImageSrc) {
        const key = design.croppedImageSrc + '-' + design.size; // Unique key for image + size
        if (!uniqueCroppedImages.has(key)) {
          uniqueCroppedImages.set(key, {
            croppedImageSrc: design.croppedImageSrc,
            metadata: { size: design.size }
          });
        }
      }
    });
    uniqueCroppedImages.forEach(item => {
      addCrop(item.croppedImageSrc, item.metadata);
    });

    const DPI = 300;
    const MM_PER_INCH = 25.4;
    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;
    const mmToPx = (mm) => (mm / MM_PER_INCH) * DPI;

    // 2️⃣ 准备所有要排版的徽章（展开数量）
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

    // 按尺寸排序（大到小）
    allBadges.sort((a, b) => b.outerDiameter - a.outerDiameter);

    // 3️⃣ 计算单页能放多少个徽章
    // 统一使用CDR模式的参数来计算（这样才能准确判断是否满张）
    const cdrMarginTop = 10;
    const cdrMarginBottom = 10;
    const cdrMarginLeft = 10;
    const cdrMarginRight = 10;
    const cdrSpacingH = 2.0;
    const cdrSpacingV = 2.0;
    const cdrEdgePaddingH = 2.0;
    const cdrEdgePaddingV = 2.0;
    const cdrAllowedOverflow = 5;

    // 使用CDR模式的参数计算有效区域（与CdrBadgeLayout.vue完全相同）
    const allowedOverflowPx = mmToPx(cdrAllowedOverflow);
    const edgePaddingHPx = mmToPx(cdrEdgePaddingH);
    const edgePaddingVPx = mmToPx(cdrEdgePaddingV);
    const marginLeftPx = mmToPx(cdrMarginLeft);
    const marginRightPx = mmToPx(cdrMarginRight);
    const marginTopPx = mmToPx(cdrMarginTop);
    const marginBottomPx = mmToPx(cdrMarginBottom);

    const effectiveCanvasWidth = mmToPx(A4_WIDTH_MM) - marginLeftPx - marginRightPx - 2 * edgePaddingHPx + 2 * allowedOverflowPx;
    const effectiveCanvasHeight = mmToPx(A4_HEIGHT_MM) - marginTopPx - marginBottomPx - 2 * edgePaddingVPx + 2 * allowedOverflowPx;
    const currentGapHPx = mmToPx(cdrSpacingH);
    const currentGapVPx = mmToPx(cdrSpacingV);

    // 使用第一个徽章的尺寸计算（因为所有徽章尺寸相同）
    const sampleBadge = allBadges[0];
    const outerDiaPx = mmToPx(sampleBadge.outerDiameter);

    // 使用与CdrBadgeLayout.vue完全相同的计算公式
    const colsPerPage = Math.floor((effectiveCanvasWidth + currentGapHPx) / (outerDiaPx + currentGapHPx));
    const rowsPerPage = Math.floor((effectiveCanvasHeight + currentGapVPx) / (outerDiaPx + currentGapVPx));
    const badgesPerPage = colsPerPage * rowsPerPage;

    if (badgesPerPage === 0) {
        alert('徽章尺寸过大，无法在A4纸上进行排版！');
        return;
    }

    // 4️⃣ 计算需要多少页
    const totalPages = Math.ceil(allBadges.length / badgesPerPage);
    console.log(`总共 ${allBadges.length} 个徽章，每页 ${badgesPerPage} 个，需要 ${totalPages} 页`);

    // 清空之前的页面
    generatedPages.value = [];

    // 5️⃣ 为每一页生成排版
    const generatePage = (pageIndex) => {
        return new Promise((resolve, reject) => {
            const startIdx = pageIndex * badgesPerPage;
            const endIdx = Math.min(startIdx + badgesPerPage, allBadges.length);
            const pageBadges = allBadges.slice(startIdx, endIdx);

            // 🎯 判断当前页是否"满张"：徽章数量 = 最大容量
            const isFullPage = pageBadges.length === badgesPerPage;

            // 🎨 根据用户选择的模式和页面满载情况决定绘制模式
            let actualDrawMode = drawMode.value;
            if (drawMode.value === 'auto') {
                // 自动模式：满张用CDR，不满用outline
                actualDrawMode = isFullPage ? 'cdr' : 'outline';
            }
            // 如果用户强制选择了某个模式，则使用用户选择的模式

            // 创建临时canvas
            const canvas = document.createElement('canvas');
            canvas.width = mmToPx(A4_WIDTH_MM);
            canvas.height = mmToPx(A4_HEIGHT_MM);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // CDR模式：绘制四个角的实心圆标记
            if (actualDrawMode === 'cdr') {
                // 使用CDR模式的边距参数
                const marginTopPx = mmToPx(cdrMarginTop);
                const marginBottomPx = mmToPx(cdrMarginBottom);
                const marginLeftPx = mmToPx(cdrMarginLeft);
                const marginRightPx = mmToPx(cdrMarginRight);
                const markerDiameter = mmToPx(5);
                const markerRadius = markerDiameter / 2;

                ctx.fillStyle = 'black';
                // 左上角
                ctx.beginPath();
                ctx.arc(marginLeftPx, marginTopPx, markerRadius, 0, Math.PI * 2);
                ctx.fill();
                // 右上角
                ctx.beginPath();
                ctx.arc(canvas.width - marginRightPx, marginTopPx, markerRadius, 0, Math.PI * 2);
                ctx.fill();
                // 左下角
                ctx.beginPath();
                ctx.arc(marginLeftPx, canvas.height - marginBottomPx, markerRadius, 0, Math.PI * 2);
                ctx.fill();
                // 右下角
                ctx.beginPath();
                ctx.arc(canvas.width - marginRightPx, canvas.height - marginBottomPx, markerRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            // 计算起始位置（居中）
            let offsetX, offsetY;

            if (actualDrawMode === 'cdr') {
                // CDR模式：使用与CdrBadgeLayout.vue完全相同的计算逻辑
                const totalBadgesWidth = colsPerPage * outerDiaPx + (colsPerPage - 1) * currentGapHPx;
                const totalBadgesHeight = rowsPerPage * outerDiaPx + (rowsPerPage - 1) * currentGapVPx;

                // 与CdrBadgeLayout.vue完全相同的计算公式
                const effectiveWidthForCentering = effectiveCanvasWidth;
                const effectiveHeightForCentering = effectiveCanvasHeight;

                offsetX = marginLeftPx + edgePaddingHPx - allowedOverflowPx + (effectiveWidthForCentering - totalBadgesWidth) / 2;
                offsetY = marginTopPx + edgePaddingVPx - allowedOverflowPx + (effectiveHeightForCentering - totalBadgesHeight) / 2;
            } else {
                // 外圆切线模式：与SingleBadgeLayout.vue的自动模式完全一致
                // 使用相同的最小间隙和居中对齐逻辑
                const minGapMM = sampleBadge.size <= 32 ? 4 : 2;
                const minGapPx = mmToPx(minGapMM);

                // 注意：这里的colsPerPage和rowsPerPage是用CDR参数计算的
                // 但外圆切线模式需要用自动模式的逻辑重新计算
                const autoModeCols = Math.floor((mmToPx(A4_WIDTH_MM) + minGapPx) / (outerDiaPx + minGapPx));
                const autoModeRows = Math.floor((mmToPx(A4_HEIGHT_MM) + minGapPx) / (outerDiaPx + minGapPx));

                const totalBadgesWidth = autoModeCols * outerDiaPx;
                const remainingWidth = mmToPx(A4_WIDTH_MM) - totalBadgesWidth;
                const horizontalGap = remainingWidth / (autoModeCols + 1);

                const totalBadgesHeight = autoModeRows * outerDiaPx;
                const remainingHeight = mmToPx(A4_HEIGHT_MM) - totalBadgesHeight;
                const verticalGap = remainingHeight / (autoModeRows + 1);

                offsetX = horizontalGap;
                offsetY = verticalGap;
            }

            // 加载所有图片并绘制
            const imageLoadPromises = pageBadges.map(badge => {
                return new Promise((resolveImg, rejectImg) => {
                    const img = new Image();
                    img.onload = () => resolveImg({ badge, img });
                    img.onerror = rejectImg;
                    img.src = badge.croppedImageSrc;
                });
            });

            Promise.all(imageLoadPromises).then(loadedImages => {
                // 根据绘制模式选择实际使用的间距
                let actualGapHPx, actualGapVPx;

                if (actualDrawMode === 'cdr') {
                    // CDR模式：使用2mm固定间距
                    actualGapHPx = currentGapHPx;
                    actualGapVPx = currentGapVPx;
                } else {
                    // 外圆切线模式：使用自动模式的动态间距（与SingleBadgeLayout一致）
                    const minGapMM = sampleBadge.size <= 32 ? 4 : 2;
                    const minGapPx = mmToPx(minGapMM);
                    const autoModeCols = Math.floor((mmToPx(A4_WIDTH_MM) + minGapPx) / (outerDiaPx + minGapPx));
                    const autoModeRows = Math.floor((mmToPx(A4_HEIGHT_MM) + minGapPx) / (outerDiaPx + minGapPx));

                    const totalBadgesWidth = autoModeCols * outerDiaPx;
                    const remainingWidth = mmToPx(A4_WIDTH_MM) - totalBadgesWidth;
                    const horizontalGap = remainingWidth / (autoModeCols + 1);

                    const totalBadgesHeight = autoModeRows * outerDiaPx;
                    const remainingHeight = mmToPx(A4_HEIGHT_MM) - totalBadgesHeight;
                    const verticalGap = remainingHeight / (autoModeRows + 1);

                    actualGapHPx = horizontalGap;
                    actualGapVPx = verticalGap;
                }

                loadedImages.forEach(({ badge, img }, index) => {
                    const row = Math.floor(index / colsPerPage);
                    const col = index % colsPerPage;
                    const x = offsetX + col * (outerDiaPx + actualGapHPx);
                    const y = offsetY + row * (outerDiaPx + actualGapVPx);

                    const innerDiaPx = mmToPx(badge.size);

                    // 外圆切线模式：绘制虚线外圆
                    if (actualDrawMode === 'outline') {
                        ctx.save();
                        ctx.strokeStyle = 'black';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([4, 2]);
                        ctx.beginPath();
                        ctx.arc(x + outerDiaPx / 2, y + outerDiaPx / 2, outerDiaPx / 2, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }

                    // 绘制内圆图片
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x + outerDiaPx / 2, y + outerDiaPx / 2, innerDiaPx / 2, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(img, x + (outerDiaPx - innerDiaPx) / 2, y + (outerDiaPx - innerDiaPx) / 2, innerDiaPx, innerDiaPx);
                    ctx.restore();
                });

                // 在页面底部添加尺寸信息
                ctx.fillStyle = 'black';
                ctx.font = `${mmToPx(4)}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(
                    `${sampleBadge.size}`,
                    canvas.width / 2,
                    canvas.height - mmToPx(5)
                );

                // 转为dataURL并存储
                const pageDataUrl = canvas.toDataURL('image/png');
                generatedPages.value.push(pageDataUrl);

                // 如果是第一页，显示在预览区
                if (pageIndex === 0) {
                    const mainCanvas = a4Canvas.value;
                    mainCanvas.width = canvas.width;
                    mainCanvas.height = canvas.height;
                    const mainCtx = mainCanvas.getContext('2d');
                    const previewImg = new Image();
                    previewImg.onload = () => {
                        mainCtx.drawImage(previewImg, 0, 0);
                    };
                    previewImg.src = pageDataUrl;
                }

                resolve();
            }).catch(error => {
                console.error('加载图片失败:', error);
                reject(error);
            });
        });
    };

    // 6️⃣ 依次生成所有页面
    const generateAllPages = async () => {
        for (let i = 0; i < totalPages; i++) {
            await generatePage(i);
        }
        alert(`排版完成！共生成 ${totalPages} 页。`);
    };

    generateAllPages().catch(error => {
        console.error('生成排版失败:', error);
        alert('生成排版时出错，请重试！');
    });
};

const printLayout = () => {
  // 如果有多页，打印所有页面
  if (generatedPages.value.length > 0) {
    // 创建一个临时容器来放置所有页面
    const printContainer = document.createElement('div');
    printContainer.className = 'printable-area';
    // 不要设置内联样式，让CSS来控制位置

    generatedPages.value.forEach((pageDataUrl, index) => {
      const img = document.createElement('img');
      img.src = pageDataUrl;
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.pageBreakAfter = index < generatedPages.value.length - 1 ? 'always' : 'auto'; // 除了最后一页，其他都分页
      printContainer.appendChild(img);
    });

    document.body.appendChild(printContainer);

    // 等待图片加载完成后打印
    const images = printContainer.querySelectorAll('img');
    let loadedCount = 0;
    images.forEach(img => {
      if (img.complete) {
        loadedCount++;
      } else {
        img.onload = () => {
          loadedCount++;
          if (loadedCount === images.length) {
            window.print();
            // 打印完成后移除临时容器
            setTimeout(() => {
              if (document.body.contains(printContainer)) {
                document.body.removeChild(printContainer);
              }
            }, 1000);
          }
        };
      }
    });

    if (loadedCount === images.length) {
      window.print();
      setTimeout(() => {
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
        }
      }, 1000);
    }
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

/* 平时隐藏打印区域 */
.printable-area {
  position: absolute;
  left: -9999px;
  top: -9999px;
  visibility: hidden;
}

@media print {
  @page {
    margin: 0;
    size: A4;
    /* 强制使用精确颜色，防止打印机自动调整色彩 */
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  /* 隐藏所有内容 */
  body * {
    visibility: hidden;
  }
  /* 只显示打印区域 */
  .printable-area, .printable-area * {
    visibility: visible;
    /* 确保打印区域也使用精确颜色 */
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  /* 打印时重置打印区域位置 */
  .printable-area {
    position: absolute;
    left: 0 !important;
    top: 0 !important;
    width: 100%;
    height: auto;
  }
  .printable-hidden {
      display: none;
  }
}
</style>