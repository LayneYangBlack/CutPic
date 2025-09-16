<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold text-center mb-12">选择一个工具</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- 图片裁剪工具 -->
      <router-link to="/cutpic" class="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <svg class="w-16 h-16 mb-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7.629,18.629,18.629,7.629,16.371,5.371,5.371,16.371ZM5,16V19H8M19,8V5H16"></path></svg>
        <h2 class="text-xl font-semibold">图片裁剪</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">调整图片尺寸和比例</p>
      </router-link>

      <!-- 图片修复工具 -->
      <router-link to="/inpaint" class="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <svg class="w-16 h-16 mb-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3c-1.2 0-2.4.3-3.5.8-1.1.5-2.1 1.2-2.9 2.1-1.6 1.6-2.6 3.8-2.6 6.1 0 2.3 1 4.5 2.6 6.1 1.6 1.6 3.8 2.6 6.1 2.6s4.5-1 6.1-2.6c1.6-1.6 2.6-3.8 2.6-6.1 0-2.3-1-4.5-2.6-6.1C16.5 4.2 15.5 3.5 14.4 3L12 3zm0 0v.01M12 15l-2 2 4 4 2-2-4-4z"></path></svg>
        <h2 class="text-xl font-semibold">图片消除</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">移除图片中的多余物体</p>
      </router-link>

      <!-- 徽章排版工具 -->
      <router-link to="/badge" class="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <svg class="w-16 h-16 mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h2 class="text-xl font-semibold">徽章排版</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">将圆形图片排列到A4纸上</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
// 这是一个简单的导航页面，不需要脚本
</script>
