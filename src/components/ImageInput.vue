<template>
  <div class="space-y-4">
    <!-- URL输入 -->
    <div class="space-y-2">
      <label for="imageUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        图片URL
      </label>
      <div class="flex gap-2">
        <input
          id="imageUrl"
          v-model="imageUrl"
          type="text"
          placeholder="输入图片URL"
          class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          @keyup.enter="handleUrlSubmit"
        />
        <button
          @click="handleUrlSubmit"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          加载
        </button>
      </div>
    </div>

    <!-- 文件上传 -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        上传图片
      </label>
      <div class="flex items-center justify-center w-full">
        <label
          for="file-upload"
          class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span class="font-semibold">点击上传</span> 或拖拽图片到此处
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              支持 PNG, JPG, GIF 格式
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            class="hidden"
            accept="image/*"
            multiple
            @change="handleFileUpload"
          />
        </label>
      </div>
    </div>

    <!-- 错误提示 -->
    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['image-loaded', 'images-loaded'])
const imageUrl = ref('')
const error = ref('')

const handleUrlSubmit = async () => {
  if (!imageUrl.value) {
    error.value = '请输入图片URL'
    return
  }

  try {
    const response = await fetch(imageUrl.value)
    if (!response.ok) throw new Error('图片加载失败')
    
    const blob = await response.blob()
    const file = new File([blob], 'image.jpg', { type: blob.type })
    emit('image-loaded', file)
    error.value = ''
  } catch (err) {
    error.value = '图片加载失败，请检查URL是否正确'
  }
}

const handleFileUpload = (event) => {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  const validFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (validFiles.length === 0) {
    error.value = '请上传图片文件'
    return
  }

  if (validFiles.length === 1) {
    emit('image-loaded', validFiles[0])
  } else {
    emit('images-loaded', validFiles)
  }
  error.value = ''
}
</script> 