<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-7xl mx-auto">

      <!-- 标题 -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">批量套图工具</h1>
          <p class="text-sm text-gray-500 mt-1">上传套图模板 → 标记徽章区域 → 导入素材 → 一键批量生成</p>
        </div>
        <div v-if="isElectron" class="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg">
          桌面端 · 支持本地路径
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- ===== 左侧操作面板 ===== -->
        <div class="lg:col-span-1 space-y-4">

          <!-- Step 1: 上传套图模板 -->
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span class="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">1</span>
              套图模板
              <span class="text-xs text-gray-400 font-normal">（最多10张JPG）</span>
            </h2>

            <!-- Electron：原生文件对话框 -->
            <button
              v-if="isElectron"
              @click="selectTemplateImages"
              class="w-full py-2 border-2 border-dashed border-blue-300 text-blue-500 rounded-lg hover:bg-blue-50 text-sm transition-colors"
            >
              + 选择套图文件
            </button>

            <!-- Web：input上传 -->
            <label v-else class="block w-full py-2 border-2 border-dashed border-blue-300 text-blue-500 rounded-lg hover:bg-blue-50 text-sm text-center cursor-pointer transition-colors">
              + 选择套图文件
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                multiple
                class="hidden"
                @change="handleTemplateUpload"
              >
            </label>

            <!-- 套图列表 -->
            <div class="mt-3 space-y-2">
              <div
                v-for="(tpl, idx) in templates"
                :key="tpl.id"
                :class="[
                  'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
                  selectedTemplateId === tpl.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
                @click="selectTemplate(tpl)"
              >
                <!-- 缩略图 -->
                <img :src="tpl.dataUrl" class="w-10 h-10 object-cover rounded" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-700 truncate">{{ tpl.name }}</p>
                  <!-- 圆形区域状态 -->
                  <p v-if="tpl.circle" class="text-xs text-green-600">
                    ✓ 已标记区域 (r={{ tpl.circle.r }}px)
                  </p>
                  <p v-else class="text-xs text-orange-400">⚠ 未标记圆形区域</p>
                </div>
                <button
                  @click.stop="removeTemplate(idx)"
                  class="text-red-400 hover:text-red-600 text-xs px-1"
                >✕</button>
              </div>

              <div v-if="templates.length === 0" class="text-center text-gray-400 text-sm py-4">
                暂无套图，点击上方添加
              </div>
            </div>
          </div>

          <!-- Step 2: 素材图 -->
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span class="w-6 h-6 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">2</span>
              素材图
              <span class="text-xs text-gray-400 font-normal">（支持批量，几百张）</span>
            </h2>

            <!-- Electron：选择文件夹 -->
            <div v-if="isElectron" class="space-y-2">
              <button
                @click="selectDesignFolder"
                class="w-full py-2 border-2 border-dashed border-green-300 text-green-600 rounded-lg hover:bg-green-50 text-sm transition-colors"
              >
                + 选择素材文件夹
              </button>
              <button
                @click="selectDesignFiles"
                class="w-full py-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 text-sm transition-colors"
              >
                或选择多个文件
              </button>
            </div>

            <!-- Web：webkitdirectory -->
            <div v-else class="space-y-2">
              <label class="block w-full py-2 border-2 border-dashed border-green-300 text-green-600 rounded-lg hover:bg-green-50 text-sm text-center cursor-pointer transition-colors">
                + 选择素材文件夹
                <input type="file" webkitdirectory accept="image/*" class="hidden" @change="handleDesignFolderUpload">
              </label>
              <label class="block w-full py-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 text-sm text-center cursor-pointer transition-colors">
                或选择多个文件
                <input type="file" multiple accept="image/*" class="hidden" @change="handleDesignFilesUpload">
              </label>
            </div>

            <!-- 素材统计 -->
            <div v-if="designs.length > 0" class="mt-3 p-2 bg-green-50 rounded-lg">
              <p class="text-sm text-green-700 font-medium">✓ 已导入 {{ designs.length }} 张素材</p>
              <!-- 前4张预览 -->
              <div class="flex gap-1 mt-2">
                <img
                  v-for="d in designs.slice(0, 4)"
                  :key="d.name"
                  :src="d.dataUrl"
                  class="w-8 h-8 object-cover rounded"
                />
                <div v-if="designs.length > 4" class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                  +{{ designs.length - 4 }}
                </div>
              </div>
            </div>
            <div v-else class="mt-2 text-center text-gray-400 text-sm py-2">
              暂无素材
            </div>
          </div>

          <!-- Step 3: 导出设置 + 生成 -->
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span class="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              批量生成
            </h2>

            <div class="space-y-3">
              <!-- 导出格式 -->
              <div class="flex items-center gap-3">
                <label class="text-sm text-gray-600 w-16">格式</label>
                <div class="flex gap-2">
                  <button
                    v-for="fmt in ['jpg', 'png']"
                    :key="fmt"
                    @click="exportFormat = fmt"
                    :class="[
                      'px-3 py-1 text-xs rounded border transition-colors',
                      exportFormat === fmt
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    ]"
                  >{{ fmt.toUpperCase() }}</button>
                </div>
              </div>

              <!-- JPG质量 -->
              <div v-if="exportFormat === 'jpg'" class="flex items-center gap-3">
                <label class="text-sm text-gray-600 w-16">质量</label>
                <input type="range" v-model.number="exportQuality" min="0.5" max="1" step="0.05" class="flex-1">
                <span class="text-xs text-gray-500 w-8">{{ Math.round(exportQuality * 100) }}%</span>
              </div>

              <!-- 任务量预估 -->
              <div class="p-2 bg-gray-50 rounded text-xs text-gray-500">
                预计生成：{{ readyTemplates.length }} 套模板 × {{ designs.length }} 张素材
                = <span class="font-bold text-gray-700">{{ readyTemplates.length * designs.length }}</span> 张图片
              </div>

              <!-- 生成按钮 -->
              <button
                @click="batchGenerate"
                :disabled="!canGenerate || generating"
                :class="[
                  'w-full py-2.5 rounded-lg font-bold text-sm transition-colors',
                  canGenerate && !generating
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]"
              >
                {{ generating ? `生成中... ${currentIdx}/${totalCount}` : '一键批量生成并下载' }}
              </button>

              <!-- 不可用提示 -->
              <div v-if="!canGenerate" class="text-xs text-orange-500 space-y-0.5">
                <p v-if="readyTemplates.length === 0">⚠ 需要至少1张已标记圆形区域的套图</p>
                <p v-if="designs.length === 0">⚠ 需要至少1张素材图</p>
              </div>

              <!-- 进度条 -->
              <div v-if="generating" class="space-y-1">
                <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    class="bg-blue-500 h-full transition-all duration-200"
                    :style="{ width: `${generateProgress}%` }"
                  ></div>
                </div>
                <p class="text-xs text-center text-gray-500">{{ currentTask }}</p>
              </div>
            </div>
          </div>

        </div>

        <!-- ===== 右侧预览区 ===== -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow p-4 sticky top-4">
            <div class="flex items-center justify-between mb-3">
              <h2 class="font-bold text-gray-700">
                {{ selectedTemplate ? `预览：${selectedTemplate.name}` : '套图预览 · 点击套图模板后标记圆形区域' }}
              </h2>
              <!-- 操作按钮 -->
              <div v-if="selectedTemplate" class="flex items-center gap-2">
                <button
                  @click="toggleMarkingMode"
                  :class="[
                    'px-3 py-1 text-xs rounded-lg border transition-colors',
                    markingMode
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-gray-300 text-gray-600 hover:border-orange-400 hover:text-orange-500'
                  ]"
                >
                  <!-- 标记模式文字根据是否有圆形而变化 -->
                  {{ markingMode ? '取消' : (selectedTemplate.circle ? '重新标记' : '标记圆形区域') }}
                </button>
                <button
                  v-if="selectedTemplate?.circle"
                  @click="clearCircle"
                  class="px-3 py-1 text-xs rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors"
                >
                  清除
                </button>
              </div>
            </div>

            <!-- 交互提示文字 -->
            <div v-if="selectedTemplate" class="mb-2 text-xs text-gray-400">
              <template v-if="markingMode">拖拽画出圆形区域</template>
              <template v-else-if="selectedTemplate.circle">拖动圆圈内部移动位置 · 拖动橙色手柄调整大小</template>
              <template v-else>点击「标记圆形区域」开始标记</template>
            </div>

            <!-- 画布区域 -->
            <div
              class="border-2 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
              :class="markingMode ? 'border-orange-400' : 'border-gray-200'"
              style="min-height: 480px;"
            >
              <!-- 空状态 -->
              <div v-if="!selectedTemplate" class="text-center text-gray-400">
                <div class="text-4xl mb-2">🖼️</div>
                <p class="text-sm">请先在左侧上传并选择套图模板</p>
              </div>

              <!-- 套图预览 + 圆形标记交互区 -->
              <div
                v-else
                class="relative select-none"
                :style="{
                  width: displayW + 'px',
                  height: displayH + 'px',
                  cursor: containerCursor,
                }"
                ref="previewWrapper"
                @mousedown="onMouseDown"
                @mousemove="onMouseMove"
                @mouseup="onMouseUp"
                @mouseleave="onMouseLeave"
              >
                <!-- 套图图片（不绑定事件，交给父div统一处理） -->
                <img
                  :src="selectedTemplate.dataUrl"
                  :width="displayW"
                  :height="displayH"
                  class="block"
                  draggable="false"
                />

                <!-- 已标记的圆形 + 交互手柄 -->
                <svg
                  v-if="displayCircle"
                  class="absolute inset-0 pointer-events-none"
                  :width="displayW"
                  :height="displayH"
                >
                  <!-- 圆形区域边框（虚线） -->
                  <circle
                    :cx="displayCircle.cx"
                    :cy="displayCircle.cy"
                    :r="displayCircle.r"
                    fill="none"
                    stroke="#3b82f6"
                    stroke-width="2"
                    stroke-dasharray="6 3"
                  />
                  <!-- 圆心手柄（拖动可移动整个圆） -->
                  <circle
                    :cx="displayCircle.cx"
                    :cy="displayCircle.cy"
                    r="8"
                    fill="white"
                    stroke="#3b82f6"
                    stroke-width="2"
                  />
                  <!-- 右侧缩放手柄（橙色圆点，拖动可调整半径） -->
                  <circle
                    :cx="displayCircle.cx + displayCircle.r"
                    :cy="displayCircle.cy"
                    r="7"
                    fill="#f97316"
                    stroke="white"
                    stroke-width="2"
                  />
                </svg>

                <!-- 拖拽绘制中的临时圆形 -->
                <svg
                  v-if="interactionMode === 'drawing' && tempCircle"
                  class="absolute inset-0 pointer-events-none"
                  :width="displayW"
                  :height="displayH"
                >
                  <circle
                    :cx="tempCircle.cx"
                    :cy="tempCircle.cy"
                    :r="tempCircle.r"
                    fill="rgba(251,146,60,0.15)"
                    stroke="#f97316"
                    stroke-width="2"
                    stroke-dasharray="6 3"
                  />
                </svg>

                <!-- 标记模式半透明遮罩（提示用户处于绘制状态） -->
                <div
                  v-if="markingMode && interactionMode !== 'drawing'"
                  class="absolute inset-0 pointer-events-none"
                  style="background: rgba(251,146,60,0.05);"
                />
              </div>
            </div>

            <!-- 当前模板圆形信息 -->
            <div v-if="selectedTemplate?.circle" class="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-600">
              圆心：({{ selectedTemplate.circle.x }}, {{ selectedTemplate.circle.y }})，
              半径：{{ selectedTemplate.circle.r }}px
              <span class="text-gray-400 ml-2">（原图坐标）</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useFileSystem } from '@/composables/useFileSystem';

const { isElectron, selectFiles, selectFolder, readImage, readImageFolder, saveFile } = useFileSystem();

// ==================== 套图模板 ====================
const templates = ref([]);       // { id, name, dataUrl, naturalW, naturalH, circle: {x,y,r} | null }
const selectedTemplateId = ref(null);
let tplIdCounter = 1;

// 当前选中的模板
const selectedTemplate = computed(() =>
  templates.value.find(t => t.id === selectedTemplateId.value) || null
);

// 已标记圆形区域的模板（可参与批量生成）
const readyTemplates = computed(() =>
  templates.value.filter(t => t.circle)
);

/** Electron：原生对话框选择套图 */
const selectTemplateImages = async () => {
  const files = await selectFiles({
    title: '选择套图文件',
    filters: [{ name: '图片', extensions: ['jpg', 'jpeg', 'png'] }],
  });
  if (!files || files.length === 0) return;

  for (const f of files.slice(0, 10 - templates.value.length)) {
    const dataUrl = await readImage(f.path);
    addTemplate(dataUrl, f.path.split('/').pop().split('\\').pop());
  }
};

/** Web：input文件上传 */
const handleTemplateUpload = async (e) => {
  const files = Array.from(e.target.files || []);
  for (const file of files.slice(0, 10 - templates.value.length)) {
    const dataUrl = await fileToDataUrl(file);
    addTemplate(dataUrl, file.name);
  }
  e.target.value = '';
};

/** 添加模板到列表，同时读取原图尺寸 */
const addTemplate = (dataUrl, name) => {
  const img = new Image();
  img.onload = () => {
    templates.value.push({
      id: tplIdCounter++,
      name,
      dataUrl,
      naturalW: img.naturalWidth,
      naturalH: img.naturalHeight,
      circle: null,
    });
  };
  img.src = dataUrl;
};

/** 选中某张模板，重置交互状态 */
const selectTemplate = (tpl) => {
  selectedTemplateId.value = tpl.id;
  markingMode.value = false;
  interactionMode.value = 'none';
  tempCircle.value = null;
  hoverType.value = 'none';
};

/** 删除模板 */
const removeTemplate = (idx) => {
  const id = templates.value[idx].id;
  templates.value.splice(idx, 1);
  if (selectedTemplateId.value === id) {
    selectedTemplateId.value = templates.value[0]?.id || null;
  }
};

// ==================== 素材图 ====================
const designs = ref([]);  // { name, dataUrl }

/** Electron：选择素材文件夹 */
const selectDesignFolder = async () => {
  const folder = await selectFolder({ title: '选择素材文件夹' });
  if (!folder) return;

  try {
    // readImageFolder 返回 [{name, data, path, size}]，data 是 base64 DataURL
    const images = await readImageFolder(folder.path);
    designs.value = images.map(img => ({
      name: img.name,
      dataUrl: img.data || img.dataUrl,
      path: img.path,
    }));
  } catch (err) {
    console.error('读取文件夹失败:', err);
    alert('读取文件夹失败: ' + err.message);
  }
};

/** Electron：选择多个素材文件 */
const selectDesignFiles = async () => {
  const files = await selectFiles({
    title: '选择素材图',
    filters: [{ name: '图片', extensions: ['jpg', 'jpeg', 'png'] }],
  });
  if (!files || files.length === 0) return;

  designs.value = [];
  for (const f of files) {
    const dataUrl = await readImage(f.path);
    designs.value.push({ name: f.path.split('/').pop().split('\\').pop(), dataUrl });
  }
};

/** Web：文件夹选择（webkitdirectory） */
const handleDesignFolderUpload = async (e) => {
  const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
  await loadWebFiles(files);
  e.target.value = '';
};

/** Web：多文件选择 */
const handleDesignFilesUpload = async (e) => {
  const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
  await loadWebFiles(files);
  e.target.value = '';
};

const loadWebFiles = async (files) => {
  designs.value = [];
  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    designs.value.push({ name: file.name, dataUrl });
  }
};

// ==================== 预览区：圆形标记交互 ====================
const previewWrapper = ref(null);

const markingMode = ref(false);        // 是否处于重新绘制模式（用户主动点击"重新标记"）
const interactionMode = ref('none');   // 当前拖拽类型：'none' | 'drawing' | 'moving' | 'resizing'
const tempCircle = ref(null);          // 绘制中的临时圆形（显示坐标）{ cx, cy, r }
const hoverType = ref('none');         // 悬停区域：'none' | 'move' | 'resize'（控制光标样式）

let dragStart = null;                  // 拖拽起点（显示坐标）
let originalCircle = null;             // 移动操作开始时的圆形快照（原图坐标）

// 手柄命中半径（px）
const HANDLE_HIT_RADIUS = 12;

// -------- 尺寸计算 --------

// 预览图显示尺寸（等比缩放，最大宽700px）
const MAX_DISPLAY_W = 700;
const displayW = computed(() => {
  if (!selectedTemplate.value) return 0;
  const { naturalW } = selectedTemplate.value;
  return naturalW <= MAX_DISPLAY_W ? naturalW : MAX_DISPLAY_W;
});
const displayH = computed(() => {
  if (!selectedTemplate.value) return 0;
  const { naturalW, naturalH } = selectedTemplate.value;
  const ratio = displayW.value / naturalW;
  return Math.round(naturalH * ratio);
});

// 缩放比例（原图 → 显示）
const scaleRatio = computed(() => {
  if (!selectedTemplate.value) return 1;
  return displayW.value / selectedTemplate.value.naturalW;
});

/** 原图坐标 → 显示坐标 */
const toDisplayX = (x) => Math.round(x * scaleRatio.value);
const toDisplayY = (y) => Math.round(y * scaleRatio.value);
const toDisplayR = (r) => Math.round(r * scaleRatio.value);

/** 显示坐标 → 原图坐标 */
const toNaturalX = (x) => Math.round(x / scaleRatio.value);
const toNaturalY = (y) => Math.round(y / scaleRatio.value);
const toNaturalR = (r) => Math.round(r / scaleRatio.value);

// 已标记圆形的显示坐标（供 SVG 渲染用）
const displayCircle = computed(() => {
  const c = selectedTemplate.value?.circle;
  if (!c) return null;
  return {
    cx: toDisplayX(c.x),
    cy: toDisplayY(c.y),
    r: toDisplayR(c.r),
  };
});

// 光标样式（根据交互状态和悬停位置动态切换）
const containerCursor = computed(() => {
  if (interactionMode.value === 'drawing') return 'crosshair';
  if (interactionMode.value === 'moving') return 'grabbing';
  if (interactionMode.value === 'resizing') return 'ew-resize';
  if (markingMode.value) return 'crosshair';
  if (hoverType.value === 'resize') return 'ew-resize';
  if (hoverType.value === 'move') return 'grab';
  return 'default';
});

// -------- 标记模式开关 --------

const toggleMarkingMode = () => {
  markingMode.value = !markingMode.value;
  if (!markingMode.value) {
    interactionMode.value = 'none';
    tempCircle.value = null;
  }
};

const clearCircle = () => {
  if (selectedTemplate.value) {
    selectedTemplate.value.circle = null;
    hoverType.value = 'none';
  }
};

// -------- 鼠标事件 --------

/** 获取鼠标相对于预览容器的坐标 */
const getRelativePos = (e) => {
  const rect = previewWrapper.value.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
};

const onMouseDown = (e) => {
  if (!selectedTemplate.value) return;
  e.preventDefault();
  const pos = getRelativePos(e);

  // 优先判断：是否点击已有圆形的手柄（移动 / 缩放）
  if (displayCircle.value) {
    const dc = displayCircle.value;

    // 1. 检测缩放手柄（圆形右侧橙色圆点）
    const rhX = dc.cx + dc.r;
    const rhY = dc.cy;
    const distToResize = Math.sqrt((pos.x - rhX) ** 2 + (pos.y - rhY) ** 2);
    if (distToResize <= HANDLE_HIT_RADIUS) {
      interactionMode.value = 'resizing';
      dragStart = pos;
      return;
    }

    // 2. 检测圆形内部（移动整个圆）
    const distToCenter = Math.sqrt((pos.x - dc.cx) ** 2 + (pos.y - dc.cy) ** 2);
    if (distToCenter <= dc.r) {
      interactionMode.value = 'moving';
      dragStart = pos;
      // 快照当前圆形位置（原图坐标），用于相对位移计算
      originalCircle = { ...selectedTemplate.value.circle };
      return;
    }
  }

  // 3. 绘制新圆形（markingMode 主动开启，或尚未标记过时允许直接画）
  if (markingMode.value || !selectedTemplate.value.circle) {
    interactionMode.value = 'drawing';
    dragStart = pos;
    tempCircle.value = { cx: pos.x, cy: pos.y, r: 0 };
  }
};

const onMouseMove = (e) => {
  if (!selectedTemplate.value) return;
  e.preventDefault();
  const pos = getRelativePos(e);

  // 正在绘制新圆形
  if (interactionMode.value === 'drawing' && dragStart) {
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    tempCircle.value = { cx: dragStart.x, cy: dragStart.y, r: Math.sqrt(dx * dx + dy * dy) };
    return;
  }

  // 正在移动圆形位置
  if (interactionMode.value === 'moving' && dragStart && originalCircle) {
    // 将鼠标位移换算为原图坐标的位移，加到快照上
    const dx = toNaturalX(pos.x) - toNaturalX(dragStart.x);
    const dy = toNaturalY(pos.y) - toNaturalY(dragStart.y);
    selectedTemplate.value.circle = {
      x: originalCircle.x + dx,
      y: originalCircle.y + dy,
      r: originalCircle.r,
    };
    return;
  }

  // 正在拖动缩放手柄调整半径
  if (interactionMode.value === 'resizing' && displayCircle.value) {
    const dc = displayCircle.value;
    // 鼠标到圆心的距离即为新的显示半径
    const dist = Math.sqrt((pos.x - dc.cx) ** 2 + (pos.y - dc.cy) ** 2);
    if (dist > 5) {
      selectedTemplate.value.circle = {
        ...selectedTemplate.value.circle,
        r: toNaturalR(dist),
      };
    }
    return;
  }

  // 未拖拽时：检测悬停区域，更新光标
  if (displayCircle.value) {
    const dc = displayCircle.value;
    const rhX = dc.cx + dc.r;
    const rhY = dc.cy;
    const distToResize = Math.sqrt((pos.x - rhX) ** 2 + (pos.y - rhY) ** 2);
    const distToCenter = Math.sqrt((pos.x - dc.cx) ** 2 + (pos.y - dc.cy) ** 2);

    if (distToResize <= HANDLE_HIT_RADIUS) {
      hoverType.value = 'resize';
    } else if (distToCenter <= dc.r) {
      hoverType.value = 'move';
    } else {
      hoverType.value = 'none';
    }
  } else {
    hoverType.value = 'none';
  }
};

const onMouseUp = (e) => {
  if (!selectedTemplate.value) return;
  e.preventDefault();
  const pos = getRelativePos(e);

  // 绘制完成：保存圆形
  if (interactionMode.value === 'drawing' && dragStart) {
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    const r = Math.sqrt(dx * dx + dy * dy);

    if (r > 5) {
      // 换算为原图坐标保存
      selectedTemplate.value.circle = {
        x: toNaturalX(dragStart.x),
        y: toNaturalY(dragStart.y),
        r: toNaturalR(r),
      };
    }
    tempCircle.value = null;
    markingMode.value = false; // 绘制完自动退出标记模式
  }

  interactionMode.value = 'none';
  dragStart = null;
  originalCircle = null;
};

const onMouseLeave = () => {
  // 鼠标离开时终止所有拖拽操作
  if (interactionMode.value === 'drawing') {
    tempCircle.value = null;
  }
  interactionMode.value = 'none';
  dragStart = null;
  originalCircle = null;
  hoverType.value = 'none';
};

// ==================== 批量生成 ====================
const exportFormat = ref('jpg');
const exportQuality = ref(0.9);
const generating = ref(false);
const currentIdx = ref(0);
const currentTask = ref('');

const totalCount = computed(() => readyTemplates.value.length * designs.value.length);

const generateProgress = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((currentIdx.value / totalCount.value) * 100);
});

const canGenerate = computed(() =>
  readyTemplates.value.length > 0 && designs.value.length > 0
);

const batchGenerate = async () => {
  if (!canGenerate.value || generating.value) return;

  generating.value = true;
  currentIdx.value = 0;

  const zip = new JSZip();
  const mimeType = exportFormat.value === 'jpg' ? 'image/jpeg' : 'image/png';
  const ext = exportFormat.value;

  // 遍历：以素材为单位建文件夹，每个素材下存各套图的合成结果
  for (const design of designs.value) {
    const designName = design.name.replace(/\.[^.]+$/, ''); // 去掉扩展名作为文件夹名
    const folder = zip.folder(designName);

    for (const tpl of readyTemplates.value) {
      currentIdx.value++;
      const tplName = tpl.name.replace(/\.[^.]+$/, '');
      currentTask.value = `${designName} / ${tplName}`;

      try {
        const blob = await compositeImage(tpl, design, mimeType);
        const arrayBuffer = await blob.arrayBuffer();
        folder.file(`${tplName}.${ext}`, arrayBuffer);
      } catch (err) {
        console.error('合成失败:', tpl.name, design.name, err);
      }

      // 让 UI 有机会更新进度
      await nextTick();
    }
  }

  currentTask.value = '打包中...';
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  await saveFile(zipBlob, `批量套图_${Date.now()}.zip`);

  generating.value = false;
  currentIdx.value = 0;
  currentTask.value = '';
  alert(`生成完成！共 ${totalCount.value} 张图片`);
};

/**
 * 核心合成逻辑：
 * 1. 将套图模板画到 canvas
 * 2. 以圆形路径裁剪，将素材图 cover-fit 缩放后贴到圆形区域
 * 3. 导出 Blob
 */
const compositeImage = (tpl, design, mimeType) => {
  return new Promise((resolve, reject) => {
    const { naturalW, naturalH, circle } = tpl;
    const canvas = document.createElement('canvas');
    canvas.width = naturalW;
    canvas.height = naturalH;
    const ctx = canvas.getContext('2d');

    const tplImg = new Image();
    const designImg = new Image();

    tplImg.crossOrigin = 'anonymous';
    designImg.crossOrigin = 'anonymous';

    tplImg.onload = () => {
      // 1. 画套图背景
      ctx.drawImage(tplImg, 0, 0, naturalW, naturalH);

      designImg.onload = () => {
        // 2. 建立圆形裁剪路径
        ctx.save();
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
        ctx.clip();

        // 3. 计算素材图绘制位置（cover-fit：短边 = 直径，居中对齐圆心）
        const diameter = circle.r * 2;
        const dw = designImg.naturalWidth;
        const dh = designImg.naturalHeight;
        const scale = Math.max(diameter / dw, diameter / dh);
        const scaledW = dw * scale;
        const scaledH = dh * scale;
        const drawX = circle.x - circle.r - (scaledW - diameter) / 2;
        const drawY = circle.y - circle.r - (scaledH - diameter) / 2;

        ctx.drawImage(designImg, drawX, drawY, scaledW, scaledH);
        ctx.restore();

        // 4. 导出
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('canvas.toBlob 返回空')),
          mimeType,
          mimeType === 'image/jpeg' ? exportQuality.value : undefined
        );
      };

      designImg.onerror = reject;
      designImg.src = design.dataUrl;
    };

    tplImg.onerror = reject;
    tplImg.src = tpl.dataUrl;
  });
};

// ==================== 工具函数 ====================

/** File 对象转 DataURL */
const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
</script>

<style scoped>
/* 防止拖拽时选中文字 */
.select-none {
  user-select: none;
  -webkit-user-select: none;
}
</style>
