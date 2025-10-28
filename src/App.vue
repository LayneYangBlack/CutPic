<!--
 * @Author: Layne
 * @Date: 2025-07-31 11:43:04
 * @LastEditors: Layne
 * @LastEditTime: 2025-09-22 13:42:36
 * @Description:
 * @FilePath: /CutPic/src/App.vue
-->
<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
    <header class="p-4 bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
      <nav class="max-w-[1200px] mx-auto flex items-center justify-between">
        <router-link to="/" class="text-xl font-bold">像素工坊</router-link>
        <div class="flex gap-4">
          <router-link to="/cutpic" class="text-blue-500 hover:underline">图片裁剪</router-link>
          <router-link to="/inpaint" class="text-blue-500 hover:underline">图片消除</router-link>
          <router-link to="/spec-generator" class="text-blue-500 hover:underline">规格图生成</router-link>
          <router-link to="/spec-statistics" class="text-blue-500 hover:underline">规格统计</router-link>
        </div>
      </nav>
    </header>

    <main class="p-4 md:p-8">
      <div class="max-w-[1200px] mx-auto">
        <!-- 路由对应的组件将在这里渲染 -->
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
// App.vue 现在是一个简单的布局组件，不需要复杂的脚本
</script>

<style>
/* 全局样式可以保留或移至 style.css */
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
