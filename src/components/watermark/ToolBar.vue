<template>
  <div class="flex flex-col gap-2 p-4 bg-white rounded-lg shadow">
    <!-- 工具按钮 -->
    <button
      v-for="tool in tools"
      :key="tool.id"
      @click="$emit('tool-select', tool.id)"
      :class="[
        'px-4 py-2 rounded transition-colors',
        currentTool === tool.id
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      ]"
      :disabled="tool.disabled"
    >
      {{ tool.label }}
    </button>

    <div class="border-t my-2"></div>

    <!-- 撤销/重做 -->
    <button
      @click="$emit('undo')"
      :disabled="!canUndo"
      class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      撤销 (Ctrl+Z)
    </button>
    <button
      @click="$emit('redo')"
      :disabled="!canRedo"
      class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      重做 (Ctrl+Y)
    </button>

    <div class="border-t my-2"></div>

    <!-- 清空/导出 -->
    <button
      @click="$emit('clear')"
      class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
    >
      清空蒙版
    </button>
    <button
      @click="$emit('export')"
      :disabled="isProcessing"
      class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
  }
});

defineEmits(['tool-select', 'undo', 'redo', 'clear', 'export']);

const tools = [
  { id: 'erase', label: '擦除工具', disabled: false }
];
</script>
