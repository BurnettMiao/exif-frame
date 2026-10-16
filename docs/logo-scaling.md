# Logo 視覺尺寸校正

## 目的

相同的「Logo 大小」數值若直接套用到不同長寬比的品牌 Logo，視覺份量會明顯不同：方形或直式 Logo 往往顯得過大，超寬字標則容易顯得太小。

因此，Exif Frame 會在使用者設定的 Logo 大小之外，套用每個品牌的 `opticalScale`（光學校正倍率）。

## 尺寸公式

```text
實際繪製尺寸 = 個別照片 Logo 大小（或版型預設值）× 品牌 opticalScale
```

其中：

- 個別照片 Logo 大小：使用者調整後，僅儲存在該張照片的 `logoScaleOverride`。
- 版型預設值：照片尚未個別調整時使用 `layoutStore.currentLayout.logoScale`。
- 品牌 `opticalScale`：由 `src/utils/brandLogos.ts` 管理，永遠會套用。

## 目前校正倍率

| EXIF／選單 key | 顯示品牌 | `opticalScale` | 原因 |
| --- | --- | ---: | --- |
| `SONY` | SONY | 1.00 | 扁平字標，作為基準。 |
| `NIKON` | NIKON | 1.00 | 扁平字標，作為基準。 |
| `Canon` | Canon | 1.00 | 橫向字標，作為基準。 |
| `FUJIFILM` | Fujifilm | 1.00 | 橫向字標，作為基準。 |
| `Apple` | Apple | 0.42 | 直式、高填滿圖形，需明顯縮小。 |
| `Google` | Google／Pixel | 0.45 | 接近方形圖示，需明顯縮小。 |
| `Hasselblad` | Hasselblad | 1.35 | 極寬字標，需適度放大。 |
| `LEICA` | Leica | 0.40 | 方形圓形徽章，需明顯縮小。 |
| `Panasonic` | LUMIX | 1.00 | 橫向字標，作為基準。 |
| `OM` | OM SYSTEM | 0.45 | 接近方形徽章，需縮小。 |
| `RICOH` | Ricoh | 1.15 | 較寬但較低的字標，略微放大。 |

## 新增品牌 Logo 的流程

1. 將 SVG 放入 `src/assets/logos/`。
2. 在 `src/utils/brandLogos.ts` 匯入檔案，並新增 `BRAND_LOGOS` 設定。
3. 使用該品牌照片確認 EXIF `Make` 產生的 key；目前讀取邏輯會取廠牌欄位的第一個單字。
4. 先以 `opticalScale: 1` 測試。
5. 與 SONY、Canon 等基準字標並排比較，再調整倍率。

## 校正原則

- 方形、圓形、直式或高填滿 Logo：通常低於 `1`。
- 超寬或細長字標：通常高於 `1`。
- 請以實際輸出的視覺面積與視覺重量判斷，不要只比較 SVG 的寬高。
- 調整後需測試預覽、單張輸出與批次匯出，三者應一致。
