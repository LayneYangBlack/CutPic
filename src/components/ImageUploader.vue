<template>
  <div class="w-full p-4">
    <div class="mb-4">
      <label for="imageUrl" class="block text-sm font-medium text-gray-700 mb-2">图片URL</label>
      <div class="flex gap-2">
        <input
          type="text"
          id="imageUrl"
          v-model="imageUrl"
          placeholder="请输入图片URL"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="handleUrlSubmit"
        />
        <button
          @click="handleUrlSubmit"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          加载
        </button>
      </div>
    </div>

    <!-- 图片预览区域 -->
    <div v-if="previewUrl" class="mt-4">
      <div class="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <img
          ref="previewImage"
          :src="previewUrl"
          alt="预览图片"
          class="w-full h-full object-contain"
          @error="handleImageError"
          @load="handleImageLoad"
        />
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div class="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="mt-2 text-red-500 text-sm">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['image-loaded'])

const imageUrl = ref('')
const previewUrl = ref('')
const isLoading = ref(false)
const error = ref('')
const previewImage = ref(null)

const handleUrlSubmit = async () => {
  if (!imageUrl.value) {
    error.value = '请输入图片URL'
    return
  }

  try {
    isLoading.value = true
    error.value = ''
    
    // 验证URL是否有效
    const response = await fetch(imageUrl.value)
    if (!response.ok) throw new Error('图片加载失败')
    
    const blob = await response.blob()
    if (!blob.type.startsWith('image/')) {
      throw new Error('无效的图片格式')
    }

    previewUrl.value = URL.createObjectURL(blob)
  } catch (err) {
    error.value = err.message || '图片加载失败'
    previewUrl.value = ''
  } finally {
    isLoading.value = false
  }
}

const handleImageError = () => {
  error.value = '图片加载失败'
  previewUrl.value = ''
}

const handleImageLoad = () => {
  if (previewImage.value) {
    emit('image-loaded', {
      width: previewImage.value.naturalWidth,
      height: previewImage.value.naturalHeight
    })
  }
}
</script> 