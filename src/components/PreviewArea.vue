<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import ExifReader from 'exifreader'
import type { PhotoInfo } from '@/types/previewArea'
import { useFilterStore } from '@/stores/filter'

const filterStore = useFilterStore()

import pic from '@/assets/DSC00255.jpg'
import sony from '@/assets/logos/Sony_logo.svg'

const currentPhotoInfo = ref<PhotoInfo | null>(null)
const previewItems = ref<{ url: string; info: PhotoInfo }[]>([]) // 改為物件陣列
const currentPreviewIndex = ref<number>(0)

const canvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const currentImage = ref<HTMLImageElement | null>(null)
const currentFilter = ref<string>('none')
const logoImage = ref<HTMLImageElement | null>(null)

// 上下左右白邊
const padding = {
  top: 120,
  right: 120,
  bottom: 120,
  left: 120,
}

// 文字之前間距
const gap = 50

// 圖片上傳
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 直接呼叫通用的圖片處理函式
  await processImage(file)

  // 清空 input，才能再次選同一張圖片
  target.value = ''
}

// 將圖片匯入Canvas
const loadImageToCanvas = (url: string) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = async () => {
    currentImage.value = img
    // 多等一次，確保 canvas ref 可用
    await nextTick()
    renderCanvas()
  }
  img.src = url
}

// 統一的繪製函式：畫面上看到的，就是最終匯出的樣子
const renderCanvas = () => {
  if (!canvas.value || !currentImage.value) {
    console.warn('renderCanvas: canvas 或 image 尚未準備好')
    return
  }
  if (!ctx.value) ctx.value = canvas.value.getContext('2d')
  if (!ctx.value) return

  // ===== Cavas 照片＋info高度 =====
  const img = currentImage.value
  // 如果希望無論橫向直向都一致，可以用「較短的那一邊」
  const baseSize = Math.min(img.width, img.height)
  // 1. 字體大小 = 圖片寬度的 3%（隨圖片尺寸變化）
  const infoLineHeight = Math.round(baseSize * 0.03)
  // 2. 間距 = 圖片寬度的 4%（隨圖片尺寸變化）
  const infoPadding = Math.round(baseSize * 0.04)
  // 3. 資訊區總高度 = 3 行文字 + 2 個間距（如果有的話）
  const hasInfo = !!currentPhotoInfo.value && !currentPhotoInfo.value.error
  // 4. Canvas 總高度 = 圖片 + 上下邊距 + 資訊區
  const infoHeight = hasInfo ? infoLineHeight * 3 + infoPadding * 2 : 0

  canvas.value.width = img.width + padding.left + padding.right
  canvas.value.height = img.height + padding.top + padding.bottom + infoHeight

  // 底色（避免 jpg 匯出時資訊區變黑）
  ctx.value.fillStyle = '#ffffff'
  ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)

  // 畫照片（套用濾鏡）
  ctx.value.save()
  ctx.value.filter = currentFilter.value
  ctx.value.drawImage(img, padding.left, padding.top, img.width, img.height)
  ctx.value.restore()

  // 畫 EXIF 資訊（不受濾鏡影響）
  if (hasInfo) {
    const info = currentPhotoInfo.value!

    ctx.value.fillStyle = '#4b5563'
    ctx.value.font = `${infoLineHeight}px monospace`
    ctx.value.textBaseline = 'top'
    ctx.value.textAlign = 'right'

    const x = padding.left + img.width
    let y = img.height + infoPadding + padding.top
    // console.log(img.height, infoPadding, padding.top, infoLineHeight)
    // ctx.value.fillText(`${info.date}`, x, y)
    y += infoLineHeight / 2
    ctx.value.font = `${infoLineHeight * 1.25}px monospace`
    ctx.value.fillText(`Shot on ${info.model}`, x, y)
    y += infoLineHeight * 0.8 + gap
    ctx.value.font = `${infoLineHeight}px monospace`
    ctx.value.fillStyle = '#C0C0C0'
    ctx.value.fillText(`${info.aperture} | ${info.exposure}s | ISO ${info.iso}`, x, y)
  }

  // 畫 Logo (不受濾鏡影響)
  if (logoImage.value) {
    const logoWidth = img.width * 0.15 // 設定 Logo 為圖片寬度的 15%
    const logoHeight = (logoImage.value.height / logoImage.value.width) * logoWidth
    const x = padding.left
    const y = padding.top + img.height + infoHeight / 2 + infoPadding / 2 - logoHeight / 2
    ctx.value.drawImage(logoImage.value, x, y, logoWidth, logoHeight)
  }
}

// 選擇圖片預覽的功能
const selectedPreview = (index: number) => {
  currentPreviewIndex.value = index
  const item = previewItems.value[index]
  if (!item) return
  loadImageToCanvas(item.url)
  filterStore.setPreviewUrl(item.url)

  // 重要：切換時更新 photoInfo
  currentPhotoInfo.value = item.info
  renderCanvas()
}

// 刪除圖片功能
const deleteImg = (index: number) => {
  // 呼叫 URL.revokeObjectURL() 釋放它，避免不必要的記憶體占用。
  const deletedItem = previewItems.value[index]
  if (deletedItem?.url) {
    URL.revokeObjectURL(deletedItem.url)
  }

  previewItems.value.splice(index, 1)

  if (previewItems.value.length === 0) {
    currentImage.value = null
    currentPhotoInfo.value = null
    filterStore.currentPreviewUrl = ''
  } else {
    const newIndex = Math.min(index, previewItems.value.length - 1)
    currentPreviewIndex.value = newIndex
    const item = previewItems.value[newIndex]

    if (item) {
      loadImageToCanvas(item.url)
      filterStore.setPreviewUrl(item.url)
      currentPhotoInfo.value = item.info
      renderCanvas()
    }
  }
}

// 讀取圖片資訊
const processImage = async (source: File | string) => {
  let file: File

  if (typeof source === 'string') {
    // 如果是網址（例如預載入的 pic），先 fetch 轉成 blob 再轉成 File
    const response = await fetch(source)
    const blob = await response.blob()
    // 為了讓 ExifReader 能讀取，我們給它一個檔名
    file = new File([blob], 'preload-img.jpg', { type: blob.type })
  } else {
    // 如果原本就是 File 物件（使用者上傳的）
    file = source
  }

  // --- 以下是原本 handleFileUpload 的核心邏輯 ---
  const newPreviewUrl = URL.createObjectURL(file)
  let photoInfoData: PhotoInfo | null = null

  try {
    const tags = await ExifReader.load(file)
    console.log('上傳圖片資訊', tags)
    photoInfoData = {
      date: tags['DateTimeOriginal']?.description.split(' ')[0]?.replaceAll(':', '-') || '未知日期',
      model: tags['Model']?.description || '未知相機',
      exposure: tags['ExposureTime']?.description || '未知快門',
      aperture: tags['FNumber']?.description || '未知光圈',
      iso: tags['ISOSpeedRatings']?.description || '未知ISO',
    }
  } catch (error) {
    console.error('Exif 讀取失敗', error)
    photoInfoData = { error: '無法讀取此照片的 EXIF 資訊' }
  }

  // 加入預覽清單
  previewItems.value.push({
    url: newPreviewUrl,
    info: photoInfoData,
  })

  currentPreviewIndex.value = previewItems.value.length - 1
  // 新增這行：同步到 store
  filterStore.setPreviewUrl(newPreviewUrl)

  await nextTick() // 等 v-if 切換，canvas 出現
  await nextTick() // 再等一次，讓 ref 真正綁定完成
  // 設定當前顯示的資訊（重要！）
  currentPhotoInfo.value = photoInfoData

  // 載入圖片 → onload 會自動 renderCanvas()
  loadImageToCanvas(newPreviewUrl)
}

// 匯出：直接存畫面上的 canvas，不用再另外組合
const downloadImage = () => {
  if (!canvas.value) return
  const link = document.createElement('a')
  link.download = 'edited-photo.jpg'
  link.href = canvas.value.toDataURL('image/jpeg', 0.95)
  link.click()
}

// 預先載入logo 與 測試圖片
onMounted(() => {
  const logo = new Image()
  logo.crossOrigin = 'anonymous'
  logo.src = sony
  logo.onload = () => {
    logoImage.value = logo
  }

  processImage(pic)
})

watch(
  () => filterStore.currentFilter,
  (newFilter) => {
    currentFilter.value = newFilter
    renderCanvas()
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
</script>

<template>
  <div class="w-full h-full p-5 bg-gray-100">
    <!-- 上傳區域保持不變 -->
    <input
      id="image-upload"
      @change="handleFileUpload"
      class="hidden"
      type="file"
      accept="image/*"
    />

    <!-- 無圖片時的上傳區（不變） -->
    <div v-show="previewItems.length === 0" class="bg-white rounded-lg shadow p-4 w-full h-full">
      <!-- 自訂樣式的 label -->
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
      <div
        class="bg-white p-2 shadow-sm rounded-sm flex items-center justify-center gap-x-3 absolute -top-3 left-1/2 -translate-x-1/2"
      >
        <div
          @click="selectedPreview(index)"
          v-for="(item, index) in previewItems"
          :key="item.url"
          class="w-12 h-12 border-2 bg-white cursor-pointer group relative"
          :class="{
            'border-black': index === currentPreviewIndex,
            'border-white': index !== currentPreviewIndex,
          }"
        >
          <img :src="item.url" alt="" class="w-full h-full object-cover" />

          <!-- 非選中的圖片遮罩 -->
          <div
            v-if="index !== currentPreviewIndex"
            class="absolute inset-0 bg-gray-100 opacity-50"
          ></div>

          <!-- 圖片刪除 -->
          <div
            @click="deleteImg(index)"
            class="absolute -top-2 right-0 w-5 h-5 flex items-center justify-center bg-white rounded-full opacity-0 group-hover:opacity-100"
          >
            <i class="ri-delete-bin-line text-gray-500 text-xs hover:text-red-600"></i>
          </div>
        </div>

        <!-- 縮圖列右側上傳框 -->
        <label
          for="image-upload"
          class="w-12 h-12 flex items-center justify-center cursor-pointer bg-white border-2 border-dotted border-gray-400"
        >
          <i class="ri-image-upload-fill text-gray-400"></i>
        </label>
      </div>

      <!-- 大圖預覽 -->
      <div class="w-full h-full flex flex-col items-center justify-center">
        <div class="h-full max-h-full flex items-center justify-center">
          <canvas ref="canvas" class="max-w-full max-h-full bg-white shadow-lg rounded-lg">
          </canvas>
        </div>
      </div>
    </div>
  </div>
</template>
