import type { PhotoInfo, PhotoInfoVisibility } from '@/types/previewArea'
import type { FrameLayout } from '@/types/layout'

type DisplayLineRole = 'title' | 'detail' | 'muted' | 'caption'

interface DisplayLine {
  text: string
  role: DisplayLineRole
}

export interface RenderFrameParams {
  canvas: HTMLCanvasElement
  image: HTMLImageElement
  layout: FrameLayout
  info: PhotoInfo | null
  infoVisibility: PhotoInfoVisibility | null
  logo: HTMLImageElement | null
  filter: string
}

let canvasFilterSupported: boolean | null = null

const clampColor = (value: number) => Math.min(255, Math.max(0, value))

const parseFilterAmount = (value: string, fallback = 1) => {
  const trimmedValue = value.trim()
  if (trimmedValue.endsWith('%')) {
    const percentage = Number.parseFloat(trimmedValue)
    return Number.isFinite(percentage) ? percentage / 100 : fallback
  }

  const amount = Number.parseFloat(trimmedValue)
  return Number.isFinite(amount) ? amount : fallback
}

const parseFilterAngle = (value: string) => {
  const trimmedValue = value.trim()
  const amount = Number.parseFloat(trimmedValue)
  if (!Number.isFinite(amount)) return 0
  if (trimmedValue.endsWith('rad')) return (amount * 180) / Math.PI
  if (trimmedValue.endsWith('turn')) return amount * 360
  return amount
}

const supportsCanvasFilter = () => {
  if (canvasFilterSupported !== null) return canvasFilterSupported
  if (typeof document === 'undefined') {
    canvasFilterSupported = false
    return canvasFilterSupported
  }

  const testCanvas = document.createElement('canvas')
  testCanvas.width = 1
  testCanvas.height = 1
  const testCtx = testCanvas.getContext('2d')
  if (!testCtx || !('filter' in testCtx)) {
    canvasFilterSupported = false
    return canvasFilterSupported
  }

  testCtx.filter = 'grayscale(1)'
  testCtx.fillStyle = 'rgb(255, 0, 0)'
  testCtx.fillRect(0, 0, 1, 1)

  const testPixel = testCtx.getImageData(0, 0, 1, 1).data
  const red = testPixel[0] ?? 0
  const green = testPixel[1] ?? 0
  const blue = testPixel[2] ?? 0
  canvasFilterSupported = red === green && green === blue
  return canvasFilterSupported
}

const applyMatrix = (
  data: Uint8ClampedArray,
  index: number,
  matrix: [number, number, number, number, number, number, number, number, number],
) => {
  const red = data[index] ?? 0
  const green = data[index + 1] ?? 0
  const blue = data[index + 2] ?? 0

  data[index] = clampColor(matrix[0] * red + matrix[1] * green + matrix[2] * blue)
  data[index + 1] = clampColor(matrix[3] * red + matrix[4] * green + matrix[5] * blue)
  data[index + 2] = clampColor(matrix[6] * red + matrix[7] * green + matrix[8] * blue)
}

const applyManualFilter = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  filter: string,
) => {
  if (!filter || filter === 'none') return

  const imageData = ctx.getImageData(x, y, width, height)
  const { data } = imageData
  const operations = [...filter.matchAll(/([a-z-]+)\(([^)]+)\)/g)]

  for (const operation of operations) {
    const name = operation[1]
    const rawValue = operation[2]
    if (!name || !rawValue) continue

    const amount = parseFilterAmount(rawValue)

    for (let index = 0; index < data.length; index += 4) {
      switch (name) {
        case 'brightness':
          data[index] = clampColor((data[index] ?? 0) * amount)
          data[index + 1] = clampColor((data[index + 1] ?? 0) * amount)
          data[index + 2] = clampColor((data[index + 2] ?? 0) * amount)
          break
        case 'contrast':
          data[index] = clampColor(((data[index] ?? 0) - 128) * amount + 128)
          data[index + 1] = clampColor(((data[index + 1] ?? 0) - 128) * amount + 128)
          data[index + 2] = clampColor(((data[index + 2] ?? 0) - 128) * amount + 128)
          break
        case 'saturate':
          applyMatrix(data, index, [
            0.213 + 0.787 * amount,
            0.715 - 0.715 * amount,
            0.072 - 0.072 * amount,
            0.213 - 0.213 * amount,
            0.715 + 0.285 * amount,
            0.072 - 0.072 * amount,
            0.213 - 0.213 * amount,
            0.715 - 0.715 * amount,
            0.072 + 0.928 * amount,
          ])
          break
        case 'grayscale':
          applyMatrix(data, index, [
            0.2126 + 0.7874 * (1 - amount),
            0.7152 - 0.7152 * (1 - amount),
            0.0722 - 0.0722 * (1 - amount),
            0.2126 - 0.2126 * (1 - amount),
            0.7152 + 0.2848 * (1 - amount),
            0.0722 - 0.0722 * (1 - amount),
            0.2126 - 0.2126 * (1 - amount),
            0.7152 - 0.7152 * (1 - amount),
            0.0722 + 0.9278 * (1 - amount),
          ])
          break
        case 'sepia':
          applyMatrix(data, index, [
            1 - amount + 0.393 * amount,
            0.769 * amount,
            0.189 * amount,
            0.349 * amount,
            1 - amount + 0.686 * amount,
            0.168 * amount,
            0.272 * amount,
            0.534 * amount,
            1 - amount + 0.131 * amount,
          ])
          break
        case 'hue-rotate': {
          const angle = (parseFilterAngle(rawValue) * Math.PI) / 180
          const cos = Math.cos(angle)
          const sin = Math.sin(angle)

          applyMatrix(data, index, [
            0.213 + 0.787 * cos - 0.213 * sin,
            0.715 - 0.715 * cos - 0.715 * sin,
            0.072 - 0.072 * cos + 0.928 * sin,
            0.213 - 0.213 * cos + 0.143 * sin,
            0.715 + 0.285 * cos + 0.14 * sin,
            0.072 - 0.072 * cos - 0.283 * sin,
            0.213 - 0.213 * cos - 0.787 * sin,
            0.715 - 0.715 * cos + 0.715 * sin,
            0.072 + 0.928 * cos + 0.072 * sin,
          ])
          break
        }
      }
    }
  }

  ctx.putImageData(imageData, x, y)
}

const getVisibleText = (value: unknown) => {
  if (value == null) return ''
  return String(value).trim()
}

const buildDisplayLines = (
  info: PhotoInfo | null,
  visibility: PhotoInfoVisibility | null,
): DisplayLine[] => {
  if (!info || info.error || !visibility) return []

  const lines: DisplayLine[] = []
  const camera = getVisibleText(info.model)

  if (visibility.camera && camera) {
    lines.push({ text: `Shot on ${camera}`, role: 'title' })
  }

  const detailParts = [
    visibility.lens ? getVisibleText(info.lens) : '',
    visibility.aperture ? getVisibleText(info.aperture) : '',
    visibility.exposure ? getVisibleText(info.exposure) : '',
    visibility.iso ? `ISO ${getVisibleText(info.iso).replace(/^ISO\s*/i, '')}` : '',
  ].filter(Boolean)

  if (detailParts.length > 0) {
    lines.push({ text: detailParts.join(' | '), role: 'detail' })
  }

  const metaParts = [
    visibility.location ? getVisibleText(info.location) : '',
    visibility.date ? getVisibleText(info.date) : '',
  ].filter(Boolean)

  if (metaParts.length > 0) {
    lines.push({ text: metaParts.join(' | '), role: 'muted' })
  }

  const caption = visibility.caption ? getVisibleText(info.caption) : ''
  if (caption) {
    lines.push({ text: caption, role: 'caption' })
  }

  return lines
}

const getLineScale = (role: DisplayLineRole) => {
  switch (role) {
    case 'title':
      return 1.25
    case 'caption':
      return 1.05
    default:
      return 0.95
  }
}

const getLineColor = (role: DisplayLineRole) => {
  switch (role) {
    case 'title':
      return '#4b5563'
    case 'caption':
      return '#6b7280'
    default:
      return '#C0C0C0'
  }
}

const measureTextBlock = (
  ctx: CanvasRenderingContext2D,
  lines: DisplayLine[],
  baseLineHeight: number,
  lineGap: number,
) => {
  let width = 0
  let height = 0

  ctx.save()
  lines.forEach((line, index) => {
    const fontSize = baseLineHeight * getLineScale(line.role)
    ctx.font = `${fontSize}px monospace`
    width = Math.max(width, ctx.measureText(line.text).width)
    height += fontSize
    if (index < lines.length - 1) {
      height += lineGap
    }
  })
  ctx.restore()

  return { width, height }
}

/**
 * 統一的繪製函式：畫面上看到的，就是最終匯出的樣子
 */
export function renderFrame({
  canvas,
  image,
  layout,
  info,
  infoVisibility,
  logo,
  filter,
}: RenderFrameParams): void {
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
  const lineGap = Math.max(4, Math.round(infoLineHeight * 0.58))

  // 3. 是否有資訊區
  const displayLines = buildDisplayLines(info, infoVisibility)
  const hasInfo = displayLines.length > 0
  const textBlock = measureTextBlock(ctx, displayLines, infoLineHeight, lineGap)
  // 4. 資訊區
  const infoHeight = hasInfo ? Math.ceil(textBlock.height + infoPadding * 2) : 0

  // 統一算好 Logo 尺寸（使用 base，讓 logo 跟圖片最大邊比例一致）
  let logoWidth = logo ? base * logoScale : 0
  let logoHeight = logo && logoWidth ? (logo.height / logo.width) * logoWidth : 0

  // Logo 高度最大不超過 infoHeight
  const maxLogoHeight = hasInfo ? Math.max(0, infoHeight - infoPadding * 2.4) : logoHeight
  if (logoHeight > maxLogoHeight) {
    const aspectRatio = logo ? logo.height / logo.width : 1
    logoHeight = maxLogoHeight
    logoWidth = maxLogoHeight / aspectRatio
  }

  // logo 區塊的完整佔高（含上下內距）
  const logoBlockHeight = infoPadding + logoHeight

  // 底欄內容的預設高度：以資訊列本身的高度為基準
  const defaultBottomContentHeight = infoHeight

  // 資訊列定位在「下置中」時，底欄需容納 logo 區塊 + 分隔線與資訊列的堆疊高度
  // 0.95：字體視覺高度約為 line-height 的 95%，避免底部多出一條縫
  const centerBottomContentHeight =
    infoPosition === 'center-bottom' ? logoBlockHeight + infoPadding / 2 + textBlock.height : 0

  // logo 定位在「上置中」時，底欄需容納整個 logo 區塊
  const logoTopContentHeight = logoPosition === 'center-top' ? logoBlockHeight : 0
  const logoSideContentHeight =
    logo && logoPosition !== 'center-top' ? logoHeight + infoPadding * 2 : 0

  // 取三種定位情境的最大值並向上取整，確保任何組合下內容都不被裁切
  const bottomContentHeight = Math.ceil(
    Math.max(
      defaultBottomContentHeight,
      centerBottomContentHeight,
      logoTopContentHeight,
      logoSideContentHeight,
    ),
  )

  // ***** 此處為全部 canvas 最後的高度與寬度 *****
  canvas.width = image.width + padLeft + padRight
  canvas.height = image.height + padTop + padBottom + bottomContentHeight

  // 底色（避免 jpg 匯出時資訊區變黑）
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 畫照片（套用濾鏡）
  ctx.save()
  if (supportsCanvasFilter()) {
    ctx.filter = filter
  }
  ctx.drawImage(image, padLeft, padTop, image.width, image.height)
  ctx.restore()
  if (!supportsCanvasFilter()) {
    applyManualFilter(ctx, padLeft, padTop, image.width, image.height, filter)
  }

  let centeredGroupLogoX: number | null = null
  let centeredGroupInfoX: number | null = null

  if (infoPosition === 'center-right' && logoPosition === 'center-left') {
    const visibleGap = logo ? gap : 0
    const groupWidth = logoWidth + visibleGap + textBlock.width
    const groupStartX = padLeft + image.width / 2 - groupWidth / 2

    centeredGroupLogoX = groupStartX
    centeredGroupInfoX = groupStartX + logoWidth + visibleGap
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
        x = centeredGroupLogoX ?? padLeft + image.width / 2 - logoWidth - gap / 2
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
        y =
          padTop +
          image.height +
          infoPadding +
          Math.max(textBlock.height, logoHeight) / 2 -
          logoHeight / 2
    }

    ctx.drawImage(logo, x, y, logoWidth, logoHeight)
  }

  // 畫 EXIF 資訊（不受濾鏡影響）
  if (hasInfo) {
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
        x = centeredGroupInfoX ?? padLeft + gap / 2 + image.width / 2
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

    displayLines.forEach((line, index) => {
      const fontSize = infoLineHeight * getLineScale(line.role)
      ctx.font = `${fontSize}px monospace`
      ctx.fillStyle = getLineColor(line.role)
      ctx.fillText(line.text, x, y)
      y += fontSize
      if (index < displayLines.length - 1) {
        y += lineGap
      }
    })
  }
}
