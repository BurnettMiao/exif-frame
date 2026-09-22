import brandSony from '@/assets/logos/sony_logo.svg'
import brandFuji from '@/assets/logos/fujifilm_logo.svg'
import brandCanon from '@/assets/logos/canon_logo.svg'
import brandNikon from '@/assets/logos/nikon_logo.svg'
import brandApple from '@/assets/logos/apple_logo.svg'
import brandGoogle from '@/assets/logos/google_logo.svg'

// 廠牌 → logo 資源對應，新增品牌只要在此加一筆
const BRAND_LOGOS: Record<string, string> = {
  SONY: brandSony,
  NIKON: brandNikon,
  Canon: brandCanon,
  FUJIFILM: brandFuji,
  Apple: brandApple,
  Google: brandGoogle,
}

/**
 * 載入廠牌對應的 logo，找不到時回傳 null
 */
export function loadBrandLogo(brand: string): Promise<HTMLImageElement | null> {
  const src = BRAND_LOGOS[brand]
  if (!src) return Promise.resolve(null)

  return new Promise((resolve) => {
    const logo = new Image()
    logo.crossOrigin = 'anonymous'
    logo.onload = () => resolve(logo)
    logo.onerror = () => resolve(null)
    logo.src = src
  })
}
