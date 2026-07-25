export interface FrameLayout {
  name: string
  padding: { top: number; right: number; bottom: number; left: number }
  gap: number
  infoPosition: 'right' | 'left' | 'center-bottom' | 'center-right'
  logoPosition: 'left' | 'center' | 'right' | 'center-top' | 'center-left'
  logoScale: number
}
