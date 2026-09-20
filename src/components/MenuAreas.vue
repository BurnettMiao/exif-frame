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
    class="relative flex w-full max-w-[305px] items-start h-full max-lg:h-auto max-lg:max-w-none max-lg:flex-col-reverse max-lg:border-t max-lg:border-gray-200 max-lg:bg-white"
  >
    <div
      class="group relative z-10 flex h-full w-[65px] flex-col gap-1 overflow-hidden border-x border-gray-200 bg-white px-2 py-4 transition-[width] duration-150 ease-in-out hover:w-[137px] max-lg:h-[58px] max-lg:w-full max-lg:flex-row max-lg:justify-around max-lg:gap-0 max-lg:border-x-0 max-lg:border-t max-lg:px-2 max-lg:pt-1.5 max-lg:pb-2 max-lg:hover:w-full"
    >
      <button
        v-for="menu in menus"
        :key="menu.name"
        type="button"
        class="relative z-30 flex w-[121px] cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-1 text-left text-gray-700 hover:text-amber-500 max-lg:w-auto max-lg:min-w-18 max-lg:flex-1 max-lg:flex-col max-lg:justify-center max-lg:gap-[3px] max-lg:rounded-lg max-lg:px-1.5 max-lg:py-1 max-lg:text-center max-lg:text-xs"
        :class="{
          'text-amber-500': menu.name === currentSelected,
          'max-lg:bg-amber-50': menu.name === currentSelected && isMobilePanelOpen,
        }"
        @click="handleSelected(menu.name)"
      >
        <i
          :class="menu.icon"
          class="shrink-0 text-2xl leading-none max-lg:text-[22px]"
          aria-hidden="true"
        ></i>
        <span
          class="whitespace-nowrap opacity-0 transition-opacity duration-150 lg:group-hover:opacity-100 max-lg:opacity-100"
          >{{ menu.name }}</span
        >
      </button>
    </div>

    <div
      class="absolute top-0 left-[65px] h-full max-lg:relative max-lg:left-0 max-lg:w-full max-lg:min-h-0 max-lg:overflow-hidden"
      :class="isMobilePanelOpen ? 'max-lg:h-auto max-lg:max-h-[190px]' : 'max-lg:hidden'"
    >
      <LayoutArea v-if="currentSelected === '排版區'" />
      <FilterArea v-if="currentSelected === '濾鏡區'" />

      <!-- 版面調整：功能開發中，先顯示 placeholder 避免白屏 -->
      <div
        v-if="currentSelected === '版面調整'"
        class="h-full min-w-45 border-r border-gray-200 bg-white px-4 py-6 max-lg:w-full max-lg:min-w-0 max-lg:border-r-0 max-lg:p-4"
      >
        <div class="flex h-full items-center justify-center text-gray-400">
          版面調整功能即將推出
        </div>
      </div>
    </div>
  </div>
</template>
