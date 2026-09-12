<script setup lang="ts">
import type { PreviewItem } from '@/composables/usePhotoCollection'

defineProps<{
  items: PreviewItem[]
  currentIndex: number
}>()

const emit = defineEmits<{
  select: [index: number]
  delete: [index: number]
}>()
</script>

<template>
  <div class="bg-white p-2 shadow-sm rounded-sm flex items-center justify-center gap-x-3 h-auto">
    <div
      @click="emit('select', index)"
      v-for="(item, index) in items"
      :key="item.url"
      class="w-15 h-15 border-2 bg-white cursor-pointer group relative"
      :class="{
        'border-black': index === currentIndex,
        'border-white': index !== currentIndex,
      }"
    >
      <img :src="item.url" alt="" class="w-full h-full object-cover" />

      <!-- 非選中的圖片遮罩 -->
      <div v-if="index !== currentIndex" class="absolute inset-0 bg-gray-100 opacity-50"></div>

      <!-- 圖片刪除 -->
      <div
        @click.stop="emit('delete', index)"
        class="absolute -top-2 right-0 w-5 h-5 flex items-center justify-center bg-white rounded-full opacity-0 group-hover:opacity-100"
      >
        <i class="ri-delete-bin-line text-gray-500 text-xs hover:text-red-600"></i>
      </div>
    </div>

    <!-- 縮圖列右側上傳框（input 在 PreviewArea 中） -->
    <label
      for="image-upload"
      class="w-12 h-12 flex items-center justify-center cursor-pointer bg-white border-2 border-dotted border-gray-400"
    >
      <i class="ri-image-upload-fill text-gray-400"></i>
    </label>
  </div>
</template>
