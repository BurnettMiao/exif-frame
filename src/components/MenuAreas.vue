<script setup lang="ts">
import { computed, ref } from 'vue'
import FilterArea from '@/components/FilterArea.vue'
import LayoutArea from '@/components/LayoutArea.vue'
import InfoArea from '@/components/InfoArea.vue'
import { useEditorStore, type EditorPanelName } from '@/stores/editorStore'

type Menu = {
  icon: string
  name: EditorPanelName
}

const editorStore = useEditorStore()

const menus = ref<Menu[]>([
  {
    icon: 'ri-layout-line',
    name: '排版區',
  },
  {
    icon: 'ri-file-info-line',
    name: '資訊區',
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

const isMobilePanelOpen = ref(false)
const mobilePanelClass = computed(() => {
  if (!isMobilePanelOpen.value) return 'max-lg:hidden'
  if (editorStore.currentPanel === '濾鏡區') return 'max-lg:h-[150px]'
  return 'max-lg:h-[190px]'
})

const handleSelected = (name: EditorPanelName) => {
  if (editorStore.currentPanel === name) {
    isMobilePanelOpen.value = !isMobilePanelOpen.value
    return
  }

  editorStore.selectPanel(name)
  isMobilePanelOpen.value = true
}
</script>

<template>
  <div
    class="relative flex w-full max-w-[305px] items-start h-full max-lg:h-auto max-lg:max-w-none max-lg:flex-col-reverse max-lg:border-t max-lg:border-gray-200 max-lg:bg-white"
  >
    <div
      class="group relative z-10 flex h-full w-[65px] flex-col gap-3 overflow-hidden border-x border-gray-200 bg-white px-2 py-4 transition-[width] duration-150 ease-in-out hover:w-[137px] max-lg:h-[68px] max-lg:w-full max-lg:flex-row max-lg:justify-around max-lg:gap-0 max-lg:border-x-0 max-lg:border-t max-lg:p-3 max-lg:hover:w-full"
    >
      <button
        v-for="menu in menus"
        :key="menu.name"
        type="button"
        class="relative z-30 flex w-[121px] cursor-pointer items-center gap-2 rounded-lg border-0 px-3 py-1 text-left hover:text-amber-500 max-lg:w-auto max-lg:min-w-18 max-lg:flex-1 max-lg:flex-col max-lg:justify-center max-lg:gap-[3px] max-lg:px-1.5 max-lg:py-1 max-lg:text-center max-lg:text-xs"
        :class="{
          'bg-amber-50 text-amber-500': menu.name === editorStore.currentPanel,
          'bg-transparent text-gray-700': menu.name !== editorStore.currentPanel,
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
      class="absolute top-0 left-[65px] h-full max-lg:relative max-lg:z-20 max-lg:left-0 max-lg:w-full max-lg:min-h-0 max-lg:overflow-hidden"
      :class="mobilePanelClass"
    >
      <LayoutArea v-if="editorStore.currentPanel === '排版區'" />
      <InfoArea v-if="editorStore.currentPanel === '資訊區'" />
      <FilterArea v-if="editorStore.currentPanel === '濾鏡區'" />
    </div>
  </div>
</template>
