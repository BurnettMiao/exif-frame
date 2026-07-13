import { defineStore } from 'pinia'
import { ref } from 'vue'

// 管理濾鏡狀態
export const useFilterStore = defineStore('filter', () => {
  // 狀態
  const currentFilter = ref<string>('none')
  const currentPreviewUrl = ref<string>('')

  // 動作
  const setFilter = (filterValue: string) => {
    currentFilter.value = filterValue
  }

  const setPreviewUrl = (url: string) => {
    currentPreviewUrl.value = url
  }

  const resetFilter = () => {
    currentFilter.value = 'none'
  }

  return {
    currentFilter,
    currentPreviewUrl,
    setFilter,
    setPreviewUrl,
    resetFilter,
  }
})
