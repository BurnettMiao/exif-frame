import type { PhotoInfo } from '@/types/previewArea'
import type { FrameLayout } from '@/types/layout'

export interface RenderFrameParams {
  canvas: HTMLCanvasElement
  image: HTMLImageElement
  layout: FrameLayout
  info: PhotoInfo | null
  logo: HTMLImageElement | null
  filter: string
}

/**
 * 統一的繪製函式：畫面上看到的，就是最終匯出的樣子
 */
export function renderFrame({ canvas, image, layout, info, logo, filter }: RenderFrameParams): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { padding, gapRatio, logoScale, infoPosition, logoPosition } = layout

  // ===== Canvas 照片＋info高度（全部依圖片最大值比例計算）=====
  const base = Math.max(image.width, image.height)
  // 1. 字體大小 = 圖片最大值的 3%
  const infoLineHeight = Math.round(base * 0.03)
  // 2. 間距 = 圖片最大值的 4%
  const infoPadding = Math.round(base * 0.04)

  // Padding 為比例值（例如 0.15 = 圖片最大值的 15%）
  const padTop = Math.round(base * padding.top)
  const padBottom = Math.round(base * padding.bottom)
  const padLeft = Math.round(base * padding.left)
  const padRight = Math.round(base * padding.right)

  // Gap 也為比例值
  const gap = Math.round(base * gapRatio)

  // 3. 是否有資訊區
  const hasInfo = !!info && !info.error
  // 4. 資訊區
  const infoHeight = hasInfo ? infoLineHeight * 3 + infoPadding * 2 : 0

  // ***** 此處為全部 canvas 最後的高度與寬度 *****
  canvas.width = image.width + padLeft + padRight
  canvas.height = image.height + padTop + padBottom + infoHeight

  // 底色（避免 jpg 匯出時資訊區變黑）
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 畫照片（套用濾鏡）
  ctx.save()
  ctx.filter = filter
  ctx.drawImage(image, padLeft, padTop, image.width, image.height)
  ctx.restore()

  // 統一算好 Logo 尺寸（使用 base，讓 logo 跟圖片最大邊比例一致）
  let logoWidth = logo ? base * logoScale : 0
  let logoHeight = logo && logoWidth ? (logo.height / logo.width) * logoWidth : 0

  // Logo 高度最大不超過 infoHeight
  const maxLogoHeight = infoHeight - infoPadding * 2.4
  if (logoHeight > maxLogoHeight) {
    const aspectRatio = logo ? logo.height / logo.width : 1
    logoHeight = maxLogoHeight
    logoWidth = maxLogoHeight / aspectRatio
  }

  // 畫 Logo (不受濾鏡影響)
  if (logo) {
    let x: number
    // logo x position
    switch (logoPosition) {
      case 'center':
      case 'center-top':
        x = padLeft + image.width / 2 - logoWidth / 2
        break
      case 'center-left':
        x = padLeft + image.width / 2 - logoWidth - gap / 2
        break
      case 'right':
        x = padLeft + image.width - logoWidth
        break
      case 'left':
      default:
        x = padLeft
    }
    // logo y position
    let y: number
    switch (logoPosition) {
      case 'center-top':
        y = padTop + image.height + infoPadding
        break
      default:
        y = padTop + image.height + infoPadding + infoLineHeight / 2
    }

    ctx.drawImage(logo, x, y, logoWidth, logoHeight)
  }

  // 畫 EXIF 資訊（不受濾鏡影響）
  if (hasInfo) {
    ctx.fillStyle = '#4b5563'
    ctx.font = `${infoLineHeight}px monospace`
    ctx.textBaseline = 'top'
    ctx.textAlign = 'right'

    // info x position
    let x: number
    switch (infoPosition) {
      case 'left':
        ctx.textAlign = 'left'
        x = padLeft
        break
      case 'center-right':
        ctx.textAlign = 'left'
        x = padLeft + gap / 2 + image.width / 2
        break
      case 'center-bottom':
        ctx.textAlign = 'center'
        x = padLeft + image.width / 2
        break
      default:
        ctx.textAlign = 'right'
        x = padLeft + image.width
    }
    // info y position
    let y: number
    switch (infoPosition) {
      case 'center-bottom':
        y = padTop + image.height + infoPadding + logoHeight + infoPadding / 2
        break
      case 'center-right':
        y = padTop + image.height + infoPadding
        break
      default:
        y = padTop + image.height + infoPadding
    }

    y += infoLineHeight / 2
    ctx.font = `${infoLineHeight * 1.25}px monospace`
    ctx.fillText(`Shot on ${info.make}`, x, y)
    y += gap
    ctx.font = `${infoLineHeight * 0.95}px monospace`
    ctx.fillStyle = '#C0C0C0'
    ctx.fillText(`${info.aperture} | ${info.exposure}s | ISO ${info.iso}`, x, y)
  }
}
