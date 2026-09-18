<script setup lang="ts">
import { computed, nextTick, ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { useFilterStore } from '@/stores/filterStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { usePhotoCollection, type PreviewItem } from '@/composables/usePhotoCollection'
import { renderFrame } from '@/utils/renderEngine'
import { loadBrandLogo } from '@/utils/brandLogos'
import ThumbnailStrip from '@/components/ThumbnailStrip.vue'

import pic from '@/assets/DSC00255.jpg'

const filterStore = useFilterStore()
const layoutStore = useLayoutStore()

const { previewItems, currentPreviewIndex, activeItem, addPhoto, selectPhoto, deletePhoto } =
  usePhotoCollection()

const previewStack = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const currentImage = ref<HTMLImageElement | null>(null)
const logoImage = ref<HTMLImageElement | null>(null)
const currentFilter = ref<string>('none')
const previewFrameSize = ref({ width: 0, height: 0 })
const previewViewportSize = ref({ width: 0, height: 0 })
const isPreviewAnimating = ref(false)
const isPreviewPreparing = ref(false)
const isUploadingPhoto = ref(false)
const previewRenderVersion = ref(0)
let previewAnimationTimer: number | null = null
let uploadToken = 0
const imageCache = new Map<string, Promise<HTMLImageElement>>()
const logoCache = new Map<string, Promise<HTMLImageElement | null>>()
const renderedPreviewCache = new Map<string, Promise<RenderedPreview>>()
const renderedPreviewUrlCache = new Map<string, Promise<string>>()
const renderedPreviewUrls = new Map<string, string>()
const renderedPreviewSizes = new Map<string, { width: number; height: number }>()

interface RenderedPreview {
  canvas: HTMLCanvasElement
  image: HTMLImageElement
  logo: HTMLImageElement | null
}

const setCanvasRef = (element: unknown) => {
  canvas.value = element instanceof HTMLCanvasElement ? element : null
  updatePreviewFrameSize()
}

const previewFrameStyle = computed(() => {
  if (!previewFrameSize.value.width || !previewFrameSize.value.height) return {}

  return {
    width: `${previewFrameSize.value.width}px`,
    height: `${previewFrameSize.value.height}px`,
  }
})

const calculatePreviewFrameSize = (sourceWidth: number, sourceHeight: number) => {
  const { width: availableWidth, height: availableHeight } = previewViewportSize.value

  if (!availableWidth || !availableHeight || !sourceWidth || !sourceHeight) return null

  const sourceRatio = sourceWidth / sourceHeight
  const availableRatio = availableWidth / availableHeight

  if (availableRatio > sourceRatio) {
    const height = availableHeight
    return { width: Math.round(height * sourceRatio), height }
  }

  const width = availableWidth
  return { width, height: Math.round(width / sourceRatio) }
}

const getPreviewFrameStyle = (item: PreviewItem) => {
  previewRenderVersion.value

  const renderedSize = renderedPreviewSizes.get(getPreviewRenderKey(item))
  const frameSize = renderedSize
    ? calculatePreviewFrameSize(renderedSize.width, renderedSize.height)
    : previewFrameSize.value

  if (!frameSize?.width || !frameSize.height) return {}

  return {
    width: `${frameSize.width}px`,
    height: `${frameSize.height}px`,
  }
}

const canSelectNextPhoto = computed(() => previewItems.value.length > 1)

const stackedPreviewItems = computed(() => {
  const total = previewItems.value.length
  if (total === 0) return []

  return Array.from({ length: 3 }, (_, stackIndex) => {
    const itemIndex = (currentPreviewIndex.value + stackIndex) % total

    return {
      item: previewItems.value[itemIndex]!,
      itemIndex,
      stackIndex,
    }
  })
})

const selectPreviewCard = (itemIndex: number, stackIndex: number) => {
  if (
    isPreviewAnimating.value ||
    isPreviewPreparing.value ||
    isUploadingPhoto.value ||
    stackIndex === 0
  )
    return
  void preloadPreviewAssets(previewItems.value[itemIndex])
  selectPhoto(itemIndex)
}

const loadPreviewImage = (url: string): Promise<HTMLImageElement> => {
  const cachedImage = imageCache.get(url)
  if (cachedImage) return cachedImage

  const imagePromise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('圖片載入失敗'))
    img.src = url
  })

  imageCache.set(url, imagePromise)
  return imagePromise
}

const loadCachedBrandLogo = (brand: string) => {
  const cachedLogo = logoCache.get(brand)
  if (cachedLogo) return cachedLogo

  const logoPromise = loadBrandLogo(brand)
  logoCache.set(brand, logoPromise)
  return logoPromise
}

const getPreviewRenderKey = (item: PreviewItem) =>
  [
    item.id,
    item.url,
    JSON.stringify(item.info),
    layoutStore.currentIndex,
    currentFilter.value,
  ].join('|')

const renderPreviewItem = (item: PreviewItem): Promise<RenderedPreview> => {
  const cacheKey = getPreviewRenderKey(item)
  const cachedRender = renderedPreviewCache.get(cacheKey)
  if (cachedRender) return cachedRender

  const renderPromise = Promise.all([
    loadPreviewImage(item.url),
    loadCachedBrandLogo(item.info.make ?? ''),
  ]).then(([image, logo]) => {
    const offscreenCanvas = document.createElement('canvas')
    renderFrame({
      canvas: offscreenCanvas,
      image,
      layout: layoutStore.currentLayout,
      info: item.info,
      logo,
      filter: currentFilter.value,
    })

    renderedPreviewSizes.set(cacheKey, {
      width: offscreenCanvas.width,
      height: offscreenCanvas.height,
    })
    previewRenderVersion.value += 1

    return { canvas: offscreenCanvas, image, logo }
  })

  renderedPreviewCache.set(cacheKey, renderPromise)
  return renderPromise
}

const getRenderedPreviewUrl = (item: PreviewItem) => {
  previewRenderVersion.value
  return renderedPreviewUrls.get(getPreviewRenderKey(item)) ?? item.url
}

const prepareRenderedPreviewUrl = (item: PreviewItem): Promise<string> => {
  const cacheKey = getPreviewRenderKey(item)
  const cachedUrl = renderedPreviewUrls.get(cacheKey)
  if (cachedUrl) return Promise.resolve(cachedUrl)

  const cachedUrlPromise = renderedPreviewUrlCache.get(cacheKey)
  if (cachedUrlPromise) return cachedUrlPromise

  const urlPromise = renderPreviewItem(item)
    .then((renderedPreview) => {
      const url = renderedPreview.canvas.toDataURL('image/jpeg', 0.92)
      renderedPreviewUrls.set(cacheKey, url)
      previewRenderVersion.value += 1
      return url
    })
    .catch((error) => {
      renderedPreviewUrlCache.delete(cacheKey)
      throw error
    })

  renderedPreviewUrlCache.set(cacheKey, urlPromise)
  return urlPromise
}

const clearRenderedPreviewCaches = () => {
  renderedPreviewCache.clear()
  renderedPreviewUrlCache.clear()
  renderedPreviewUrls.clear()
  renderedPreviewSizes.clear()
  previewRenderVersion.value += 1
}

const copyRenderedPreviewToCanvas = (renderedPreview: RenderedPreview) => {
  if (!canvas.value) return

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  canvas.value.width = renderedPreview.canvas.width
  canvas.value.height = renderedPreview.canvas.height
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  ctx.drawImage(renderedPreview.canvas, 0, 0)
  updatePreviewFrameSize()
}

const preloadPreviewAssets = (item: PreviewItem | undefined) => {
  if (!item) return
  void loadPreviewImage(item.url).catch(() => {
    imageCache.delete(item.url)
  })
  void loadCachedBrandLogo(item.info.make ?? '')
  void renderPreviewItem(item).catch(() => {
    renderedPreviewCache.delete(getPreviewRenderKey(item))
  })
  void prepareRenderedPreviewUrl(item).catch(() => {
    renderedPreviewUrlCache.delete(getPreviewRenderKey(item))
  })
}

const preloadUpcomingPreviewAssets = () => {
  stackedPreviewItems.value.forEach(({ item }) => preloadPreviewAssets(item))
}

const finishPreviewAnimation = async () => {
  try {
    if (previewItems.value.length <= 1) return

    const nextIndex = (currentPreviewIndex.value + 1) % previewItems.value.length
    const nextItem = previewItems.value[nextIndex]

    if (!nextItem) return

    const renderedPreview = await renderPreviewItem(nextItem)
    isPreviewAnimating.value = false

    copyRenderedPreviewToCanvas(renderedPreview)
    currentImage.value = renderedPreview.image
    logoImage.value = renderedPreview.logo
    selectPhoto(nextIndex)

    await nextTick()
    updatePreviewFrameSize()
  } finally {
    isPreviewAnimating.value = false
    previewAnimationTimer = null
  }
}

const selectNextPhoto = async () => {
  if (
    !canSelectNextPhoto.value ||
    isPreviewAnimating.value ||
    isPreviewPreparing.value ||
    isUploadingPhoto.value
  )
    return

  const nextItem = previewItems.value[(currentPreviewIndex.value + 1) % previewItems.value.length]
  if (!nextItem) return

  isPreviewPreparing.value = true
  try {
    await Promise.all([renderPreviewItem(nextItem), prepareRenderedPreviewUrl(nextItem)])
    preloadPreviewAssets(nextItem)
  } catch (error) {
    console.error('下一張預覽準備失敗', error)
    return
  } finally {
    isPreviewPreparing.value = false
  }

  isPreviewAnimating.value = true

  previewAnimationTimer = window.setTimeout(() => {
    void finishPreviewAnimation()
  }, 600)
}

const selectThumbnailPhoto = (index: number) => {
  if (isPreviewAnimating.value || isPreviewPreparing.value || isUploadingPhoto.value) return
  selectPhoto(index)
}

const updatePreviewFrameSize = () => {
  if (!previewStack.value) return

  const availableWidth = Math.max(0, previewStack.value.clientWidth - 52)
  const availableHeight = Math.max(0, previewStack.value.clientHeight - 52)
  previewViewportSize.value = { width: availableWidth, height: availableHeight }

  if (!canvas.value || !canvas.value.width || !canvas.value.height) return

  const frameSize = calculatePreviewFrameSize(canvas.value.width, canvas.value.height)
  if (frameSize) previewFrameSize.value = frameSize
}

// 統一的繪製入口：畫面上看到的，就是最終匯出的樣子
const render = () => {
  if (!canvas.value || !currentImage.value) return
  renderFrame({
    canvas: canvas.value,
    image: currentImage.value,
    layout: layoutStore.currentLayout,
    info: activeItem.value?.info ?? null,
    logo: logoImage.value,
    filter: currentFilter.value,
  })
  updatePreviewFrameSize()
}

// 目前照片變更時：圖片與 logo 都準備好後一次繪製，避免先照片後資訊補上的頓挫
let loadToken = 0
watch(activeItem, async (item) => {
  const token = ++loadToken

  if (!item) {
    currentImage.value = null
    logoImage.value = null
    return
  }

  try {
    const renderedPreview = await renderPreviewItem(item)

    if (token !== loadToken) return
    currentImage.value = renderedPreview.image
    logoImage.value = renderedPreview.logo
    void prepareRenderedPreviewUrl(item)
    copyRenderedPreviewToCanvas(renderedPreview)
    preloadUpcomingPreviewAssets()
  } catch (error) {
    console.error('預覽圖片載入失敗', error)
  }
})

// 圖片上傳
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const token = ++uploadToken
  const shouldKeepCurrentPreview = previewItems.value.length > 0

  isUploadingPhoto.value = true

  try {
    const item = await addPhoto(file, { select: !shouldKeepCurrentPreview })
    const readyItem = (await item.ready) ?? item

    if (token !== uploadToken) return

    await Promise.all([renderPreviewItem(readyItem), prepareRenderedPreviewUrl(readyItem)])

    const readyIndex = previewItems.value.findIndex(
      (previewItem) => previewItem.id === readyItem.id,
    )
    if (readyIndex === -1) return

    selectPhoto(readyIndex)
  } catch (error) {
    console.error('照片加入失敗', error)
  } finally {
    if (token === uploadToken) {
      isUploadingPhoto.value = false
    }

    // 清空 input，才能再次選同一張圖片
    target.value = ''
  }
}

// 匯出：直接存畫面上的 canvas，不用再另外組合
const downloadImage = () => {
  if (!canvas.value) return
  const link = document.createElement('a')
  link.download = 'edited-photo.jpg'
  link.href = canvas.value.toDataURL('image/jpeg', 0.95)
  link.click()
}

let previewResizeObserver: ResizeObserver | null = null

// 預先載入測試圖片
onMounted(() => {
  if (previewStack.value) {
    previewResizeObserver = new ResizeObserver(updatePreviewFrameSize)
    previewResizeObserver.observe(previewStack.value)
  }

  addPhoto(pic)
})

onBeforeUnmount(() => {
  previewResizeObserver?.disconnect()
  if (previewAnimationTimer !== null) {
    window.clearTimeout(previewAnimationTimer)
  }
})

watch(
  () => filterStore.currentFilter,
  (newFilter) => {
    currentFilter.value = newFilter
    clearRenderedPreviewCaches()
    render()
    preloadUpcomingPreviewAssets()
  },
  { immediate: true },
)

// 監聽 store 的 triggerDownload
watch(
  () => filterStore.triggerDownload,
  (newVal, oldVal) => {
    if (newVal !== oldVal && newVal > 0) {
      downloadImage()
    }
  },
  { immediate: true },
)

watch(
  () => layoutStore.currentIndex,
  () => {
    clearRenderedPreviewCaches()
    render()
    preloadUpcomingPreviewAssets()
  },
)
</script>

<template>
  <div class="w-full h-full p-5 bg-gray-100">
    <!-- 上傳區域 -->
    <input
      id="image-upload"
      @change="handleFileUpload"
      class="hidden"
      type="file"
      accept="image/*"
      :disabled="isUploadingPhoto"
    />

    <!-- 無圖片時的上傳區 -->
    <div v-show="previewItems.length === 0" class="bg-white rounded-lg shadow p-4 w-full h-full">
      <label
        for="image-upload"
        class="w-full h-full border-2 border-dotted border-gray-500 rounded-lg flex items-center justify-center group cursor-pointer"
      >
        <div class="flex items-center justify-center gap-x-2">
          <i class="ri-image-upload-fill text-2xl group-hover:text-amber-400"></i>
          <span class="text-xl group-hover:text-amber-400">選擇檔案</span>
        </div>
      </label>
    </div>

    <!-- 有圖片時的預覽 -->
    <div
      v-show="previewItems.length > 0"
      class="w-full h-full flex flex-col items-center justify-center gap-y-5"
    >
      <!-- 大圖預覽 -->
      <div class="relative w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <div
          ref="previewStack"
          class="preview-stack"
          :class="{ 'is-animating': isPreviewAnimating }"
          :style="{ '--stack-size': stackedPreviewItems.length }"
        >
          <button
            v-for="{ item, itemIndex, stackIndex } in stackedPreviewItems"
            :key="`${item.id}-${stackIndex}`"
            type="button"
            class="preview-card"
            :class="{ 'is-active': stackIndex === 0 }"
            :style="{ '--stack-index': stackIndex, '--promote-index': Math.max(stackIndex - 1, 0) }"
            @click="selectPreviewCard(itemIndex, stackIndex)"
          >
            <canvas
              v-if="stackIndex === 0"
              :ref="setCanvasRef"
              class="preview-stack-canvas"
              :style="previewFrameStyle"
            ></canvas>
            <div v-else class="preview-stack-frame" :style="getPreviewFrameStyle(item)">
              <img :src="getRenderedPreviewUrl(item)" alt="" class="preview-stack-image" />
            </div>
          </button>
        </div>
        <button
          type="button"
          class="next-preview-button"
          :disabled="
            !canSelectNextPhoto || isPreviewAnimating || isPreviewPreparing || isUploadingPhoto
          "
          @click="selectNextPhoto"
        >
          <i class="ri-arrow-right-line" aria-hidden="true"></i>
          <span>Next</span>
        </button>
        <div
          v-if="isUploadingPhoto"
          class="upload-loading-overlay"
          role="status"
          aria-live="polite"
        >
          <div class="upload-loading-panel">
            <span class="upload-loading-spinner" aria-hidden="true"></span>
            <span>讀取照片中</span>
          </div>
        </div>
      </div>

      <!-- 縮圖列 -->
      <ThumbnailStrip
        :items="previewItems"
        :current-index="currentPreviewIndex"
        @select="selectThumbnailPhoto"
        @delete="deletePhoto"
      />
    </div>
  </div>
</template>

<style scoped>
.preview-stack {
  --stack-size: 1;

  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 44px 44px 8px;
}

.next-preview-button {
  position: absolute;
  right: 24px;
  bottom: 16px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 104px;
  height: 42px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: #111827;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 12px 26px rgb(15 23 42 / 18%);
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}

.next-preview-button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.next-preview-button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.upload-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(243 244 246 / 38%);
  backdrop-filter: blur(1.5px);
  pointer-events: auto;
}

.upload-loading-panel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 142px;
  height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgb(17 24 39 / 90%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 14px 32px rgb(15 23 42 / 18%);
}

.upload-loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgb(255 255 255 / 34%);
  border-top-color: white;
  border-radius: 999px;
  animation: upload-loading-spin 780ms linear infinite;
}

@keyframes upload-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

.preview-card {
  --stack-index: 0;
  --promote-index: 0;

  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% - 52px);
  height: calc(100% - 52px);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transform: translate(calc(var(--stack-index) * 18px), calc(var(--stack-index) * 18px))
    scale(calc(1 - var(--stack-index) * 0.045)) rotate(calc(var(--stack-index) * 1.5deg));
  transform-origin: center;
  transition:
    transform 220ms ease,
    opacity 220ms ease;
  z-index: calc(var(--stack-size) - var(--stack-index));
}

.preview-stack.is-animating .preview-card {
  transition:
    transform 600ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 600ms ease;
}

.preview-stack.is-animating .preview-card.is-active {
  opacity: 0;
  transform: translate(450px, 0) scale(1) rotate(20deg);
}

.preview-stack.is-animating .preview-card:not(.is-active) {
  opacity: 1;
  transform: translate(calc(var(--promote-index) * 18px), calc(var(--promote-index) * 18px))
    scale(calc(1 - var(--promote-index) * 0.045))
    rotate(calc(var(--promote-index) * 1.5deg));
}

.preview-card:not(.is-active) {
  opacity: 0.92;
}

.preview-card.is-active {
  cursor: default;
}

.preview-stack-canvas,
.preview-stack-frame {
  display: block;
  max-width: 100%;
  max-height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 22px 45px rgb(15 23 42 / 18%);
}

.preview-stack-frame {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-stack-image {
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  object-fit: contain;
}
</style>
