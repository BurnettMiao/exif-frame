import { ref, computed } from 'vue'
import ExifReader from 'exifreader'
import type { PhotoInfo } from '@/types/previewArea'
import { useFilterStore } from '@/stores/filterStore'
import { compressImage } from '@/utils/imageUtils'

export interface PreviewItem {
  url: string
  info: PhotoInfo
}

/**
 * 管理照片清單：上傳 → 讀 EXIF → 壓縮 → 切換 / 刪除
 */
export function usePhotoCollection() {
  const filterStore = useFilterStore()

  const previewItems = ref<PreviewItem[]>([])
  const currentPreviewIndex = ref(0)
  const activeItem = computed<PreviewItem | null>(
    () => previewItems.value[currentPreviewIndex.value] ?? null,
  )

  // 讀取 EXIF、壓縮圖片並加入預覽清單
  async function addPhoto(source: File | string): Promise<PreviewItem> {
    let file: File

    if (typeof source === 'string') {
      const response = await fetch(source)
      const blob = await response.blob()
      file = new File([blob], 'preload-img.jpg', { type: blob.type })
    } else {
      file = source
    }

    // Step 1：先讀 EXIF（原始檔案才有資料）
    let photoInfoData: PhotoInfo
    try {
      const tags = await ExifReader.load(file)
      photoInfoData = {
        date: tags['DateTimeOriginal']?.description.split(' ')[0]?.replaceAll(':', '-') || '未知日期',
        model: tags['Model']?.description || '未知相機',
        exposure: tags['ExposureTime']?.description || '未知快門',
        aperture: tags['FNumber']?.description || '未知光圈',
        iso: tags['ISOSpeedRatings']?.description || '未知ISO',
        make: tags['Make']?.description.split(' ')[0] || '未知廠牌',
      }
    } catch (error) {
      console.error('Exif 讀取失敗', error)
      photoInfoData = { error: '無法讀取此照片的 EXIF 資訊' }
    }

    // Step 2：再壓縮（EXIF 已經讀完了，丟失也沒關係）
    let processedBlob: Blob
    try {
      processedBlob = await compressImage(file, 1920)
    } catch (error) {
      console.error('縮圖失敗，使用原始檔案', error)
      processedBlob = file // 失敗就退回原檔
    }

    // Step 3：加入預覽清單並設為目前照片
    const item: PreviewItem = { url: URL.createObjectURL(processedBlob), info: photoInfoData }
    previewItems.value.push(item)
    currentPreviewIndex.value = previewItems.value.length - 1
    filterStore.setPreviewUrl(item.url)

    return item
  }

  // 切換選中的照片
  function selectPhoto(index: number) {
    const item = previewItems.value[index]
    if (!item) return
    currentPreviewIndex.value = index
    filterStore.setPreviewUrl(item.url)
  }

  // 刪除照片並釋放 object URL
  function deletePhoto(index: number) {
    const deletedItem = previewItems.value[index]
    if (deletedItem?.url) {
      URL.revokeObjectURL(deletedItem.url)
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

  return { previewItems, currentPreviewIndex, activeItem, addPhoto, selectPhoto, deletePhoto }
}
