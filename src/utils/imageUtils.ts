/**
 * 將 File/Blob 圖片縮圖，回傳壓縮後的 Blob
 * @param file - 原始檔案
 * @param maxSide - 最大邊長（預設 1920px）
 */

export function compressImage(file: File | Blob, maxSide = 1920): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // 1. 計算縮圖尺寸（保持比例）
      let width = img.width
      let height = img.height

      if (width > height) {
        height = Math.round((height * maxSide) / width)
        width = maxSide
      } else {
        width = Math.round((width * maxSide) / height)
        height = maxSide
      }

      // 2. 用 Canvas 繪製縮圖
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)

      // 3. Canvas → Blob（品質 0.92）
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob 失敗'))
        },
        'image/jpeg',
        0.92,
      )

      // 4. 釋放圖片記憶體
      URL.revokeObjectURL(img.src)
    }

    img.onerror = () => reject(new Error('圖片載入失敗'))
    img.src = URL.createObjectURL(file)
  })
}
