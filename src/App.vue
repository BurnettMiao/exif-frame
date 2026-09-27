<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useRoute } from 'vue-router'
import { useFilterStore } from '@/stores/filterStore'

const filterStore = useFilterStore()
const route = useRoute()
const isEditorRoute = computed(() => route.name === 'editor')
const isExportingAll = ref(false)

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
          to="/editor"
          class="font-bold text-xl sm:text-2xl flex items-center gap-x-2 text-gray-800"
        >
          <i class="ri-camera-3-line"></i> <span>Exif Frame</span>
        </RouterLink>

        <div class="flex items-center gap-2">
          <RouterLink
            to="/intro"
            class="hidden min-h-10 items-center rounded-lg px-3 py-1 text-sm text-gray-600 hover:text-amber-600 sm:flex"
            active-class="text-amber-600"
          >
            介紹
          </RouterLink>
          <RouterLink
            to="/editor"
            class="hidden min-h-10 items-center rounded-lg px-3 py-1 text-sm text-gray-600 hover:text-amber-600 sm:flex"
            active-class="text-amber-600"
          >
            編輯器
          </RouterLink>

          <button
            v-if="isEditorRoute"
            @click="handleExport"
            class="flex min-h-10 items-center px-3 py-1 rounded-lg bg-white text-gray-800 gap-x-2 border border-gray-800 cursor-pointer hover:bg-gray-800 hover:text-white transition-all ease duration-300"
          >
            <i class="ri-export-line text-xl"></i>
            <div class="text-sm sm:text-base">匯出圖片</div>
          </button>
          <button
            v-if="isEditorRoute"
            @click="handleExportAll"
            :disabled="isExportingAll"
            class="flex min-h-10 items-center px-3 py-1 rounded-lg bg-gray-800 text-white gap-x-2 border border-gray-800 cursor-pointer hover:bg-amber-500 hover:border-amber-500 disabled:cursor-wait disabled:opacity-60 transition-all ease duration-300"
          >
            <i
              :class="isExportingAll ? 'ri-loader-4-line animate-spin' : 'ri-folder-zip-line'"
              class="text-xl"
            ></i>
            <div class="text-sm sm:text-base">
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
