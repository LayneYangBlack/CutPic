<template>
  <!-- 模型加载提示 -->
  <div v-if="isModelLoading" class="fixed inset-0 bg-white bg-opacity-80 flex flex-col justify-center items-center z-50">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
      <h2 class="text-xl font-semibold text-center mb-4">正在初始化修复模型...</h2>
      <p class="text-sm text-gray-600 text-center mb-2">首次加载需要下载约30MB的模型文件，请稍候。</p>
      <div class="w-full bg-gray-200 rounded-full">
        <div
          class="bg-blue-500 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
          :style="{ width: modelLoadProgress + '%' }"
        >
          {{ modelLoadProgress.toFixed(0) }}%
        </div>
      </div>
    </div>
  </div>

  <div class="w-full max-w-7xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">图片裁剪 + 水印擦除工具</h1>

    <!-- 图片上传区域 -->
    <div v-if="images.length === 0" class="flex items-center justify-center w-full">
      <label
        for="dropzone-file"
        class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
      >
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <svg class="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="mb-2 text-sm text-gray-500">
            <span class="font-semibold">点击上传</span> 或拖拽图片到此
          </p>
          <p class="text-xs text-gray-500">支持多张图片 (PNG, JPG, WEBP)</p>
        </div>
        <input
          id="dropzone-file"
          type="file"
          class="hidden"
          @change="handleImageUpload"
          accept="image/*"
          multiple
        />
      </label>
    </div>

    <!-- 编辑工作区 -->
    <div v-else class="grid grid-cols-12 gap-4">
      <!-- 左侧工具栏 -->
      <div class="col-span-2">
        <ToolBar
          :current-tool="currentTool"
          :can-undo="editorRef?.canUndo || false"
          :can-redo="editorRef?.canRedo || false"
          :is-processing="isProcessing"
          @tool-select="currentTool = $event"
          @undo="editorRef?.handleUndo()"
          @redo="editorRef?.handleRedo()"
          @clear="editorRef?.clearMask()"
          @export="handleExport"
        />
      </div>

      <!-- 中间画布区域 -->
      <div class="col-span-7">
        <!-- 参数设置 -->
        <div class="mb-4 p-4 bg-white rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-3">参数设置</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">目标宽度 (px)</label>
              <input
                v-model.number="targetWidth"
                type="number"
                min="100"
                max="5000"
                class="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">目标高度 (px)</label>
              <input
                v-model.number="targetHeight"
                type="number"
                min="100"
                max="5000"
                class="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">画笔大小: {{ brushSize }}px</label>
              <input
                v-model.number="brushSize"
                type="range"
                min="5"
                max="100"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p class="text-sm text-blue-700">
            {{ images.length > 1
              ? '在第一张图片上涂抹水印区域，该蒙版将自动应用到所有图片'
              : '使用画笔涂抹需要擦除的水印区域'
            }}
          </p>
        </div>

        <!-- 图片编辑器 -->
        <ImageEditor
          ref="editorRef"
          :image-url="currentImageUrl"
          :current-tool="currentTool"
          :brush-size="brushSize"
          @mask-ready="handleMaskReady"
        />

        <!-- 进度条 -->
        <div v-if="isProcessing" class="mt-4 p-4 bg-white rounded-lg shadow">
          <p class="text-sm text-center text-blue-500 mb-2">
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

      <!-- 右侧批量列表 -->
      <div class="col-span-3">
        <BatchList
          :images="images"
          :current-index="currentIndex"
          @select="handleSelectImage"
        />

        <!-- 重置按钮 -->
        <button
          @click="handleReset"
          class="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          全部重置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ImageEditor from '../components/watermark/ImageEditor.vue';
import ToolBar from '../components/watermark/ToolBar.vue';
import BatchList from '../components/watermark/BatchList.vue';
import { useImageProcessor } from '../composables/useImageProcessor.js';
import { loadImage } from '../utils/imageUtils.js';
import { initInpaintSession } from '../adapters/inpainting.js';

// 编辑器引用
const editorRef = ref(null);

// 状态
const images = ref([]);
const currentIndex = ref(0);
const targetWidth = ref(800);
const targetHeight = ref(800);
const brushSize = ref(40);
const maskTemplate = ref(null); // 蒙版模板（用于批量处理）
const isProcessing = ref(false);
const progress = ref(0);
const isModelLoading = ref(true);
const modelLoadProgress = ref(0);

// 图像处理器
const { processImage } = useImageProcessor();

// 初始化ONNX模型
onMounted(async () => {
  try {
    console.log('开始加载ONNX模型...');
    await initInpaintSession((progress) => {
      modelLoadProgress.value = progress;
      console.log('模型加载进度:', progress.toFixed(2) + '%');
    });
    console.log('ONNX模型加载完成');
    isModelLoading.value = false;
  } catch (error) {
    console.error('ONNX模型加载失败:', error);
    console.error('错误详情:', error.message, error.stack);
    isModelLoading.value = false; // 即使失败也关闭加载提示
    alert(`模型加载失败: ${error.message}\n\n将使用简单修复算法代替（效果可能较差）`);
  }
});

// 当前图片URL
const currentImageUrl = computed(() => {
  if (images.value.length === 0) return '';
  return images.value[currentIndex.value]?.url || '';
});

// 已完成数量
const doneCount = computed(() => {
  return images.value.filter(img => img.status === 'done').length;
});

// 图片上传处理
const handleImageUpload = (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  // 转换为图片对象数组
  images.value = Array.from(files).map((file, index) => ({
    id: Date.now() + index,
    file,
    name: file.name,
    url: URL.createObjectURL(file),
    status: 'pending',
    progress: 0,
    result: null
  }));

  currentIndex.value = 0;
};

// 蒙版准备就绪
const handleMaskReady = (maskCanvas) => {
  // 保存蒙版模板（用于批量处理）
  maskTemplate.value = maskCanvas;
};

// 选择图片
const handleSelectImage = (index) => {
  currentIndex.value = index;
};

// 导出处理
const handleExport = async () => {
  if (images.value.length === 0) {
    alert('请先上传图片');
    return;
  }

  if (!maskTemplate.value) {
    alert('请先涂抹需要擦除的水印区域');
    return;
  }

  console.log('=== 开始导出处理 ===');
  console.log('图片数量:', images.value.length);
  console.log('蒙版模板:', maskTemplate.value);

  // 检查蒙版是否为空（检查是否有非透明像素）
  const maskCtx = maskTemplate.value.getContext('2d');
  const maskData = maskCtx.getImageData(0, 0, maskTemplate.value.width, maskTemplate.value.height);
  let hasContent = false;
  for (let i = 3; i < maskData.data.length; i += 4) {
    if (maskData.data[i] > 0) { // 检查alpha通道
      hasContent = true;
      break;
    }
  }

  if (!hasContent) {
    alert('请先在图片上绘制需要擦除的区域');
    return;
  }

  console.log('蒙版检查通过，开始处理...');

  isProcessing.value = true;
  progress.value = 0;

  try {
    // 批量处理所有图片
    for (let i = 0; i < images.value.length; i++) {
      const image = images.value[i];
      image.status = 'processing';

      console.log(`\n处理第 ${i + 1}/${images.value.length} 张图片: ${image.name}`);

      try {
        // 加载原始图片
        const img = await loadImage(image.url);
        console.log('原始图片尺寸:', img.width, 'x', img.height);

        // 计算裁剪区域（整个图片）
        const cropArea = {
          x: 0,
          y: 0,
          width: img.width,
          height: img.height
        };

        console.log('目��尺寸:', targetWidth.value, 'x', targetHeight.value);
        console.log('蒙版尺寸:', maskTemplate.value.width, 'x', maskTemplate.value.height);

        // 处理图片（裁剪 + 擦除水印）
        const resultBlob = await processImage(
          img,
          cropArea,
          maskTemplate.value,
          targetWidth.value,
          targetHeight.value
        );

        console.log('处理完成，结果大小:', resultBlob.size, 'bytes');

        image.result = resultBlob;
        image.status = 'done';
      } catch (error) {
        console.error(`处理图片 ${image.name} 失败:`, error);
        image.status = 'error';
        image.error = error.message;
      }

      progress.value = (i + 1) / images.value.length;
    }

    // 导出结果
    if (images.value.length === 1) {
      // 单图：直接下载
      const image = images.value[0];
      if (image.result) {
        const url = URL.createObjectURL(image.result);
        const link = document.createElement('a');
        link.href = url;
        link.download = `processed_${image.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } else {
      // 多图：打包为ZIP
      const successImages = images.value.filter(img => img.status === 'done' && img.result);
      if (successImages.length === 0) {
        throw new Error('没有成功处理的图片可供导出');
      }

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (const image of successImages) {
        const fileName = `processed_${image.name}`;
        zip.file(fileName, image.result);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'watermark-removed.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    alert('处理完成！');
  } catch (error) {
    console.error('批量处理失败:', error);
    alert(`处理失败: ${error.message}`);
  } finally {
    isProcessing.value = false;
  }
};

// 重置
const handleReset = () => {
  // 释放URL对象
  images.value.forEach(img => {
    if (img.url) {
      URL.revokeObjectURL(img.url);
    }
  });

  images.value = [];
  currentIndex.value = 0;
  maskTemplate.value = null;
  isProcessing.value = false;
  progress.value = 0;
};
</script>
