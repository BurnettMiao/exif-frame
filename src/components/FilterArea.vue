<script setup lang="ts"></script>

<template>
  <div
    class="min-w-45 2xl:min-w-60 bg-white px-4 py-7 border-l border-l-gray-200 flex flex-col h-full overflow-hidden"
  >
    <div class="flex-1 overflow-y-scroll flex flex-col gap-y-4">
      <div v-for="i in 5" :key="i">
        <div class="border border-gray-400 rounded-lg w-full aspect-4/3"></div>
        <div class="mt-1 text-center">範例{{ i }}</div>
      </div>
    </div>
  </div>
</template>
