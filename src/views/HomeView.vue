<script setup lang="ts">
import PreviewArea from '@/components/PreviewArea.vue'
import MenuAreas from '@/components/MenuAreas.vue'
</script>

<template>
  <div class="home-layout">
    <!-- 左側區域 -->
    <MenuAreas class="home-menu" />

    <!-- 右側側區域 -->
    <PreviewArea class="home-preview" />
  </div>
</template>

<style scoped>
.home-layout {
  display: flex;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  overflow: hidden;
}

.home-menu {
  flex: 0 0 auto;
}

.home-preview {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

@media (max-width: 767px) {
  .home-layout {
    flex-direction: column;
  }

  .home-preview {
    order: 1;
  }

  .home-menu {
    order: 2;
  }
}
</style>
