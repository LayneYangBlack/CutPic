<script setup>
import { ref, computed } from 'vue'
import ImageInput from './components/ImageInput.vue'
import ImageCropper from './components/ImageCropper.vue'

const currentImage = ref(null)
const imagePreview = ref('')
const width = ref('')
const height = ref('')
const isAspectRatioLocked = ref(false)
const cropData = ref(null)

// 计算宽高比
const aspectRatio = computed(() => {
  if (!isAspectRatioLocked.value || !width.value || !height.value) return null
  return Number(width.value) / Number(height.value)
})

// 处理图片加载
const handleImageLoaded = (file) => {
  currentImage.value = file
  imagePreview.value = URL.createObjectURL(file)
}

// 处理裁剪
const handleCrop = (data) => {
  cropData.value = data
}

// 切换锁定比例
const toggleLockAspectRatio = () => {
  if (!width.value || !height.value) {
    alert('请先输入宽度和高度')
    return
  }
  isAspectRatioLocked.value = !isAspectRatioLocked.value
}

// 重置图片
const resetImage = () => {
  currentImage.value = null
  imagePreview.value = ''
  width.value = ''
  height.value = ''
  isAspectRatioLocked.value = false
  cropData.value = null
}

// 下载图片
const downloadImage = () => {
  if (!cropData.value) return

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()

  img.onload = () => {
    // 设置画布尺寸为指定的输出尺寸
    canvas.width = Number(width.value) || cropData.value.width
    canvas.height = Number(height.value) || cropData.value.height

    // 绘制裁剪后的图片
    ctx.drawImage(
      img,
      cropData.value.x,
      cropData.value.y,
      cropData.value.width,
      cropData.value.height,
      0,
      0,
      canvas.width,
      canvas.height
    )

    // 创建下载链接
    const link = document.createElement('a')
    link.download = 'cropped-image.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  img.src = imagePreview.value
}
</script>

<template>
  <div class="h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
    <header class="p-4 bg-white dark:bg-gray-800 shadow">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">图片裁剪工具</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">上传图片并选择裁剪区域</p>
    </header>

    <div class="flex-1 overflow-y-auto p-4">
      <!-- 图片输入组件 -->
      <ImageInput
        v-if="!currentImage"
        @image-loaded="handleImageLoaded"
        class="mb-4"
      />

      <!-- 图片预览和裁剪区域 -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <!-- 尺寸控制 -->
        <div class="mb-4 space-y-3">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">宽度:</label>
              <input
                type="number"
                v-model="width"
                class="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="宽度"
              />
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">高度:</label>
              <input
                type="number"
                v-model="height"
                class="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="高度"
              />
            </div>
          </div>
          <button
            @click="toggleLockAspectRatio"
            class="w-full px-3 py-2 rounded text-sm"
            :class="isAspectRatioLocked ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'"
          >
            {{ isAspectRatioLocked ? '解锁比例' : '锁定比例' }}
          </button>
        </div>

        <!-- 裁剪区域 -->
        <div class="relative aspect-[3/4] mb-4">
          <ImageCropper
            :image-url="imagePreview"
            :aspect-ratio="aspectRatio"
            @crop="handleCrop"
          />
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-col gap-2">
          <button
            @click="downloadImage"
            class="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            下载图片
          </button>
          <button
            @click="resetImage"
            class="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            重新选择
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.8);
}
</style>
