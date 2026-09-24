export interface PhotoInfo {
  date?: string
  model?: string
  lens?: string
  location?: string
  caption?: string
  exposure?: string
  aperture?: string
  iso?: string
  make?: string
  error?: string // 處理錯誤訊息的欄位
}

export type PhotoInfoVisibility = {
  camera: boolean
  lens: boolean
  date: boolean
  location: boolean
  caption: boolean
  exposure: boolean
  aperture: boolean
  iso: boolean
}
