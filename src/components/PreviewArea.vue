<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import ExifReader from 'exifreader'

import pic from '@/assets/DSC00255.jpg'
import { updateSourceFile } from 'typescript'

const photoInfo = ref<any>(null)
const previewImgArr = ref<string[]>([])
const currentPreviewIndex = ref<number>(0)

const canvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const currentImage = ref<HTMLImageElement | null>(null)
const currentFilter = ref<string>('none')

// 上下左右白邊
const padding = {
  top: 120,
  right: 120,
  bottom: 120,
  left: 120,
}

// 統一的繪製函式：畫面上看到的，就是最終匯出的樣子
const renderCanvas = () => {
  if (!canvas.value || !currentImage.value) return
  if (!ctx.value) ctx.value = canvas.value.getContext('2d')
  if (!ctx.value) return

  const img = currentImage.value
  const infoLineHeight = Math.round(img.width * 0.03)
  const infoPadding = Math.round(img.width * 0.04)
  const hasInfo = !!photoInfo.value && !photoInfo.value.error
  const infoHeight = hasInfo ? infoLineHeight * 3 + infoPadding * 2 : 0

  canvas.value.width = img.width + padding.left + padding.right
  canvas.value.height = img.height + infoHeight + padding.top + padding.bottom

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
    ctx.value.fillStyle = '#4b5563'
    ctx.value.font = `${infoLineHeight}px monospace`
    ctx.value.textBaseline = 'top'
    const x = infoPadding
    let y = img.height + infoPadding + padding.top
    console.log(img.height, infoPadding, padding.top, infoLineHeight)
    ctx.value.fillText(`日期：${photoInfo.value.date}`, x, y)
    y += infoLineHeight
    ctx.value.fillText(`相機：${photoInfo.value.model}`, x, y)
    y += infoLineHeight
    ctx.value.fillText(
      `參數：f/${photoInfo.value.aperture} | ${photoInfo.value.exposure}s | ISO ${photoInfo.value.iso}`,
      x,
      y,
    )
  }
}

const loadImageToCanvas = (url: string) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    currentImage.value = img
    renderCanvas()
  }
  img.src = url
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 直接呼叫通用的處理函式
  await processImage(file)
}

const selectedPreview = (index: number) => {
  currentPreviewIndex.value = index
  const url = previewImgArr.value[index]
  if (!url) return
  loadImageToCanvas(url)
}

const deleteImg = (index: number) => {
  previewImgArr.value.splice(index, 1)
  if (previewImgArr.value.length === 0) {
    currentImage.value = null
  } else {
    const newIndex = Math.min(index, previewImgArr.value.length - 1)
    currentPreviewIndex.value = newIndex
    const url = previewImgArr.value[newIndex]
    if (!url) return
    loadImageToCanvas(url)
  }
}

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
  previewImgArr.value.push(newPreviewUrl)
  currentPreviewIndex.value = previewImgArr.value.length - 1

  await nextTick()
  loadImageToCanvas(newPreviewUrl)

  try {
    const tags = await ExifReader.load(file)
    photoInfo.value = {
      date: tags['DateTimeOriginal']?.description || '未知日期',
      model: tags['Model']?.description || '未知相機',
      exposure: tags['ExposureTime']?.description || '未知快門',
      aperture: tags['FNumber']?.description || '未知光圈',
      iso: tags['ISOSpeedRatings']?.description || '未知ISO',
    }
    renderCanvas()
  } catch (error) {
    photoInfo.value = { error: '無法讀取此照片的 EXIF 資訊' }
    renderCanvas()
  }
}

const applyFilter = (filter: string) => {
  currentFilter.value = filter
  renderCanvas()
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
  processImage(pic)
})
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
    <div v-if="previewImgArr.length === 0" class="bg-white rounded-lg shadow p-4 w-full h-full">
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
    <div v-else class="w-full h-full relative">
      <!-- 縮圖列 -->
      <div
        class="bg-white p-2 shadow-sm rounded-lg flex items-center justify-center gap-x-3 absolute -top-3 left-1/2 -translate-x-1/2"
      >
        <div
          @click="selectedPreview(index)"
          v-for="(img, index) in previewImgArr"
          :key="img"
          class="w-12 h-12 border-2 bg-white cursor-pointer group relative"
          :class="{
            'border-black': index === currentPreviewIndex,
            'border-white': index !== currentPreviewIndex,
          }"
        >
          <img :src="img" alt="" class="w-full h-full object-cover" />

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

      <!-- 濾鏡按鈕範例 -->
      <!-- <div
        class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 p-2 rounded-full shadow"
      >
        <button
          @click="applyFilter('none')"
          class="px-4 py-1 text-sm rounded-full hover:bg-gray-100"
        >
          原圖
        </button>
        <button
          @click="applyFilter('contrast(1.3) saturate(1.4)')"
          class="px-4 py-1 text-sm rounded-full hover:bg-gray-100"
        >
          鮮豔
        </button>
        <button
          @click="applyFilter('sepia(0.7)')"
          class="px-4 py-1 text-sm rounded-full hover:bg-gray-100"
        >
          復古
        </button>
        <button
          @click="applyFilter('grayscale(1)')"
          class="px-4 py-1 text-sm rounded-full hover:bg-gray-100"
        >
          黑白
        </button>
        <button
          @click="downloadImage"
          class="px-4 py-1 text-sm rounded-full bg-blue-500 text-white"
        >
          下載
        </button>
      </div> -->
    </div>
  </div>
</template>
