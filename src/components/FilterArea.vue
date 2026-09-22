<script setup lang="ts">
import { ref } from 'vue'
import { useFilterStore } from '@/stores/filterStore'
import defaultBlur from '@/assets/default.jpg'

type FilterOption = {
  name: string
  details: string
}

const filterStore = useFilterStore()

const filterDetails = ref<FilterOption[]>([
  { name: '原圖', details: 'none' },

  // 常用色調
  { name: '鮮明', details: 'contrast(1.18) saturate(1.22)' },
  { name: '明亮', details: 'brightness(1.1) contrast(1.06) saturate(1.05)' },
  { name: '柔和', details: 'brightness(1.04) contrast(0.94) saturate(0.9)' },
  { name: '暖色', details: 'sepia(0.16) saturate(1.08) brightness(1.03)' },
  { name: '冷色', details: 'hue-rotate(350deg) saturate(0.92) contrast(1.04) brightness(1.02)' },

  // 風格化
  { name: '電影感', details: 'contrast(1.22) saturate(0.82) brightness(0.96)' },
  { name: '底片', details: 'sepia(0.22) contrast(1.08) saturate(0.92) brightness(1.03)' },
  { name: '復古', details: 'sepia(0.38) contrast(0.96) saturate(0.86)' },
  { name: '淡雅', details: 'brightness(1.08) contrast(0.9) saturate(0.78)' },
  { name: '暗調', details: 'brightness(0.9) contrast(1.18) saturate(0.92)' },

  // 黑白
  { name: '黑白', details: 'grayscale(1)' },
  { name: '高反差黑白', details: 'grayscale(1) contrast(1.45)' },
])

const selectedFilter = (index: number) => {
  // 使用 pinia
  const filter = filterDetails.value[index]
  if (filter) {
    filterStore.setFilter(filter.details)
  }
}
</script>

<template>
  <div
    class="flex h-full w-full min-w-45 flex-col overflow-hidden border-r border-r-gray-200 bg-white px-4 py-6 2xl:max-w-60 max-lg:h-auto max-lg:max-h-[190px] max-lg:min-w-0 max-lg:max-w-none max-lg:border-r-0 max-lg:px-3.5 max-lg:py-3"
  >
    <div
      class="flex flex-1 flex-col gap-y-4 overflow-y-scroll max-lg:flex-row max-lg:gap-3 max-lg:overflow-x-auto max-lg:overflow-y-hidden max-lg:pb-1.5"
    >
      <button
        v-for="(filter, index) in filterDetails"
        :key="filter.name"
        type="button"
        class="group cursor-pointer border-0 bg-transparent p-0 text-left [touch-action:manipulation] max-lg:w-28 max-lg:flex-[0_0_7rem]"
        @click="selectedFilter(index)"
      >
        <div
          class="aspect-4/3 w-full overflow-hidden rounded-lg border border-gray-100 shadow-sm max-lg:h-[84px]"
        >
          <img
            :src="defaultBlur"
            :style="{ filter: filter.details }"
            class="w-full max-w-52.5 h-full object-center object-cover"
            alt=""
          />
        </div>
        <div
          class="mt-1 text-center group-hover:text-amber-600"
          :class="{ 'text-amber-600': filter.details === filterStore.currentFilter }"
        >
          {{ filter.name }}
        </div>
      </button>
    </div>
  </div>
</template>
