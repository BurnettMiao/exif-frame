<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useRoute } from 'vue-router'
import { useFilterStore } from '@/stores/filterStore'

const filterStore = useFilterStore()
const route = useRoute()
const isEditorRoute = computed(() => route.name === 'editor')
const isExportingAll = ref(false)
// const feedbackUrl = ''

const handleExport = () => {
  filterStore.download()
}

const handleExportAll = () => {
  if (isExportingAll.value) return
  window.dispatchEvent(new CustomEvent('exif-frame:export-all'))
}

const handleExportAllState = (event: Event) => {
  const customEvent = event as CustomEvent<{ isExporting: boolean }>
  isExportingAll.value = customEvent.detail?.isExporting ?? false
}

// const openFeedbackLink = () => {
//   if (!feedbackUrl) {
//     window.alert('問題回報表單準備中，之後會放上回報連結。')
//     return
//   }
//
//   window.open(feedbackUrl, '_blank', 'noopener,noreferrer')
// }

onMounted(() => {
  window.addEventListener('exif-frame:export-all-state', handleExportAllState)
})

onBeforeUnmount(() => {
  window.removeEventListener('exif-frame:export-all-state', handleExportAllState)
})
</script>

<template>
  <div class="flex h-[100dvh] flex-col overflow-hidden">
    <!-- Navbar -->
    <header class="w-full border-b border-b-gray-200">
      <div class="flex items-center justify-between w-full max-w-384 mx-auto py-3 px-3 sm:p-4">
        <RouterLink
          to="/intro"
          class="font-bold text-xl sm:text-2xl flex min-w-0 items-center gap-x-2 text-gray-800"
        >
          <i class="ri-camera-3-line shrink-0"></i> <span class="truncate">Exif Frame</span>
        </RouterLink>

        <div class="flex shrink-0 items-center gap-2 sm:gap-4">
          <RouterLink
            v-if="!isEditorRoute"
            to="/editor"
            class="flex size-10 items-center justify-center text-gray-600 hover:text-amber-600 sm:w-auto sm:px-2 sm:py-1 sm:text-base sm:gap-x-1.5"
            active-class="text-amber-600 bg-amber-50 sm:bg-transparent sm:border-b-2 sm:border-amber-600"
            title="編輯器"
            aria-label="編輯器"
          >
            <i class="ri-edit-line text-xl" aria-hidden="true"></i>
            <span class="hidden sm:inline">編輯器</span>
          </RouterLink>
          <!-- <button
            type="button"
            class="flex size-10 items-center justify-center text-gray-600 hover:text-amber-600 sm:w-auto sm:px-2 sm:py-1 sm:text-base sm:gap-x-1.5"
            title="回報問題"
            aria-label="回報問題"
            @click="openFeedbackLink"
          >
            <i class="ri-bug-line text-xl" aria-hidden="true"></i>
            <span class="hidden sm:inline">回報問題</span>
          </button> -->

          <button
            v-if="isEditorRoute"
            @click="handleExport"
            class="flex size-10 items-center justify-center rounded-lg border border-gray-800 bg-white text-gray-800 cursor-pointer transition-all ease duration-300 hover:bg-gray-800 hover:text-white sm:w-auto sm:px-3 sm:py-1 sm:gap-x-2"
            title="匯出圖片"
            aria-label="匯出圖片"
          >
            <i class="ri-export-line text-xl"></i>
            <div class="hidden text-sm sm:block sm:text-base">匯出圖片</div>
          </button>
          <button
            v-if="isEditorRoute"
            @click="handleExportAll"
            :disabled="isExportingAll"
            class="flex size-10 items-center justify-center rounded-lg border border-gray-800 bg-gray-800 text-white cursor-pointer transition-all ease duration-300 hover:border-amber-500 hover:bg-amber-500 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-3 sm:py-1 sm:gap-x-2"
            title="匯出全部"
            aria-label="匯出全部"
          >
            <i
              :class="isExportingAll ? 'ri-loader-4-line animate-spin' : 'ri-folder-zip-line'"
              class="text-xl"
            ></i>
            <div class="hidden text-sm sm:block sm:text-base">
              {{ isExportingAll ? '匯出中' : '匯出全部' }}
            </div>
          </button>
        </div>
      </div>
    </header>

    <!-- 主體 -->
    <div class="min-h-0 flex-1 flex overflow-hidden bg-gray-100">
      <RouterView />
    </div>

    <!-- footer -->
    <!-- <div
      class="p-4 bg-white border-t border-t-gray-200 w-full max-w-7xl flex items-center justify-between mx-auto"
    >
      <div class="font-bold text-2xl flex items-center gap-x-2">
        <i class="ri-camera-3-line"></i> <span>Exif Frame</span>
      </div>

      <div class="font-bold text-xl">Burnet Studio</div>
    </div> -->
  </div>
</template>

<style scoped></style>
