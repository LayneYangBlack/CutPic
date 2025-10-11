<template>
  <div class="p-4 font-sans">
    <h1 class="text-2xl font-bold mb-4">规格图批量生成器</h1>

    <!-- Main Content -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Left Panel: Controls & Batch List -->
      <div class="md:col-span-1 bg-white p-4 rounded-lg shadow space-y-6">
        <div>
          <h2 class="text-lg font-semibold mb-3">1. 上传模板</h2>
          <ImageInput @image-loaded="handleImageLoaded" />
        </div>

        <div>
          <h2 class="text-lg font-semibold mb-3">2. 编辑文字</h2>
          <button @click="addText" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4">
            添加文字到画布
          </button>

          <!-- New Preset-based Properties Panel -->
          <div v-if="activeObject?.type === 'i-text'" class="space-y-4 p-4 border border-gray-200 rounded-lg">
            <h3 class="text-md font-semibold">文本样式</h3>

            <!-- Preset Selector -->
            <div>
              <label class="block text-sm font-medium">艺术字样式</label>
              <select v-model="selectedPreset" class="w-full p-1 border border-gray-300 rounded">
                <option v-for="preset in stylePresets" :key="preset.name" :value="preset.name">
                  {{ preset.name }}
                </option>
              </select>
            </div>

            <!-- Color Picker -->
            <div>
              <label class="block text-sm font-medium">颜色</label>
              <input type="color" v-model="essentialProps.fill" class="w-full h-8 p-1 border-none rounded" />
            </div>

            <!-- Essential Controls -->
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
        </div>

        <div>
          <h2 class="text-lg font-semibold mb-3">3. 批量内容列表</h2>
          <div class="mb-4 space-y-2">
            <div v-for="(item, index) in batchList" :key="index" class="flex items-center gap-2">
              <input type="text" v-model="item.text" class="flex-1 p-1 border border-gray-300 rounded" placeholder="输入文字..." />
              <button @click="removeBatchItem(index)" class="text-red-500 hover:text-red-700">×</button>
            </div>
            <button @click="addBatchItem" class="w-full text-sm text-blue-500 hover:underline">+ 添加一项</button>
          </div>
          <button @click="generateAndDownload" :disabled="isGenerating" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
            {{ isGenerating ? '正在生成...' : '生成并下载 ZIP' }}
          </button>
        </div>
      </div>

      <!-- Center Panel: Canvas/Preview -->
      <div class="md:col-span-2 bg-gray-200 rounded-lg shadow-inner flex items-center justify-center p-4 min-h-[600px]">
        <canvas ref="canvasEl"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive, watch } from 'vue';
import * as fabric from 'fabric';
import ImageInput from '../components/ImageInput.vue';

const canvasEl = ref(null);
let fabricCanvas = null;
const activeObject = ref(null);

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
  },
  {
    name: '火焰燃烧',
    options: {
      fontFamily: 'Montserrat',
      fontWeight: 'bold',
      fontStyle: 'normal',
      underline: false,
      fill: { type: 'linear', gradientUnits: 'percentage', coords: { x1: 0, y1: 0, x2: 0, y2: 1 }, colorStops: [{ offset: 0, color: '#FFD700' }, { offset: 1, color: '#FF4500' }] },
      shadow: 'rgba(0,0,0,0.5) 3px 3px 3px',
    }
  },
  {
    name: '霓虹光晕',
    options: {
      fontFamily: 'Pacifico',
      fontWeight: 'normal',
      fontStyle: 'normal',
      underline: false,
      fill: '#39FF14',
      stroke: '#39FF14',
      strokeWidth: 1,
      shadow: '#39FF14 0 0 20px',
    }
  },
  {
    name: '金属质感',
    options: {
      fontFamily: 'Roboto',
      fontWeight: 'bold',
      fontStyle: 'normal',
      underline: false,
      fill: { type: 'linear', gradientUnits: 'percentage', coords: { x1: 0, y1: 0, x2: 0, y2: 1 }, colorStops: [{ offset: 0, color: '#FFFFFF' }, { offset: 0.5, color: '#808080' }, { offset: 1, color: '#FFFFFF' }] },
      stroke: '#36454F',
      strokeWidth: 1,
      shadow: null,
    }
  },
  {
    name: '可爱手写',
    options: {
      fontFamily: 'Caveat',
      fontWeight: 'normal',
      fontStyle: 'normal',
      underline: false,
      fill: '#1E90FF',
      stroke: null,
      strokeWidth: 0,
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
  fill: '#000000', // Reintroduced fill for direct editing
});
const batchList = ref([
  { text: '示例文字1' },
  { text: '示例文字2' },
]);
const isGenerating = ref(false);

// --- Lifecycle Hooks ---
onMounted(() => {
  if (canvasEl.value) {
    fabricCanvas = new fabric.Canvas(canvasEl.value, {
      width: 600,
      height: 600,
      backgroundColor: '#f0f0f0',
    });

    const updateActiveObject = (e) => {
      const selected = e.selected;
      if (selected && selected.length === 1 && selected[0].type === 'i-text') {
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
  }
});

onBeforeUnmount(() => {
  if (fabricCanvas) {
    fabricCanvas.dispose();
  }
});

// --- Watchers for Reactivity ---
watch(selectedPreset, (presetName) => {
  if (!activeObject.value) return;
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

  // Update essentialProps directly from the preset's options for consistency
  essentialProps.fontSize = optionsToApply.fontSize || 40;
  essentialProps.opacity = optionsToApply.opacity || 1;
  essentialProps.textAlign = optionsToApply.textAlign || 'left';
  essentialProps.fill = optionsToApply.fill; // This will be the raw color string or gradient object from preset
});

watch(essentialProps, (props) => {
  if (activeObject.value) {
    activeObject.value.set(props);
    fabricCanvas.renderAll();
  }
});

watch(activeObject, (obj) => {
  if (obj) {
    essentialProps.fontSize = obj.get('fontSize');
    essentialProps.opacity = obj.get('opacity');
    essentialProps.textAlign = obj.get('textAlign');
    essentialProps.fill = obj.get('fill'); // Update fill when object is selected

    // No longer trying to match preset, just update essential props
  } 
});

// --- Component Methods ---
const addText = () => {
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

const handleImageLoaded = (file) => {
  if (!fabricCanvas || !canvasEl.value) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageUrl = e.target.result;
    const imgEl = new Image();
    imgEl.onload = () => {
      const fabricImg = new fabric.Image(imgEl);
      const container = canvasEl.value.parentElement;
      if (!container) return;

      const newWidth = container.clientWidth > 20 ? container.clientWidth - 20 : 800;
      const imgRatio = fabricImg.width / fabricImg.height;
      const newHeight = newWidth / imgRatio;

      fabricCanvas.setWidth(newWidth);
      fabricCanvas.setHeight(newHeight);
      fabricImg.scaleToWidth(newWidth);
      fabricCanvas.backgroundImage = fabricImg;
      fabricCanvas.renderAll();
    };
    imgEl.onerror = (err) => console.error('Failed to load image data:', err);
    imgEl.src = imageUrl;
  };
  reader.onerror = (err) => console.error('FileReader error:', err);
  reader.readAsDataURL(file);
};

const addBatchItem = () => {
  batchList.value.push({ text: '新文字' });
};

const removeBatchItem = (index) => {
  batchList.value.splice(index, 1);
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
}

const generateAndDownload = async () => {
  if (!fabricCanvas || batchList.value.length === 0) {
    alert('请先上传模板并添加至少一个批量项。');
    return;
  }
  const textObject = fabricCanvas.getObjects('i-text')[0];
  if (!textObject) {
    alert('画布上没有可用的文本对象。请先添加一个文字框。');
    return;
  }
  isGenerating.value = true;
  try {
    const zip = new JSZip();
    const originalText = textObject.text;
    for (let i = 0; i < batchList.value.length; i++) {
      const item = batchList.value[i];
      textObject.set('text', item.text);
      fabricCanvas.renderAll();
      const dataUrl = fabricCanvas.toDataURL({ format: 'png' });
      const blob = dataURLtoBlob(dataUrl);
      zip.file(`规格图_${i + 1}.png`, blob);
    }
    textObject.set('text', originalText);
    fabricCanvas.renderAll();
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = '规格图批量生成.zip';
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('生成失败:', error);
    alert('生成失败，请查看控制台获取更多信息。');
  } finally {
    isGenerating.value = false;
  }
};
</script>

<style>
/* Canvas container needs to have a defined size */
.canvas-container {
  margin: 0 auto;
}
</style>
