<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="flex h-screen flex-col">
    <!-- Navbar -->
    <header class="w-full border-b border-b-gray-200">
      <div class="flex items-center justify-between w-full max-w-7xl mx-auto py-4 px-2">
        <div class="font-bold text-2xl flex items-center gap-x-2">
          <i class="ri-camera-3-line"></i> <span>Exif Frame</span>
        </div>

        <nav>iiiii</nav>
      </div>
    </header>

    <!-- 主體 -->
    <div class="flex-1 flex overflow-hidden">
      <RouterView />
    </div>

    <!-- footer -->
    <div class="text-center p-4 bg-white border-t border-t-gray-200">footer</div>
  </div>
</template>

<style scoped></style>
