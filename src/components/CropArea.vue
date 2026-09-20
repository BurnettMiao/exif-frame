<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import 'cropperjs'
import type { CropperImage, CropperSelection } from 'cropperjs'
import { usePhotoCollection } from '@/composables/usePhotoCollection'
import { useEditorStore } from '@/stores/editorStore'

const { activeItem, applyCrop, resetCrop } = usePhotoCollection()
const editorStore = useEditorStore()

const cropperImage = ref<CropperImage | null>(null)
const cropperSelection = ref<CropperSelection | null>(null)
const isApplying = ref(false)
const cropperKey = ref(0)
const sourceAspectRatio = ref<number | null>(null)

const cropSourceUrl = computed(() => activeItem.value?.sourceUrl ?? '')
const hasPhoto = computed(() => !!activeItem.value)
const hasCrop = computed(() => !!activeItem.value?.cropUrl)
const initialCropAspectRatio = computed(() => sourceAspectRatio.value ?? undefined)

const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error('裁切圖片輸出失敗'))
      },
      'image/jpeg',
      0.95,
    )
  })

const getCropOutputSize = async () => {
  const imageElement = cropperImage.value
  const selection = cropperSelection.value
  if (!imageElement || !selection) return null

  const sourceImage = await imageElement.$ready()
  const imageRect = imageElement.getBoundingClientRect()
  if (!imageRect.width || !imageRect.height) return null

  const widthScale = sourceImage.naturalWidth / imageRect.width
  const heightScale = sourceImage.naturalHeight / imageRect.height

  return {
    width: Math.max(1, Math.round(selection.width * widthScale)),
    height: Math.max(1, Math.round(selection.height * heightScale)),
  }
}

const zoomPhoto = (scale: number) => {
  cropperImage.value?.$zoom(scale)
}

const resetSelection = () => {
  cropperSelection.value?.$reset()
}

const applyCurrentCrop = async () => {
  const item = activeItem.value
  const selection = cropperSelection.value
  if (!item || !selection || isApplying.value) return

  isApplying.value = true

  try {
    const outputSize = await getCropOutputSize()
    const canvas = await selection.$toCanvas(outputSize ?? undefined)
    const blob = await canvasToBlob(canvas)
    const updatedItem = applyCrop(item, blob)

    if (updatedItem) {
      editorStore.selectPanel('排版區')
    }
  } catch (error) {
    console.error('裁切套用失敗', error)
  } finally {
    isApplying.value = false
  }
}

const resetCurrentCrop = () => {
  const item = activeItem.value
  if (!item) return

  resetCrop(item)
  cropperKey.value += 1
}

watch(
  cropSourceUrl,
  async () => {
    sourceAspectRatio.value = null

    if (cropSourceUrl.value) {
      try {
        sourceAspectRatio.value = await new Promise<number>((resolve, reject) => {
          const image = new Image()
          image.onload = () => {
            if (image.naturalWidth > 0 && image.naturalHeight > 0) {
              resolve(image.naturalWidth / image.naturalHeight)
              return
            }

            reject(new Error('照片尺寸讀取失敗'))
          }
          image.onerror = () => reject(new Error('照片載入失敗'))
          image.src = cropSourceUrl.value
        })
      } catch (error) {
        console.error('裁切比例讀取失敗', error)
      }
    }

    cropperKey.value += 1
    await nextTick()
    cropperSelection.value?.$reset()
  },
  { immediate: true },
)
</script>

<template>
  <div class="relative flex h-full w-full min-w-0 flex-col bg-gray-100 p-4 max-lg:p-3">
    <button
      type="button"
      class="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-gray-700 shadow-lg hover:text-amber-600 max-lg:top-3 max-lg:right-3"
      title="關閉"
      @click="editorStore.selectPanel('排版區')"
    >
      <i class="ri-close-line" aria-hidden="true"></i>
    </button>

    <div v-if="hasPhoto" class="flex h-full min-h-0 flex-col gap-3">
      <div class="min-h-0 flex-1 overflow-hidden border border-gray-200 bg-gray-50 shadow-xl">
        <cropper-canvas
          :key="`${activeItem?.id ?? 'empty'}-${cropperKey}`"
          background
          class="block h-full w-full"
        >
          <cropper-image
            ref="cropperImage"
            :src="cropSourceUrl"
            alt="Photo"
            scalable
            translatable
          ></cropper-image>
          <cropper-shade hidden></cropper-shade>
          <cropper-handle action="move" plain></cropper-handle>
          <cropper-selection
            ref="cropperSelection"
            initial-coverage="1"
            :initial-aspect-ratio="initialCropAspectRatio"
            movable
            resizable
            zoomable
            keyboard
            outlined
          >
            <cropper-grid role="grid" covered></cropper-grid>
            <cropper-crosshair centered></cropper-crosshair>
            <cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>
            <cropper-handle action="n-resize"></cropper-handle>
            <cropper-handle action="e-resize"></cropper-handle>
            <cropper-handle action="s-resize"></cropper-handle>
            <cropper-handle action="w-resize"></cropper-handle>
            <cropper-handle action="ne-resize"></cropper-handle>
            <cropper-handle action="nw-resize"></cropper-handle>
            <cropper-handle action="se-resize"></cropper-handle>
            <cropper-handle action="sw-resize"></cropper-handle>
          </cropper-selection>
        </cropper-canvas>
      </div>

      <div
        class="mx-auto grid w-full max-w-[520px] shrink-0 grid-cols-3 gap-2 rounded-lg bg-white/90 p-2 shadow-lg backdrop-blur"
      >
        <button
          type="button"
          class="flex h-9 items-center justify-center border border-gray-200 bg-white text-lg text-gray-700 hover:border-amber-300 hover:text-amber-600 rounded-lg cursor-pointer"
          title="縮小"
          @click="zoomPhoto(-0.1)"
        >
          <i class="ri-zoom-out-line" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="flex h-9 items-center justify-center border border-gray-200 bg-white text-lg text-gray-700 hover:border-amber-300 hover:text-amber-600 rounded-lg cursor-pointer"
          title="重設框線"
          @click="resetSelection"
        >
          <i class="ri-refresh-line" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="flex h-9 items-center justify-center border border-gray-200 bg-white text-lg text-gray-700 hover:border-amber-300 hover:text-amber-600 rounded-lg cursor-pointer"
          title="放大"
          @click="zoomPhoto(0.1)"
        >
          <i class="ri-zoom-in-line" aria-hidden="true"></i>
        </button>
      </div>

      <div
        class="mx-auto grid w-full max-w-[520px] shrink-0 grid-cols-2 gap-2 rounded-lg bg-white/90 p-2 shadow-lg backdrop-blur"
      >
        <button
          type="button"
          class="h-9 border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:border-amber-300 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg cursor-pointer"
          :disabled="!hasCrop || isApplying"
          @click="resetCurrentCrop"
        >
          還原
        </button>
        <button
          type="button"
          class="h-9 bg-amber-500 px-3 text-sm text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 rounded-lg cursor-pointer"
          :disabled="isApplying"
          @click="applyCurrentCrop"
        >
          {{ isApplying ? '處理中' : '套用' }}
        </button>
      </div>
    </div>

    <div v-else class="flex h-full items-center justify-center text-sm text-gray-400">
      尚未選擇照片
    </div>
  </div>
</template>
