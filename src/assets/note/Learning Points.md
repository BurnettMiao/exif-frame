**製作中遇到的學習重點**

- 文件的上傳
- 濾鏡的數值
- Vue Pinia的使用

**含有相機資訊的網站**

- https://www.dpreview.com/

**之後網站可以強調的賣點**

- 另外，我很喜歡你說的「照片不會離開使用者裝置」，你甚至可以在網站上寫一句：「All image processing happens locally in your browser. Your photos are never uploaded to any server.」這會是一個很強的賣點。
- 我唯一建議的是：輸出時不要只保留 Object URL，而是保留 Blob。因為之後如果使用者按「下載」，直接：
  const url = URL.createObjectURL(blob)
  就可以下載，不需要重新處理一次圖片。
  我覺得你這個方向是對的，而且架構上也很乾淨。下一步我會挑戰你一個功能：在 processImage() 裡加入 EXIF 方向修正（iPhone 直拍橫掉的問題），這是很多圖片網站最容易忽略的一步，也是很值得練的。
