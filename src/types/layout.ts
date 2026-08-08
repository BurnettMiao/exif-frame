export interface FrameLayout {
  name: string
  /** Padding as ratios relative to image width (e.g., 0.15 = 15% of imgWidth) */
  padding: { top: number; right: number; bottom: number; left: number }
  /** Gap as ratio relative to image width */
  gapRatio: number
  infoPosition: 'right' | 'left' | 'center-bottom' | 'center-right'
  logoPosition: 'left' | 'center' | 'right' | 'center-top' | 'center-left'
  logoScale: number
}
