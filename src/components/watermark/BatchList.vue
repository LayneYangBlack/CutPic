<template>
  <div class="p-3 bg-white rounded-lg shadow flex flex-col gap-2">
    <!-- 标题 + 清空按钮 -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-700">图片列表 ({{ images.length }})</h3>
      <button
        v-if="images.length > 0"
        @click="$emit('clear-all')"
        class="text-xs text-red-400 hover:text-red-600 transition-colors"
      >
        清空
      </button>
    </div>

    <!-- 图片列表 -->
    <div class="space-y-1.5 max-h-96 overflow-y-auto pr-0.5">
      <div
        v-for="(image, index) in images"
        :key="image.id"
        :class="[
          'p-2 rounded border transition-colors cursor-pointer group',
          currentIndex === index
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        ]"
        @click="$emit('select', index)"
      >
        <div class="flex items-center gap-2">
          <!-- 状态图标 -->
          <span v-if="image.status === 'pending'" class="text-gray-400 text-sm shrink-0">⏳</span>
          <span v-else-if="image.status === 'processing'" class="text-blue-500 text-sm shrink-0">⚙️</span>
          <span v-else-if="image.status === 'done'" class="text-green-500 text-sm shrink-0">✅</span>
          <span v-else-if="image.status === 'error'" class="text-red-500 text-sm shrink-0">❌</span>

          <!-- 文件名 -->
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium truncate text-gray-700">{{ image.name }}</p>
            <!-- 仅裁剪模式下显示裁剪状态，擦除模式下隐藏避免混淆 -->
            <p v-if="isCropMode && image.cropArea" class="text-xs text-blue-400">已设置裁剪</p>
            <p v-else class="text-xs text-gray-400">{{ getStatusText(image.status) }}</p>
          </div>

          <!-- 删除按钮（hover 时显示） -->
          <button
            class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-0.5 rounded"
            @click.stop="$emit('remove', index)"
            title="移除"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 进度条 -->
        <div v-if="image.status === 'processing'" class="mt-1.5">
          <div class="w-full bg-gray-200 rounded-full h-1">
            <div class="bg-blue-500 h-1 rounded-full transition-all" :style="{ width: `${(image.progress || 0) * 100}%` }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div v-if="images.length > 0" class="pt-2 border-t text-xs text-gray-500">
      待处理 {{ pendingCount }} · 完成 {{ doneCount }} · 失败 {{ errorCount }}
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
  },
  isCropMode: {
    type: Boolean,
    default: false
  }
});

defineEmits(['select', 'remove', 'clear-all']);

const pendingCount = computed(() => props.images.filter(img => img.status === 'pending').length);
const doneCount = computed(() => props.images.filter(img => img.status === 'done').length);
const errorCount = computed(() => props.images.filter(img => img.status === 'error').length);

const getStatusText = (status) => {
  const statusMap = { pending: '待处理', processing: '处理中', done: '已完成', error: '失败' };
  return statusMap[status] || '未知';
};
</script>
