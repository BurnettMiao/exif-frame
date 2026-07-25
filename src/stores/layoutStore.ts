import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FrameLayout } from '@/types/layout'

// layout 管理狀態
export const useLayoutStore = defineStore('layout', () => {
  const layouts = ref<FrameLayout[]>([
    {
      name: 'logo左 info右',
      padding: { top: 120, right: 120, bottom: 120, left: 120 },
      gap: 50,
      infoPosition: 'right',
      logoPosition: 'left',
      logoScale: 0.18,
    },
    {
      name: 'logo右 info左',
      padding: { top: 120, right: 120, bottom: 120, left: 120 },
      gap: 40,
      infoPosition: 'left',
      logoPosition: 'right',
      logoScale: 0.18,
    },
    {
      name: 'logo中 info中',
      padding: { top: 120, right: 120, bottom: 120, left: 120 },
      gap: 40,
      infoPosition: 'center-right',
      logoPosition: 'center-left',
      logoScale: 0.18,
    },
    {
      name: 'logo上 info下',
      padding: { top: 120, right: 120, bottom: 120, left: 120 },
      gap: 30,
      infoPosition: 'center-bottom',
      logoPosition: 'center-top',
      logoScale: 0.18,
    },
  ])

  const currentIndex = ref(0)
  const currentLayout = computed(() => layouts.value[currentIndex.value]) ?? layouts.value[0]

  function selectedLayout(index: number) {
    currentIndex.value = index
  }

  return { layouts, currentIndex, currentLayout, selectedLayout }
})
