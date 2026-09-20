<script setup lang="ts">
import type { PreviewItem } from '@/composables/usePhotoCollection'

defineProps<{
  items: PreviewItem[]
  currentIndex: number
  maxCount: number
}>()

const emit = defineEmits<{
  select: [index: number]
  delete: [index: number]
}>()
</script>

<template>
  <div class="w-full lg:w-auto max-w-full overflow-x-auto overscroll-x-contain">
    <div
      class="bg-white p-2 shadow-sm rounded-sm flex w-max min-w-full items-center justify-start gap-x-3 h-auto"
    >
      <div
        @click="emit('select', index)"
        v-for="(item, index) in items"
        :key="item.id"
        class="w-12 h-12 2xl:h-15 2xl:w-15 shrink-0 border-2 bg-white cursor-pointer group relative"
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
          class="absolute -top-2 right-0 w-6 h-6 flex items-center justify-center bg-white rounded-full opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <i class="ri-delete-bin-line text-gray-500 text-base hover:text-red-600"></i>
        </div>
      </div>

      <!-- 縮圖列右側上傳框（input 在 PreviewArea 中） -->
      <label
        v-if="items.length < maxCount"
        for="image-upload"
        class="w-12 h-12 shrink-0 flex items-center justify-center cursor-pointer bg-white border-2 border-dotted border-gray-400"
      >
        <i class="ri-image-upload-fill text-2xl text-gray-400"></i>
      </label>
    </div>
  </div>
</template>
