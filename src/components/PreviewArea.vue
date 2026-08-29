<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useFilterStore } from '@/stores/filterStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { usePhotoCollection } from '@/composables/usePhotoCollection'
import { renderFrame } from '@/utils/renderEngine'
import { loadBrandLogo } from '@/utils/brandLogos'
import ThumbnailStrip from '@/components/ThumbnailStrip.vue'

import pic from '@/assets/DSC00255.jpg'

const filterStore = useFilterStore()
const layoutStore = useLayoutStore()

const { previewItems, currentPreviewIndex, activeItem, addPhoto, selectPhoto, deletePhoto } =
  usePhotoCollection()

const canvas = ref<HTMLCanvasElement | null>(null)
const currentImage = ref<HTMLImageElement | null>(null)
const logoImage = ref<HTMLImageElement | null>(null)
const currentFilter = ref<string>('none')

// 統一的繪製入口：畫面上看到的，就是最終匯出的樣子
const render = () => {
  if (!canvas.value || !currentImage.value) return
  renderFrame({
    canvas: canvas.value,
    image: currentImage.value,
    layout: layoutStore.currentLayout,
    info: activeItem.value?.info ?? null,
    logo: logoImage.value,
    filter: currentFilter.value,
  })
}

// 目前照片變更時：載入圖片與對應廠牌 logo（token 防止快速切換時舊請求覆蓋新照片）
let loadToken = 0
watch(activeItem, (item) => {
  const token = ++loadToken

  if (!item) {
    currentImage.value = null
    logoImage.value = null
    return
  }

  loadBrandLogo(item.info.make ?? '').then((logo) => {
    if (token !== loadToken) return
    logoImage.value = logo
    render()
  })

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    if (token !== loadToken) return
    currentImage.value = img
    render()
  }
  img.src = item.url
})

// 圖片上傳
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  await addPhoto(file)

  // 清空 input，才能再次選同一張圖片
  target.value = ''
}

// 匯出：直接存畫面上的 canvas，不用再另外組合
const downloadImage = () => {
  if (!canvas.value) return
  const link = document.createElement('a')
  link.download = 'edited-photo.jpg'
  link.href = canvas.value.toDataURL('image/jpeg', 0.95)
  link.click()
}

// 預先載入測試圖片
onMounted(() => {
  addPhoto(pic)
})

watch(
  () => filterStore.currentFilter,
  (newFilter) => {
    currentFilter.value = newFilter
    render()
  },
  { immediate: true },
)

// 監聽 store 的 triggerDownload
watch(
  () => filterStore.triggerDownload,
  (newVal, oldVal) => {
    if (newVal !== oldVal && newVal > 0) {
      downloadImage()
    }
  },
  { immediate: true },
)

watch(
  () => layoutStore.currentIndex,
  () => {
    render()
  },
)
</script>

<template>
  <div class="w-full h-full p-5 bg-gray-100">
    <!-- 上傳區域 -->
    <input
      id="image-upload"
      @change="handleFileUpload"
      class="hidden"
      type="file"
      accept="image/*"
    />

    <!-- 無圖片時的上傳區 -->
    <div v-show="previewItems.length === 0" class="bg-white rounded-lg shadow p-4 w-full h-full">
      <label
        for="image-upload"
        class="w-full h-full border-2 border-dotted border-gray-500 rounded-lg flex items-center justify-center group cursor-pointer"
      >
        <div class="flex items-center justify-center gap-x-2">
          <i class="ri-image-upload-fill text-2xl group-hover:text-amber-400"></i>
          <span class="text-xl group-hover:text-amber-400">選擇檔案</span>
        </div>
      </label>
    </div>

    <!-- 有圖片時的預覽 -->
    <div v-show="previewItems.length > 0" class="w-full h-full relative">
      <!-- 縮圖列 -->
      <ThumbnailStrip
        :items="previewItems"
        :current-index="currentPreviewIndex"
        @select="selectPhoto"
        @delete="deletePhoto"
      />

      <!-- 大圖預覽 -->
      <div class="w-full h-full flex flex-col items-center justify-center">
        <div class="h-full max-h-full flex items-center justify-center">
          <canvas ref="canvas" class="max-w-full max-h-full bg-white shadow-lg rounded-lg"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>
