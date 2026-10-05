<script setup lang="ts">
import { computed, nextTick, reactive, ref, onBeforeUnmount, onMounted, watch } from 'vue'
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

const maxPhotoCount = 10
const previewStack = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const currentImage = ref<HTMLImageElement | null>(null)
const logoImage = ref<HTMLImageElement | null>(null)
const currentFilter = ref<string>('none')
const currentGrainAmount = ref(0)
const previewFrameSize = ref({ width: 0, height: 0 })
const previewViewportSize = ref({ width: 0, height: 0 })
const isPreviewAnimating = ref(false)
const isPreviewPreparing = ref(false)
const isUploadingPhoto = ref(false)
const isExportingAll = ref(false)
// const showSupportPrompt = ref(false)
const showThumbnailStrip = ref(true)
// const supportUrl = ''
let previewAnimationTimer: number | null = null
let deferredStackPreviewTimer: number | null = null
let uploadToken = 0
const imageCache = new Map<string, Promise<HTMLImageElement>>()
const logoCache = new Map<string, Promise<HTMLImageElement | null>>()
const renderedPreviewCache = new Map<string, Promise<RenderedPreview>>()
const renderedPreviewUrlCache = new Map<string, Promise<string>>()
const renderedPreviewUrls = reactive(new Map<string, string>())
const renderedPreviewSizes = reactive(new Map<string, { width: number; height: number }>())

interface RenderedPreview {
  canvas: HTMLCanvasElement
  image: HTMLImageElement
  logo: HTMLImageElement | null
}

interface StackedPreviewEntry {
  item: PreviewItem
  itemIndex: number
  stackIndex: number
  isIncoming?: boolean
}

interface ZipEntry {
  name: string
  data: Uint8Array
}

const textEncoder = new TextEncoder()
let crcTable: Uint32Array | null = null

const getCrcTable = () => {
  if (crcTable) return crcTable

  const table = new Uint32Array(256)
  for (let index = 0; index < table.length; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[index] = value >>> 0
  }

  crcTable = table
  return table
}

const getCrc32 = (data: Uint8Array) => {
  const table = getCrcTable()
  let crc = 0xffffffff

  for (const byte of data) {
    crc = table[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

const writeUint16 = (target: Uint8Array, offset: number, value: number) => {
  target[offset] = value & 0xff
  target[offset + 1] = (value >>> 8) & 0xff
}

const writeUint32 = (target: Uint8Array, offset: number, value: number) => {
  target[offset] = value & 0xff
  target[offset + 1] = (value >>> 8) & 0xff
  target[offset + 2] = (value >>> 16) & 0xff
  target[offset + 3] = (value >>> 24) & 0xff
}

const toArrayBuffer = (data: Uint8Array) => {
  const copy = new Uint8Array(data.byteLength)
  copy.set(data)
  return copy.buffer
}

const createZipBlob = (entries: ZipEntry[]) => {
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  entries.forEach((entry) => {
    const filename = textEncoder.encode(entry.name)
    const crc = getCrc32(entry.data)
    const localHeader = new Uint8Array(30 + filename.length)
    const centralHeader = new Uint8Array(46 + filename.length)

    writeUint32(localHeader, 0, 0x04034b50)
    writeUint16(localHeader, 4, 20)
    writeUint16(localHeader, 6, 0)
    writeUint16(localHeader, 8, 0)
    writeUint16(localHeader, 10, 0)
    writeUint16(localHeader, 12, 0)
    writeUint32(localHeader, 14, crc)
    writeUint32(localHeader, 18, entry.data.length)
    writeUint32(localHeader, 22, entry.data.length)
    writeUint16(localHeader, 26, filename.length)
    writeUint16(localHeader, 28, 0)
    localHeader.set(filename, 30)

    writeUint32(centralHeader, 0, 0x02014b50)
    writeUint16(centralHeader, 4, 20)
    writeUint16(centralHeader, 6, 20)
    writeUint16(centralHeader, 8, 0)
    writeUint16(centralHeader, 10, 0)
    writeUint16(centralHeader, 12, 0)
    writeUint16(centralHeader, 14, 0)
    writeUint32(centralHeader, 16, crc)
    writeUint32(centralHeader, 20, entry.data.length)
    writeUint32(centralHeader, 24, entry.data.length)
    writeUint16(centralHeader, 28, filename.length)
    writeUint16(centralHeader, 30, 0)
    writeUint16(centralHeader, 32, 0)
    writeUint16(centralHeader, 34, 0)
    writeUint16(centralHeader, 36, 0)
    writeUint32(centralHeader, 38, 0)
    writeUint32(centralHeader, 42, offset)
    centralHeader.set(filename, 46)

    localParts.push(localHeader, entry.data)
    centralParts.push(centralHeader)
    offset += localHeader.length + entry.data.length
  })

  const centralDirectorySize = centralParts.reduce((total, part) => total + part.length, 0)
  const endRecord = new Uint8Array(22)
  writeUint32(endRecord, 0, 0x06054b50)
  writeUint16(endRecord, 4, 0)
  writeUint16(endRecord, 6, 0)
  writeUint16(endRecord, 8, entries.length)
  writeUint16(endRecord, 10, entries.length)
  writeUint32(endRecord, 12, centralDirectorySize)
  writeUint32(endRecord, 16, offset)
  writeUint16(endRecord, 20, 0)

  return new Blob([...localParts, ...centralParts, endRecord].map(toArrayBuffer), {
    type: 'application/zip',
  })
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

// const openSupportLink = () => {
//   if (!supportUrl) {
//     window.alert('支持連結準備中，之後會放上 Buy Me a Coffee。')
//     return
//   }
//
//   window.open(supportUrl, '_blank', 'noopener,noreferrer')
// }

const canvasToJpegBytes = (sourceCanvas: HTMLCanvasElement) =>
  new Promise<Uint8Array>((resolve, reject) => {
    sourceCanvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('圖片匯出失敗'))
          return
        }

        resolve(new Uint8Array(await blob.arrayBuffer()))
      },
      'image/jpeg',
      0.95,
    )
  })

const setExportingAll = (isExporting: boolean) => {
  isExportingAll.value = isExporting
  window.dispatchEvent(
    new CustomEvent('exif-frame:export-all-state', {
      detail: { isExporting },
    }),
  )
}

const setCanvasRef = (element: unknown) => {
  const nextCanvas = element instanceof HTMLCanvasElement ? element : null
  if (canvas.value === nextCanvas) return

  canvas.value = nextCanvas
  updatePreviewFrameSize()

  if (nextCanvas && activeItem.value) {
    const token = loadToken
    void renderPreviewItem(activeItem.value)
      .then((renderedPreview) => {
        if (token !== loadToken || canvas.value !== nextCanvas) return
        currentImage.value = renderedPreview.image
        logoImage.value = renderedPreview.logo
        copyRenderedPreviewToCanvas(renderedPreview)
      })
      .catch((error) => {
        console.error('預覽圖片載入失敗', error)
      })
  }
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

const stackedPreviewItems = computed<StackedPreviewEntry[]>(() => {
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

const animatedStackedPreviewItems = computed<StackedPreviewEntry[]>(() => {
  const items = [...stackedPreviewItems.value]
  const total = previewItems.value.length

  if (!isPreviewAnimating.value || total <= 2) return items

  const incomingItemIndex = (currentPreviewIndex.value + 3) % total
  const incomingItem = previewItems.value[incomingItemIndex]
  if (!incomingItem) return items

  items.push({
    item: incomingItem,
    itemIndex: incomingItemIndex,
    stackIndex: 3,
    isIncoming: true,
  })

  return items
})

const previewStackStyle = computed(() => {
  const baseSize = Math.min(previewViewportSize.value.width, previewViewportSize.value.height)
  const stackOffset = baseSize ? Math.min(Math.max(baseSize * 0.028, 18), 48) : 18
  const stackRotation = 1.5

  return {
    '--stack-size': animatedStackedPreviewItems.value.length,
    '--stack-offset': `${stackOffset}px`,
    '--stack-rotation': `${stackRotation}deg`,
  }
})

const getPreviewCardKey = (item: PreviewItem, stackIndex: number, isIncoming = false) => {
  if (isIncoming) return `${item.id}-incoming`
  if (previewItems.value.length >= 3) return item.id
  return `${item.id}-${stackIndex}`
}

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
    JSON.stringify(item.infoVisibility),
    JSON.stringify(layoutStore.currentLayout),
    currentFilter.value,
    currentGrainAmount.value,
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
      infoVisibility: item.infoVisibility,
      logo,
      filter: currentFilter.value,
      grainAmount: currentGrainAmount.value,
    })

    renderedPreviewSizes.set(cacheKey, {
      width: offscreenCanvas.width,
      height: offscreenCanvas.height,
    })

    return { canvas: offscreenCanvas, image, logo }
  })

  renderedPreviewCache.set(cacheKey, renderPromise)
  return renderPromise
}

const getRenderedPreviewUrl = (item: PreviewItem) => {
  const cacheKey = getPreviewRenderKey(item)
  const cachedUrl = renderedPreviewUrls.get(cacheKey)
  if (cachedUrl) return cachedUrl

  const previousRenderedUrl = [...renderedPreviewUrls.entries()]
    .reverse()
    .find(([key]) => key.startsWith(`${item.id}|`))?.[1]

  return previousRenderedUrl ?? item.url
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
      return url
    })
    .catch((error) => {
      renderedPreviewUrlCache.delete(cacheKey)
      throw error
    })

  renderedPreviewUrlCache.set(cacheKey, urlPromise)
  return urlPromise
}

const clearRenderedPreviewCaches = (options: { keepRenderedUrls?: boolean } = {}) => {
  renderedPreviewCache.clear()
  renderedPreviewUrlCache.clear()
  renderedPreviewSizes.clear()

  if (!options.keepRenderedUrls) {
    renderedPreviewUrls.clear()
  }
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

const refreshPreview = (options: { deferStack?: boolean } = {}) => {
  clearRenderedPreviewCaches({ keepRenderedUrls: options.deferStack })
  render()

  if (!options.deferStack) {
    preloadUpcomingPreviewAssets()
    return
  }

  if (deferredStackPreviewTimer !== null) {
    window.clearTimeout(deferredStackPreviewTimer)
  }

  deferredStackPreviewTimer = window.setTimeout(() => {
    deferredStackPreviewTimer = null
    preloadUpcomingPreviewAssets()
  }, 220)
}

const getStackedPreviewItemsFromIndex = (startIndex: number) => {
  const total = previewItems.value.length
  if (total === 0) return []

  return Array.from({ length: Math.min(3, total) }, (_, stackIndex) => {
    return previewItems.value[(startIndex + stackIndex) % total]
  }).filter((item): item is PreviewItem => !!item)
}

const preparePreviewStackAssets = async (startIndex: number) => {
  const items = getStackedPreviewItemsFromIndex(startIndex)

  await Promise.all(
    items.map((item) => Promise.all([renderPreviewItem(item), prepareRenderedPreviewUrl(item)])),
  )
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
  const nextIndex = previewItems.value.findIndex((item) => item.id === nextItem.id)
  if (nextIndex === -1) return

  isPreviewPreparing.value = true
  try {
    await preparePreviewStackAssets(nextIndex)
    getStackedPreviewItemsFromIndex(nextIndex).forEach((item) => preloadPreviewAssets(item))
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

const toggleThumbnailStrip = async () => {
  showThumbnailStrip.value = !showThumbnailStrip.value
  await nextTick()
  updatePreviewFrameSize()
}

const updatePreviewFrameSize = () => {
  if (!previewStack.value) return

  const availableWidth = Math.max(0, previewStack.value.clientWidth - 52)
  const availableHeight = Math.max(0, previewStack.value.clientHeight - 52)
  if (
    previewViewportSize.value.width !== availableWidth ||
    previewViewportSize.value.height !== availableHeight
  ) {
    previewViewportSize.value = { width: availableWidth, height: availableHeight }
  }

  if (!canvas.value || !canvas.value.width || !canvas.value.height) return

  const frameSize = calculatePreviewFrameSize(canvas.value.width, canvas.value.height)
  if (
    frameSize &&
    (previewFrameSize.value.width !== frameSize.width ||
      previewFrameSize.value.height !== frameSize.height)
  ) {
    previewFrameSize.value = frameSize
  }
}

// 統一的繪製入口：畫面上看到的，就是最終匯出的樣子
const render = () => {
  if (!canvas.value || !currentImage.value) return
  renderFrame({
    canvas: canvas.value,
    image: currentImage.value,
    layout: layoutStore.currentLayout,
    info: activeItem.value?.info ?? null,
    infoVisibility: activeItem.value?.infoVisibility ?? null,
    logo: logoImage.value,
    filter: currentFilter.value,
    grainAmount: currentGrainAmount.value,
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
  const files = Array.from(target.files ?? [])
  if (files.length === 0) return

  const availableSlots = maxPhotoCount - previewItems.value.length
  const selectedFiles = files.slice(0, availableSlots)
  if (selectedFiles.length === 0) {
    target.value = ''
    return
  }

  const token = ++uploadToken
  const shouldKeepCurrentPreview = previewItems.value.length > 0

  isUploadingPhoto.value = true

  try {
    let firstReadyItem: PreviewItem | null = null

    for (const [index, file] of selectedFiles.entries()) {
      const item = await addPhoto(file, { select: !shouldKeepCurrentPreview && index === 0 })
      const readyItem = (await item.ready) ?? item

      if (token !== uploadToken) return

      await Promise.all([renderPreviewItem(readyItem), prepareRenderedPreviewUrl(readyItem)])
      firstReadyItem ??= readyItem
    }

    if (!firstReadyItem) return

    const readyIndex = previewItems.value.findIndex(
      (previewItem) => previewItem.id === firstReadyItem.id,
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
  canvas.value.toBlob(
    (blob) => {
      if (!blob) return
      downloadBlob(blob, 'edited-photo.jpg')
      // showSupportPrompt.value = true
    },
    'image/jpeg',
    0.95,
  )
}

const downloadAllImages = async () => {
  if (previewItems.value.length === 0 || isExportingAll.value) return

  setExportingAll(true)

  try {
    const entries = await Promise.all(
      previewItems.value.map(async (item, index) => {
        await item.ready
        const latestItem =
          previewItems.value.find((previewItem) => previewItem.id === item.id) ?? item
        const renderedPreview = await renderPreviewItem(latestItem)
        const data = await canvasToJpegBytes(renderedPreview.canvas)
        const fileNumber = String(index + 1).padStart(2, '0')

        return {
          name: `edited-photo-${fileNumber}.jpg`,
          data,
        }
      }),
    )

    downloadBlob(createZipBlob(entries), 'exif-frame-export.zip')
    // showSupportPrompt.value = true
  } catch (error) {
    console.error('批次匯出失敗', error)
    window.alert('批次匯出失敗，請再試一次。')
  } finally {
    setExportingAll(false)
  }
}

const handleExportAllRequest = () => {
  void downloadAllImages()
}

let previewResizeObserver: ResizeObserver | null = null

// 預先載入測試圖片
onMounted(() => {
  window.addEventListener('exif-frame:export-all', handleExportAllRequest)

  if (previewStack.value) {
    previewResizeObserver = new ResizeObserver(updatePreviewFrameSize)
    previewResizeObserver.observe(previewStack.value)
  }

  // addPhoto(pic)
})

onBeforeUnmount(() => {
  window.removeEventListener('exif-frame:export-all', handleExportAllRequest)
  setExportingAll(false)
  previewResizeObserver?.disconnect()
  if (previewAnimationTimer !== null) {
    window.clearTimeout(previewAnimationTimer)
  }
  if (deferredStackPreviewTimer !== null) {
    window.clearTimeout(deferredStackPreviewTimer)
  }
})

watch(
  () => filterStore.currentFilter,
  (newFilter) => {
    currentFilter.value = newFilter
    refreshPreview()
  },
  { immediate: true },
)

watch(
  () => filterStore.grainAmount,
  (newGrainAmount) => {
    currentGrainAmount.value = newGrainAmount
    refreshPreview({ deferStack: true })
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
  () => layoutStore.currentLayout,
  () => {
    refreshPreview({ deferStack: true })
  },
)
</script>

<template>
  <div class="preview-area">
    <!-- 上傳區域 -->
    <input
      id="image-upload"
      @change="handleFileUpload"
      class="hidden"
      type="file"
      accept="image/*"
      multiple
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
      <div class="relative w-full flex-1 min-h-0 flex items-center justify-center">
        <button
          type="button"
          class="thumbnail-strip-toggle"
          :aria-label="showThumbnailStrip ? '隱藏縮圖列' : '顯示縮圖列'"
          :title="showThumbnailStrip ? '隱藏縮圖列' : '顯示縮圖列'"
          @click="toggleThumbnailStrip"
        >
          <i
            :class="showThumbnailStrip ? 'ri-layout-bottom-line' : 'ri-layout-bottom-2-line'"
            aria-hidden="true"
          ></i>
        </button>
        <div
          ref="previewStack"
          class="preview-stack"
          :class="{ 'is-animating': isPreviewAnimating }"
          :style="previewStackStyle"
        >
          <button
            v-for="{ item, itemIndex, stackIndex, isIncoming } in animatedStackedPreviewItems"
            :key="getPreviewCardKey(item, stackIndex, isIncoming)"
            type="button"
            class="preview-card"
            :class="{ 'is-active': stackIndex === 0 && !isIncoming, 'is-incoming': isIncoming }"
            :style="{ '--stack-index': stackIndex, '--promote-index': Math.max(stackIndex - 1, 0) }"
            @click="selectPreviewCard(itemIndex, stackIndex)"
          >
            <canvas
              v-if="stackIndex === 0 && !isIncoming"
              :ref="setCanvasRef"
              class="preview-stack-canvas shadow-xl"
              :style="previewFrameStyle"
            ></canvas>
            <div v-else class="preview-stack-frame shadow-xl" :style="getPreviewFrameStyle(item)">
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
        <label
          v-if="!showThumbnailStrip && previewItems.length < maxPhotoCount"
          for="image-upload"
          class="preview-upload-button"
          aria-label="新增照片"
          title="新增照片"
        >
          <i class="ri-image-add-line" aria-hidden="true"></i>
        </label>
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
        <!-- <div
          v-if="showSupportPrompt"
          class="support-prompt"
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            class="support-prompt-close"
            title="關閉"
            aria-label="關閉支持提示"
            @click="showSupportPrompt = false"
          >
            <i class="ri-close-line" aria-hidden="true"></i>
          </button>
          <div class="support-prompt-icon">
            <i class="ri-cup-line" aria-hidden="true"></i>
          </div>
          <div class="support-prompt-copy">
            <p class="support-prompt-title">喜歡這個工具嗎？</p>
            <p class="support-prompt-text">
              如果它幫你做出喜歡的照片，可以請我喝杯咖啡，支持我繼續做更多相框模板。
            </p>
          </div>
          <button type="button" class="support-prompt-action" @click="openSupportLink">
            支持開發
          </button>
        </div> -->
      </div>

      <!-- 縮圖列 -->
      <ThumbnailStrip
        v-if="showThumbnailStrip"
        :items="previewItems"
        :current-index="currentPreviewIndex"
        :max-count="maxPhotoCount"
        @select="selectThumbnailPhoto"
        @delete="deletePhoto"
      />
    </div>
  </div>
</template>

<style scoped>
.preview-area {
  position: relative;
  width: 100%;
  height: 100%;
  background: #f3f4f6;
  padding: 20px;
  overflow: hidden;
}

.preview-stack {
  --stack-size: 1;
  --stack-offset: 18px;
  --stack-rotation: 1.5deg;

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

.thumbnail-strip-toggle,
.preview-upload-button {
  position: absolute;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 999px;
  background: rgb(255 255 255 / 94%);
  color: #111827;
  font-size: 20px;
  box-shadow: 0 12px 26px rgb(15 23 42 / 14%);
  transition:
    transform 180ms ease,
    background-color 180ms ease;
}

.thumbnail-strip-toggle {
  top: 16px;
  right: 24px;
}

.preview-upload-button {
  right: 140px;
  bottom: 16px;
  cursor: pointer;
}

.thumbnail-strip-toggle:hover,
.preview-upload-button:hover {
  transform: translateY(-2px);
  background: white;
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

.support-prompt {
  position: absolute;
  right: 24px;
  bottom: 72px;
  z-index: 18;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: min(520px, calc(100% - 48px));
  padding: 14px 48px 14px 14px;
  border: 1px solid rgb(245 158 11 / 28%);
  border-radius: 12px;
  background: rgb(255 255 255 / 96%);
  color: #111827;
  box-shadow: 0 20px 44px rgb(15 23 42 / 16%);
  backdrop-filter: blur(8px);
}

.support-prompt-close {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #6b7280;
  font-size: 18px;
  cursor: pointer;
}

.support-prompt-close:hover {
  color: #d97706;
}

.support-prompt-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: #fffbeb;
  color: #d97706;
  font-size: 22px;
}

.support-prompt-copy {
  min-width: 0;
}

.support-prompt-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.support-prompt-text {
  margin: 3px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: #4b5563;
}

.support-prompt-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: #111827;
  color: white;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.support-prompt-action:hover {
  background: #f59e0b;
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
  transform: translate(
      calc(var(--stack-index) * var(--stack-offset)),
      calc(var(--stack-index) * var(--stack-offset))
    )
    scale(calc(1 - var(--stack-index) * 0.045))
    rotate(calc(var(--stack-index) * var(--stack-rotation)));
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
  transform: translate(
      calc(var(--promote-index) * var(--stack-offset)),
      calc(var(--promote-index) * var(--stack-offset))
    )
    scale(calc(1 - var(--promote-index) * 0.045))
    rotate(calc(var(--promote-index) * var(--stack-rotation)));
}

.preview-stack.is-animating .preview-card.is-incoming {
  pointer-events: none;
  animation: preview-card-fade-in 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes preview-card-fade-in {
  from {
    opacity: 0;
    transform: translate(calc(var(--stack-offset) * 3 + 52px), calc(var(--stack-offset) * 3 + 52px))
      scale(0.86) rotate(calc(var(--stack-rotation) * 3));
  }

  to {
    opacity: 1;
    transform: translate(calc(var(--stack-offset) * 2), calc(var(--stack-offset) * 2))
      scale(calc(1 - 2 * 0.045)) rotate(calc(var(--stack-rotation) * 2));
  }
}

.preview-card:not(.is-active) {
  opacity: 1;
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
  /* box-shadow: 0 22px 45px rgb(15 23 42 / 18%); */
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

@media (max-width: 1023px) {
  .preview-area {
    padding: 12px;
  }

  .preview-stack {
    padding: 6px 32px 32px 6px;
  }

  .next-preview-button {
    right: 14px;
    bottom: 10px;
    min-width: 44px;
    width: 44px;
    height: 44px;
    padding: 0;
    border-radius: 999px;
  }

  .next-preview-button span {
    display: none;
  }

  .thumbnail-strip-toggle {
    top: 10px;
    right: 14px;
    width: 40px;
    height: 40px;
  }

  .preview-upload-button {
    right: 66px;
    bottom: 10px;
    width: 44px;
    height: 44px;
  }

  .support-prompt {
    bottom: 64px;
  }
}

@media (max-width: 640px) {
  .support-prompt {
    right: 12px;
    grid-template-columns: auto minmax(0, 1fr);
    width: calc(100% - 24px);
    padding: 12px 42px 12px 12px;
  }

  .support-prompt-action {
    grid-column: 1 / -1;
    width: 100%;
  }
}
</style>
