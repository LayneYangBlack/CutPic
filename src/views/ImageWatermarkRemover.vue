<template>
  <!-- 模型加载提示 -->
  <div v-if="isModelLoading" class="fixed inset-0 bg-white bg-opacity-80 flex flex-col justify-center items-center z-50">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
      <h2 class="text-xl font-semibold text-center mb-4">正在初始化修复模型...</h2>
      <p class="text-sm text-gray-600 text-center mb-2">
        {{ modelLoadProgress < 90 ? '正在下载模型文件（约27MB）...' : '正在初始化推理引擎...' }}
      </p>
      <p class="text-xs text-gray-500 text-center mb-4">首次加载需要下载，请耐心等待</p>
      <div class="w-full bg-gray-200 rounded-full">
        <div
          class="bg-blue-500 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full transition-all duration-300"
          :style="{ width: modelLoadProgress + '%' }"
        >
          {{ modelLoadProgress.toFixed(0) }}%
        </div>
      </div>
      <p class="text-xs text-gray-400 text-center mt-2">
        {{ modelLoadProgress < 90 ? '下载速度取决于您的网络状况' : '即将完成...' }}
      </p>
      <button
        @click="skipModelLoading"
        class="mt-4 w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
      >
        跳过AI修复（使用简单算法）
      </button>
    </div>
  </div>

  <div class="w-full">
    <!-- 顶部标题 + 上传入口 -->
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-800">批量裁剪 + 水印擦除</h1>
      <label v-if="images.length > 0" class="cursor-pointer">
        <span class="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors">
          + 添加图片
        </span>
        <input type="file" class="hidden" @change="handleImageUpload" accept="image/*" multiple />
      </label>
    </div>

    <!-- 上传区域（无图片时） -->
    <div v-if="images.length === 0" class="flex items-center justify-center w-full">
      <label
        for="dropzone-file"
        class="flex flex-col items-center justify-center w-full h-72 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div class="flex flex-col items-center justify-center">
          <svg class="w-10 h-10 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="mb-1 text-sm text-gray-500">
            <span class="font-semibold text-blue-500">点击上传</span> 或拖拽图片到此
          </p>
          <p class="text-xs text-gray-400">支持多张图片（PNG、JPG、WEBP），支持批量处理</p>
        </div>
        <input id="dropzone-file" type="file" class="hidden" @change="handleImageUpload" accept="image/*" multiple />
      </label>
    </div>

    <!-- 工作区（有图片时） -->
    <div v-else class="grid grid-cols-12 gap-4" style="min-height: 580px;">

      <!-- 左侧：工具面板 -->
      <div class="col-span-2 flex flex-col gap-4">
        <ToolBar
          :current-tool="currentTool"
          :can-undo="editorRef?.canUndo || false"
          :can-redo="editorRef?.canRedo || false"
          :is-processing="isProcessing"
          :crop-info="currentImage?.cropArea || null"
          @tool-select="currentTool = $event"
          @undo="editorRef?.handleUndo()"
          @redo="editorRef?.handleRedo()"
          @clear="editorRef?.clearMask()"
          @export="handleExport"
        />

        <!-- 参数设置 -->
        <div class="p-3 bg-white rounded-lg shadow">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">输出尺寸</p>
          <div class="flex flex-col gap-2">
            <div>
              <label class="block text-xs text-gray-500 mb-0.5">宽度 (px)</label>
              <input
                v-model.number="targetWidth"
                type="number"
                min="100"
                max="5000"
                class="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-0.5">高度 (px)</label>
              <input
                v-model.number="targetHeight"
                type="number"
                min="100"
                max="5000"
                class="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:border-blue-400"
              />
            </div>
            <!-- 画笔大小（仅擦除模式） -->
            <div v-if="currentTool === 'erase'">
              <label class="block text-xs text-gray-500 mb-0.5">画笔大小: {{ brushSize }}px</label>
              <input v-model.number="brushSize" type="range" min="5" max="100" class="w-full" />
            </div>
          </div>
        </div>
      </div>

      <!-- 中间：画布区域 -->
      <div class="col-span-7 flex flex-col gap-3">
        <!-- 操作提示 -->
        <div class="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <template v-if="isCropMode">
            <strong>裁剪模式：</strong>拖拽角点调整裁剪框大小，拖拽框内移动位置
            <span class="text-blue-500 ml-1">（每张图片的裁剪框独立保存）</span>
          </template>
          <template v-else>
            <strong>擦除模式：</strong>用画笔涂抹需要去除的水印区域
            <span v-if="images.length > 1" class="ml-1">（蒙版将应用到所有图片）</span>
          </template>
        </div>

        <!-- 图片编辑器 -->
        <ImageEditor
          ref="editorRef"
          :image-url="currentImageUrl"
          :current-tool="currentTool"
          :brush-size="brushSize"
          :container-height="520"
          :target-width="targetWidth"
          :target-height="targetHeight"
          @mask-ready="handleMaskReady"
          @crop-change="handleCropChange"
        />

        <!-- 进度条 -->
        <div v-if="isProcessing" class="p-3 bg-white rounded-lg shadow">
          <p class="text-sm text-center text-blue-500 mb-1.5">
            正在处理: {{ Math.round(progress * 100) }}% ({{ doneCount }} / {{ images.length }})
          </p>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-500 h-2 rounded-full transition-all"
              :style="{ width: `${progress * 100}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 右侧：批量列表 -->
      <div class="col-span-3 flex flex-col gap-3">
        <BatchList
          :images="images"
          :current-index="currentIndex"
          :is-crop-mode="isCropMode"
          @select="handleSelectImage"
          @remove="handleRemoveImage"
          @clear-all="handleClearAll"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import ImageEditor from '../components/watermark/ImageEditor.vue';
import ToolBar from '../components/watermark/ToolBar.vue';
import BatchList from '../components/watermark/BatchList.vue';
import { useImageProcessor } from '../composables/useImageProcessor.js';
import { loadImage } from '../utils/imageUtils.js';
import { initInpaintSession, checkModelCached } from '../adapters/inpainting.js';

// ────────────────────────────────────────────────────────────────
// 状态
// ────────────────────────────────────────────────────────────────

const editorRef = ref(null);
const images = ref([]);
const currentIndex = ref(0);
const currentTool = ref('crop-rect');
const targetWidth = ref(800);
const targetHeight = ref(800);
const brushSize = ref(40);
const maskTemplate = ref(null);  // 擦除蒙版 Canvas（所有图共用）
const isProcessing = ref(false);
const progress = ref(0);
const isModelLoading = ref(true);
const modelLoadProgress = ref(0);

const { processImage } = useImageProcessor();

const isCropMode = computed(() => currentTool.value === 'crop-rect' || currentTool.value === 'crop-circle');

// 当前选中的图片对象
const currentImage = computed(() => images.value[currentIndex.value] || null);

// 当前图片URL
const currentImageUrl = computed(() => currentImage.value?.url || '');

// 已完成数量
const doneCount = computed(() => images.value.filter(img => img.status === 'done').length);

// ────────────────────────────────────────────────────────────────
// 模型初始化
// ────────────────────────────────────────────────────────────────

const skipModelLoading = () => {
  isModelLoading.value = false;
};

onMounted(async () => {
  try {
    // 模型已缓存则静默在后台初始化，不显示 loading 界面
    const cached = await checkModelCached();
    if (cached) {
      isModelLoading.value = false;
      initInpaintSession().catch(err => console.error('模型后台初始化失败:', err));
      return;
    }

    await initInpaintSession((p) => {
      modelLoadProgress.value = p;
    });
    await new Promise(resolve => setTimeout(resolve, 300));
    isModelLoading.value = false;
  } catch (error) {
    console.error('ONNX模型加载失败:', error);
    isModelLoading.value = false;
    alert(`模型加载失败: ${error.message}\n\n将使用简单修复算法代替（效果可能较差）`);
  }
});

// ────────────────────────────────────────────────────────────────
// 事件处理
// ────────────────────────────────────────────────────────────────

const handleImageUpload = (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  const newImages = Array.from(files).map((file, index) => ({
    id: Date.now() + index,
    file,
    name: file.name,
    url: URL.createObjectURL(file),
    status: 'pending',
    progress: 0,
    result: null,
    cropArea: null  // 每张图片独立保存自己的裁剪区域（原图坐标）
  }));

  if (images.value.length === 0) {
    images.value = newImages;
    currentIndex.value = 0;
  } else {
    images.value = [...images.value, ...newImages];
  }
};

// 蒙版 Canvas 引用更新（擦除模式共用）
const handleMaskReady = (maskCanvas) => {
  maskTemplate.value = maskCanvas;
};

/**
 * 裁剪区域变化时，实时同步到当前图片对象
 * 每张图片有自己的 cropArea，这样切换时可以恢复
 */
const handleCropChange = (area) => {
  if (currentImage.value) {
    currentImage.value.cropArea = area;
  }
};

/**
 * 切换图片时：
 * 1. 先保存当前编辑器的裁剪区域到当前图片（通过 getCropArea）
 * 2. 切换到新图片
 * 3. 等图片加载完毕后，调用 setCropBox 恢复新图片的裁剪区域
 */
const handleSelectImage = async (index) => {
  if (index === currentIndex.value) return;

  // 保存当前图片的最新裁剪区域
  if (currentImage.value && editorRef.value) {
    const latest = editorRef.value.getCropArea?.();
    if (latest) currentImage.value.cropArea = latest;
  }

  currentIndex.value = index;

  // 等图片加载完毕（watch imageUrl → loadImageToCanvas），然后恢复裁剪框
  await nextTick();
  // 给 ImageEditor 的图片加载留一点时间（loadImage 是异步的）
  // 用一个短暂的 watch + 回调更稳健，但这里用简单的 setTimeout 配合 nextTick
  setTimeout(() => {
    const savedArea = images.value[index]?.cropArea;
    editorRef.value?.setCropBox?.(savedArea || null);
  }, 50);
};

/**
 * 移除单张图片
 */
const handleRemoveImage = (index) => {
  const img = images.value[index];
  if (img?.url) URL.revokeObjectURL(img.url);
  images.value.splice(index, 1);

  if (images.value.length === 0) {
    currentIndex.value = 0;
    maskTemplate.value = null;
  } else {
    // 保证 currentIndex 不越界
    currentIndex.value = Math.min(currentIndex.value, images.value.length - 1);
  }
};

/**
 * 清空所有图片
 */
const handleClearAll = () => {
  images.value.forEach(img => {
    if (img.url) URL.revokeObjectURL(img.url);
  });
  images.value = [];
  currentIndex.value = 0;
  maskTemplate.value = null;
  isProcessing.value = false;
  progress.value = 0;
};

// ────────────────────────────────────────────────────────────────
// 导出处理
// ────────────────────────────────────────────────────────────────

const handleExport = async () => {
  if (images.value.length === 0) {
    alert('请先上传图片');
    return;
  }

  // 擦除模式下必须有蒙版内容
  if (!isCropMode.value) {
    if (!maskTemplate.value) {
      alert('请先涂抹需要擦除的水印区域');
      return;
    }
    const maskCtx = maskTemplate.value.getContext('2d');
    const maskData = maskCtx.getImageData(0, 0, maskTemplate.value.width, maskTemplate.value.height);
    const hasContent = Array.from({ length: maskData.data.length / 4 }).some((_, i) => maskData.data[i * 4 + 3] > 0);
    if (!hasContent) {
      alert('请先在图片上绘制需要擦除的区域');
      return;
    }
  }

  // 保存当前图片的最新裁剪区域（防止用户来不及触发 crop-change）
  if (currentImage.value && editorRef.value) {
    const latest = editorRef.value.getCropArea?.();
    if (latest) currentImage.value.cropArea = latest;
  }

  isProcessing.value = true;
  progress.value = 0;

  try {
    for (let i = 0; i < images.value.length; i++) {
      const image = images.value[i];
      image.status = 'processing';

      try {
        const img = await loadImage(image.url);

        // 每张图片使用自己保存的裁剪区域；没有则全图
        let resolvedCropArea;
        if (isCropMode.value && image.cropArea) {
          resolvedCropArea = {
            x: image.cropArea.x,
            y: image.cropArea.y,
            width: image.cropArea.width,
            height: image.cropArea.height
          };
        } else {
          resolvedCropArea = { x: 0, y: 0, width: img.width, height: img.height };
        }

        // 裁剪模式：maskSource 为 null（不做擦除）
        const maskSource = isCropMode.value ? null : maskTemplate.value;

        // 圆形裁剪时加透明遮罩
        const cropShape = (isCropMode.value && image.cropArea?.isCircle) ? 'circle' : null;

        const resultBlob = await processImage(
          img,
          resolvedCropArea,
          maskSource,
          targetWidth.value,
          targetHeight.value,
          cropShape
        );

        image.result = resultBlob;
        image.status = 'done';
      } catch (error) {
        console.error(`处理图片 ${image.name} 失败:`, error);
        image.status = 'error';
        image.error = error.message;
      }

      progress.value = (i + 1) / images.value.length;
    }

    await exportResults();
    alert('处理完成！');
  } catch (error) {
    console.error('批量处理失败:', error);
    alert(`处理失败: ${error.message}`);
  } finally {
    isProcessing.value = false;
  }
};

const exportResults = async () => {
  const successImages = images.value.filter(img => img.status === 'done' && img.result);
  if (successImages.length === 0) throw new Error('没有成功处理的图片可供导出');

  if (successImages.length === 1) {
    const image = successImages[0];
    const url = URL.createObjectURL(image.result);
    const link = document.createElement('a');
    link.href = url;
    link.download = `processed_${image.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    for (const image of successImages) {
      zip.file(`processed_${image.name}`, image.result);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'processed-images.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
</script>
