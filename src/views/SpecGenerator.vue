<template>
  <div class="p-4 font-sans">
    <h1 class="text-2xl font-bold mb-4">水印批量生成器</h1>

    <!-- Main Content -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
      <!-- Left Panel: Controls -->
      <div class="md:col-span-4 bg-white p-4 rounded-lg shadow space-y-6">

        <!-- 第一步：创建水印 -->
        <div>
          <h2 class="text-lg font-semibold mb-3">1. 创建水印</h2>

          <!-- 水印模式选择 -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">水印模式</label>
            <select v-model="watermarkMode" class="w-full p-2 border border-gray-300 rounded text-sm">
              <option value="tile">平铺模式 - 水印重复铺满背景图</option>
              <option value="position">位置模式 - 自定义拖动水印位置</option>
            </select>
          </div>

          <!-- 平铺模式：表单配置 -->
          <div v-if="watermarkMode === 'tile'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">水印文字</label>
              <input
                v-model="tileWatermarkText"
                type="text"
                placeholder="输入水印文字"
                class="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">艺术字样式</label>
              <select v-model="tileSelectedPreset" class="w-full p-2 border border-gray-300 rounded">
                <option v-for="preset in stylePresets" :key="preset.name" :value="preset.name">
                  {{ preset.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">颜色</label>
              <input type="color" v-model="tileColor" class="w-full h-10 p-1 border border-gray-300 rounded" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">字号</label>
              <input type="number" v-model.number="tileFontSize" min="10" max="200" class="w-full p-2 border border-gray-300 rounded" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">透明度</label>
              <input type="range" v-model.number="tileOpacity" min="0" max="1" step="0.05" class="w-full" />
              <span class="text-xs text-gray-500">{{ Math.round(tileOpacity * 100) }}%</span>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">旋转角度</label>
              <input type="range" v-model.number="tileRotation" min="-180" max="180" step="1" class="w-full" />
              <span class="text-xs text-gray-500">{{ tileRotation }}°</span>
            </div>
          </div>

          <!-- 位置模式：添加水印按钮 -->
          <div v-else>
            <div class="flex gap-2 mb-4">
              <button @click="addText" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                添加文字
              </button>
              <button @click="triggerWatermarkUpload" class="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded">
                添加图片
              </button>
            </div>
            <input ref="watermarkFileInput" type="file" accept="image/*" @change="handleWatermarkFileUpload" class="hidden" />

            <!-- 文字编辑面板 -->
            <div v-if="activeObject?.type === 'i-text'" class="space-y-4 p-4 border border-gray-200 rounded-lg mt-4">
              <h3 class="text-md font-semibold">文字样式</h3>
              <div>
                <label class="block text-sm font-medium">艺术字样式</label>
                <select v-model="selectedPreset" class="w-full p-1 border border-gray-300 rounded">
                  <option v-for="preset in stylePresets" :key="preset.name" :value="preset.name">
                    {{ preset.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium">颜色</label>
                <input type="color" v-model="essentialProps.fill" class="w-full h-8 p-1 border-none rounded" />
              </div>
              <div>
                <label class="block text-sm font-medium">字号</label>
                <input type="number" v-model.number="essentialProps.fontSize" class="w-full p-1 border border-gray-300 rounded" />
              </div>
              <div>
                <label class="block text-sm font-medium">透明度</label>
                <input type="range" v-model.number="essentialProps.opacity" min="0" max="1" step="0.05" class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium">对齐</label>
                <select v-model="essentialProps.textAlign" class="w-full p-1 border border-gray-300 rounded">
                  <option value="left">左对齐</option>
                  <option value="center">居中</option>
                  <option value="right">右对齐</option>
                  <option value="justify">两端对齐</option>
                </select>
              </div>
            </div>

            <!-- 图片水印编辑面板 -->
            <div v-if="activeObject?.type === 'image'" class="space-y-4 p-4 border border-gray-200 rounded-lg mt-4">
              <h3 class="text-md font-semibold">图片水印样式</h3>
              <div>
                <label class="block text-sm font-medium">透明度</label>
                <input type="range" min="0" max="1" step="0.05" v-model.number="imageWatermarkOpacity" class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium">缩放</label>
                <input type="range" min="0.1" max="3" step="0.1" v-model.number="imageWatermarkScale" class="w-full" />
              </div>
            </div>
          </div>
        </div>

        <!-- 第二步：上传背景图片 -->
        <div class="border-t pt-4">
          <h2 class="text-lg font-semibold mb-3">2. 上传背景图片</h2>
          <input
            type="file"
            accept="image/*"
            multiple
            @change="handleBackgroundImagesUpload"
            class="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-green-600 file:text-white hover:file:bg-green-700 mb-2"
          />
          <p class="text-xs text-gray-500 mb-2">可选择单张或多张图片</p>

          <!-- 已上传图片列表 -->
          <div v-if="backgroundImages.length > 0" class="space-y-2">
            <div v-for="(img, index) in backgroundImages" :key="index" class="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
              <span class="flex-1 truncate">{{ img.name }}</span>
              <button @click="removeBackgroundImage(index)" class="text-red-500 hover:text-red-700">×</button>
            </div>
          </div>
        </div>

        <!-- 第三步：生成下载 -->
        <div class="border-t pt-4">
          <h2 class="text-lg font-semibold mb-3">3. 生成并下载</h2>
          <button
            @click="generateAndDownload"
            :disabled="isGenerating || backgroundImages.length === 0 || !canGenerate"
            class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          >
            {{ isGenerating ? '正在生成...' : `生成并下载 (${backgroundImages.length}张)` }}
          </button>
          <p v-if="backgroundImages.length === 0" class="text-xs text-gray-500 mt-2 text-center">请先上传背景图片</p>
          <p v-else-if="!canGenerate" class="text-xs text-gray-500 mt-2 text-center">请先{{ watermarkMode === 'tile' ? '输入水印文字' : '添加水印' }}</p>
        </div>

      </div>

      <!-- Center Panel: Canvas/Preview -->
      <div class="md:col-span-8 rounded-lg shadow-inner flex items-center justify-center p-4 min-h-[600px]"
           :style="watermarkMode === 'tile' ? 'background-color: #f9fafb;' : 'background: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc); background-size: 20px 20px; background-position: 0 0, 10px 10px; background-color: #f0f0f0;'">

        <!-- 平铺模式预览 -->
        <div v-if="watermarkMode === 'tile'" class="text-center">
          <div class="bg-white p-8 rounded-lg shadow-lg" style="width: 500px; height: 500px; position: relative; overflow: hidden;">
            <canvas ref="tilePreviewCanvas" width="500" height="500"></canvas>
          </div>
          <p class="text-sm text-gray-600 mt-2">平铺水印预览效果</p>
        </div>

        <!-- 位置模式预览 -->
        <div v-else class="text-center">
          <div style="display: inline-block; border: 2px solid #333; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <canvas ref="canvasEl"></canvas>
          </div>
          <p class="text-sm text-gray-600 mt-2">透明画布 - 拖动调整水印位置</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive, watch, computed } from 'vue';
import * as fabric from 'fabric';
import JSZip from 'jszip';

const canvasEl = ref(null);
const tilePreviewCanvas = ref(null);
const watermarkFileInput = ref(null);
let fabricCanvas = null;
const activeObject = ref(null);

// 背景图片列表
const backgroundImages = ref([]);

// 水印模式
const watermarkMode = ref('tile');

// 平铺模式数据
const tileWatermarkText = ref('水印文字');
const tileSelectedPreset = ref('普通字体');
const tileColor = ref('#000000');
const tileFontSize = ref(40);
const tileOpacity = ref(0.3);
const tileRotation = ref(-45);

// 判断是否可以生成
const canGenerate = computed(() => {
  if (watermarkMode.value === 'tile') {
    return tileWatermarkText.value.trim() !== '';
  } else {
    return fabricCanvas && fabricCanvas.getObjects().length > 0;
  }
});

// --- Data for Presets ---
const stylePresets = ref([
  {
    name: '普通字体',
    options: {
      fontFamily: 'sans-serif',
      fontWeight: 'normal',
      fontStyle: 'normal',
      underline: false,
      fill: '#000000',
      stroke: null,
      strokeWidth: 0,
      shadow: null,
    }
  },
  {
    name: '现代粗体',
    options: {
      fontFamily: 'Montserrat',
      fontWeight: 'bold',
      fontStyle: 'normal',
      underline: false,
      fill: '#333333',
      stroke: null,
      strokeWidth: 0,
      shadow: 'rgba(0,0,0,0.2) 2px 2px 3px',
    }
  },
  {
    name: '优雅衬线',
    options: {
      fontFamily: 'Playfair Display',
      fontWeight: 'normal',
      fontStyle: 'normal',
      underline: false,
      fill: '#4A4A4A',
      stroke: null,
      strokeWidth: 0,
      shadow: null,
    }
  },
  {
    name: '折扣标签',
    options: {
      fontFamily: 'Lobster',
      fontWeight: 'normal',
      fontStyle: 'normal',
      underline: false,
      fill: '#FF0000',
      stroke: '#FFFFFF',
      strokeWidth: 2,
      shadow: 'rgba(0,0,0,0.3) 3px 3px 5px',
    }
  },
  {
    name: '简洁描边',
    options: {
      fontFamily: 'Open Sans',
      fontWeight: 'bold',
      fontStyle: 'normal',
      underline: false,
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeWidth: 1,
      shadow: null,
    }
  }
]);

const selectedPreset = ref(stylePresets.value[0].name);

// --- Data for other controls ---
const essentialProps = reactive({
  fontSize: 40,
  opacity: 1,
  textAlign: 'left',
  fill: '#000000',
});

const imageWatermarkOpacity = ref(1);
const imageWatermarkScale = ref(1);

const isGenerating = ref(false);

// --- Lifecycle Hooks ---
onMounted(() => {
  // 初始化平铺预览
  updateTilePreview();
});

onBeforeUnmount(() => {
  if (fabricCanvas) {
    fabricCanvas.dispose();
  }
});

// 初始化位置模式画布
const initPositionCanvas = () => {
  if (!canvasEl.value || fabricCanvas) return;

  fabricCanvas = new fabric.Canvas(canvasEl.value, {
    width: 600,
    height: 600,
    backgroundColor: null,
  });

  const updateActiveObject = (e) => {
    const selected = e.selected;
    if (selected && selected.length === 1) {
      activeObject.value = selected[0];
    } else {
      activeObject.value = null;
    }
  };

  fabricCanvas.on({
    'selection:created': updateActiveObject,
    'selection:updated': updateActiveObject,
    'selection:cleared': () => { activeObject.value = null; },
  });
};

// 更新平铺预览
const updateTilePreview = () => {
  if (!tilePreviewCanvas.value) return;

  const canvas = tilePreviewCanvas.value;
  const ctx = canvas.getContext('2d');

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 设置文字样式
  const preset = stylePresets.value.find(p => p.name === tileSelectedPreset.value);
  ctx.font = `${preset?.options.fontWeight || 'normal'} ${tileFontSize.value}px ${preset?.options.fontFamily || 'sans-serif'}`;
  ctx.fillStyle = tileColor.value;
  ctx.globalAlpha = tileOpacity.value;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 计算平铺参数
  const tileWidth = 200;
  const tileHeight = 200;
  const cols = Math.ceil(canvas.width / tileWidth) + 2;
  const rows = Math.ceil(canvas.height / tileHeight) + 2;

  // 绘制平铺水印
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileWidth + tileWidth / 2;
      const y = row * tileHeight + tileHeight / 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((tileRotation.value * Math.PI) / 180);
      ctx.fillText(tileWatermarkText.value, 0, 0);
      ctx.restore();
    }
  }
};

// 监听平铺模式参数变化
watch([tileWatermarkText, tileSelectedPreset, tileColor, tileFontSize, tileOpacity, tileRotation], () => {
  updateTilePreview();
});

// 监听模式切换
watch(watermarkMode, (newMode) => {
  if (newMode === 'tile') {
    setTimeout(() => updateTilePreview(), 100);
  } else if (newMode === 'position') {
    setTimeout(() => initPositionCanvas(), 100);
  }
});

// --- Watchers for Reactivity ---
watch(selectedPreset, (presetName) => {
  if (!activeObject.value || activeObject.value.type !== 'i-text') return;
  const preset = stylePresets.value.find(p => p.name === presetName);
  if (!preset) return;

  const optionsToApply = { ...preset.options };

  // Handle complex objects like gradient and shadow
  if (typeof optionsToApply.fill === 'object' && optionsToApply.fill.type === 'linear') {
    optionsToApply.fill = new fabric.Gradient(optionsToApply.fill);
  }
  if (typeof optionsToApply.shadow === 'string') {
    optionsToApply.shadow = new fabric.Shadow(optionsToApply.shadow);
  }

  activeObject.value.set(optionsToApply);
  fabricCanvas.renderAll();

  essentialProps.fontSize = optionsToApply.fontSize || 40;
  essentialProps.opacity = optionsToApply.opacity || 1;
  essentialProps.textAlign = optionsToApply.textAlign || 'left';
  essentialProps.fill = optionsToApply.fill;
});

watch(essentialProps, (props) => {
  if (activeObject.value && activeObject.value.type === 'i-text') {
    activeObject.value.set(props);
    fabricCanvas.renderAll();
  }
});

watch(imageWatermarkOpacity, (newOpacity) => {
  if (activeObject.value && activeObject.value.type === 'image') {
    activeObject.value.set('opacity', newOpacity);
    fabricCanvas.renderAll();
  }
});

watch(imageWatermarkScale, (newScale) => {
  if (activeObject.value && activeObject.value.type === 'image') {
    activeObject.value.set({ scaleX: newScale, scaleY: newScale });
    fabricCanvas.renderAll();
  }
});

watch(activeObject, (obj) => {
  if (obj) {
    if (obj.type === 'i-text') {
      essentialProps.fontSize = obj.get('fontSize');
      essentialProps.opacity = obj.get('opacity');
      essentialProps.textAlign = obj.get('textAlign');
      essentialProps.fill = obj.get('fill');
    } else if (obj.type === 'image') {
      imageWatermarkOpacity.value = obj.get('opacity');
      imageWatermarkScale.value = obj.get('scaleX');
    }
  }
});

// --- Component Methods ---
const addText = () => {
  // 确保画布已初始化
  if (!fabricCanvas) {
    initPositionCanvas();
  }
  if (!fabricCanvas) return;

  const text = new fabric.IText('双击编辑', {
    left: 50,
    top: 50,
    fontFamily: 'Roboto',
    fill: '#000000',
    fontSize: 40,
  });
  fabricCanvas.add(text);
  fabricCanvas.setActiveObject(text);
};

const triggerWatermarkUpload = () => {
  watermarkFileInput.value?.click();
};

const handleWatermarkFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件作为水印');
    return;
  }
  addImageWatermark(file);
};

const addImageWatermark = (file) => {
  // 确保画布已初始化
  if (!fabricCanvas) {
    initPositionCanvas();
  }
  if (!fabricCanvas) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const imgObj = new fabric.Image(img, {
        left: fabricCanvas.getWidth() / 2,
        top: fabricCanvas.getHeight() / 2,
        originX: 'center',
        originY: 'center',
        selectable: true,
        opacity: imageWatermarkOpacity.value,
        scaleX: imageWatermarkScale.value,
        scaleY: imageWatermarkScale.value,
      });
      fabricCanvas.add(imgObj);
      fabricCanvas.setActiveObject(imgObj);
      fabricCanvas.renderAll();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

const handleBackgroundImagesUpload = (event) => {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  const validFiles = files.filter(file => file.type.startsWith('image/'));
  if (validFiles.length === 0) {
    alert('请选择有效的图片文件');
    return;
  }

  backgroundImages.value = validFiles;
};

const removeBackgroundImage = (index) => {
  backgroundImages.value.splice(index, 1);
};

const dataURLtoBlob = (dataurl) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--){
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:mime});
};

const generateAndDownload = async () => {
  if (!backgroundImages.value.length) {
    alert('请先上传背景图片');
    return;
  }

  if (!canGenerate.value) {
    alert(watermarkMode.value === 'tile' ? '请先输入水印文字' : '请先添加水印');
    return;
  }

  isGenerating.value = true;
  try {
    const zip = new JSZip();

    if (watermarkMode.value === 'tile') {
      // 平铺模式：生成平铺水印
      await generateTiledWatermark(zip);
    } else {
      // 位置模式：生成位置水印
      await generatePositionWatermark(zip);
    }

    // 生成并下载 ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = '水印批量生成.zip';
    link.click();
    URL.revokeObjectURL(link.href);

  } catch (error) {
    console.error('生成失败:', error);
    alert('生成失败，请查看控制台获取更多信息。');
  } finally {
    isGenerating.value = false;
  }
};

// 生成平铺水印
const generateTiledWatermark = async (zip) => {
  for (let i = 0; i < backgroundImages.value.length; i++) {
    const file = backgroundImages.value[i];
    const imageData = await readFileAsDataURL(file);
    const bgImg = await loadImage(imageData);

    // 创建画布
    const canvas = document.createElement('canvas');
    canvas.width = bgImg.width;
    canvas.height = bgImg.height;
    const ctx = canvas.getContext('2d');

    // 绘制背景
    ctx.drawImage(bgImg, 0, 0);

    // 绘制平铺水印
    const preset = stylePresets.value.find(p => p.name === tileSelectedPreset.value);
    ctx.font = `${preset?.options.fontWeight || 'normal'} ${tileFontSize.value}px ${preset?.options.fontFamily || 'sans-serif'}`;
    ctx.fillStyle = tileColor.value;
    ctx.globalAlpha = tileOpacity.value;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const tileWidth = 300;
    const tileHeight = 300;
    const cols = Math.ceil(bgImg.width / tileWidth) + 2;
    const rows = Math.ceil(bgImg.height / tileHeight) + 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * tileWidth + tileWidth / 2;
        const y = row * tileHeight + tileHeight / 2;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((tileRotation.value * Math.PI) / 180);
        ctx.fillText(tileWatermarkText.value, 0, 0);
        ctx.restore();
      }
    }

    const dataUrl = canvas.toDataURL('image/png', 1);
    const blob = dataURLtoBlob(dataUrl);
    const fileName = file.name.replace(/\.[^/.]+$/, '') + '_水印.png';
    zip.file(fileName, blob);
  }
};

// 生成位置水印
const generatePositionWatermark = async (zip) => {
  // 将当前水印导出为图片
  const watermarkDataUrl = fabricCanvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 1
  });
  const watermarkImg = await loadImage(watermarkDataUrl);

  for (let i = 0; i < backgroundImages.value.length; i++) {
    const file = backgroundImages.value[i];
    const imageData = await readFileAsDataURL(file);
    const bgImg = await loadImage(imageData);

    // 创建原生 canvas 进行合成
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = bgImg.width;
    finalCanvas.height = bgImg.height;
    const ctx = finalCanvas.getContext('2d');

    // 绘制背景图片
    ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height);

    // 位置模式：按照画布上的相对位置和大小显示
    const scaleX = bgImg.width / fabricCanvas.getWidth();
    const scaleY = bgImg.height / fabricCanvas.getHeight();

    // 计算水印在背景图上的实际尺寸和位置
    const watermarkWidth = fabricCanvas.getWidth() * scaleX;
    const watermarkHeight = fabricCanvas.getHeight() * scaleY;

    // 绘制水印（保持相对位置）
    ctx.drawImage(
      watermarkImg,
      0,
      0,
      fabricCanvas.getWidth(),
      fabricCanvas.getHeight(),
      0,
      0,
      watermarkWidth,
      watermarkHeight
    );

    // 导出为图片
    const dataUrl = finalCanvas.toDataURL('image/png', 1);
    const blob = dataURLtoBlob(dataUrl);
    const fileName = file.name.replace(/\.[^/.]+$/, '') + '_水印.png';
    zip.file(fileName, blob);
  }
};

// 辅助函数
const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};
</script>

<style>
/* Canvas container needs to have a defined size */
.canvas-container {
  margin: 0 auto;
}
</style>
