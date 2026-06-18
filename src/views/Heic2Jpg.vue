<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-4xl mx-auto">

      <!-- 标题 -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">HEIC 转 JPG</h1>
          <p class="text-sm text-gray-500 mt-1">批量将 iPhone HEIC/HEIF 图片转换为 JPG 或 PNG</p>
        </div>
        <div class="flex items-center gap-3">
          <div v-if="isElectron" class="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg">
            桌面端
          </div>
          <router-link to="/" class="text-sm text-gray-500 hover:text-gray-700">← 返回</router-link>
        </div>
      </div>

      <!-- 设置栏 -->
      <div class="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-4 items-center">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 font-medium">输出格式</label>
          <select v-model="outputFormat" class="border border-gray-300 rounded px-2 py-1 text-sm">
            <option value="JPEG">JPG</option>
            <option value="PNG">PNG</option>
          </select>
        </div>
        <div class="flex items-center gap-2" v-if="outputFormat === 'JPEG'">
          <label class="text-sm text-gray-600 font-medium">质量</label>
          <input type="range" v-model.number="quality" min="0.1" max="1" step="0.05" class="w-24" />
          <span class="text-sm text-gray-500 w-8">{{ Math.round(quality * 100) }}%</span>
        </div>
        <button
          v-if="files.length > 0 && !isConverting"
          @click="clearAll"
          class="ml-auto text-sm text-red-400 hover:text-red-600"
        >清空</button>
      </div>

      <!-- 上传区 -->
      <div
        class="bg-white rounded-lg shadow p-6 mb-4 border-2 border-dashed transition-colors"
        :class="isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <div class="flex flex-col items-center justify-center gap-3">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-gray-500 text-sm">拖拽 HEIC 文件到此处，或</p>
          <!-- Electron：原生文件选择 -->
          <button
            v-if="isElectron"
            @click="selectFilesElectron"
            class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >选择文件</button>
          <!-- Web：input 上传 -->
          <label v-else class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
            选择文件
            <input ref="fileInput" type="file" accept=".heic,.heif,image/heic,image/heif" multiple class="hidden" @change="handleFileInput" />
          </label>
          <p class="text-xs text-gray-400">支持 .heic / .heif 格式</p>
        </div>
      </div>

      <!-- 文件列表 -->
      <div v-if="files.length > 0" class="bg-white rounded-lg shadow overflow-hidden mb-4">
        <div class="p-3 border-b border-gray-100 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">共 {{ files.length }} 个文件</span>
          <button
            @click="convertAll"
            :disabled="isConverting || allDone"
            class="px-4 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isConverting ? `转换中 (${doneCount}/${files.length})` : allDone ? '已全部完成' : '开始转换' }}
          </button>
        </div>

        <div class="divide-y divide-gray-100">
          <div
            v-for="item in files"
            :key="item.id"
            class="flex items-center gap-3 px-4 py-3"
          >
            <!-- 状态图标 -->
            <div class="w-6 h-6 flex-shrink-0 flex items-center justify-center">
              <svg v-if="item.status === 'done'" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else-if="item.status === 'error'" class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div v-else-if="item.status === 'converting'" class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div v-else class="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
            </div>

            <!-- 文件名 -->
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-700 truncate">{{ item.name }}</p>
              <p v-if="item.status === 'error'" class="text-xs text-red-500">{{ item.errorMsg }}</p>
              <p v-else-if="item.status === 'done'" class="text-xs text-green-600">转换完成</p>
            </div>

            <!-- 大小 -->
            <span class="text-xs text-gray-400 flex-shrink-0">{{ formatSize(item.size) }}</span>

            <!-- 下载按钮 -->
            <button
              v-if="item.status === 'done'"
              @click="downloadOne(item)"
              class="text-xs text-blue-500 hover:text-blue-700 flex-shrink-0 px-2 py-1 border border-blue-300 rounded"
            >下载</button>
          </div>
        </div>
      </div>

      <!-- 批量下载 -->
      <div v-if="allDone && files.length > 1" class="flex justify-end">
        <button
          @click="downloadAll"
          class="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >打包下载全部 ({{ files.length }} 张)</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { heicTo } from 'heic-to'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

const isElectron = computed(() => !!window.electron?.platform?.isElectron)

const outputFormat = ref('JPEG')
const quality = ref(0.92)
const isDragging = ref(false)
const isConverting = ref(false)
const files = ref([])   // { id, name, size, file, status, outputBuffer }
let idCounter = 0

const doneCount = computed(() => files.value.filter(f => f.status === 'done').length)
const allDone = computed(() => files.value.length > 0 && files.value.every(f => f.status === 'done' || f.status === 'error'))

function addFiles(rawFiles) {
  for (const f of rawFiles) {
    // 跳过已添加的同名文件
    if (files.value.some(e => e.name === f.name && e.size === f.size)) continue
    files.value.push({
      id: ++idCounter,
      name: f.name,
      size: f.size,
      file: f,
      status: 'pending',   // pending | converting | done | error
      outputBuffer: null,
      errorMsg: '',
    })
  }
}

function handleFileInput(e) {
  addFiles(Array.from(e.target.files))
  e.target.value = ''
}

function handleDrop(e) {
  isDragging.value = false
  const dropped = Array.from(e.dataTransfer.files).filter(f =>
    f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif')
  )
  addFiles(dropped)
}

// Electron 端通过 IPC 打开文件选择对话框，再用 fetch 读取本地文件
async function selectFilesElectron() {
  const paths = await window.electron?.dialog?.openFile({
    filters: [{ name: 'HEIC Images', extensions: ['heic', 'heif'] }],
    properties: ['openFile', 'multiSelections'],
  })
  if (!paths?.length) return
  const fetched = await Promise.all(paths.map(async p => {
    const res = await fetch(`file://${p}`)
    const blob = await res.blob()
    return new File([blob], p.split('/').pop(), { type: 'image/heic' })
  }))
  addFiles(fetched)
}

async function convertOne(item) {
  item.status = 'converting'
  try {
    const mimeType = outputFormat.value === 'JPEG' ? 'image/jpeg' : 'image/png'
    // heic-to 接收 Blob，返回 Blob
    const outputBlob = await heicTo({
      blob: item.file,
      type: mimeType,
      quality: outputFormat.value === 'JPEG' ? quality.value : undefined,
    })
    item.outputBuffer = outputBlob
    item.status = 'done'
  } catch (err) {
    item.status = 'error'
    item.errorMsg = err.message || '转换失败'
  }
}

async function convertAll() {
  if (isConverting.value) return
  isConverting.value = true
  const pending = files.value.filter(f => f.status === 'pending')
  // 限制并发数为 3，避免内存溢出
  const CONCURRENCY = 3
  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    await Promise.all(pending.slice(i, i + CONCURRENCY).map(convertOne))
  }
  isConverting.value = false
}

function getOutputName(item) {
  const ext = outputFormat.value === 'JPEG' ? 'jpg' : 'png'
  return item.name.replace(/\.(heic|heif)$/i, '') + '.' + ext
}

function downloadOne(item) {
  saveAs(item.outputBuffer, getOutputName(item))
}

async function downloadAll() {
  const zip = new JSZip()
  for (const item of files.value) {
    if (item.status === 'done') {
      const ab = await item.outputBuffer.arrayBuffer()
      zip.file(getOutputName(item), ab)
    }
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `heic2jpg_${Date.now()}.zip`)
}

function clearAll() {
  files.value = []
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}
</script>
