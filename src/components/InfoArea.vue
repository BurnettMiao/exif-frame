<script setup lang="ts">
import { computed } from 'vue'
import { usePhotoCollection } from '@/composables/usePhotoCollection'
import type { PhotoInfo, PhotoInfoVisibility } from '@/types/previewArea'

type InfoField = {
  key: keyof PhotoInfo
  visibilityKey: keyof PhotoInfoVisibility
  label: string
  placeholder: string
  multiline?: boolean
}

const { activeItem, updatePhotoInfo, setInfoVisibility, resetPhotoInfo } = usePhotoCollection()

const fields: InfoField[] = [
  {
    key: 'model',
    visibilityKey: 'camera',
    label: '相機名稱',
    placeholder: '例如 A7C II',
  },
  {
    key: 'lens',
    visibilityKey: 'lens',
    label: '鏡頭',
    placeholder: '例如 FE 35mm F1.8',
  },
  {
    key: 'aperture',
    visibilityKey: 'aperture',
    label: '光圈',
    placeholder: '例如 f/2.8',
  },
  {
    key: 'exposure',
    visibilityKey: 'exposure',
    label: '快門',
    placeholder: '例如 1/250',
  },
  {
    key: 'iso',
    visibilityKey: 'iso',
    label: 'ISO',
    placeholder: '例如 400',
  },
  {
    key: 'date',
    visibilityKey: 'date',
    label: '日期',
    placeholder: '例如 2026-09-24',
  },
  {
    key: 'location',
    visibilityKey: 'location',
    label: '地點',
    placeholder: '例如 Taipei',
  },
  {
    key: 'caption',
    visibilityKey: 'caption',
    label: 'Caption',
    placeholder: '替這張照片加一句話',
    multiline: true,
  },
]

const hasPhoto = computed(() => !!activeItem.value)

const getFieldValue = (key: keyof PhotoInfo) => {
  const value = activeItem.value?.info[key]
  return typeof value === 'string' ? value : ''
}

const updateField = (key: keyof PhotoInfo, value: string) => {
  const item = activeItem.value
  if (!item) return

  updatePhotoInfo(item, { [key]: value })
}

const updateVisibility = (key: keyof PhotoInfoVisibility, value: boolean) => {
  const item = activeItem.value
  if (!item) return

  setInfoVisibility(item, key, value)
}

const resetCurrentInfo = () => {
  const item = activeItem.value
  if (!item) return

  resetPhotoInfo(item)
}
</script>

<template>
  <div
    class="flex h-full min-w-58 w-full flex-col overflow-hidden border-r border-r-gray-200 bg-white px-4 py-5 2xl:max-w-72 max-lg:h-auto max-lg:max-h-[190px] max-lg:min-w-0 max-lg:max-w-none max-lg:border-r-0 max-lg:px-3.5 max-lg:py-3"
  >
    <div v-if="hasPhoto" class="flex min-h-0 flex-1 flex-col gap-3">
      <div class="flex shrink-0 items-center justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-gray-900">顯示資訊</div>
          <div class="text-xs text-gray-400">只影響輸出的相框文字</div>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:border-amber-300 hover:text-amber-600"
          @click="resetCurrentInfo"
        >
          還原 EXIF
        </button>
      </div>

      <div
        class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 max-lg:flex max-lg:space-y-0 max-lg:gap-3 max-lg:overflow-x-auto max-lg:overflow-y-hidden max-lg:pr-0 max-lg:pb-1.5"
      >
        <div
          v-for="field in fields"
          :key="field.key"
          class="rounded-lg border border-gray-100 bg-gray-50 p-3 max-lg:w-60 max-lg:flex-[0_0_15rem]"
        >
          <div class="mb-2 flex items-center justify-between gap-3">
            <label class="text-xs font-semibold text-gray-700" :for="`info-${field.key}`">
              {{ field.label }}
            </label>
            <label class="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-500">
              <input
                type="checkbox"
                class="h-3.5 w-3.5 accent-amber-500"
                :checked="activeItem?.infoVisibility[field.visibilityKey]"
                @change="
                  updateVisibility(field.visibilityKey, ($event.target as HTMLInputElement).checked)
                "
              />
              顯示
            </label>
          </div>

          <textarea
            v-if="field.multiline"
            :id="`info-${field.key}`"
            class="h-auto w-full resize-none rounded-md border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none focus:border-amber-400"
            :value="getFieldValue(field.key)"
            :placeholder="field.placeholder"
            @input="updateField(field.key, ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
          <input
            v-else
            :id="`info-${field.key}`"
            type="text"
            class="h-9 w-full rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-800 outline-none focus:border-amber-400"
            :value="getFieldValue(field.key)"
            :placeholder="field.placeholder"
            @input="updateField(field.key, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>

    <div v-else class="flex h-full items-center justify-center text-sm text-gray-400">
      尚未選擇照片
    </div>
  </div>
</template>
