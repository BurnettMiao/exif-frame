import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { FrameLayout } from '@/types/layout'

export type LayoutPlacement = {
  name: string
  infoPosition: FrameLayout['infoPosition']
  logoPosition: FrameLayout['logoPosition']
}

export const layoutPlacements: LayoutPlacement[] = [
  { name: '左 Logo', infoPosition: 'right', logoPosition: 'left' },
  { name: '右 Logo', infoPosition: 'left', logoPosition: 'right' },
  { name: '置中橫排', infoPosition: 'center-right', logoPosition: 'center-left' },
  { name: '置中上下', infoPosition: 'center-bottom', logoPosition: 'center-top' },
]

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
  const layouts = ref<FrameLayout[]>(
    layoutPlacements.map((placement) =>
      createLayout({
        name: placement.name,
        padding: { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 },
        gapRatio: 0.05,
        infoPosition: placement.infoPosition,
        logoPosition: placement.logoPosition,
        logoScale: 0.18,
      }),
    ),
  )

  const currentIndex = ref(0)
  const currentLayout = ref<FrameLayout>(cloneLayout(layouts.value[0]!))
  const currentPlacementIndex = computed(() => {
    const index = layoutPlacements.findIndex(
      (placement) =>
        placement.infoPosition === currentLayout.value.infoPosition &&
        placement.logoPosition === currentLayout.value.logoPosition,
    )

    return index === -1 ? currentIndex.value : index
  })

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
    const placementIndex = layoutPlacements.findIndex(
      (placement) =>
        placement.infoPosition === infoPosition && placement.logoPosition === logoPosition,
    )
    if (placementIndex !== -1) {
      currentIndex.value = placementIndex
    }

    updateLayout({ infoPosition, logoPosition })
  }

  return {
    layouts,
    layoutPlacements,
    currentIndex,
    currentPlacementIndex,
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
