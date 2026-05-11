<template>
  <div>
    <div class="p-4 md:p-8 bg-white shadow-sm rounded-lg mb-6 max-w-max mx-auto">
      <div class="flex space-x-1 rounded-lg bg-gray-200 p-1">
        <button
          @click="mode = 'single'"
          :class="['w-full rounded-md py-2.5 text-sm font-medium leading-5',
            mode === 'single' ? 'bg-white shadow' : 'text-gray-700 hover:bg-white/[0.5]'
          ]"
        >
          单图案排版
        </button>
        <button
          @click="mode = 'multi'"
          :class="['w-full rounded-md py-2.5 text-sm font-medium leading-5',
            mode === 'multi' ? 'bg-white shadow' : 'text-gray-700 hover:bg-white/[0.5]'
          ]"
        >
          多图案排版
        </button>
        <button
          @click="mode = 'cdr'"
          :class="['w-full rounded-md py-2.5 text-sm font-medium leading-5',
            mode === 'cdr' ? 'bg-white shadow' : 'text-gray-700 hover:bg-white/[0.5]'
          ]"
        >
          CDR排版
        </button>
        <button
          @click="mode = 'json'"
          :class="['w-full rounded-md py-2.5 text-sm font-medium leading-5',
            mode === 'json' ? 'bg-white shadow' : 'text-gray-700 hover:bg-white/[0.5]'
          ]"
        >
          JSON自动排版
        </button>
        <button
          @click="mode = 'acrylic'"
          :class="['w-full rounded-md py-2.5 text-sm font-medium leading-5',
            mode === 'acrylic' ? 'bg-white shadow' : 'text-gray-700 hover:bg-white/[0.5]'
          ]"
        >
          亚克力排版
        </button>
      </div>
    </div>

    <div>
      <SingleBadgeLayout v-if="mode === 'single'" />
      <MultiBadgeLayout v-if="mode === 'multi'" />
      <CdrBadgeLayout v-if="mode === 'cdr'" />
      <JsonBadgeLayout v-if="mode === 'json'" />
      <AcrylicBadgeLayout v-if="mode === 'acrylic'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SingleBadgeLayout from '../components/SingleBadgeLayout.vue';
import MultiBadgeLayout from '../components/MultiBadgeLayout.vue';
import CdrBadgeLayout from '../components/CdrBadgeLayout.vue';
import JsonBadgeLayout from '../components/JsonBadgeLayout.vue';
import AcrylicBadgeLayout from '../components/AcrylicBadgeLayout.vue';

const mode = ref('single'); // 'single', 'multi', 'cdr', 'json', or 'acrylic'
</script>

<style scoped>
button {
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  padding-left: 2rem;
  padding-right: 2rem;
}
</style>