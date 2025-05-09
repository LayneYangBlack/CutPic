<template>
  <div class="relative w-full h-full">
    <!-- 图片容器 -->
    <div class="relative w-full h-full overflow-hidden">
      <div class="relative w-full h-full flex items-center justify-center">
        <img
          :src="imageUrl"
          class="max-w-full max-h-full object-contain"
          @load="handleImageLoad"
          ref="imageRef"
        />
        
        <!-- 裁剪框 -->
        <div
          v-if="isImageLoaded"
          class="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move z-20"
          :style="cropBoxStyle"
          @mousedown="startDrag"
        >
          <!-- 网格线 -->
          <div class="absolute inset-0 grid grid-cols-3 grid-rows-3">
            <div v-for="i in 4" :key="`v${i}`" class="absolute top-0 bottom-0 border-l border-white border-opacity-50" :style="{ left: `${(i-1) * 33.33}%` }"></div>
            <div v-for="i in 4" :key="`h${i}`" class="absolute left-0 right-0 border-t border-white border-opacity-50" :style="{ top: `${(i-1) * 33.33}%` }"></div>
          </div>

          <!-- 裁剪框控制点 -->
          <div
            v-for="(handle, index) in handles"
            :key="index"
            class="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full z-30"
            :style="getHandleStyle(handle)"
            @mousedown.stop="startResize(handle)"
          ></div>
        </div>

        <!-- 遮罩层 -->
        <div
          v-if="isImageLoaded"
          class="absolute inset-0 bg-black bg-opacity-50 z-10"
          :style="{
            clipPath: `polygon(
              0 0,
              100% 0,
              100% 100%,
              0 100%,
              0 0,
              ${cropBox.x}px ${cropBox.y}px,
              ${cropBox.x + cropBox.width}px ${cropBox.y}px,
              ${cropBox.x + cropBox.width}px ${cropBox.y + cropBox.height}px,
              ${cropBox.x}px ${cropBox.y + cropBox.height}px,
              ${cropBox.x}px ${cropBox.y}px
            )`
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  imageUrl: {
    type: String,
    required: true
  },
  aspectRatio: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['crop'])

// 状态变量
const imageRef = ref(null)
const isImageLoaded = ref(false)
const imageSize = ref({ width: 0, height: 0 })
const cropBox = ref({
  x: 0,
  y: 0,
  width: 0,
  height: 0
})
const isDragging = ref(false)
const isResizing = ref(false)
const activeHandle = ref(null)
const dragStart = ref({ x: 0, y: 0 })
const imageScale = ref(1)
const imagePosition = ref({ x: 0, y: 0 })

// 控制点位置
const handles = [
  { position: 'top-left', cursor: 'nw-resize' },
  { position: 'top-right', cursor: 'ne-resize' },
  { position: 'bottom-left', cursor: 'sw-resize' },
  { position: 'bottom-right', cursor: 'se-resize' }
]

// 计算样式
const cropBoxStyle = computed(() => ({
  left: `${imagePosition.value.x + cropBox.value.x * imageScale.value}px`,
  top: `${imagePosition.value.y + cropBox.value.y * imageScale.value}px`,
  width: `${cropBox.value.width * imageScale.value}px`,
  height: `${cropBox.value.height * imageScale.value}px`
}))

// 处理图片加载
const handleImageLoad = () => {
  isImageLoaded.value = true
  imageSize.value = {
    width: imageRef.value.naturalWidth,
    height: imageRef.value.naturalHeight
  }
  calculateImageScale()
  initCropBox()
}

// 计算图片缩放比例和位置
const calculateImageScale = () => {
  if (!imageRef.value) return
  
  const container = imageRef.value.parentElement
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  
  const scaleX = containerWidth / imageSize.value.width
  const scaleY = containerHeight / imageSize.value.height
  
  imageScale.value = Math.min(scaleX, scaleY)
  
  // 计算图片在容器中的位置
  const scaledWidth = imageSize.value.width * imageScale.value
  const scaledHeight = imageSize.value.height * imageScale.value
  
  imagePosition.value = {
    x: (containerWidth - scaledWidth) / 2,
    y: (containerHeight - scaledHeight) / 2
  }
}

// 初始化裁剪框
const initCropBox = () => {
  const { width, height } = imageSize.value
  const size = Math.min(width, height) * 0.8
  
  cropBox.value = {
    x: (width - size) / 2,
    y: (height - size) / 2,
    width: size,
    height: props.aspectRatio ? size / props.aspectRatio : size
  }
  
  emitCropData()
}

// 获取控制点样式
const getHandleStyle = (handle) => {
  const positions = {
    'top-left': { left: '-8px', top: '-8px' },
    'top-right': { right: '-8px', top: '-8px' },
    'bottom-left': { left: '-8px', bottom: '-8px' },
    'bottom-right': { right: '-8px', bottom: '-8px' }
  }
  
  return {
    ...positions[handle.position],
    cursor: handle.cursor
  }
}

// 开始拖拽
const startDrag = (e) => {
  e.preventDefault()
  isDragging.value = true
  dragStart.value = {
    x: e.clientX,
    y: e.clientY
  }
  
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
}

// 开始调整大小
const startResize = (handle) => {
  isResizing.value = true
  activeHandle.value = handle
  dragStart.value = {
    x: event.clientX,
    y: event.clientY
  }
  
  document.addEventListener('mousemove', handleResizeBox)
  document.addEventListener('mouseup', stopResize)
}

// 处理拖拽
const handleDrag = (e) => {
  if (!isDragging.value) return
  
  const deltaX = (e.clientX - dragStart.value.x) / imageScale.value
  const deltaY = (e.clientY - dragStart.value.y) / imageScale.value
  
  cropBox.value.x = Math.max(0, Math.min(imageSize.value.width - cropBox.value.width, cropBox.value.x + deltaX))
  cropBox.value.y = Math.max(0, Math.min(imageSize.value.height - cropBox.value.height, cropBox.value.y + deltaY))
  
  dragStart.value = { x: e.clientX, y: e.clientY }
  emitCropData()
}

// 处理调整大小
const handleResizeBox = (e) => {
  if (!isResizing.value || !activeHandle.value) return
  
  const deltaX = (e.clientX - dragStart.value.x) / imageScale.value
  const deltaY = (e.clientY - dragStart.value.y) / imageScale.value
  
  const { position } = activeHandle.value
  const newBox = { ...cropBox.value }
  
  if (position.includes('right')) {
    newBox.width = Math.max(50, Math.min(imageSize.value.width - newBox.x, newBox.width + deltaX))
  }
  if (position.includes('bottom')) {
    newBox.height = Math.max(50, Math.min(imageSize.value.height - newBox.y, newBox.height + deltaY))
  }
  if (position.includes('left')) {
    const newX = Math.max(0, Math.min(newBox.x + newBox.width - 50, newBox.x + deltaX))
    newBox.width = newBox.width - (newX - newBox.x)
    newBox.x = newX
  }
  if (position.includes('top')) {
    const newY = Math.max(0, Math.min(newBox.y + newBox.height - 50, newBox.y + deltaY))
    newBox.height = newBox.height - (newY - newBox.y)
    newBox.y = newY
  }
  
  if (props.aspectRatio) {
    if (position.includes('right') || position.includes('left')) {
      newBox.height = newBox.width / props.aspectRatio
    } else {
      newBox.width = newBox.height * props.aspectRatio
    }
  }
  
  cropBox.value = newBox
  dragStart.value = { x: e.clientX, y: e.clientY }
  emitCropData()
}

// 停止拖拽
const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 停止调整大小
const stopResize = () => {
  isResizing.value = false
  activeHandle.value = null
  document.removeEventListener('mousemove', handleResizeBox)
  document.removeEventListener('mouseup', stopResize)
}

// 发送裁剪数据
const emitCropData = () => {
  emit('crop', {
    x: cropBox.value.x,
    y: cropBox.value.y,
    width: cropBox.value.width,
    height: cropBox.value.height
  })
}

// 生命周期钩子
onMounted(() => {
  window.addEventListener('resize', calculateImageScale)
})

onUnmounted(() => {
  stopDrag()
  stopResize()
  window.removeEventListener('resize', calculateImageScale)
})

// 监听宽高比变化
watch(() => props.aspectRatio, (newRatio) => {
  if (newRatio && cropBox.value) {
    const currentWidth = cropBox.value.width
    cropBox.value.height = currentWidth / newRatio
    emitCropData()
  }
})
</script>

<style scoped>
.crop-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 50%;
}
</style> 