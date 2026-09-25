<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLayoutStore } from '@/stores/layoutStore'
import defaultPic from '@/assets/DSC00255.jpg'

const layoutStore = useLayoutStore()

const mobileLayoutMode = ref<'presets' | 'details'>('presets')

const selectedLayout = (index: number) => {
  layoutStore.selectedLayout(index)
  mobileLayoutMode.value = 'details'
}

const currentPadding = computed(() => layoutStore.currentLayout.padding.top)

const updateNumber = (event: Event, update: (value: number) => void) => {
  update(Number((event.target as HTMLInputElement).value))
}

const updateColor = (event: Event, update: (value: string) => void) => {
  update((event.target as HTMLInputElement).value)
}

const isCurrentPlacement = (option: (typeof layoutStore.layoutPlacements)[number]) =>
  layoutStore.currentLayout.infoPosition === option.infoPosition &&
  layoutStore.currentLayout.logoPosition === option.logoPosition
</script>

<template>
  <div
    class="flex h-full min-w-58 w-full flex-col overflow-hidden border-r border-r-gray-200 bg-white px-4 py-5 2xl:max-w-72 max-lg:h-[190px] max-lg:min-w-0 max-lg:max-w-none max-lg:border-r-0 max-lg:px-3.5 max-lg:py-3"
  >
    <div class="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 max-lg:hidden">
      <section>
        <div class="mb-3 text-sm font-semibold text-gray-900">版型</div>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="(layout, index) in layoutStore.layouts"
            :key="layout.name"
            type="button"
            class="group cursor-pointer border-0 bg-transparent p-1 text-left [touch-action:manipulation]"
            @click="selectedLayout(index)"
          >
            <div
              class="aspect-4/3 w-full overflow-hidden rounded-lg border border-gray-100 shadow-sm"
              :class="{ 'ring-2 ring-amber-400': layoutStore.currentPlacementIndex === index }"
            >
              <img :src="defaultPic" class="h-full w-full object-cover object-center" alt="" />
            </div>
            <div
              class="mt-1 text-center text-xs group-hover:text-amber-600"
              :class="{ 'text-amber-600': layoutStore.currentPlacementIndex === index }"
            >
              {{ layout.name }}
            </div>
          </button>
        </div>
      </section>

      <section
        class="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-3 max-lg:w-72 max-lg:flex-[0_0_18rem]"
      >
        <div class="text-sm font-semibold text-gray-900">細節調整</div>

        <label class="block">
          <div class="mb-1.5 flex items-center justify-between text-xs text-gray-600">
            <span>邊框厚度</span>
            <span>{{ Math.round(currentPadding * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.16"
            step="0.005"
            :value="currentPadding"
            class="w-full accent-amber-500"
            @input="updateNumber($event, layoutStore.updatePadding)"
          />
        </label>

        <label class="block">
          <div class="mb-1.5 flex items-center justify-between text-xs text-gray-600">
            <span>內容間距</span>
            <span>{{ Math.round(layoutStore.currentLayout.gapRatio * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0.015"
            max="0.1"
            step="0.005"
            :value="layoutStore.currentLayout.gapRatio"
            class="w-full accent-amber-500"
            @input="updateNumber($event, layoutStore.updateGapRatio)"
          />
        </label>

        <label class="block">
          <div class="mb-1.5 flex items-center justify-between text-xs text-gray-600">
            <span>Logo 大小</span>
            <span>{{ Math.round(layoutStore.currentLayout.logoScale * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0.08"
            max="0.32"
            step="0.005"
            :value="layoutStore.currentLayout.logoScale"
            class="w-full accent-amber-500"
            @input="updateNumber($event, layoutStore.updateLogoScale)"
          />
        </label>

        <label class="block">
          <div class="mb-1.5 flex items-center justify-between text-xs text-gray-600">
            <span>字體大小</span>
            <span>{{ Math.round(layoutStore.currentLayout.fontScale * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.35"
            step="0.025"
            :value="layoutStore.currentLayout.fontScale"
            class="w-full accent-amber-500"
            @input="updateNumber($event, layoutStore.updateFontScale)"
          />
        </label>

        <div class="grid grid-cols-3 gap-2">
          <label class="text-xs text-gray-600">
            <span class="mb-1.5 block">背景</span>
            <input
              type="color"
              :value="layoutStore.currentLayout.backgroundColor"
              class="h-9 w-full cursor-pointer rounded border border-gray-200 bg-white p-1"
              @input="updateColor($event, layoutStore.updateBackgroundColor)"
            />
          </label>
          <label class="text-xs text-gray-600">
            <span class="mb-1.5 block">主文字</span>
            <input
              type="color"
              :value="layoutStore.currentLayout.primaryTextColor"
              class="h-9 w-full cursor-pointer rounded border border-gray-200 bg-white p-1"
              @input="updateColor($event, layoutStore.updatePrimaryTextColor)"
            />
          </label>
          <label class="text-xs text-gray-600">
            <span class="mb-1.5 block">次文字</span>
            <input
              type="color"
              :value="layoutStore.currentLayout.secondaryTextColor"
              class="h-9 w-full cursor-pointer rounded border border-gray-200 bg-white p-1"
              @input="updateColor($event, layoutStore.updateSecondaryTextColor)"
            />
          </label>
        </div>

        <button
          type="button"
          class="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:border-amber-300 hover:text-amber-600"
          @click="selectedLayout(layoutStore.currentPlacementIndex)"
        >
          重設目前版型
        </button>
      </section>
    </div>

    <div class="hidden min-h-0 flex-1 max-lg:block">
      <div v-if="mobileLayoutMode === 'presets'" class="flex h-full min-h-0 flex-col">
        <div class="mb-2 flex items-center justify-between">
          <div class="text-sm font-semibold text-gray-900">版型</div>
          <div class="text-xs text-gray-400">點選後調整細節</div>
        </div>
        <div class="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden p-1 pb-1.5">
          <button
            v-for="(layout, index) in layoutStore.layouts"
            :key="layout.name"
            type="button"
            class="group w-28 flex-[0_0_7rem] cursor-pointer border-0 bg-transparent p-0 text-left [touch-action:manipulation]"
            @click="selectedLayout(index)"
          >
            <div
              class="h-[84px] w-full overflow-hidden rounded-lg border border-gray-100 shadow-sm"
              :class="{ 'ring-2 ring-amber-400': layoutStore.currentPlacementIndex === index }"
            >
              <img :src="defaultPic" class="h-full w-full object-cover object-center" alt="" />
            </div>
            <div
              class="mt-1 text-center text-xs group-hover:text-amber-600"
              :class="{ 'text-amber-600': layoutStore.currentPlacementIndex === index }"
            >
              {{ layout.name }}
            </div>
          </button>
        </div>
      </div>

      <div v-else class="flex h-full min-h-0 flex-col">
        <div class="mb-2 flex items-center justify-between gap-3">
          <button
            type="button"
            class="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-xs text-gray-700"
            @click="mobileLayoutMode = 'presets'"
          >
            <i class="ri-arrow-left-line text-sm" aria-hidden="true"></i>
            版型
          </button>
          <div class="min-w-0 flex-1 text-center text-sm font-semibold text-gray-900">細節調整</div>
          <button
            type="button"
            class="h-8 rounded-md border border-gray-200 bg-white px-2.5 text-xs text-gray-700"
            @click="selectedLayout(layoutStore.currentPlacementIndex)"
          >
            重設
          </button>
        </div>

        <div class="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden pb-1.5">
          <section class="w-64 flex-[0_0_16rem] rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div class="mb-3 text-xs font-semibold text-gray-700">資訊列位置</div>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="option in layoutStore.layoutPlacements"
                :key="option.name"
                type="button"
                class="h-9 rounded-md border bg-white px-2 text-xs text-gray-700"
                :class="
                  isCurrentPlacement(option) ? 'border-amber-400 text-amber-600' : 'border-gray-200'
                "
                @click="layoutStore.updatePlacement(option.infoPosition, option.logoPosition)"
              >
                {{ option.name }}
              </button>
            </div>
          </section>

          <section
            class="w-64 flex-[0_0_16rem] rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
          >
            <div class="mb-2 text-xs font-semibold text-gray-700">邊框與間距</div>
            <label class="mb-1.5 block">
              <div class="mb-1 flex items-center justify-between text-xs text-gray-600">
                <span>邊框厚度</span>
                <span>{{ Math.round(currentPadding * 100) }}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.16"
                step="0.005"
                :value="currentPadding"
                class="block h-5 w-full accent-amber-500"
                @input="updateNumber($event, layoutStore.updatePadding)"
              />
            </label>
            <label class="block">
              <div class="mb-1 flex items-center justify-between text-xs text-gray-600">
                <span>內容間距</span>
                <span>{{ Math.round(layoutStore.currentLayout.gapRatio * 100) }}%</span>
              </div>
              <input
                type="range"
                min="0.015"
                max="0.1"
                step="0.005"
                :value="layoutStore.currentLayout.gapRatio"
                class="block h-5 w-full accent-amber-500"
                @input="updateNumber($event, layoutStore.updateGapRatio)"
              />
            </label>
          </section>

          <section
            class="w-64 flex-[0_0_16rem] rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
          >
            <div class="mb-2 text-xs font-semibold text-gray-700">尺寸</div>
            <label class="mb-1.5 block">
              <div class="mb-1 flex items-center justify-between text-xs text-gray-600">
                <span>Logo 大小</span>
                <span>{{ Math.round(layoutStore.currentLayout.logoScale * 100) }}%</span>
              </div>
              <input
                type="range"
                min="0.08"
                max="0.32"
                step="0.005"
                :value="layoutStore.currentLayout.logoScale"
                class="block h-5 w-full accent-amber-500"
                @input="updateNumber($event, layoutStore.updateLogoScale)"
              />
            </label>
            <label class="block">
              <div class="mb-1 flex items-center justify-between text-xs text-gray-600">
                <span>字體大小</span>
                <span>{{ Math.round(layoutStore.currentLayout.fontScale * 100) }}%</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.35"
                step="0.025"
                :value="layoutStore.currentLayout.fontScale"
                class="block h-5 w-full accent-amber-500"
                @input="updateNumber($event, layoutStore.updateFontScale)"
              />
            </label>
          </section>

          <section class="w-64 flex-[0_0_16rem] rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div class="mb-3 text-xs font-semibold text-gray-700">顏色</div>
            <div class="grid grid-cols-3 gap-2">
              <label class="text-xs text-gray-600">
                <span class="mb-1.5 block">背景</span>
                <input
                  type="color"
                  :value="layoutStore.currentLayout.backgroundColor"
                  class="h-10 w-full cursor-pointer rounded border border-gray-200 bg-white p-1"
                  @input="updateColor($event, layoutStore.updateBackgroundColor)"
                />
              </label>
              <label class="text-xs text-gray-600">
                <span class="mb-1.5 block">主文字</span>
                <input
                  type="color"
                  :value="layoutStore.currentLayout.primaryTextColor"
                  class="h-10 w-full cursor-pointer rounded border border-gray-200 bg-white p-1"
                  @input="updateColor($event, layoutStore.updatePrimaryTextColor)"
                />
              </label>
              <label class="text-xs text-gray-600">
                <span class="mb-1.5 block">次文字</span>
                <input
                  type="color"
                  :value="layoutStore.currentLayout.secondaryTextColor"
                  class="h-10 w-full cursor-pointer rounded border border-gray-200 bg-white p-1"
                  @input="updateColor($event, layoutStore.updateSecondaryTextColor)"
                />
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
