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

  // 色彩調整
  { name: '鮮豔', details: 'contrast(1.3) saturate(1.45)' },
  { name: '柔和', details: 'contrast(0.95) saturate(0.85)' },
  { name: '明亮', details: 'brightness(1.15) contrast(1.1)' },
  { name: '暗調', details: 'brightness(0.85) contrast(1.2)' },

  // 復古風
  { name: '復古', details: 'sepia(0.7) contrast(0.95)' },
  { name: '老照片', details: 'sepia(0.85) contrast(1.05) brightness(0.95)' },
  { name: '冷調', details: 'hue-rotate(200deg) saturate(1.2) contrast(1.05)' },
  { name: '暖調', details: 'hue-rotate(20deg) saturate(1.25) contrast(1.1)' },

  // 黑白與特殊效果
  { name: '黑白', details: 'grayscale(1)' },
  { name: '高反差黑白', details: 'grayscale(1) contrast(1.6)' },
  { name: '夢幻', details: 'contrast(1.1) saturate(1.6) brightness(1.1)' },
  { name: '電影感', details: 'contrast(1.25) saturate(0.85) brightness(0.95)' },

  // 進階效果
  { name: '清新', details: 'saturate(1.35) brightness(1.08)' },
  { name: '復古電影', details: 'sepia(0.4) contrast(1.15) saturate(0.9)' },
  { name: '鮮明', details: 'contrast(1.4) saturate(1.3)' },
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
            :src="filterStore.currentPreviewUrl || defaultBlur"
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
