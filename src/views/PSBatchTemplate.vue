<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-7xl mx-auto">
      <!-- 标题 -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">PS批量套图工具</h1>
            <p class="text-gray-600 mt-2">可视化编辑模板,批量导入数据,一键生成所有变体</p>
          </div>
          <!-- 环境标识 -->
          <div v-if="isElectron" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-lg">
            <div class="flex items-center space-x-2">
              <span class="text-2xl">🖥️</span>
              <div>
                <p class="font-bold text-sm">桌面端模式</p>
                <p class="text-xs opacity-90">支持本地文件路径</p>
              </div>
            </div>
          </div>
          <div v-else class="px-4 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg">
            <div class="flex items-center space-x-2">
              <span class="text-2xl">🌐</span>
              <div>
                <p class="font-bold text-sm text-gray-700">网页端模式</p>
                <p class="text-xs text-gray-500">仅支持URL路径</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 class="text-sm font-bold text-blue-800 mb-2">📖 使用说明</h3>
          <ol class="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>设置画布尺寸，添加图层（背景/图片/文字）</li>
            <li><strong class="text-blue-900">勾选"可变"</strong>并填写<strong class="text-blue-900">变量名</strong>（与Excel表头一致）</li>
            <li>上传Excel批量数据（表头需要包含变量名）</li>
            <li>点击"批量生成并下载"，自动生成所有变体图片</li>
          </ol>
          <div class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <strong>💡 示例：</strong>图层变量名填"标题"，Excel需要有"标题"这一列
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左侧面板 -->
        <div class="lg:col-span-1 space-y-6">
          <!-- 1. 模板设置 -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold mb-4 flex items-center">
              <span class="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">1</span>
              模板设置
            </h2>

            <!-- 画布尺寸 -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">画布尺寸</label>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      v-model.number="canvasWidth"
                      placeholder="宽度"
                      class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                    <span class="text-xs text-gray-500">宽度(px)</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      v-model.number="canvasHeight"
                      placeholder="高度"
                      class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                    <span class="text-xs text-gray-500">高度(px)</span>
                  </div>
                </div>
                <button
                  @click="initCanvas"
                  class="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  应用尺寸
                </button>
              </div>

              <!-- 快捷尺寸 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">快捷尺寸</label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    @click="setCanvasSize(800, 800)"
                    class="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                  >
                    800x800
                  </button>
                  <button
                    @click="setCanvasSize(1200, 1200)"
                    class="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                  >
                    1200x1200
                  </button>
                  <button
                    @click="setCanvasSize(1920, 1080)"
                    class="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                  >
                    1920x1080
                  </button>
                  <button
                    @click="setCanvasSize(750, 1334)"
                    class="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                  >
                    750x1334
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 图层管理 -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold mb-4 flex items-center">
              <span class="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">2</span>
              图层管理
            </h2>

            <!-- 添加图层按钮 -->
            <div class="space-y-2 mb-4">
              <button
                @click="addLayer('background')"
                class="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-md hover:from-purple-600 hover:to-purple-700 flex items-center justify-center"
              >
                <span class="mr-2">🎨</span> 添加背景层
              </button>
              <button
                @click="addLayer('image')"
                class="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 flex items-center justify-center"
              >
                <span class="mr-2">🖼️</span> 添加图片层
              </button>
              <button
                @click="addLayer('text')"
                class="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md hover:from-green-600 hover:to-green-700 flex items-center justify-center"
              >
                <span class="mr-2">📝</span> 添加文字层
              </button>
            </div>

            <!-- 图层列表 -->
            <div class="space-y-2 max-h-96 overflow-y-auto">
              <div
                v-for="layer in layers"
                :key="layer.id"
                :class="['p-3 border rounded-md cursor-pointer transition-all', selectedLayer?.id === layer.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300']"
                @click="selectLayer(layer)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <span v-if="layer.type === 'background'">🎨</span>
                    <span v-if="layer.type === 'image'">🖼️</span>
                    <span v-if="layer.type === 'text'">📝</span>
                    <span class="font-medium text-sm">{{ layer.name }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <!-- 可变标记 -->
                    <label class="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        v-model="layer.variable"
                        class="mr-1"
                        @click.stop
                      >
                      <span class="text-xs text-gray-600">可变</span>
                    </label>
                    <button
                      @click.stop="deleteLayer(layer.id)"
                      class="text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <!-- 变量名(如果是可变图层) -->
                <div v-if="layer.variable" class="mt-2">
                  <input
                    type="text"
                    v-model="layer.variableName"
                    :placeholder="layer.type === 'image' ? '变量名(如: 主图) - 对应Excel列名' : layer.type === 'text' ? '变量名(如: 标题) - 对应Excel列名' : '变量名(如: 背景色) - 对应Excel列名'"
                    class="w-full px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-500"
                    @click.stop
                  >
                  <p class="text-xs text-gray-500 mt-1">💡 此变量名需与Excel表头一致</p>
                </div>
              </div>
              <div v-if="layers.length === 0" class="text-center text-gray-400 py-8">
                暂无图层,点击上方按钮添加
              </div>
            </div>
          </div>

          <!-- 3. 图层属性编辑 -->
          <div v-if="selectedLayer" class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold mb-4">图层属性</h2>

            <!-- 背景层属性 -->
            <div v-if="selectedLayer.type === 'background'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">背景颜色</label>
                <input
                  type="color"
                  v-model="selectedLayer.backgroundColor"
                  @change="updateLayer"
                  class="w-full h-10 rounded cursor-pointer"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">或上传背景图</label>
                <input
                  type="file"
                  accept="image/*"
                  @change="handleBackgroundUpload"
                  class="w-full text-sm"
                >
              </div>
            </div>

            <!-- 图片层属性 -->
            <div v-if="selectedLayer.type === 'image'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">上传图片</label>
                <input
                  type="file"
                  accept="image/*"
                  @change="handleImageUpload"
                  class="w-full text-sm"
                >
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">宽度</label>
                  <input
                    type="number"
                    v-model.number="selectedLayer.width"
                    @change="updateLayer"
                    class="w-full px-2 py-1 border rounded"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">高度</label>
                  <input
                    type="number"
                    v-model.number="selectedLayer.height"
                    @change="updateLayer"
                    class="w-full px-2 py-1 border rounded"
                  >
                </div>
              </div>
            </div>

            <!-- 文字层属性 -->
            <div v-if="selectedLayer.type === 'text'" class="space-y-4">
              <!-- 艺术字样式选择器 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">艺术字样式</label>
                <select
                  v-model="selectedLayer.stylePreset"
                  @change="applyStylePreset(selectedLayer.stylePreset)"
                  class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option v-for="preset in stylePresets" :key="preset.name" :value="preset.name">
                    {{ preset.name }}
                  </option>
                </select>
                <p class="text-xs text-gray-500 mt-1">💡 选择预设样式快速应用艺术字效果</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">文字内容</label>
                <input
                  type="text"
                  v-model="selectedLayer.text"
                  @input="updateLayer"
                  class="w-full px-3 py-2 border rounded"
                >
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">字号</label>
                  <input
                    type="number"
                    v-model.number="selectedLayer.fontSize"
                    @change="updateLayer"
                    class="w-full px-2 py-1 border rounded"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
                  <input
                    type="color"
                    v-model="selectedLayer.fill"
                    @change="updateLayer"
                    class="w-full h-8 rounded cursor-pointer"
                  >
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">字体粗细</label>
                <select
                  v-model="selectedLayer.fontWeight"
                  @change="updateLayer"
                  class="w-full px-2 py-1 border rounded"
                >
                  <option value="normal">正常</option>
                  <option value="bold">加粗</option>
                </select>
              </div>

              <!-- 高级艺术字设置 -->
              <div class="border-t pt-4">
                <h3 class="text-sm font-medium text-gray-700 mb-3">高级设置（自定义艺术字）</h3>

                <!-- 描边设置 -->
                <div class="space-y-2">
                  <label class="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      :checked="!!selectedLayer.stroke"
                      @change="(e) => {
                        if (e.target.checked) {
                          selectedLayer.stroke = '#000000';
                          selectedLayer.strokeWidth = 2;
                        } else {
                          selectedLayer.stroke = null;
                          selectedLayer.strokeWidth = 0;
                        }
                        updateLayer();
                      }"
                      class="mr-2"
                    >
                    启用描边
                  </label>

                  <div v-if="selectedLayer.stroke" class="grid grid-cols-2 gap-2 ml-6">
                    <div>
                      <label class="block text-xs text-gray-600 mb-1">描边颜色</label>
                      <input
                        type="color"
                        v-model="selectedLayer.stroke"
                        @change="updateLayer"
                        class="w-full h-8 rounded cursor-pointer"
                      >
                    </div>
                    <div>
                      <label class="block text-xs text-gray-600 mb-1">描边宽度</label>
                      <input
                        type="number"
                        v-model.number="selectedLayer.strokeWidth"
                        @change="updateLayer"
                        min="0"
                        max="10"
                        class="w-full px-2 py-1 border rounded text-sm"
                      >
                    </div>
                  </div>
                </div>

                <!-- 阴影设置 -->
                <div class="space-y-2 mt-3">
                  <label class="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      :checked="!!selectedLayer.shadow"
                      @change="(e) => {
                        if (e.target.checked) {
                          selectedLayer.shadow = '2px 2px 4px rgba(0,0,0,0.5)';
                        } else {
                          selectedLayer.shadow = null;
                        }
                        updateLayer();
                      }"
                      class="mr-2"
                    >
                    启用阴影
                  </label>

                  <div v-if="selectedLayer.shadow" class="ml-6">
                    <label class="block text-xs text-gray-600 mb-1">阴影CSS值</label>
                    <input
                      type="text"
                      v-model="selectedLayer.shadow"
                      @change="updateLayer"
                      placeholder="例: 2px 2px 4px rgba(0,0,0,0.5)"
                      class="w-full px-2 py-1 border rounded text-xs"
                    >
                    <p class="text-xs text-gray-400 mt-1">格式: offsetX offsetY blur color</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. 数据导入 -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold mb-4 flex items-center">
              <span class="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">3</span>
              批量数据
            </h2>

            <div class="space-y-4">
              <!-- Electron专属：选择Excel文件按钮 -->
              <div v-if="isElectron" class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <label class="block text-sm font-medium text-blue-800 mb-2">📂 选择Excel文件（桌面端）</label>
                <button
                  @click="selectExcelFile"
                  class="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  📁 浏览并选择Excel文件
                </button>
                <p class="text-xs text-blue-600 mt-1">支持本地路径：C:\xxx\data.xlsx 或 /Users/xxx/data.xlsx</p>
              </div>

              <!-- Web模式：传统上传 -->
              <div v-else>
                <label class="block text-sm font-medium text-gray-700 mb-2">上传Excel数据</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  @change="handleExcelUpload"
                  class="w-full text-sm"
                >
                <p class="text-xs text-gray-500 mt-1">支持 .xlsx, .xls, .csv 格式</p>
              </div>

              <div v-if="excelData.length > 0">
                <p class="text-sm text-green-600 font-medium">✓ 已导入 {{ excelData.length }} 条数据</p>
                <div class="mt-2 p-3 bg-gray-50 rounded text-xs">
                  <p class="font-medium mb-1">数据列:</p>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="col in excelColumns"
                      :key="col"
                      :class="[
                        'px-2 py-1 rounded',
                        isColumnMapped(col) ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-200 text-gray-600'
                      ]"
                    >
                      {{ col }}
                      <span v-if="isColumnMapped(col)">✓</span>
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-2">
                    <span class="text-green-600">✓</span> 表示已映射到图层变量
                  </p>
                </div>
              </div>

              <!-- 下载示例Excel -->
              <button
                @click="downloadExampleExcel"
                class="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                📥 下载示例Excel模板
              </button>
            </div>
          </div>

          <!-- 5. 批量生成 -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold mb-4 flex items-center">
              <span class="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">4</span>
              批量生成
            </h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">导出格式</label>
                <select v-model="exportFormat" class="w-full px-3 py-2 border rounded">
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                </select>
              </div>

              <div v-if="exportFormat === 'jpg'">
                <label class="block text-sm font-medium text-gray-700 mb-2">图片质量</label>
                <input
                  type="range"
                  v-model.number="exportQuality"
                  min="0.1"
                  max="1"
                  step="0.1"
                  class="w-full"
                >
                <p class="text-xs text-gray-500">{{ Math.round(exportQuality * 100) }}%</p>
              </div>

              <button
                @click="batchGenerate"
                :disabled="!canGenerate"
                class="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-md hover:from-red-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-bold"
              >
                🚀 批量生成并下载
              </button>

              <!-- 进度条 -->
              <div v-if="generating" class="space-y-2">
                <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    class="bg-blue-500 h-full transition-all duration-300"
                    :style="{ width: `${generateProgress}%` }"
                  ></div>
                </div>
                <p class="text-sm text-center text-gray-600">
                  正在生成: {{ currentGenerateIndex }} / {{ excelData.length }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧画布预览区 -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 class="text-xl font-bold mb-4">画布预览</h2>

            <!-- Canvas容器 - 自动缩放预览 -->
            <div
              ref="canvasContainer"
              class="border-2 border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center p-4"
              style="min-height: 500px; max-height: 800px;"
            >
              <div :style="{ transform: `scale(${previewScale})`, transformOrigin: 'center center' }">
                <canvas ref="fabricCanvas" id="fabricCanvas"></canvas>
              </div>
            </div>

            <!-- 缩放信息 -->
            <div class="mt-2 text-xs text-gray-500 text-center">
              预览缩放: {{ Math.round(previewScale * 100) }}% | 实际尺寸: {{ canvasWidth }}x{{ canvasHeight }}px
            </div>

            <!-- 操作按钮 -->
            <div class="mt-4 flex gap-2">
              <button
                @click="clearCanvas"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                清空画布
              </button>
              <button
                @click="saveTemplate"
                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                保存模板
              </button>
              <button
                @click="loadTemplate"
                class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                加载模板
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
// Fabric.js v6 正确导入方式
import { Canvas, Rect, Circle, Image as FabricImage, Text as FabricText, Shadow } from 'fabric';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
// 导入平台适配层 - 自动适配Web/Electron
import { useFileSystem } from '@/composables/useFileSystem';

// 平台适配层实例
const { isElectron, selectFile, readImage, readExcel, writeExcel, saveFile: saveFileAdapted } = useFileSystem();

// 调试：检查环境
console.log('🔍 [环境检测]');
console.log('  window.electron:', typeof window !== 'undefined' ? window.electron : 'undefined');
console.log('  isElectron:', isElectron.value);
if (typeof window !== 'undefined' && window.electron) {
  console.log('  window.electron.file:', window.electron.file);
  console.log('  window.electron.file.readImage:', window.electron.file.readImage);
}

// ========== 艺术字预设样式 ==========
// 12种预设艺术字效果，包含填充、描边、阴影等属性
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

// 画布配置
const canvasWidth = ref(800);
const canvasHeight = ref(800);
const fabricCanvas = ref(null);
const canvasContainer = ref(null);
const previewScale = ref(1); // 预览缩放比例
let canvas = null;

// 图层管理
const layers = ref([]);
const selectedLayer = ref(null);
let layerIdCounter = 1;

// 数据导入
const excelData = ref([]);
const excelColumns = ref([]);

// 批量生成
const exportFormat = ref('png');
const exportQuality = ref(0.9);
const generating = ref(false);
const currentGenerateIndex = ref(0);
const generateProgress = computed(() => {
  if (excelData.value.length === 0) return 0;
  return Math.round((currentGenerateIndex.value / excelData.value.length) * 100);
});

const canGenerate = computed(() => {
  return excelData.value.length > 0 && layers.value.length > 0;
});

// 检查某个Excel列是否已映射到图层变量
const isColumnMapped = (columnName) => {
  return layers.value.some(layer => layer.variable && layer.variableName === columnName);
};

// 初始化Canvas
onMounted(() => {
  nextTick(() => {
    initCanvas();
  });

  // 监听窗口resize，更新缩放比例
  window.addEventListener('resize', updatePreviewScale);
});

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('resize', updatePreviewScale);
});

// 初始化Fabric画布
const initCanvas = () => {
  const canvasEl = fabricCanvas.value;
  if (!canvasEl) return;

  // 销毁旧画布
  if (canvas) {
    canvas.dispose();
  }

  // 创建新画布 - Fabric.js v6写法
  canvas = new Canvas(canvasEl, {
    width: canvasWidth.value,
    height: canvasHeight.value,
    backgroundColor: '#ffffff',
  });

  // 计算预览缩放比例（确保画布适应容器）
  updatePreviewScale();

  // 监听对象选中事件
  canvas.on('selection:created', (e) => {
    const activeObj = e.selected[0];
    if (activeObj && activeObj.layerId) {
      const layer = layers.value.find(l => l.id === activeObj.layerId);
      if (layer) {
        selectedLayer.value = layer;
      }
    }
  });

  canvas.on('selection:updated', (e) => {
    const activeObj = e.selected[0];
    if (activeObj && activeObj.layerId) {
      const layer = layers.value.find(l => l.id === activeObj.layerId);
      if (layer) {
        selectedLayer.value = layer;
      }
    }
  });

  console.log('Canvas initialized:', canvasWidth.value, 'x', canvasHeight.value);
};

// 更新预览缩放比例
const updatePreviewScale = () => {
  if (!canvasContainer.value) return;

  // 容器可用尺寸（减去padding）
  const containerWidth = canvasContainer.value.clientWidth - 32; // 减去padding
  const containerHeight = canvasContainer.value.clientHeight - 32;

  // 计算缩放比例（取最小值以确保完整显示）
  const scaleX = containerWidth / canvasWidth.value;
  const scaleY = containerHeight / canvasHeight.value;
  const scale = Math.min(scaleX, scaleY, 1); // 最大不超过1（不放大）

  previewScale.value = scale;
};

// 设置画布尺寸
const setCanvasSize = (width, height) => {
  canvasWidth.value = width;
  canvasHeight.value = height;
  initCanvas();
};

// 添加图层
const addLayer = (type) => {
  const layer = {
    id: layerIdCounter++,
    type,
    name: `${type === 'background' ? '背景' : type === 'image' ? '图片' : '文字'}${layerIdCounter - 1}`,
    variable: false,
    variableName: '',
  };

  // 根据类型设置默认属性
  if (type === 'background') {
    layer.backgroundColor = '#ffffff';
    layer.backgroundImage = null;
  } else if (type === 'image') {
    layer.src = null;
    layer.width = 300;
    layer.height = 300;
  } else if (type === 'text') {
    layer.text = '示例文字';
    layer.fontSize = 32;
    layer.fill = '#000000';
    layer.fontWeight = 'normal';
    // 艺术字样式属性
    layer.fontFamily = 'sans-serif';
    layer.stroke = null;
    layer.strokeWidth = 0;
    layer.shadow = null;
    layer.stylePreset = '普通字体'; // 默认使用普通字体
  }

  layers.value.push(layer);
  selectedLayer.value = layer;

  // 在画布上创建对应对象
  if (type === 'text') {
    // 创建文字对象，应用艺术字效果
    const textOptions = {
      left: 100,
      top: 100,
      fontSize: layer.fontSize,
      fill: layer.fill,
      fontWeight: layer.fontWeight,
      fontFamily: layer.fontFamily,
      layerId: layer.id,
    };

    // 应用描边效果
    if (layer.stroke) {
      textOptions.stroke = layer.stroke;
      textOptions.strokeWidth = layer.strokeWidth;
    }

    // 应用阴影效果（Fabric.js需要Shadow对象）
    if (layer.shadow) {
      textOptions.shadow = layer.shadow;
    }

    const text = new FabricText(layer.text, textOptions);
    canvas.add(text);
    canvas.setActiveObject(text);
  }
};

// 选中图层
const selectLayer = (layer) => {
  selectedLayer.value = layer;
  // 在画布上选中对应对象
  const obj = canvas.getObjects().find(o => o.layerId === layer.id);
  if (obj) {
    canvas.setActiveObject(obj);
    canvas.renderAll();
  }
};

// 应用艺术字预设样式
const applyStylePreset = (presetName) => {
  if (!selectedLayer.value || selectedLayer.value.type !== 'text') return;

  const preset = stylePresets.value.find(p => p.name === presetName);
  if (!preset) return;

  const layer = selectedLayer.value;
  const options = preset.options;

  // 更新图层属性
  layer.stylePreset = presetName;
  layer.fontFamily = options.fontFamily;
  layer.fontWeight = options.fontWeight;
  layer.fill = options.fill || layer.fill; // 如果预设没有fill，保持原有颜色
  layer.stroke = options.stroke;
  layer.strokeWidth = options.strokeWidth;
  layer.shadow = options.shadow;

  // 立即更新画布显示
  updateLayer();
};

// 删除图层
const deleteLayer = (id) => {
  layers.value = layers.value.filter(l => l.id !== id);

  // 从画布删除对应对象
  const obj = canvas.getObjects().find(o => o.layerId === id);
  if (obj) {
    canvas.remove(obj);
  }

  if (selectedLayer.value?.id === id) {
    selectedLayer.value = null;
  }
};

// 更新图层(当属性改变时)
const updateLayer = () => {
  if (!selectedLayer.value) return;

  const layer = selectedLayer.value;
  const obj = canvas.getObjects().find(o => o.layerId === layer.id);

  if (layer.type === 'background') {
    if (layer.backgroundColor) {
      // Fabric v6: 直接设置属性
      canvas.backgroundColor = layer.backgroundColor;
      canvas.renderAll();
    }
  } else if (layer.type === 'text' && obj) {
    // 更新文字层属性，包含艺术字效果
    const updateOptions = {
      text: layer.text,
      fontSize: layer.fontSize,
      fill: layer.fill,
      fontWeight: layer.fontWeight,
      fontFamily: layer.fontFamily,
    };

    // 应用描边效果
    if (layer.stroke) {
      updateOptions.stroke = layer.stroke;
      updateOptions.strokeWidth = layer.strokeWidth;
    } else {
      updateOptions.stroke = null;
      updateOptions.strokeWidth = 0;
    }

    // 应用阴影效果
    if (layer.shadow) {
      updateOptions.shadow = layer.shadow;
    } else {
      updateOptions.shadow = null;
    }

    obj.set(updateOptions);
    canvas.renderAll();
  } else if (layer.type === 'image' && obj) {
    obj.set({
      scaleX: layer.width / obj.width,
      scaleY: layer.height / obj.height,
    });
    canvas.renderAll();
  }
};

// 处理背景图上传
const handleBackgroundUpload = (event) => {
  const file = event.target.files[0];
  if (!file || !selectedLayer.value) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    // Fabric.js v6: 使用FabricImage.fromURL
    FabricImage.fromURL(e.target.result).then((img) => {
      // 设置图片缩放以适应画布
      img.set({
        scaleX: canvasWidth.value / img.width,
        scaleY: canvasHeight.value / img.height,
      });
      canvas.backgroundImage = img;
      canvas.renderAll();
      selectedLayer.value.backgroundImage = e.target.result;
    });
  };
  reader.readAsDataURL(file);
};

// 处理图片上传
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file || !selectedLayer.value) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    // Fabric.js v6: 使用FabricImage.fromURL (返回Promise)
    FabricImage.fromURL(e.target.result).then((img) => {
      img.set({
        left: 100,
        top: 100,
        scaleX: selectedLayer.value.width / img.width,
        scaleY: selectedLayer.value.height / img.height,
        layerId: selectedLayer.value.id,
      });

      // 移除旧对象
      const oldObj = canvas.getObjects().find(o => o.layerId === selectedLayer.value.id);
      if (oldObj) {
        canvas.remove(oldObj);
      }

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();

      selectedLayer.value.src = e.target.result;
    });
  };
  reader.readAsDataURL(file);
};

// 处理Excel上传（Web模式）
const handleExcelUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

    excelData.value = jsonData;
    if (jsonData.length > 0) {
      excelColumns.value = Object.keys(jsonData[0]);
    }

    console.log('Excel数据导入成功:', jsonData.length, '条');
  };
  reader.readAsArrayBuffer(file);
};

// Electron专属：选择Excel文件（使用原生对话框）
const selectExcelFile = async () => {
  try {
    const file = await selectFile({
      title: '选择Excel文件',
      filters: [
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!file) return;

    // 使用平台适配层读取Excel（Electron优化版）
    const result = await readExcel(file.path);

    excelData.value = result.data;
    excelColumns.value = result.columns;

    console.log('✅ Excel数据导入成功（桌面端）:', result.data.length, '条');
    alert(`成功导入 ${result.data.length} 条数据！`);
  } catch (error) {
    console.error('Excel导入失败:', error);
    alert('Excel导入失败: ' + error.message);
  }
};

// 下载示例Excel
const downloadExampleExcel = () => {
  // 更新示例数据，包含更详细的说明
  const exampleData = [
    {
      '主图': 'https://example.com/image1.jpg',
      '标题': '新品上市',
      '价格': '¥99',
      '背景色': '#FF6B6B',
      '副标题': '限时优惠'
    },
    {
      '主图': 'https://example.com/image2.jpg',
      '标题': '限时优惠',
      '价格': '¥79',
      '背景色': '#4ECDC4',
      '副标题': '火热促销'
    },
    {
      '主图': 'https://example.com/image3.jpg',
      '标题': '爆款推荐',
      '价格': '¥129',
      '背景色': '#95E1D3',
      '副标题': '品质保证'
    },
  ];

  const ws = XLSX.utils.json_to_sheet(exampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '数据');
  XLSX.writeFile(wb, '批量套图示例数据.xlsx');
};

// 批量生成
const batchGenerate = async () => {
  if (!canGenerate.value) {
    alert('请先上传Excel数据并添加图层!');
    return;
  }

  generating.value = true;
  currentGenerateIndex.value = 0;

  const zip = new JSZip();
  const folder = zip.folder('generated_images');

  // 遍历每条数据
  for (let i = 0; i < excelData.value.length; i++) {
    const rowData = excelData.value[i];
    currentGenerateIndex.value = i + 1;

    // 应用数据到画布
    await applyDataToCanvas(rowData);

    // 强制渲染并等待完成
    canvas.renderAll();

    // 等待渲染完成（增加等待时间，确保图片完全加载）
    await new Promise(resolve => setTimeout(resolve, 500));

    // 导出图片
    const format = exportFormat.value === 'png' ? 'png' : 'jpeg';
    const dataURL = canvas.toDataURL(`image/${format}`, exportQuality.value);
    const base64Data = dataURL.split(',')[1];

    // 添加到ZIP
    const filename = `output_${i + 1}.${exportFormat.value}`;
    folder.file(filename, base64Data, { base64: true });
  }

  // 生成ZIP并下载
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `批量套图_${Date.now()}.zip`);

  generating.value = false;
  currentGenerateIndex.value = 0;
  alert(`成功生成 ${excelData.value.length} 张图片!`);
};

// 应用数据到画布（支持本地路径 - Electron优化）
const applyDataToCanvas = async (rowData) => {
  // 遍历所有可变图层
  for (const layer of layers.value) {
    if (!layer.variable || !layer.variableName) continue;

    const value = rowData[layer.variableName];
    if (value === undefined) continue;

    // 根据图层类型应用数据
    if (layer.type === 'text') {
      // 文字层：直接替换文字内容，保持艺术字效果
      const obj = canvas.getObjects().find(o => o.layerId === layer.id);
      if (obj) {
        // 更新文字内容，同时保持艺术字样式
        const updateOptions = {
          text: String(value),
          fontSize: layer.fontSize,
          fill: layer.fill,
          fontWeight: layer.fontWeight,
          fontFamily: layer.fontFamily,
        };

        // 应用描边效果
        if (layer.stroke) {
          updateOptions.stroke = layer.stroke;
          updateOptions.strokeWidth = layer.strokeWidth;
        }

        // 应用阴影效果
        if (layer.shadow) {
          updateOptions.shadow = layer.shadow;
        }

        obj.set(updateOptions);
      }
    } else if (layer.type === 'background') {
      // 背景层：支持颜色值或图片
      if (typeof value === 'string' && value.startsWith('#')) {
        // 纯色背景
        canvas.backgroundColor = value;
      } else if (typeof value === 'string' && value.length > 0) {
        // 图片背景（支持URL或本地路径）
        try {
          // 使用平台适配层读取图片（自动适配Web/Electron）
          const imageData = await readImage(value);

          const bgImg = await FabricImage.fromURL(imageData);
          bgImg.set({
            scaleX: canvasWidth.value / bgImg.width,
            scaleY: canvasHeight.value / bgImg.height,
          });
          canvas.backgroundImage = bgImg;

          // 立即渲染，确保背景图片显示
          canvas.renderAll();
        } catch (err) {
          console.error('背景图片加载失败:', value, err);
        }
      }
    } else if (layer.type === 'image') {
      // 图片层：动态加载图片并替换（支持本地路径）
      if (typeof value === 'string' && value.length > 0) {
        try {
          // 使用平台适配层读取图片（支持本地路径 C:\xxx\image.jpg）
          console.log('🔍 [调试] 准备读取图片:', value);
          console.log('🔍 [调试] isElectron:', isElectron.value);

          const imageData = await readImage(value);

          console.log('🔍 [调试] 读取结果类型:', typeof imageData);
          console.log('🔍 [调试] 读取结果前100字符:', imageData?.substring(0, 100));

          // 加载新图片
          const newImg = await FabricImage.fromURL(imageData);

          // 查找并移除旧的图片对象
          const oldObj = canvas.getObjects().find(o => o.layerId === layer.id);
          const left = oldObj?.left || 100;
          const top = oldObj?.top || 100;

          if (oldObj) {
            canvas.remove(oldObj);
          }

          // 添加新图片，保持原有位置和尺寸
          newImg.set({
            left,
            top,
            layerId: layer.id,
            selectable: true,
          });

          canvas.add(newImg);

          // 立即渲染，确保图片显示
          canvas.renderAll();
        } catch (err) {
          console.error('图片加载失败:', value, err);
        }
      }
    }
  }

  canvas.renderAll();
};

// 清空画布
const clearCanvas = () => {
  if (confirm('确定要清空画布吗?')) {
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    layers.value = [];
    selectedLayer.value = null;
  }
};

// 保存模板
const saveTemplate = () => {
  const template = {
    canvasWidth: canvasWidth.value,
    canvasHeight: canvasHeight.value,
    layers: layers.value,
    canvasJSON: canvas.toJSON(['layerId']),
  };

  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
  saveAs(blob, `模板_${Date.now()}.json`);
  alert('模板保存成功!');
};

// 加载模板
const loadTemplate = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const template = JSON.parse(event.target.result);

        canvasWidth.value = template.canvasWidth;
        canvasHeight.value = template.canvasHeight;
        layers.value = template.layers;

        // 重新初始化画布
        initCanvas();

        // 加载画布对象
        canvas.loadFromJSON(template.canvasJSON, () => {
          canvas.renderAll();
          alert('模板加载成功!');
        });
      } catch (err) {
        console.error('模板加载失败:', err);
        alert('模板加载失败!');
      }
    };
    reader.readAsText(file);
  };
  input.click();
};
</script>

<style scoped>
/* 自定义样式 */
</style>
