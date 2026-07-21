export interface FrameLayout {
  name: string
  padding: { top: number; right: number; bottom: number; left: number }
  gap: number
  infoPosition: 'right' | 'left' | 'bottom-center'
  logoPosition: 'left' | 'center' | 'right' | 'top-center'
  logoScale: number
}
