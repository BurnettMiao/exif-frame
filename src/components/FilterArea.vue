<script setup lang="ts">
import { ref, watch } from 'vue'
import { useFilterStore } from '@/stores/filter'
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
  { name: '鮮明', details: 'contrast(1.4) saturate(1.3) sharpness(1)' }, // sharpness 在 canvas 支援有限
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
    class="min-w-45 2xl:min-w-60 bg-white px-4 py-6 border-l border-l-gray-200 flex flex-col h-full overflow-hidden"
  >
    <div class="flex-1 overflow-y-scroll flex flex-col gap-y-4">
      <div
        @click="selectedFilter(index)"
        v-for="(filter, index) in filterDetails"
        :key="filter.name"
        class="cursor-pointer group"
      >
        <div class="border border-gray-100 rounded-lg overflow-hidden w-full aspect-4/3 shadow-sm">
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
      </div>
    </div>

    <!-- 濾鏡按鈕範例 -->
    <div class="w-full pt-4">
      <button class="w-full px-4 py-2 text-sm rounded-lg bg-gray-800 text-white cursor-pointer">
        下載
      </button>
    </div>
  </div>
</template>
