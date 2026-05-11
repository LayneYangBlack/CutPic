<template>
  <div class="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 printable-hidden">
    <!-- Left Panel: Settings -->
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">亚克力徽章排版工具</h1>

      <!-- Step 1: 说明 -->
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-2">亚克力排版模式</h2>
        <div class="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
          <p class="mb-1">✨ <strong>亚克力排版特点：</strong></p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li>直接裁切图案圆片，<strong>无外圆边距</strong></li>
            <li>裁剪后<strong>所见所得</strong>，直接使用</li>
            <li>支持相同尺寸的徽章混合排版</li>
          </ul>
        </div>
      </div>

      <!-- Step 2: Designs -->
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">2. 图案列表</h2>
          <button @click="addDesign" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">添加图案</button>
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
                <input type="file" @change="handleImageUpload($event, design)" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100">
              </div>
              <button @click="openCropper(design)" :disabled="!design.imageSrc" class="self-end px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 text-sm">
                裁切图片
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700">选择尺寸</label>
                <select v-model="design.size" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-900">
                  <option v-for="size in availableSizes" :key="size" :value="size">{{ size }}mm 亚克力</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">打印数量</label>
                <input type="number" v-model.number="design.quantity" min="1" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-900">
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
                <label for="acrylic-cropper-bg-color" class="text-sm font-medium text-gray-700">背景色:</label>
                <input type="color" id="acrylic-cropper-bg-color" v-model="cropperBgColor" class="w-8 h-8 p-0 border rounded cursor-pointer" style="border-color: #ccc;">
              </div>
              <div>
                <button @click="cancelCrop" class="px-4 py-2 text-gray-600 rounded hover:bg-gray-100 text-sm mr-2">取消</button>
                <button @click="confirmCrop" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">确认裁切</button>
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
            <select v-model="selectedFilter" class="px-3 py-1 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="all">全部 ({{ cropHistory.length }})</option>
              <option v-for="size in historySizes" :key="size" :value="size">
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
              class="w-full h-auto rounded-full border-2 border-gray-300 group-hover:border-purple-500 cursor-pointer"
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
            <button @click="printLayout" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">打印</button>
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
            <button @click="openNewCropper" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">裁剪新图片</button>
          </div>

          <div v-if="cropHistory.length > 0">
            <div class="flex justify-between items-center mb-2">
              <h4 class="text-md font-medium text-gray-700">裁剪历史</h4>
              <!-- 规格筛选 -->
              <select v-model="modalSelectedFilter" class="px-2 py-1 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="all">全部 ({{ cropHistory.length }})</option>
                <option v-for="size in historySizes" :key="size" :value="size">
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
import { useCropHistory } from '../composables/useCropHistory.js';

// --- 亚克力尺寸配置 ---
// 键：亚克力成品尺寸（mm），值：对应的图案圆片裁切尺寸（mm）
// 亚克力排版特点：直接裁切图案圆片，无外圆边距，所见所得
const acrylicSizeMap = {
  25: 21,
  37: 33,
  44: 39,
  58: 54,
  75: 68,
  79: 73,
};

// 可选的亚克力尺寸列表
const availableSizes = Object.keys(acrylicSizeMap).map(Number).sort((a, b) => a - b);

// --- State ---
const badgeDesigns = ref([]);
let nextDesignId = 1;

const cropper = ref(null);
const activeDesign = ref(null); // 当前正在裁切的图案
const showHistorySelectionModal = ref(false);

const a4Canvas = ref(null);
const printableImage = ref(null);
const cropperBgColor = ref('#ffffff'); // 裁剪框默认背景色：白色
const generatedPages = ref([]); // 存储生成的多页canvas的dataURL数组

const allDesignsReady = computed(() => badgeDesigns.value.length > 0 && badgeDesigns.value.every(d => d.croppedImageSrc));

const { cropHistory, addCrop, removeCrop, clearHistory } = useCropHistory();

// 规格筛选功能
const selectedFilter = ref('all'); // 当前选中的规格筛选（用于主裁剪历史区）
const modalSelectedFilter = ref('all'); // 模态框中的规格筛选

// 计算属性：获取历史记录中存在的所有规格
const historySizes = computed(() => {
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
    size: 58, // 默认尺寸
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
        const MAX_DIMENSION = 4096; // 最大尺寸限制
        let width = img.width;
        let height = img.height;

        // 如果图片过大，进行压缩
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const aspectRatio = width / height;
          if (width > height) {
            width = MAX_DIMENSION;
            height = MAX_DIMENSION / aspectRatio;
          } else {
            height = MAX_DIMENSION;
            width = MAX_DIMENSION * aspectRatio;
          }
          // 创建临时canvas进行压缩
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(img, 0, 0, width, height);
          design.imageSrc = tempCanvas.toDataURL('image/png');
          console.log(`AcrylicBadgeLayout: 图片从 ${img.width}x${img.height} 压缩至 ${width}x${height}`);
        } else {
          design.imageSrc = e.target.result;
        }
        design.croppedImageSrc = null; // 重置裁切结果
      };
      img.onerror = () => {
        console.error("AcrylicBadgeLayout: 图片加载失败", { src: e.target.result });
        alert("图片加载失败，请检查文件是否损坏或尝试其他图片。");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const openCropper = (design) => {
  if (design.imageSrc) {
    activeDesign.value = design;
    showHistorySelectionModal.value = true;
  } else {
    alert('请先上传图片！');
  }
};

const selectFromHistory = (historyItem) => {
  if (activeDesign.value) {
    activeDesign.value.croppedImageSrc = historyItem.croppedImageSrc;
    activeDesign.value.size = historyItem.metadata.size; // 恢复尺寸
    showHistorySelectionModal.value = false;
    activeDesign.value = null;
  }
};

const openNewCropper = () => {
  showHistorySelectionModal.value = false;
  // activeDesign.value已经在openCropper中设置，所以裁切器会显示
};

const cancelHistorySelection = () => {
  showHistorySelectionModal.value = false;
  activeDesign.value = null;
};

const confirmCrop = () => {
  if (cropper.value && activeDesign.value) {
    const croppedDataUrl = cropper.value.crop();
    activeDesign.value.croppedImageSrc = croppedDataUrl;
    // 添加到裁剪历史记录
    addCrop(croppedDataUrl, { size: activeDesign.value.size });
    activeDesign.value = null; // 隐藏裁切器
  }
};

const cancelCrop = () => {
    activeDesign.value = null;
}

// 从历史记录快速应用图片到新图案
const useHistoryImageForDesign = (historyItem) => {
  const newDesign = {
    id: nextDesignId++,
    imageSrc: historyItem.croppedImageSrc,
    croppedImageSrc: historyItem.croppedImageSrc,
    size: historyItem.metadata.size,
    quantity: 1,
  };
  badgeDesigns.value.push(newDesign);
};

const generateLayout = () => {
    if (badgeDesigns.value.length === 0 || badgeDesigns.value.some(d => !d.croppedImageSrc)) {
        alert('请确保所有图案都已上传并裁切！');
        return;
    }

    // 检查所有徽章尺寸是否一致
    const sizes = new Set(badgeDesigns.value.map(d => d.size));
    if (sizes.size > 1) {
        const sizeList = Array.from(sizes).sort((a, b) => a - b).join('mm, ') + 'mm';
        alert(`❌ 亚克力排版仅支持相同尺寸的徽章！\n\n当前图案包含多个尺寸：${sizeList}\n\n请删除不同尺寸的图案。`);
        return;
    }

    // 将当前所有裁剪图片添加到历史记录
    const uniqueCroppedImages = new Map();
    badgeDesigns.value.forEach(design => {
      if (design.croppedImageSrc) {
        const key = design.croppedImageSrc + '-' + design.size;
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

    // 准备所有要排版的徽章（展开数量）
    const allBadges = [];
    badgeDesigns.value.forEach(design => {
        for (let i = 0; i < (design.quantity || 1); i++) {
            allBadges.push({
                size: design.size,
                croppedImageSrc: design.croppedImageSrc,
                cutDiameter: acrylicSizeMap[design.size], // 实际裁切的图案圆片尺寸
            });
        }
    });

    // 按尺寸排序（大到小）
    allBadges.sort((a, b) => b.cutDiameter - a.cutDiameter);

    // 计算单页能放多少个徽章
    // 亚克力排版：使用紧密排列，间距2mm
    const marginMM = 5; // 页面边距
    const gapMM = 2; // 徽章间距

    const marginPx = mmToPx(marginMM);
    const gapPx = mmToPx(gapMM);
    const effectiveWidth = mmToPx(A4_WIDTH_MM) - 2 * marginPx;
    const effectiveHeight = mmToPx(A4_HEIGHT_MM) - 2 * marginPx;

    const sampleBadge = allBadges[0];
    const cutDiaPx = mmToPx(sampleBadge.cutDiameter);

    // 计算每页的行列数
    const colsPerPage = Math.floor((effectiveWidth + gapPx) / (cutDiaPx + gapPx));
    const rowsPerPage = Math.floor((effectiveHeight + gapPx) / (cutDiaPx + gapPx));
    const badgesPerPage = colsPerPage * rowsPerPage;

    if (badgesPerPage === 0) {
        alert('徽章尺寸过大，无法在A4纸上进行排版！');
        return;
    }

    // 计算需要多少页
    const totalPages = Math.ceil(allBadges.length / badgesPerPage);
    console.log(`总共 ${allBadges.length} 个徽章，每页 ${badgesPerPage} 个，需要 ${totalPages} 页`);

    // 清空之前的页面
    generatedPages.value = [];

    // 为每一页生成排版
    const generatePage = (pageIndex) => {
        return new Promise((resolve, reject) => {
            const startIdx = pageIndex * badgesPerPage;
            const endIdx = Math.min(startIdx + badgesPerPage, allBadges.length);
            const pageBadges = allBadges.slice(startIdx, endIdx);

            // 创建临时canvas
            const canvas = document.createElement('canvas');
            canvas.width = mmToPx(A4_WIDTH_MM);
            canvas.height = mmToPx(A4_HEIGHT_MM);
            const ctx = canvas.getContext('2d');

            // 白色背景
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 计算居中起始位置
            const totalBadgesWidth = colsPerPage * cutDiaPx + (colsPerPage - 1) * gapPx;
            const totalBadgesHeight = rowsPerPage * cutDiaPx + (rowsPerPage - 1) * gapPx;
            const offsetX = marginPx + (effectiveWidth - totalBadgesWidth) / 2;
            const offsetY = marginPx + (effectiveHeight - totalBadgesHeight) / 2;

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
                loadedImages.forEach(({ badge, img }, index) => {
                    const row = Math.floor(index / colsPerPage);
                    const col = index % colsPerPage;
                    const x = offsetX + col * (cutDiaPx + gapPx);
                    const y = offsetY + row * (cutDiaPx + gapPx);

                    // 绘制圆形图案（裁剪为圆形）
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x + cutDiaPx / 2, y + cutDiaPx / 2, cutDiaPx / 2, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(img, x, y, cutDiaPx, cutDiaPx);
                    ctx.restore();
                });

                // 在页面底部添加尺寸信息
                ctx.fillStyle = 'black';
                ctx.font = `${mmToPx(4)}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(
                    `${sampleBadge.size}mm 亚克力 (裁切 ${sampleBadge.cutDiameter}mm)`,
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

    // 依次生成所有页面
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

    generatedPages.value.forEach((pageDataUrl, index) => {
      const img = document.createElement('img');
      img.src = pageDataUrl;
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.pageBreakAfter = index < generatedPages.value.length - 1 ? 'always' : 'auto';
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

<style scoped>
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
