<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useFilterStore } from '@/stores/filter'

const filterStore = useFilterStore()

const handleExport = () => {
  filterStore.download()
}
</script>

<template>
  <div class="flex h-screen flex-col">
    <!-- Navbar -->
    <header class="w-full border-b border-b-gray-200">
      <div class="flex items-center justify-between w-full max-w-7xl mx-auto py-4 px-2">
        <div class="font-bold text-2xl flex items-center gap-x-2 text-gray-800">
          <i class="ri-camera-3-line"></i> <span>Exif Frame</span>
        </div>

        <button
          @click="handleExport"
          class="flex items-center px-3 py-1 rounded-lg bg-white text-gray-800 gap-x-2 border border-gray-800 cursor-pointer hover:bg-gray-800 hover:text-white transition-all ease duration-300"
        >
          <i class="ri-export-line text-xl"></i>
          <div>匯出圖片</div>
        </button>
      </div>
    </header>

    <!-- 主體 -->
    <div class="flex-1 flex overflow-hidden">
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
