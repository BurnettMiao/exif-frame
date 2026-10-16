import brandSony from '@/assets/logos/sony_logo.svg'
import brandFuji from '@/assets/logos/fujifilm_logo.svg'
import brandCanon from '@/assets/logos/canon_logo.svg'
import brandNikon from '@/assets/logos/nikon_logo.svg'
import brandApple from '@/assets/logos/apple_logo.svg'
import brandGoogle from '@/assets/logos/google_logo.svg'
import brandHasselblad from '@/assets/logos/hasselblad_logo.svg'
import brandLeica from '@/assets/logos/leica_logo.svg'
import brandLumix from '@/assets/logos/lumix_logo.svg'
import brandOmSystem from '@/assets/logos/omSystem-logo.svg'
import brandRicoh from '@/assets/logos/ricoh_logo.svg'

type BrandLogo = {
  src: string
  opticalScale: number
}

// 廠牌 → logo 資源對應，新增品牌只要在此加一筆
const BRAND_LOGOS: Record<string, BrandLogo> = {
  SONY: { src: brandSony, opticalScale: 1 },
  NIKON: { src: brandNikon, opticalScale: 1 },
  Canon: { src: brandCanon, opticalScale: 1 },
  FUJIFILM: { src: brandFuji, opticalScale: 1 },
  Apple: { src: brandApple, opticalScale: 0.78 },
  Google: { src: brandGoogle, opticalScale: 0.78 },
  Hasselblad: { src: brandHasselblad, opticalScale: 1.35 },
  LEICA: { src: brandLeica, opticalScale: 0.7 },
  Panasonic: { src: brandLumix, opticalScale: 1 },
  OM: { src: brandOmSystem, opticalScale: 0.68 },
  RICOH: { src: brandRicoh, opticalScale: 1.15 },
}

const BRAND_LABELS: Record<string, string> = {
  FUJIFILM: 'Fujifilm',
  Panasonic: 'LUMIX',
  OM: 'OM SYSTEM',
  RICOH: 'Ricoh',
}

export const brandLogoOptions = Object.entries(BRAND_LOGOS).map(([value, logo]) => ({
  value,
  label: BRAND_LABELS[value] ?? value,
  src: logo.src,
}))

/**
 * 讓方形、直式與超寬字標在相同 Logo 大小設定下有較接近的視覺份量。
 */
export function getBrandLogoOpticalScale(brand: string) {
  return BRAND_LOGOS[brand]?.opticalScale ?? 1
}

/**
 * 載入廠牌對應的 logo，找不到時回傳 null
 */
export function loadBrandLogo(brand: string): Promise<HTMLImageElement | null> {
  const logoConfig = BRAND_LOGOS[brand]
  if (!logoConfig) return Promise.resolve(null)

  return new Promise((resolve) => {
    const logo = new Image()
    logo.crossOrigin = 'anonymous'
    logo.onload = () => resolve(logo)
    logo.onerror = () => resolve(null)
    logo.src = logoConfig.src
  })
}
