# JavaScript 圖片 URL、Blob、File 轉換流程整理

## 使用情境

前端開發常遇到以下情境：

1. 使用者透過 `<input type="file">` 上傳圖片
2. 頁面初始化時，需要預載入一張已存在的圖片 URL
3. 需要讀取圖片 EXIF 資訊（例如拍攝時間、GPS、相機資訊）
4. 需要把圖片送到 API 上傳

問題：

- 使用者上傳的是 `File`
- 圖片網址 (`URL`) 只是 `string`

兩者型別不同，因此需要統一處理。

---

# 核心概念

圖片資料在瀏覽器中有幾種型態：

```
URL (string)
    |
    | fetch()
    ↓
Response
    |
    | response.blob()
    ↓
Blob
    |
    | new File()
    ↓
File
```

最終目的：

> 不管圖片來源是網址還是使用者上傳，都轉換成 File，讓後續流程統一處理。

---

# File、Blob、URL 的差異

## URL (string)

例如：

```ts
const source = 'https://example.com/photo.jpg'
```

它只是圖片位置。

它不是圖片內容。

類似：

```
地址：
台北市某某路100號
```

只有位置資訊，沒有房子內容。

---

## Blob

Blob = Binary Large Object

代表：

> 一段二進位資料

例如圖片：

```ts
Blob {
  size: 500000,
  type: "image/jpeg"
}
```

包含：

- 圖片內容
- 檔案大小
- MIME Type

但是沒有：

- 檔名

例如：

```ts
blob.name
```

不存在。

---

## File

File 繼承 Blob。

比 Blob 多：

- 檔名
- 最後修改時間

例如：

```ts
File {
  name: "photo.jpg",
  size: 500000,
  type: "image/jpeg"
}
```

通常：

- 上傳 API
- `<input type="file">`
- EXIF 處理

會使用 File。

---

# fetch(source)

## 目的

當 source 是圖片 URL：

```ts
const source = 'https://example.com/photo.jpg'
```

需要先下載圖片。

```ts
const response = await fetch(source)
```

流程：

```
圖片網址
   |
   | fetch()
   ↓
HTTP Request
   |
   ↓
伺服器回傳圖片
   |
   ↓
Response
```

---

## fetch 回傳什麼？

不是圖片。

而是：

```ts
Response
```

例如：

```ts
Response {
  status: 200,
  headers: Headers,
  body: ReadableStream
}
```

真正圖片資料在：

```
response.body
```

裡面。

---

# response.blob()

## 目的

將 Response 裡面的二進位資料取出，轉成 Blob。

```ts
const blob = await response.blob()
```

流程：

```
Response
    |
    | blob()
    ↓
Blob
```

---

## 為什麼需要 blob()？

因為：

```ts
fetch()
```

拿到的是 HTTP 回應。

不是直接圖片。

需要把：

```
HTTP Response
```

轉成：

```
圖片二進位資料
```

才能交給後續處理。

---

# response.blob() 內部概念

伺服器：

```
photo.jpg
```

↓

fetch：

```
Response
 |
 | body stream
 |
 ↓
response.blob()
```

↓

得到：

```
Blob

size: 582310
type: image/jpeg
```

---

# response.blob() 為什麼需要 await？

因為圖片下載需要時間。

錯誤：

```ts
const blob = response.blob()
```

得到：

```ts
Promise<Blob>
```

不是 Blob。

正確：

```ts
const blob = await response.blob()
```

等待下載完成。

---

# Blob 轉 File

Blob 沒有檔名。

如果需要 File：

```ts
const file = new File([blob], 'preload-img.jpg', {
  type: blob.type,
})
```

---

## File 建構子

語法：

```ts
new File(fileBits, fileName, options)
```

---

## 第一個參數

```ts
;[blob]
```

為 Blob 資料內容。

為什麼是陣列？

因為 File 支援多段資料：

```ts
new File(['hello', blob], 'test.txt')
```

會串接所有內容。

---

## 第二個參數

```ts
'preload-img.jpg'
```

指定檔名。

因為 URL 本身沒有檔名。

---

## 第三個參數

```ts
{
  type: blob.type
}
```

設定 MIME Type。

例如：

```ts
image / jpeg
image / png
```

---

# 完整範例

假設函式接受：

```ts
source: File | string
```

代表：

- File：使用者上傳
- string：圖片 URL

---

## 統一轉 File

```ts
let file: File

if (typeof source === 'string') {
  // URL 圖片
  const response = await fetch(source)

  // Response → Blob
  const blob = await response.blob()

  // Blob → File
  file = new File([blob], 'preload-img.jpg', {
    type: blob.type,
  })
} else {
  // 原本就是 File
  file = source
}
```

---

# 完整資料流

## 情境一：使用者上傳

```
<input type=file>

        ↓

File

        ↓

ExifReader.load(file)

```

---

## 情境二：預載圖片 URL

```
"https://xxx.com/photo.jpg"

        ↓

fetch()

        ↓

Response

        ↓

response.blob()

        ↓

Blob

        ↓

new File()

        ↓

File

        ↓

ExifReader.load(file)

```

---

# 為什麼最後一定轉 File？

因為後面的程式不用管來源。

不用寫：

```ts
if (source 是 URL)

else if (source 是 File)
```

只需要：

```ts
ExifReader.load(file)
```

或：

```ts
formData.append('image', file)
```

---

# 常見 API 對照

| API                    | 回傳        | 用途            |
| ---------------------- | ----------- | --------------- |
| fetch()                | Response    | 取得 HTTP 回應  |
| response.text()        | string      | 文字            |
| response.json()        | object      | JSON API        |
| response.blob()        | Blob        | 圖片、影片、PDF |
| response.arrayBuffer() | ArrayBuffer | 底層二進位處理  |
| new File()             | File        | 建立可上傳檔案  |

---

# 記憶方式

```
URL
= 地址

fetch()
= 去地址拿東西

Response
= 包裹

blob()
= 拆包拿出內容

Blob
= 實際資料

File
= 加上檔名的 Blob
```

---

# 在圖片 EXIF 專案中的角色

流程：

```
圖片 URL
    ↓
fetch()
    ↓
Response
    ↓
response.blob()
    ↓
Blob
    ↓
new File()
    ↓
ExifReader.load(File)
    ↓
取得 EXIF Metadata
```

核心觀念：

> URL 只是位置，Blob 是內容，File 是帶有檔名資訊的 Blob。
