<script setup lang="ts">
import { ref } from 'vue'
import ExifReader from 'exifreader'

// 用來存放照片資訊的響應式變數
const photoInfo = ref<any>(null)
const previewUrl = ref<string | null>(null)

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  console.log(file)
  if (!file) return

  // 1. 預覽照片 (建立一個暫時的 URL)
  previewUrl.value = URL.createObjectURL(file)

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
</script>

<template>
  <div class="flex w-full h-full overflow-hidden">
    <!-- 左側區域 -->
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
            class="w-12 h-12 bg-white"
            :class="{ 'border-2 border-dotted border-gray-400': !previewUrl }"
          >
            <img :src="previewUrl" alt="" class="w-full h-full object-cover" />
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
        <div class="w-full h-full flex items-center justify-center">
          <img
            :src="previewUrl"
            alt="preview img"
            class="w-auto max-w-full h-auto max-h-full object-contain p-4 pb-20 bg-white rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>

    <!-- 右側區域 -->
    <div
      class="min-w-30 2xl:min-w-60 bg-white px-4 py-7 border-l border-l-gray-200 flex flex-col h-full overflow-hidden"
    >
      <div class="flex-1 overflow-y-scroll flex flex-col gap-y-4">
        <div v-for="i in 5" :key="i">
          <div class="border border-gray-400 rounded-lg w-full aspect-4/3"></div>
          <div class="mt-1 text-center">範例{{ i }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 簡易的拍立得預覽框 -->
  <!-- <div v-if="previewUrl" class="bg-white p-4 shadow-xl border border-gray-200 rounded-sm">
    <img :src="previewUrl" class="w-full aspect-square object-cover mb-4" />

    <div v-if="photoInfo" class="text-gray-600 font-mono text-sm space-y-1">
      <p>📅 日期：{{ photoInfo.date }}</p>
      <p>📷 相機：{{ photoInfo.model }}</p>
      <p>
        ⚙️ 參數：f/{{ photoInfo.aperture }} | {{ photoInfo.exposure }}s | ISO {{ photoInfo.iso }}
      </p>
    </div>
  </div> -->
</template>
