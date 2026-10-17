<template>
  <div class="badge-page">
    <div class="badge-mode-panel p-3 sm:p-4 md:p-6 bg-white shadow-sm rounded-lg mb-4 sm:mb-6 w-full max-w-3xl mx-auto">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-lg bg-gray-200 p-1">
        <button
          type="button"
          @click="mode = 'single'"
          :class="['w-full rounded-md py-2.5 text-sm font-medium leading-5',
            mode === 'single' ? 'bg-white shadow' : 'text-gray-700 hover:bg-white/[0.5]'
          ]"
        >
          单图案排版
        </button>
        <button
          type="button"
          @click="mode = 'multi'"
          :class="['w-full rounded-md py-2.5 text-sm font-medium leading-5',
            mode === 'multi' ? 'bg-white shadow' : 'text-gray-700 hover:bg-white/[0.5]'
          ]"
        >
          多图案排版
        </button>
        <button
          type="button"
          @click="mode = 'cdr'"
          :class="['w-full rounded-md py-2.5 text-sm font-medium leading-5',
            mode === 'cdr' ? 'bg-white shadow' : 'text-gray-700 hover:bg-white/[0.5]'
          ]"
        >
          CDR排版
        </button>
        <button
          type="button"
          @click="mode = 'json'"
          :class="['w-full rounded-md py-2.5 text-sm font-medium leading-5',
            mode === 'json' ? 'bg-white shadow' : 'text-gray-700 hover:bg-white/[0.5]'
          ]"
        >
          JSON自动排版
        </button>
      </div>
    </div>

    <div>
      <SingleBadgeLayout v-if="mode === 'single'" />
      <MultiBadgeLayout v-if="mode === 'multi'" />
      <CdrBadgeLayout v-if="mode === 'cdr'" />
      <JsonBadgeLayout v-if="mode === 'json'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SingleBadgeLayout from '../components/SingleBadgeLayout.vue';
import MultiBadgeLayout from '../components/MultiBadgeLayout.vue';
import CdrBadgeLayout from '../components/CdrBadgeLayout.vue';
import JsonBadgeLayout from '../components/JsonBadgeLayout.vue';

const mode = ref('single'); // 'single', 'multi', 'cdr', or 'json'
</script>

<style scoped>
button {
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  min-height: 44px;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

@media (min-width: 640px) {
  button {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
