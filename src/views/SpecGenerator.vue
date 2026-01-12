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

          <!-- 位置模式：水印配置 -->
          <div v-else>
            <!-- 水印类型选择 -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">水印类型</label>
              <select v-model="positionWatermarkType" class="w-full p-2 border border-gray-300 rounded text-sm">
                <option value="text">文字水印</option>
                <option value="image">图片水印</option>
              </select>
            </div>

            <!-- 文字水印配置 -->
            <div v-if="positionWatermarkType === 'text'" class="space-y-4">
              <!-- 快捷换算工具 -->
              <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <label class="block text-sm font-medium mb-2 text-blue-700">🔄 快捷换算工具（cm/mm → inch）</label>
                <div class="flex gap-2">
                  <input
                    v-model.number="quickConvertValue"
                    type="number"
                    step="0.1"
                    placeholder="输入数值"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <select v-model="quickConvertUnit" class="px-3 py-2 border border-gray-300 rounded text-sm">
                    <option value="cm">cm</option>
                    <option value="mm">mm</option>
                  </select>
                  <button
                    @click="addQuickConvertText"
                    class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
                  >
                    添加
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-2">💡 自动生成格式：3cm/1.18inch</p>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">水印文字（每行一个）</label>
                <textarea
                  v-model="positionTextList"
                  placeholder="输入水印文字，每行一个&#10;例如：&#10;促销&#10;新品&#10;限时"
                  rows="5"
                  class="w-full p-2 border border-gray-300 rounded text-sm"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">艺术字样式</label>
                <select v-model="positionTextPreset" class="w-full p-2 border border-gray-300 rounded">
                  <option v-for="preset in stylePresets" :key="preset.name" :value="preset.name">
                    {{ preset.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">颜色</label>
                <input type="color" v-model="positionTextColor" class="w-full h-10 p-1 border border-gray-300 rounded" />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">透明度</label>
                <input type="range" v-model.number="positionTextOpacity" min="0" max="1" step="0.05" class="w-full" />
                <span class="text-xs text-gray-500">{{ Math.round(positionTextOpacity * 100) }}%</span>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">文字对齐</label>
                <select v-model="positionTextAlign" class="w-full p-2 border border-gray-300 rounded text-sm">
                  <option value="left">居左</option>
                  <option value="center">居中</option>
                  <option value="right">居右</option>
                </select>
              </div>

              <p class="text-xs text-gray-500 mt-4">💡 在右侧预览区域拖拽调整文字位置和大小</p>
            </div>

            <!-- 图片水印配置 -->
            <div v-else>
              <div class="flex gap-2 mb-4">
                <button @click="triggerWatermarkUpload" class="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded">
                  添加图片
                </button>
              </div>
              <input ref="watermarkFileInput" type="file" accept="image/*" @change="handleWatermarkFileUpload" class="hidden" />

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
            {{ isGenerating ? '正在生成...' : `生成并下载 (${totalOutputCount}张)` }}
          </button>
          <p v-if="backgroundImages.length === 0" class="text-xs text-gray-500 mt-2 text-center">请先上传背景图片</p>
          <p v-else-if="!canGenerate" class="text-xs text-gray-500 mt-2 text-center">
            请先{{ watermarkMode === 'tile' ? '输入水印文字' : (positionWatermarkType === 'text' ? '输入水印文字' : '添加图片水印') }}
          </p>
        </div>

      </div>

      <!-- Center Panel: Canvas/Preview -->
      <div class="md:col-span-8 rounded-lg shadow-inner flex items-center justify-center p-4"
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
          <!-- 文字水印预览 -->
          <div v-if="positionWatermarkType === 'text'" style="display: inline-block; border: 2px solid #333; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <canvas ref="positionTextPreviewCanvas"></canvas>
          </div>
          <!-- 图片水印预览 -->
          <div v-else style="display: inline-block; border: 2px solid #333; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <canvas ref="canvasEl"></canvas>
          </div>
          <p class="text-sm text-gray-600 mt-2">
            {{ positionWatermarkType === 'text' ? '拖拽调整文字位置' : '透明画布 - 拖动调整水印位置' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import * as fabric from 'fabric';
import JSZip from 'jszip';

const canvasEl = ref(null);
const tilePreviewCanvas = ref(null);
const positionTextPreviewCanvas = ref(null);
const watermarkFileInput = ref(null);
let fabricCanvas = null;
let textFabricCanvas = null; // 文字水印专用画布
const activeObject = ref(null);
const textActiveObject = ref(null); // 文字水印画布的活动对象

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

// 位置模式数据
const positionWatermarkType = ref('text'); // 'text' | 'image'
const positionTextList = ref(''); // 多行文字输入
const positionTextPreset = ref('普通字体');
const positionTextColor = ref('#000000');
const positionTextFontSize = ref(30);
const positionTextOpacity = ref(1);
const positionTextAlign = ref('left'); // 文字对齐方式：left/center/right

// 快捷换算工具
const quickConvertValue = ref(''); // 尺寸数值
const quickConvertUnit = ref('cm'); // 单位：cm 或 mm

// 判断是否可以生成
const canGenerate = computed(() => {
  if (watermarkMode.value === 'tile') {
    return tileWatermarkText.value.trim() !== '';
  } else {
    // 位置模式：文字水印需要有输入，图片水印需要有画布对象
    if (positionWatermarkType.value === 'text') {
      return positionTextList.value.trim() !== '';
    } else {
      return fabricCanvas && fabricCanvas.getObjects().length > 0;
    }
  }
});

// 计算实际生成的图片数量
const totalOutputCount = computed(() => {
  const bgCount = backgroundImages.value.length;
  if (bgCount === 0) return 0;
  // 位置文字模式：背景图数量 × 文字行数
  if (watermarkMode.value === 'position' && positionWatermarkType.value === 'text') {
    const textLines = positionTextList.value.split('\n').filter(line => line.trim());
    return bgCount * Math.max(textLines.length, 1);
  }
  return bgCount;
});

// --- Data for Presets ---
const stylePresets = ref([
  {
    name: '普通字体',
    options: {
      fontFamily: 'sans-serif',
      fontWeight: 'normal',
      fill: null,
      stroke: null,
      strokeWidth: 0,
      shadow: null,
    }
  },
  {
    name: '粗体黑色',
    options: {
      fontFamily: 'Arial Black, sans-serif',
      fontWeight: 'bold',
      fill: '#000000',
      stroke: null,
      strokeWidth: 0,
      shadow: null,
    }
  },
  {
    name: '霓虹发光',
    options: {
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      fill: '#00FFFF',
      stroke: '#FFFFFF',
      strokeWidth: 1,
      shadow: '0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 30px #00FFFF',
    }
  },
  {
    name: '金色渐变',
    options: {
      fontFamily: 'Georgia, serif',
      fontWeight: 'bold',
      fill: '#FFD700',
      stroke: '#B8860B',
      strokeWidth: 2,
      shadow: '2px 2px 4px rgba(0,0,0,0.5)',
    }
  },
  {
    name: '火焰红',
    options: {
      fontFamily: 'Impact, sans-serif',
      fontWeight: 'normal',
      fill: '#FF4500',
      stroke: '#FFD700',
      strokeWidth: 2,
      shadow: '0 0 10px #FF4500, 0 0 20px #FF0000',
    }
  },
  {
    name: '冰蓝',
    options: {
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      fill: '#87CEEB',
      stroke: '#FFFFFF',
      strokeWidth: 2,
      shadow: '0 0 15px #00BFFF, 0 0 25px #87CEEB',
    }
  },
  {
    name: '立体浮雕',
    options: {
      fontFamily: 'Arial Black, sans-serif',
      fontWeight: 'bold',
      fill: '#FFFFFF',
      stroke: '#333333',
      strokeWidth: 3,
      shadow: '3px 3px 0 #666666, 6px 6px 0 #999999',
    }
  },
  {
    name: '描边镂空',
    options: {
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      fill: 'transparent',
      stroke: '#FF0000',
      strokeWidth: 3,
      shadow: null,
    }
  },
  {
    name: '促销爆款',
    options: {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontWeight: 'bold',
      fill: '#FFFF00',
      stroke: '#FF0000',
      strokeWidth: 4,
      shadow: '3px 3px 6px rgba(0,0,0,0.6)',
    }
  },
  {
    name: '清新绿',
    options: {
      fontFamily: 'Verdana, sans-serif',
      fontWeight: 'bold',
      fill: '#32CD32',
      stroke: '#FFFFFF',
      strokeWidth: 2,
      shadow: '2px 2px 4px rgba(0,0,0,0.3)',
    }
  },
  {
    name: '紫色梦幻',
    options: {
      fontFamily: 'Georgia, serif',
      fontWeight: 'bold',
      fill: '#9932CC',
      stroke: '#FFB6C1',
      strokeWidth: 2,
      shadow: '0 0 15px #9932CC, 0 0 25px #DA70D6',
    }
  },
  {
    name: '简约白描',
    options: {
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeWidth: 1,
      shadow: null,
    }
  },
]);

// --- Data for other controls ---
const imageWatermarkOpacity = ref(1);
const imageWatermarkScale = ref(1);

const isGenerating = ref(false);

// --- Lifecycle Hooks ---
onMounted(async () => {
  // 初始化平铺预览
  updateTilePreview();
  // 初始化位置文字预览
  await updatePositionTextPreview();
});

onBeforeUnmount(() => {
  if (fabricCanvas) {
    fabricCanvas.dispose();
  }
  if (textFabricCanvas) {
    textFabricCanvas.dispose();
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

// 更新位置文字预览 - 使用 Fabric.js 画布
const updatePositionTextPreview = async (savedRelativePosition = null) => {
  if (!positionTextPreviewCanvas.value) return;

  // 销毁旧画布
  if (textFabricCanvas) {
    textFabricCanvas.dispose();
    textFabricCanvas = null;
  }

  // 获取文字列表
  const textLines = positionTextList.value.split('\n').filter(line => line.trim());
  const text = textLines.length > 0 ? textLines[0] : null;

  // 如果有背景图，使用第一张背景图
  if (backgroundImages.value.length > 0) {
    // 读取背景图文件
    const imageData = await readFileAsDataURL(backgroundImages.value[0]);
    const img = await loadImage(imageData);

    // 计算画布尺寸(最大600x600,等比缩放)
    const maxSize = 600;
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    const canvasWidth = img.width * scale;
    const canvasHeight = img.height * scale;

    // 初始化 Fabric.js 画布
    textFabricCanvas = new fabric.Canvas(positionTextPreviewCanvas.value, {
      width: canvasWidth,
      height: canvasHeight,
    });

    // Fabric.js v6: fromURL 返回 Promise
    const bgImg = await fabric.Image.fromURL(imageData);
    bgImg.scaleToWidth(canvasWidth);
    bgImg.scaleToHeight(canvasHeight);

    // Fabric.js v6: 直接设置 backgroundImage 属性
    textFabricCanvas.backgroundImage = bgImg;
    textFabricCanvas.renderAll();

    // 如果有文字,添加文字对象
    if (text) {
      addTextToCanvas(text, savedRelativePosition);
    }
  } else {
    // 没有背景图也没有文字,不初始化画布
    if (!text) return;

    // 有文字但没有背景图,使用默认尺寸
    textFabricCanvas = new fabric.Canvas(positionTextPreviewCanvas.value, {
      width: 600,
      height: 600,
      backgroundColor: '#f0f0f0',
    });

    addTextToCanvas(text, savedRelativePosition);
  }
};

// 在画布上添加文字对象(支持恢复相对位置)
const addTextToCanvas = (text, savedRelativePosition = null) => {
  if (!textFabricCanvas) return;

  // 获取样式配置
  const preset = stylePresets.value.find(p => p.name === positionTextPreset.value);
  const opts = preset?.options || {};

  // 计算文字位置(如果有保存的相对位置,使用该位置;否则居中)
  const left = savedRelativePosition
    ? textFabricCanvas.width * savedRelativePosition.relativeX
    : textFabricCanvas.width / 2;
  const top = savedRelativePosition
    ? textFabricCanvas.height * savedRelativePosition.relativeY
    : textFabricCanvas.height / 2;

  // 构建阴影对象
  let shadowObj = null;
  if (opts.shadow) {
    shadowObj = new fabric.Shadow(opts.shadow);
  }

  const textObj = new fabric.IText(text, {
    left,
    top,
    originX: 'center',
    originY: 'center',
    fontFamily: opts.fontFamily || 'sans-serif',
    fontWeight: opts.fontWeight || 'normal',
    fontSize: positionTextFontSize.value,
    fill: opts.fill || positionTextColor.value || '#000000',
    stroke: opts.stroke || null,
    strokeWidth: opts.strokeWidth || 0,
    shadow: shadowObj,
    opacity: positionTextOpacity.value,
    textAlign: positionTextAlign.value, // 设置文字对齐方式
  });

  textFabricCanvas.add(textObj);
  textFabricCanvas.setActiveObject(textObj);
  textFabricCanvas.renderAll();

  // 监听对象选择
  textFabricCanvas.on('selection:created', (e) => {
    textActiveObject.value = e.selected[0];
  });
  textFabricCanvas.on('selection:updated', (e) => {
    textActiveObject.value = e.selected[0];
  });
  textFabricCanvas.on('selection:cleared', () => {
    textActiveObject.value = null;
  });
};

// 快捷换算并添加文字（cm/mm 转英寸）
const addQuickConvertText = () => {
  const value = parseFloat(quickConvertValue.value);
  if (isNaN(value) || value <= 0) {
    alert('请输入有效的数值');
    return;
  }

  // 换算到英寸（1 inch = 2.54 cm = 25.4 mm）
  let inches;
  if (quickConvertUnit.value === 'cm') {
    inches = value / 2.54;
  } else {
    // mm
    inches = value / 25.4;
  }

  // 生成格式化文字：例如 "3cm/1.18inch"
  const formattedText = `${value}${quickConvertUnit.value}/${inches.toFixed(2)}inch`;

  // 添加到文字列表
  if (positionTextList.value.trim()) {
    positionTextList.value += '\n' + formattedText;
  } else {
    positionTextList.value = formattedText;
  }

  // 清空输入框
  quickConvertValue.value = '';
};

// 监听平铺模式参数变化
watch([tileWatermarkText, tileSelectedPreset, tileColor, tileFontSize, tileOpacity, tileRotation], () => {
  updateTilePreview();
});

// 监听位置文字模式参数变化(只更新样式,不重新初始化画布)
watch([positionTextPreset, positionTextColor, positionTextFontSize, positionTextOpacity, positionTextAlign], () => {
  if (textFabricCanvas && textFabricCanvas.getObjects().length > 0) {
    const textObj = textFabricCanvas.getObjects()[0];
    const preset = stylePresets.value.find(p => p.name === positionTextPreset.value);
    const opts = preset?.options || {};

    // 构建阴影对象
    let shadowObj = null;
    if (opts.shadow) {
      shadowObj = new fabric.Shadow(opts.shadow);
    }

    textObj.set({
      fontFamily: opts.fontFamily || 'sans-serif',
      fontWeight: opts.fontWeight || 'normal',
      fontSize: positionTextFontSize.value,
      fill: opts.fill || positionTextColor.value || '#000000',
      stroke: opts.stroke || null,
      strokeWidth: opts.strokeWidth || 0,
      shadow: shadowObj,
      opacity: positionTextOpacity.value,
      textAlign: positionTextAlign.value, // 更新文字对齐方式
    });

    textFabricCanvas.renderAll();
  }
});

// 监听文字内容变化(需要重新初始化画布)
watch(positionTextList, async () => {
  // 保存相对位置
  let savedRelativePosition = null;
  if (textFabricCanvas && textFabricCanvas.getObjects().length > 0) {
    const textObj = textFabricCanvas.getObjects()[0];
    savedRelativePosition = {
      relativeX: textObj.left / textFabricCanvas.width,
      relativeY: textObj.top / textFabricCanvas.height,
    };
  }
  await updatePositionTextPreview(savedRelativePosition);
});

// 监听背景图变化，更新预览(保留文字位置)
watch(backgroundImages, async () => {
  if (watermarkMode.value === 'position' && positionWatermarkType.value === 'text') {
    // 保存当前文字对象的相对位置
    let savedRelativePosition = null;
    if (textFabricCanvas && textFabricCanvas.getObjects().length > 0) {
      const textObj = textFabricCanvas.getObjects()[0];
      savedRelativePosition = {
        relativeX: textObj.left / textFabricCanvas.width,
        relativeY: textObj.top / textFabricCanvas.height,
      };
    }

    // 重新初始化画布(传入保存的相对位置,等待完成)
    await updatePositionTextPreview(savedRelativePosition);
  }
});

// 监听模式切换
watch(watermarkMode, async (newMode) => {
  if (newMode === 'tile') {
    setTimeout(() => updateTilePreview(), 100);
  } else if (newMode === 'position') {
    if (positionWatermarkType.value === 'text') {
      await updatePositionTextPreview();
    } else {
      setTimeout(() => initPositionCanvas(), 100);
    }
  }
});

// 监听位置模式水印类型切换
watch(positionWatermarkType, async (newType) => {
  if (watermarkMode.value === 'position') {
    if (newType === 'text') {
      await updatePositionTextPreview();
    } else {
      setTimeout(() => initPositionCanvas(), 100);
    }
  }
});

// --- Watchers for Reactivity ---
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
  if (obj && obj.type === 'image') {
    imageWatermarkOpacity.value = obj.get('opacity');
    imageWatermarkScale.value = obj.get('scaleX');
  }
});

// --- Component Methods ---
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
      // 位置模式：根据水印类型生成
      if (positionWatermarkType.value === 'text') {
        await generatePositionTextWatermark(zip);
      } else {
        await generatePositionWatermark(zip);
      }
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

// 生成位置文字水印
const generatePositionTextWatermark = async (zip) => {
  // 获取文字列表
  const textLines = positionTextList.value.split('\n').filter(line => line.trim());

  // 从画布获取文字的相对位置
  if (!textFabricCanvas || !textFabricCanvas.getObjects().length) {
    alert('请先在预览区域调整文字位置');
    return;
  }

  const textObj = textFabricCanvas.getObjects()[0];
  const relativeX = textObj.left / textFabricCanvas.width;
  const relativeY = textObj.top / textFabricCanvas.height;
  // 从 Fabric 对象获取实际字体大小和缩放比例
  const baseFontSize = textObj.fontSize || 60;
  const userScaleX = textObj.scaleX || 1;
  const userScaleY = textObj.scaleY || 1;
  const rotation = textObj.angle || 0; // 旋转角度（度）

  // 获取预设样式
  const preset = stylePresets.value.find(p => p.name === positionTextPreset.value);
  const opts = preset?.options || {};

  for (let i = 0; i < backgroundImages.value.length; i++) {
    const file = backgroundImages.value[i];
    const imageData = await readFileAsDataURL(file);
    const bgImg = await loadImage(imageData);

    // 为每条文字生成一张图片
    for (let j = 0; j < textLines.length; j++) {
      let text;

      if (j === 0) {
        // 第一条规格：使用预览区域的文本（保留用户编辑的换行）
        text = textObj.text;
      } else {
        // 其他规格：应用第一条的换行模式
        text = textLines[j];

        // 应用第一条规格的换行模式
        const firstSpecText = textObj.text; // 第一条规格（预览区域的文本）
        const firstSpecLines = firstSpecText.split('\n');

        // 如果第一条规格有换行，分析换行模式
        if (firstSpecLines.length > 1) {
          // 计算第一条规格的换行间隔（每段的字符数）
          const lineBreakPattern = firstSpecLines.map(line => line.length);

          // 将换行模式应用到当前规格
          const currentText = textLines[j];
          const newLines = [];
          let currentIndex = 0;

          for (let k = 0; k < lineBreakPattern.length && currentIndex < currentText.length; k++) {
            const charsToTake = lineBreakPattern[k];
            newLines.push(currentText.substring(currentIndex, currentIndex + charsToTake));
            currentIndex += charsToTake;
          }

          // 如果还有剩余字符，追加到最后一行（而不是新增一行，保持行数一致）
          if (currentIndex < currentText.length) {
            if (newLines.length > 0) {
              // 追加到最后一行
              newLines[newLines.length - 1] += currentText.substring(currentIndex);
            } else {
              // 如果没有行，创建一行
              newLines.push(currentText.substring(currentIndex));
            }
          }

          text = newLines.join('\n');
        }
      }

      // 创建画布
      const canvas = document.createElement('canvas');
      canvas.width = bgImg.width;
      canvas.height = bgImg.height;
      const ctx = canvas.getContext('2d');

      // 绘制背景图片
      ctx.drawImage(bgImg, 0, 0);

      // 计算缩放比例（实际图片尺寸 / 预览画布尺寸）
      const scaleRatio = canvas.width / textFabricCanvas.width;

      // 使用相对位置计算实际位置
      const x = canvas.width * relativeX;
      const y = canvas.height * relativeY;

      // 按比例缩放字体大小（从 Fabric 对象获取实际大小）
      const scaledFontSize = Math.round(baseFontSize * scaleRatio * userScaleX);

      // 获取文本对齐方式
      const textAlign = textObj.textAlign || 'left';

      // 设置文字样式
      ctx.font = `${opts.fontWeight || 'normal'} ${scaledFontSize}px ${opts.fontFamily || 'sans-serif'}`;
      ctx.globalAlpha = positionTextOpacity.value;
      ctx.textAlign = textAlign;
      ctx.textBaseline = 'middle';

      // 计算绘制的 x 坐标（根据 textAlign 和对象宽度）
      const scaledWidth = textObj.width * userScaleX * scaleRatio;
      let drawX = 0; // 相对于旋转中心的 x 坐标
      if (textAlign === 'left') {
        drawX = -scaledWidth / 2;
      } else if (textAlign === 'right') {
        drawX = scaledWidth / 2;
      }
      // textAlign === 'center' 时，drawX = 0（对象中心）

      // 处理多行文本
      const lines = text.split('\n');
      const lineHeight = scaledFontSize * 1.2;
      const totalHeight = lines.length * lineHeight;
      const startY = -totalHeight / 2 + lineHeight / 2; // 相对于旋转中心的起始 y 坐标

      // 解析多个阴影（如果有）
      const shadows = [];
      if (opts.shadow) {
        const shadowParts = opts.shadow.split(',');
        for (const part of shadowParts) {
          const shadowMatch = part.trim().match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(#[0-9A-Fa-f]+|rgba?\([^)]+\))/);
          if (shadowMatch) {
            shadows.push({
              offsetX: parseInt(shadowMatch[1]) * scaleRatio,
              offsetY: parseInt(shadowMatch[2]) * scaleRatio,
              blur: parseInt(shadowMatch[3]) * scaleRatio,
              color: shadowMatch[4]
            });
          }
        }
      }

      // 保存画布状态
      ctx.save();

      // 移动到旋转中心点并旋转
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);

      for (let k = 0; k < lines.length; k++) {
        const lineY = startY + k * lineHeight;

        // 绘制所有阴影层
        for (const shadow of shadows) {
          ctx.shadowOffsetX = shadow.offsetX;
          ctx.shadowOffsetY = shadow.offsetY;
          ctx.shadowBlur = shadow.blur;
          ctx.shadowColor = shadow.color;
          ctx.fillStyle = opts.fill || positionTextColor.value || '#000000';
          if (opts.fill !== 'transparent') {
            ctx.fillText(lines[k], drawX, lineY);
          }
        }

        // 清除阴影设置
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;

        // 绘制描边（如果有），按比例缩放描边宽度
        if (opts.stroke && opts.strokeWidth > 0) {
          ctx.strokeStyle = opts.stroke;
          ctx.lineWidth = opts.strokeWidth * scaleRatio;
          ctx.strokeText(lines[k], drawX, lineY);
        }

        // 绘制填充
        ctx.fillStyle = opts.fill || positionTextColor.value || '#000000';
        if (opts.fill !== 'transparent') {
          ctx.fillText(lines[k], drawX, lineY);
        }
      }

      // 恢复画布状态
      ctx.restore();

      // 导出为图片
      const dataUrl = canvas.toDataURL('image/png', 1);
      const blob = dataURLtoBlob(dataUrl);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const fileName = `${baseName}_${textLines[j]}_水印.png`;
      zip.file(fileName, blob);
    }
  }
};

// 生成位置水印（图片水印）
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
