<script setup lang="ts">
import { useLayoutStore } from '@/stores/layoutStore'
import defaultPic from '@/assets/DSC00255.jpg'

const layoutStore = useLayoutStore()

const selectedLayout = (index: number) => {
  layoutStore.selectedLayout(index)
}
</script>

<template>
  <div
    class="flex h-full min-w-45 w-full flex-col overflow-hidden border-r border-r-gray-200 bg-white px-4 py-6 2xl:max-w-60 max-lg:h-auto max-lg:max-h-[190px] max-lg:min-w-0 max-lg:max-w-none max-lg:border-r-0 max-lg:px-3.5 max-lg:py-3"
  >
    <div
      class="flex flex-1 flex-col gap-y-4 overflow-y-scroll max-lg:flex-row max-lg:gap-3 max-lg:overflow-x-auto max-lg:overflow-y-hidden max-lg:pb-1.5"
    >
      <div
        @click="selectedLayout(index)"
        v-for="(layout, index) in layoutStore.layouts"
        :key="layout.name"
        class="group cursor-pointer max-lg:w-28 max-lg:flex-[0_0_7rem]"
      >
        <div
          class="aspect-4/3 w-full overflow-hidden rounded-lg border border-gray-100 shadow-sm max-lg:h-[84px]"
        >
          <img
            :src="defaultPic"
            class="w-full max-w-52.5 h-full object-center object-cover"
            alt=""
          />
        </div>
        <div
          class="mt-1 text-center group-hover:text-amber-600"
          :class="{ 'text-amber-600': layoutStore.currentIndex === index }"
        >
          {{ layout.name }}
        </div>
      </div>
    </div>
  </div>
</template>
