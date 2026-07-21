<script setup lang="ts">
import { ref } from 'vue'
import { useLayoutStore } from '@/stores/layout'
import defaultPic from '@/assets/DSC00255.jpg'

const layoutStore = useLayoutStore()

const selectedLayout = (index: number) => {
  layoutStore.selectedLayout(index)
}
</script>

<template>
  <div
    class="min-w-45 2xl:min-w-60 bg-white px-4 py-6 border-r border-r-gray-200 flex flex-col h-full overflow-hidden"
  >
    <div class="flex-1 overflow-y-scroll flex flex-col gap-y-4">
      <div
        @click="selectedLayout(index)"
        v-for="(layout, index) in layoutStore.layouts"
        :key="layout.name"
        class="cursor-pointer group"
      >
        <div class="border border-gray-100 rounded-lg overflow-hidden w-full aspect-4/3 shadow-sm">
          <img
            :src="defaultPic"
            class="w-full max-w-52.5 h-full object-center object-cover"
            alt=""
          />
        </div>
        <div
          class="mt-1 text-center group-hover:text-amber-600"
          :class="{ 'text-amber-600': layoutStore.currentIndex === index }"
        >
          {{ layout.name }}
        </div>
      </div>
    </div>
  </div>
</template>
