<script setup lang="ts">
import { ref } from 'vue'
import PreviewArea from '@/components/PreviewArea.vue'
import MenuAreas from '@/components/MenuAreas.vue'
</script>

<template>
  <div class="flex w-full h-full overflow-hidden">
    <!-- 左側區域 -->
    <MenuAreas />

    <!-- 右側側區域 -->
    <PreviewArea />
  </div>
</template>
