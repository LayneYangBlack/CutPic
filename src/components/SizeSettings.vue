<template>
  <div class="w-full p-4">
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">裁剪尺寸</label>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="width" class="block text-xs text-gray-500 mb-1">宽度</label>
          <input
            type="number"
            id="width"
            v-model.number="width"
            min="1"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @input="handleWidthChange"
          />
        </div>
        <div>
          <label for="height" class="block text-xs text-gray-500 mb-1">高度</label>
          <input
            type="number"
            id="height"
            v-model.number="height"
            min="1"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @input="handleHeightChange"
          />
        </div>
      </div>
    </div>

    <div class="flex items-center mb-4">
      <input
        type="checkbox"
        id="keepRatio"
        v-model="keepRatio"
        class="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label for="keepRatio" class="ml-2 block text-sm text-gray-700">
        保持宽高比
      </label>
    </div>

    <div v-if="error" class="text-red-500 text-sm">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  initialWidth: {
    type: Number,
    default: 0
  },
  initialHeight: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:size'])

const width = ref(props.initialWidth)
const height = ref(props.initialHeight)
const keepRatio = ref(true)
const error = ref('')
const originalRatio = ref(props.initialWidth && props.initialHeight ? props.initialWidth / props.initialHeight : 0)

// 监听尺寸变化
watch([width, height], ([newWidth, newHeight]) => {
  if (newWidth && newHeight) {
    emit('update:size', { width: newWidth, height: newHeight })
  }
})

// 处理宽度变化
const handleWidthChange = () => {
  if (!width.value) return
  if (keepRatio.value && originalRatio.value) {
    height.value = Math.round(width.value / originalRatio.value)
  }
}

// 处理高度变化
const handleHeightChange = () => {
  if (!height.value) return
  if (keepRatio.value && originalRatio.value) {
    width.value = Math.round(height.value * originalRatio.value)
  }
}

// 设置初始尺寸
const setInitialSize = (w, h) => {
  width.value = w
  height.value = h
  originalRatio.value = w / h
}

defineExpose({
  setInitialSize
})
</script> 