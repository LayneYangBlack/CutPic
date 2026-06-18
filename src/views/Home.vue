<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold text-center mb-12">选择一个工具</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

      <!-- 徽章排版工具 -->
      <router-link to="/badge" class="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <svg class="w-16 h-16 mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h2 class="text-xl font-semibold">徽章排版</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">将圆形图片排列到A4纸上</p>
      </router-link>

      <!-- PDF合成工具 -->
      <router-link to="/pdf-composer" class="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <svg class="w-16 h-16 mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <h2 class="text-xl font-semibold">PDF 合成</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">将条码PDF合并到模板PDF中</p>
      </router-link>

      <!-- 一键抠图工具 -->
<!--      <router-link to="/remove-background" class="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">-->
<!--        <svg class="w-16 h-16 mb-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>-->
<!--        <h2 class="text-xl font-semibold">一键抠图</h2>-->
<!--        <p class="text-gray-500 dark:text-gray-400 mt-2">自动移除图片背景</p>-->
<!--      </router-link>-->

      <!-- 规格图生成工具 -->
      <router-link to="/spec-generator" class="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <svg class="w-16 h-16 mb-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6M9 17h6M9 9h3"></path></svg>
        <h2 class="text-xl font-semibold">规格图生成</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">批量生成带文字的规格图</p>
      </router-link>

      <!-- 规格统计工具 -->
      <router-link to="/spec-statistics" class="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <svg class="w-16 h-16 mb-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 14h.01M12 11h.01M9 11h.01M15 11h.01M12 8h.01M15 8h.01M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"></path></svg>
        <h2 class="text-xl font-semibold">规格数量统计</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">从Excel统计商品规格和数量</p>
      </router-link>

      <!-- PS批量套图工具 -->
      <router-link to="/ps-batch" class="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <svg class="w-16 h-16 mb-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        <h2 class="text-xl font-semibold">PS批量套图</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">批量生成电商图片变体</p>
      </router-link>

      <!-- 图片裁剪+水印擦除工具 -->
      <router-link to="/watermark-remover" class="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <svg class="w-16 h-16 mb-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        <h2 class="text-xl font-semibold">裁剪+去水印</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">批量裁剪图片并擦除水印</p>
      </router-link>

      <!-- HEIC 转 JPG 工具 -->
      <router-link to="/heic2jpg" class="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <svg class="w-16 h-16 mb-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        <h2 class="text-xl font-semibold">HEIC 转 JPG</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">批量将 iPhone HEIC 图片转为 JPG/PNG</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

// 调试：检查 window.electron 是否存在
onMounted(() => {
  console.log('=== Electron API 检测 ===');
  console.log('window.electron:', window.electron);
  console.log('isElectron:', window.electron?.platform?.isElectron);

  if (window.electron) {
    console.log('✅ Electron API 已成功加载！');
    console.log('可用的 API:', Object.keys(window.electron));
  } else {
    console.error('❌ Electron API 未加载！');
  }
});
</script>
