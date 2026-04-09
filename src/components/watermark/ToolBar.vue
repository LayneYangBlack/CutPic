<template>
  <div class="flex flex-col gap-3 p-4 bg-white rounded-lg shadow h-full">
    <!-- 工具模式 -->
    <div>
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">工具</p>
      <div class="flex flex-col gap-1.5">
        <button
          v-for="tool in tools"
          :key="tool.id"
          @click="$emit('tool-select', tool.id)"
          :class="[
            'flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors text-left',
            currentTool === tool.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          <span>{{ tool.icon }}</span>
          <span>{{ tool.label }}</span>
        </button>
      </div>
    </div>

    <div class="border-t"></div>

    <!-- 撤销/重做（仅擦除模式显示） -->
    <div v-if="currentTool === 'erase'">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">操作</p>
      <div class="flex flex-col gap-1.5">
        <button
          @click="$emit('undo')"
          :disabled="!canUndo"
          class="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ↩ 撤销
        </button>
        <button
          @click="$emit('redo')"
          :disabled="!canRedo"
          class="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ↪ 重做
        </button>
        <button
          @click="$emit('clear')"
          class="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
        >
          🗑 清空蒙版
        </button>
      </div>
    </div>

    <!-- 裁剪信息（裁剪模式） -->
    <div v-if="currentTool !== 'erase' && cropInfo">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">裁剪区域</p>
      <div class="text-xs text-gray-600 space-y-1 bg-gray-50 rounded p-2">
        <div>X: {{ cropInfo.x }} Y: {{ cropInfo.y }}</div>
        <div>{{ cropInfo.width }} × {{ cropInfo.height }} px</div>
      </div>
    </div>

    <!-- 弹性空白 -->
    <div class="flex-1"></div>

    <!-- 导出按钮 -->
    <button
      @click="$emit('export')"
      :disabled="isProcessing"
      class="w-full px-4 py-2.5 bg-green-500 text-white rounded font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {{ isProcessing ? '处理中...' : '导出图片' }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  currentTool: {
    type: String,
    default: 'erase'
  },
  canUndo: {
    type: Boolean,
    default: false
  },
  canRedo: {
    type: Boolean,
    default: false
  },
  isProcessing: {
    type: Boolean,
    default: false
  },
  // 当前裁剪区域信息（原图坐标），用于显示
  cropInfo: {
    type: Object,
    default: null
  }
});

defineEmits(['tool-select', 'undo', 'redo', 'clear', 'export']);

const tools = [
  { id: 'crop-rect', icon: '▭', label: '矩形裁剪' },
  { id: 'crop-circle', icon: '○', label: '圆形裁剪' },
  { id: 'erase', icon: '✏️', label: '擦除水印' }
];
</script>
