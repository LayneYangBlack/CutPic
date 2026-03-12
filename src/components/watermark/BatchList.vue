<template>
  <div class="p-4 bg-white rounded-lg shadow">
    <h3 class="text-lg font-semibold mb-4">批量列表 ({{ images.length }})</h3>

    <!-- 图片列表 -->
    <div class="space-y-2 max-h-96 overflow-y-auto">
      <div
        v-for="(image, index) in images"
        :key="image.id"
        :class="[
          'p-3 rounded border-2 transition-colors cursor-pointer',
          currentIndex === index
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        ]"
        @click="$emit('select', index)"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ image.name }}</p>
            <p class="text-xs text-gray-500">
              {{ getStatusText(image.status) }}
            </p>
          </div>

          <!-- 状态图标 -->
          <div class="ml-2">
            <span v-if="image.status === 'pending'" class="text-gray-400">⏳</span>
            <span v-else-if="image.status === 'processing'" class="text-blue-500">⚙️</span>
            <span v-else-if="image.status === 'done'" class="text-green-500">✅</span>
            <span v-else-if="image.status === 'error'" class="text-red-500">❌</span>
          </div>
        </div>

        <!-- 进度条 -->
        <div v-if="image.status === 'processing'" class="mt-2">
          <div class="w-full bg-gray-200 rounded-full h-1">
            <div
              class="bg-blue-500 h-1 rounded-full transition-all"
              :style="{ width: `${image.progress * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="mt-4 pt-4 border-t text-sm text-gray-600">
      <p>待处理: {{ pendingCount }} | 已完成: {{ doneCount }} | 失败: {{ errorCount }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: 0
  }
});

defineEmits(['select']);

// 计算统计信息
const pendingCount = computed(() => {
  return props.images.filter(img => img.status === 'pending').length;
});

const doneCount = computed(() => {
  return props.images.filter(img => img.status === 'done').length;
});

const errorCount = computed(() => {
  return props.images.filter(img => img.status === 'error').length;
});

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    processing: '处理中',
    done: '已完成',
    error: '失败'
  };
  return statusMap[status] || '未知';
};
</script>
