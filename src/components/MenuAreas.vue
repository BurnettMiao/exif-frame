<script setup lang="ts">
import { ref } from 'vue'
import FilterArea from '@/components/FilterArea.vue'
import LayoutArea from '@/components/LayoutArea.vue'

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

const currentSelected = ref<string>('排版區')
const isMobilePanelOpen = ref(false)

const handleSelected = (name: string) => {
  if (currentSelected.value === name) {
    isMobilePanelOpen.value = !isMobilePanelOpen.value
    return
  }

  currentSelected.value = name
  isMobilePanelOpen.value = true
}
</script>

<template>
  <div
    class="relative flex w-full max-w-[305px] items-start h-full max-md:h-auto max-md:max-w-none max-md:flex-col-reverse max-md:border-t max-md:border-gray-200 max-md:bg-white"
  >
    <div
      class="group relative z-10 flex h-full w-[65px] flex-col gap-1 overflow-hidden border-x border-gray-200 bg-white px-2 py-4 transition-[width] duration-150 ease-in-out hover:w-[137px] max-md:h-[58px] max-md:w-full max-md:flex-row max-md:justify-around max-md:gap-0 max-md:border-x-0 max-md:border-t max-md:px-2 max-md:pt-1.5 max-md:pb-2 max-md:hover:w-full"
    >
      <button
        v-for="menu in menus"
        :key="menu.name"
        type="button"
        class="relative z-30 flex w-[121px] cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-1 text-left text-gray-700 hover:text-amber-500 max-md:w-auto max-md:min-w-18 max-md:flex-1 max-md:flex-col max-md:justify-center max-md:gap-[3px] max-md:rounded-lg max-md:px-1.5 max-md:py-1 max-md:text-center max-md:text-xs"
        :class="{
          'text-amber-500': menu.name === currentSelected,
          'max-md:bg-amber-50': menu.name === currentSelected && isMobilePanelOpen,
        }"
        @click="handleSelected(menu.name)"
      >
        <i :class="menu.icon" class="shrink-0 text-2xl leading-none max-md:text-[22px]" aria-hidden="true"></i>
        <span
          class="whitespace-nowrap opacity-0 transition-opacity duration-150 md:group-hover:opacity-100 max-md:opacity-100"
          >{{ menu.name }}</span
        >
      </button>
    </div>

    <div
      class="absolute top-0 left-[65px] h-full max-md:relative max-md:left-0 max-md:w-full max-md:min-h-0 max-md:overflow-hidden"
      :class="isMobilePanelOpen ? 'max-md:h-auto max-md:max-h-[190px]' : 'max-md:hidden'"
    >
      <LayoutArea v-if="currentSelected === '排版區'" />
      <FilterArea v-if="currentSelected === '濾鏡區'" />

      <!-- 版面調整：功能開發中，先顯示 placeholder 避免白屏 -->
      <div
        v-if="currentSelected === '版面調整'"
        class="h-full min-w-45 border-r border-gray-200 bg-white px-4 py-6 max-md:w-full max-md:min-w-0 max-md:border-r-0 max-md:p-4"
      >
        <div class="flex h-full items-center justify-center text-gray-400">版面調整功能即將推出</div>
      </div>
    </div>
  </div>
</template>
