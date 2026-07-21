import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FrameLayout } from '@/types/layout'

// layout 管理狀態
export const useLayoutStore = defineStore('layout', () => {
  const layouts = ref<FrameLayout[]>([
    {
      name: '經典',
      padding: { top: 120, right: 120, bottom: 120, left: 120 },
      gap: 50,
      infoPosition: 'right',
      logoPosition: 'left',
      logoScale: 0.15,
    },
    {
      name: '特殊規格一',
      padding: { top: 80, right: 80, bottom: 200, left: 80 },
      gap: 30,
      infoPosition: 'bottom-center',
      logoPosition: 'center',
      logoScale: 0.18,
    },
    {
      name: '特殊規格二',
      padding: { top: 150, right: 150, bottom: 60, left: 150 },
      gap: 40,
      infoPosition: 'left',
      logoPosition: 'right',
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
