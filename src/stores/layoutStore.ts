import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FrameLayout } from '@/types/layout'

const cloneLayout = (layout: FrameLayout): FrameLayout => ({
  ...layout,
  padding: { ...layout.padding },
})

const createLayout = (
  layout: Omit<
    FrameLayout,
    'fontScale' | 'backgroundColor' | 'primaryTextColor' | 'secondaryTextColor'
  >,
): FrameLayout => ({
  ...layout,
  fontScale: 1,
  backgroundColor: '#ffffff',
  primaryTextColor: '#4b5563',
  secondaryTextColor: '#c0c0c0',
})

// layout 管理狀態
export const useLayoutStore = defineStore('layout', () => {
  const layouts = ref<FrameLayout[]>([
    createLayout({
      name: 'logo左 info右',
      padding: { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 },
      gapRatio: 0.05,
      infoPosition: 'right',
      logoPosition: 'left',
      logoScale: 0.18,
    }),
    createLayout({
      name: 'logo右 info左',
      padding: { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 },
      gapRatio: 0.05,
      infoPosition: 'left',
      logoPosition: 'right',
      logoScale: 0.18,
    }),
    createLayout({
      name: 'logo中 info中',
      padding: { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 },
      gapRatio: 0.05,
      infoPosition: 'center-right',
      logoPosition: 'center-left',
      logoScale: 0.18,
    }),
    createLayout({
      name: 'logo上 info下',
      padding: { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 },
      gapRatio: 0.05,
      infoPosition: 'center-bottom',
      logoPosition: 'center-top',
      logoScale: 0.18,
    }),
  ])

  const currentIndex = ref(0)
  const currentLayout = ref<FrameLayout>(cloneLayout(layouts.value[0]!))

  function selectedLayout(index: number) {
    const selectedPreset = layouts.value[index]
    if (!selectedPreset) return

    currentIndex.value = index
    currentLayout.value = cloneLayout(selectedPreset)
  }

  function updateLayout(patch: Partial<Omit<FrameLayout, 'padding'>>) {
    currentLayout.value = {
      ...currentLayout.value,
      ...patch,
      padding: { ...currentLayout.value.padding },
    }
  }

  function updatePadding(value: number) {
    currentLayout.value = {
      ...currentLayout.value,
      padding: {
        top: value,
        right: value,
        bottom: value,
        left: value,
      },
    }
  }

  function updateGapRatio(value: number) {
    updateLayout({ gapRatio: value })
  }

  function updateLogoScale(value: number) {
    updateLayout({ logoScale: value })
  }

  function updateFontScale(value: number) {
    updateLayout({ fontScale: value })
  }

  function updateBackgroundColor(value: string) {
    updateLayout({ backgroundColor: value })
  }

  function updatePrimaryTextColor(value: string) {
    updateLayout({ primaryTextColor: value })
  }

  function updateSecondaryTextColor(value: string) {
    updateLayout({ secondaryTextColor: value })
  }

  function updatePlacement(
    infoPosition: FrameLayout['infoPosition'],
    logoPosition: FrameLayout['logoPosition'],
  ) {
    updateLayout({ infoPosition, logoPosition })
  }

  return {
    layouts,
    currentIndex,
    currentLayout,
    selectedLayout,
    updatePadding,
    updateGapRatio,
    updateLogoScale,
    updateFontScale,
    updateBackgroundColor,
    updatePrimaryTextColor,
    updateSecondaryTextColor,
    updatePlacement,
  }
})
