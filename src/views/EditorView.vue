<script setup lang="ts">
import PreviewArea from '@/components/PreviewArea.vue'
import MenuAreas from '@/components/MenuAreas.vue'
import CropArea from '@/components/CropArea.vue'
import { useEditorStore } from '@/stores/editorStore'
import { usePhotoCollection } from '@/composables/usePhotoCollection'

const editorStore = useEditorStore()
const { previewItems } = usePhotoCollection()
</script>

<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden lg:flex-row">
    <!-- 左側區域 -->
    <MenuAreas class="order-2 shrink-0 lg:order-none" />

    <!-- 右側側區域 -->
    <PreviewArea class="order-1 min-h-0 min-w-0 flex-1 lg:order-none" />

    <div
      v-if="previewItems.length > 0 && editorStore.currentPanel === '版面調整'"
      class="absolute inset-0 z-50 flex min-h-0 min-w-0 bg-gray-100"
    >
      <CropArea />
    </div>
  </div>
</template>
