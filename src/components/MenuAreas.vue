<script setup lang="ts">
import { ref } from 'vue'
import FilterArea from '@/components/FilterArea.vue'

type Menu = {
  icon: string
  name: string
}

const menus = ref<Menu[]>([
  {
    icon: 'ri-layout-line',
    name: '排版區',
  },
  {
    icon: 'ri-color-filter-line',
    name: '濾鏡區',
  },
  {
    icon: 'ri-crop-line',
    name: '版面調整',
  },
])

const currentSelected = ref<string>('')
const handleSelected = (name: string) => {
  currentSelected.value = name
  console.log(currentSelected.value)
}
</script>

<template>
  <div class="flex items-start relative min-w-61.25 h-full">
    <div
      class="h-full py-4 px-2 flex flex-col gap-y-1 border-r border-gray-200 z-10 bg-white group w-16.25 hover:w-34.25 overflow-hidden transition-all ease-in-out duration-150"
    >
      <div
        @click="handleSelected(menu.name)"
        v-for="menu in menus"
        :key="menu.name"
        class="flex items-center gap-x-2 px-3 py-1 cursor-pointer relative z-30 hover:text-amber-500"
      >
        <i
          :class="[menu.icon, { 'text-amber-500': menu.name === currentSelected }]"
          class="text-2xl"
        ></i>
        <span
          class="text-nowrap opacity-0 group-hover:opacity-100"
          :class="{ 'text-amber-500': menu.name === currentSelected }"
          >{{ menu.name }}
        </span>
      </div>
    </div>

    <div class="absolute top-0 left-16.25 h-full">
      <FilterArea v-if="currentSelected === '濾鏡區'" />
    </div>
  </div>
</template>
