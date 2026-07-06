<script setup lang="ts">
import { ref } from 'vue'
import PreviewArea from '@/components/PreviewArea.vue'
import FilterArea from '@/components/FilterArea.vue'
</script>

<template>
  <div class="flex w-full h-full overflow-hidden">
    <!-- 左側區域 -->
    <PreviewArea />

    <!-- 右側區域 -->
    <FilterArea />
  </div>
</template>
