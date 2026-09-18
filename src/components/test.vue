<script setup>
import { ref, nextTick } from 'vue'
import { animate } from 'animejs'

const cards = ref([
  { id: 1, title: 'Card 1', color: '#ff6b6b' },
  { id: 2, title: 'Card 2', color: '#4ecdc4' },
  { id: 3, title: 'Card 3', color: '#45b7d1' },
  { id: 4, title: 'Card 4', color: '#f7b731' },
  { id: 5, title: 'Card 5', color: '#a55eea' },
])

const isAnimating = ref(false)

async function nextCard() {
  if (isAnimating.value) return

  isAnimating.value = true

  // 取得目前最上面的卡片
  const firstCard = document.querySelector('.card')

  if (!firstCard) {
    isAnimating.value = false
    return
  }

  // --------------------------------
  // 1. 最上面的卡片飛出去
  // --------------------------------

  animate(firstCard, {
    translateX: 450,
    rotate: 20,
    opacity: 0,
    duration: 600,
    ease: 'out(4)',
  })

  // --------------------------------
  // 2. 等一點時間後，
  //    讓下面的卡片往前補位
  // --------------------------------

  setTimeout(async () => {
    // 把第一張卡片移到最後
    const first = cards.value.shift()
    cards.value.push(first)

    // 等 Vue 更新 DOM
    await nextTick()

    // --------------------------------
    // 3. 重新設定所有卡片的位置
    // --------------------------------

    const cardElements = document.querySelectorAll('.card')

    cardElements.forEach((card, index) => {
      const targetY = index * 15
      const targetScale = 1 - index * 0.04
      const targetRotate = index * 2

      animate(card, {
        translateX: 0,
        translateY: targetY,
        scale: targetScale,
        rotate: targetRotate,
        opacity: 1,
        duration: 500,
        ease: 'out(3)',
      })
    })

    isAnimating.value = false
  }, 300)
}

// 初始設定
function setupCards() {
  const cardElements = document.querySelectorAll('.card')

  cardElements.forEach((card, index) => {
    animate(card, {
      translateY: index * 15,
      scale: 1 - index * 0.04,
      rotate: index * 2,
      duration: 0,
    })
  })
}
</script>

<template>
  <main class="page">
    <h1>Anime.js v4 Card Stack</h1>

    <div class="card-container">
      <div
        v-for="(card, index) in cards"
        :key="card.id"
        class="card"
        :style="{
          backgroundColor: card.color,
          zIndex: cards.length - index,
        }"
      >
        <span>
          {{ card.title }}
        </span>
      </div>
    </div>

    <button class="next-button" :disabled="isAnimating" @click="nextCard">
      {{ isAnimating ? 'Animating...' : 'Next Card' }}
    </button>
  </main>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  background: #f3f4f6;
}

.page {
  min-height: 100vh;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 30px;
}

h1 {
  margin: 0;
  font-size: 28px;
}

/* -------------------------
   Card Stack
------------------------- */

.card-container {
  position: relative;

  width: 300px;
  height: 400px;
}

.card {
  position: absolute;

  top: 0;
  left: 0;

  width: 300px;
  height: 400px;

  border-radius: 24px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: white;
  font-size: 32px;
  font-weight: 700;

  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);

  user-select: none;
}

/* -------------------------
   Button
------------------------- */

.next-button {
  border: none;

  padding: 14px 28px;

  border-radius: 999px;

  background: #111827;
  color: white;

  font-size: 16px;
  font-weight: 600;

  cursor: pointer;

  transition:
    transform 0.2s,
    opacity 0.2s;
}

.next-button:hover {
  transform: translateY(-2px);
}

.next-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
