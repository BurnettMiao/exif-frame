<script setup lang="ts">
import PreviewArea from '@/components/PreviewArea.vue'
import MenuAreas from '@/components/MenuAreas.vue'
</script>

<template>
  <div class="flex h-full w-full flex-col overflow-hidden lg:flex-row">
    <!-- 左側區域 -->
    <MenuAreas class="order-2 shrink-0 lg:order-none" />

    <!-- 右側側區域 -->
    <PreviewArea class="order-1 min-h-0 min-w-0 flex-1 lg:order-none" />
  </div>
</template>
