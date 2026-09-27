import { defineStore } from 'pinia'
import { ref } from 'vue'

// 管理濾鏡狀態
export const useFilterStore = defineStore('filter', () => {
  // 狀態
  const currentFilter = ref<string>('none')
  const currentPreviewUrl = ref<string>('')
  const grainAmount = ref<number>(0)

  // 用來觸發下載
  const triggerDownload = ref(0) // 每次+1就觸發一次下載

  // 動作
  const setFilter = (filterValue: string) => {
    currentFilter.value = filterValue
  }

  const setPreviewUrl = (url: string) => {
    currentPreviewUrl.value = url
  }

  const setGrainAmount = (amount: number) => {
    grainAmount.value = Math.min(100, Math.max(0, amount))
  }

  const resetFilter = () => {
    currentFilter.value = 'none'
    grainAmount.value = 0
  }

  const download = () => {
    triggerDownload.value += 1
  }

  return {
    currentFilter,
    currentPreviewUrl,
    grainAmount,
    setFilter,
    setPreviewUrl,
    setGrainAmount,
    resetFilter,
    triggerDownload,
    download,
  }
})
