<script setup lang="ts">
import { ref } from 'vue'
import ExifReader from 'exifreader'

// 用來存放照片資訊的響應式變數
const photoInfo = ref<any>(null)
const previewUrl = ref<string>('')
const previewImgArr = ref<string[]>([])
const currentPreviewIndex = ref<number>(0)

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  console.log(file)
  if (!file) return

  // 建立新的預覽連結與加入圖片陣列
  const newPreviewUrl = URL.createObjectURL(file)
  previewImgArr.value.push(newPreviewUrl)
  previewUrl.value = newPreviewUrl
  currentPreviewIndex.value = previewImgArr.value.length - 1

  try {
    // 2. 讀取 EXIF 資訊
    // ExifReader 會自動處理 File 物件
    const tags = await ExifReader.load(file)

    // 3. 整理我們想要的資訊
    // 使用 ?.description 來取得易讀的文字內容
    photoInfo.value = {
      date: tags['DateTimeOriginal']?.description || '未知日期',
      model: tags['Model']?.description || '未知相機',
      exposure: tags['ExposureTime']?.description || '未知快門',
      aperture: tags['FNumber']?.description || '未知光圈',
      iso: tags['ISOSpeedRatings']?.description || '未知ISO',
    }

    console.log('完整解析結果：', tags)
  } catch (error) {
    console.log('解析 EXIF 出錯：', error)
    photoInfo.value = { error: '無法讀取此照片的 EXIF 資訊' }
  }
}

const selectedPreview = (index: number) => {
  if (previewImgArr.value && previewImgArr.value[index]) {
    previewUrl.value = previewImgArr.value[index]
    currentPreviewIndex.value = index
  }
}

const deleteImg = (index: number) => {
  previewImgArr.value.splice(index, 1)

  if (previewImgArr.value.length === 0) {
    previewUrl.value = ''
  } else if (index >= previewImgArr.value.length) {
    previewUrl.value = previewImgArr.value[index - 1] || ''
  } else {
    previewUrl.value = previewImgArr.value[index] || ''
  }
}
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
    <div v-if="!previewUrl" class="bg-white rounded-lg shadow p-4 w-full h-full">
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

    <!-- 預覽區塊 -->
    <div v-if="previewUrl" class="w-full h-full relative">
      <!-- 縮圖預覽 -->
      <div
        class="bg-white p-2 shadow-sm rounded-lg flex items-center justify-center gap-x-3 absolute -top-3 left-1/2 -translate-x-1/2"
      >
        <div
          @click="selectedPreview(index)"
          v-for="(img, index) in previewImgArr"
          :key="img"
          class="w-12 h-12 border-2 bg-white cursor-pointer group relative"
          :class="{
            'border-dotted border-gray-400': !previewUrl,
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

        <label
          for="image-upload"
          class="w-12 h-12 flex items-center justify-center cursor-pointer bg-white"
          :class="{ 'border-2 border-dotted border-gray-400': previewUrl }"
        >
          <i class="ri-image-upload-fill text-gray-400"></i>
        </label>
      </div>

      <!-- 大圖預覽 -->
      <div class="w-full h-full flex flex-col items-center justify-center">
        <img
          :src="previewUrl"
          alt="preview img"
          class="w-auto max-w-full h-auto max-h-full object-contain p-4 bg-white rounded-lg shadow-lg"
        />

        <!-- 照片相關資訊 -->
        <!-- <div v-if="photoInfo" class="bg-white w-full text-gray-600 font-mono text-sm space-y-1">
          <p>📅 日期：{{ photoInfo.date }}</p>
          <p>📷 相機：{{ photoInfo.model }}</p>
          <p>
            ⚙️ 參數：f/{{ photoInfo.aperture }} | {{ photoInfo.exposure }}s | ISO
            {{ photoInfo.iso }}
          </p>
        </div> -->
      </div>
    </div>
  </div>
</template>
