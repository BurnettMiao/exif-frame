import { ref, computed } from 'vue'
import ExifReader from 'exifreader'
import type { PhotoInfo, PhotoInfoVisibility } from '@/types/previewArea'
import { useFilterStore } from '@/stores/filterStore'
import { compressImage } from '@/utils/imageUtils'

export interface PreviewItem {
  id: string
  url: string
  sourceUrl: string
  cropUrl?: string
  info: PhotoInfo
  originalInfo: PhotoInfo
  infoVisibility: PhotoInfoVisibility
  ready?: Promise<PreviewItem>
}

interface AddPhotoOptions {
  select?: boolean
}

let nextPreviewItemId = 0
const previewItems = ref<PreviewItem[]>([])
const currentPreviewIndex = ref(0)
const activeItem = computed<PreviewItem | null>(
  () => previewItems.value[currentPreviewIndex.value] ?? null,
)

const getTagDescription = (tag: unknown) => {
  if (!tag || typeof tag !== 'object' || !('description' in tag)) return ''
  const description = (tag as { description?: unknown }).description
  return description == null ? '' : String(description)
}

export const defaultPhotoInfoVisibility = (): PhotoInfoVisibility => ({
  camera: true,
  lens: false,
  date: false,
  location: false,
  caption: false,
  exposure: true,
  aperture: true,
  iso: true,
})

/**
 * 管理照片清單：上傳 → 立即預覽 → 背景讀 EXIF / 壓縮 → 切換 / 刪除
 */
export function usePhotoCollection() {
  const filterStore = useFilterStore()

  function updatePreviewItem(
    target: PreviewItem,
    patch: Partial<
      Pick<
        PreviewItem,
        'url' | 'sourceUrl' | 'cropUrl' | 'info' | 'originalInfo' | 'infoVisibility'
      >
    >,
  ) {
    const index = previewItems.value.findIndex((item) => item.id === target.id)
    if (index === -1) return null

    const currentItem = previewItems.value[index]
    if (!currentItem) return null

    const updatedItem: PreviewItem = { ...currentItem, ...patch }
    previewItems.value.splice(index, 1, updatedItem)

    if (index === currentPreviewIndex.value) {
      filterStore.setPreviewUrl(updatedItem.url)
    }

    return updatedItem
  }

  async function readPhotoInfo(file: File): Promise<PhotoInfo> {
    try {
      const tags = await ExifReader.load(file)
      console.log('相片基本資訊', tags)

      const rawMake = getTagDescription(tags['Make'])
      const make = rawMake.split(' ')[0] || '未知廠牌'
      const rawModel = getTagDescription(tags['Model']) || '未知相機'
      const lens = getTagDescription(tags['LensModel']) || getTagDescription(tags['Lens'])
      const model =
        make !== '未知廠牌' && rawModel.startsWith(make)
          ? rawModel.slice(make.length).trim()
          : rawModel

      return {
        date:
          getTagDescription(tags['DateTimeOriginal']).split(' ')[0]?.replaceAll(':', '-') ||
          '未知日期',
        model,
        exposure: getTagDescription(tags['ExposureTime']) || '未知快門',
        aperture: getTagDescription(tags['FNumber']) || '未知光圈',
        iso: getTagDescription(tags['ISOSpeedRatings']) || '未知ISO',
        lens,
        location: '',
        caption: '',
        make,
      }
    } catch (error) {
      console.error('Exif 讀取失敗', error)
      return { error: '無法讀取此照片的 EXIF 資訊' }
    }
  }

  // 先加入原圖預覽，再於背景讀取 EXIF、壓縮圖片
  async function addPhoto(
    source: File | string,
    options: AddPhotoOptions = {},
  ): Promise<PreviewItem> {
    const shouldSelect = options.select ?? true
    let file: File

    if (typeof source === 'string') {
      const response = await fetch(source)
      const blob = await response.blob()
      file = new File([blob], 'preload-img.jpg', { type: blob.type })
    } else {
      file = source
    }

    const originalUrl = URL.createObjectURL(file)
    const item: PreviewItem = {
      id: String(nextPreviewItemId++),
      url: originalUrl,
      sourceUrl: originalUrl,
      info: { error: 'EXIF 讀取中' },
      originalInfo: { error: 'EXIF 讀取中' },
      infoVisibility: defaultPhotoInfoVisibility(),
    }
    previewItems.value.push(item)

    if (shouldSelect) {
      currentPreviewIndex.value = previewItems.value.length - 1
      filterStore.setPreviewUrl(item.url)
    }

    const infoPromise = readPhotoInfo(file).then((photoInfoData) => {
      return updatePreviewItem(item, { info: photoInfoData, originalInfo: photoInfoData }) ?? item
    })

    const compressionPromise = compressImage(file, 1920)
      .then((processedBlob) => {
        const compressedUrl = URL.createObjectURL(processedBlob)
        const currentItem = previewItems.value.find((previewItem) => previewItem.id === item.id)
        const updatedItem = updatePreviewItem(item, {
          sourceUrl: compressedUrl,
          url: currentItem?.cropUrl ? currentItem.url : compressedUrl,
        })

        if (updatedItem) {
          URL.revokeObjectURL(originalUrl)
        } else {
          URL.revokeObjectURL(compressedUrl)
        }

        return updatedItem ?? item
      })
      .catch((error) => {
        console.error('縮圖失敗，使用原始檔案', error)
        return item
      })

    item.ready = Promise.all([infoPromise, compressionPromise]).then(() => {
      return previewItems.value.find((previewItem) => previewItem.id === item.id) ?? item
    })

    return item
  }

  // 切換選中的照片
  function selectPhoto(index: number) {
    const item = previewItems.value[index]
    if (!item) return
    currentPreviewIndex.value = index
    filterStore.setPreviewUrl(item.url)
  }

  function applyCrop(target: PreviewItem, croppedBlob: Blob) {
    const croppedUrl = URL.createObjectURL(croppedBlob)
    const previousCropUrl = target.cropUrl
    const updatedItem = updatePreviewItem(target, {
      url: croppedUrl,
      cropUrl: croppedUrl,
    })

    if (!updatedItem) {
      URL.revokeObjectURL(croppedUrl)
      return null
    }

    if (previousCropUrl && previousCropUrl !== croppedUrl) {
      URL.revokeObjectURL(previousCropUrl)
    }

    return updatedItem
  }

  function resetCrop(target: PreviewItem) {
    if (!target.cropUrl) return target

    const previousCropUrl = target.cropUrl
    const updatedItem = updatePreviewItem(target, {
      url: target.sourceUrl,
      cropUrl: undefined,
    })

    URL.revokeObjectURL(previousCropUrl)
    return updatedItem ?? target
  }

  function updatePhotoInfo(target: PreviewItem, patch: Partial<PhotoInfo>) {
    return updatePreviewItem(target, {
      info: {
        ...target.info,
        ...patch,
        error: undefined,
      },
    })
  }

  function setInfoVisibility(target: PreviewItem, key: keyof PhotoInfoVisibility, value: boolean) {
    return updatePreviewItem(target, {
      infoVisibility: {
        ...target.infoVisibility,
        [key]: value,
      },
    })
  }

  function resetPhotoInfo(target: PreviewItem) {
    return updatePreviewItem(target, {
      info: { ...target.originalInfo },
      infoVisibility: defaultPhotoInfoVisibility(),
    })
  }

  // 刪除照片並釋放 object URL
  function deletePhoto(index: number) {
    const deletedItem = previewItems.value[index]
    if (deletedItem?.sourceUrl) {
      URL.revokeObjectURL(deletedItem.sourceUrl)
    }

    if (deletedItem?.cropUrl) {
      URL.revokeObjectURL(deletedItem.cropUrl)
    }

    previewItems.value.splice(index, 1)

    if (previewItems.value.length === 0) {
      filterStore.setPreviewUrl('')
      return
    }

    const newIndex = Math.min(index, previewItems.value.length - 1)
    const newItem = previewItems.value[newIndex]
    if (!newItem) return
    currentPreviewIndex.value = newIndex
    filterStore.setPreviewUrl(newItem.url)
  }

  return {
    previewItems,
    currentPreviewIndex,
    activeItem,
    addPhoto,
    selectPhoto,
    applyCrop,
    resetCrop,
    updatePhotoInfo,
    setInfoVisibility,
    resetPhotoInfo,
    deletePhoto,
  }
}
