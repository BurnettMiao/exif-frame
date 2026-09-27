<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import introImage01 from '@/assets/intro/intro_01.jpg'
import introImage02 from '@/assets/intro/intro_02.jpg'
import introImage03 from '@/assets/intro/intro_03.jpg'

const introImages = [
  {
    src: introImage01,
    alt: 'Exif Frame preview with camera metadata',
  },
  {
    src: introImage02,
    alt: 'Exif Frame preview with a different photo layout',
  },
  {
    src: introImage03,
    alt: 'Exif Frame preview with film-inspired styling',
  },
]

const stackStyles = [
  {
    transform: 'translate(0, 0) scale(1) rotate(-1.5deg)',
    zIndex: 30,
    opacity: 1,
  },
  {
    transform: 'translate(32px, 32px) scale(0.92) rotate(4deg)',
    zIndex: 20,
    opacity: 1,
  },
  {
    transform: 'translate(60px, 60px) scale(0.84) rotate(8deg)',
    zIndex: 10,
    opacity: 1,
  },
]

const currentImageIndex = ref(0)
const isIntroStackAnimating = ref(false)
const isIntroStackPaused = ref(false)
let introStackInterval: number | null = null
let introStackAnimationTimer: number | null = null

const stackedIntroImages = computed(() =>
  introImages.map((image, imageIndex) => {
    const stackIndex =
      (imageIndex - currentImageIndex.value + introImages.length) % introImages.length

    return {
      ...image,
      stackIndex,
      style: stackStyles[stackIndex],
      isActive: stackIndex === 0,
    }
  }),
)

const rotateIntroStack = () => {
  if (isIntroStackPaused.value || isIntroStackAnimating.value) return

  isIntroStackAnimating.value = true

  if (introStackAnimationTimer !== null) {
    window.clearTimeout(introStackAnimationTimer)
  }

  introStackAnimationTimer = window.setTimeout(() => {
    currentImageIndex.value = (currentImageIndex.value + 1) % introImages.length
    isIntroStackAnimating.value = false
    introStackAnimationTimer = null
  }, 620)
}

onMounted(() => {
  introStackInterval = window.setInterval(rotateIntroStack, 3600)
})

onBeforeUnmount(() => {
  if (introStackInterval !== null) {
    window.clearInterval(introStackInterval)
  }

  if (introStackAnimationTimer !== null) {
    window.clearTimeout(introStackAnimationTimer)
  }
})
</script>

<template>
  <div class="h-full w-full overflow-y-auto bg-white">
    <main class="mx-auto flex min-h-full w-full max-w-384 items-center px-5 py-12 sm:px-6 lg:px-8">
      <section class="grid w-full items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        <div class="order-2 max-w-2xl lg:order-1">
          <p class="mb-4 text-sm font-semibold tracking-wide text-amber-600 uppercase">
            Exif Frame
          </p>
          <h1 class="text-4xl leading-tight font-bold text-gray-950 sm:text-5xl lg:text-6xl">
            讓照片資訊成為畫面的一部分
          </h1>
          <p class="mt-6 text-base leading-8 text-gray-600 sm:text-lg">
            上傳照片、讀取 EXIF、調整版型，再加上濾鏡與噪點，輸出一張乾淨、有攝影感的相框照。
          </p>
          <p
            class="mt-5 max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 font-medium text-gray-800"
          >
            All image processing happens locally in your browser. Your photos are never uploaded to
            any server.
          </p>
          <div class="mt-8 flex flex-wrap items-center gap-3">
            <RouterLink
              to="/editor"
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500"
            >
              <i class="ri-arrow-right-line text-lg" aria-hidden="true"></i>
              開始編輯
            </RouterLink>
          </div>
        </div>

        <div
          class="intro-stack relative order-1 mx-auto h-[360px] w-full max-w-[620px] sm:h-[470px] lg:order-2 lg:h-[560px]"
          :class="{ 'is-animating': isIntroStackAnimating }"
          @mouseenter="isIntroStackPaused = true"
          @mouseleave="isIntroStackPaused = false"
        >
          <img
            v-for="image in stackedIntroImages"
            :key="image.src"
            :src="image.src"
            :alt="image.alt"
            class="intro-stack-image absolute top-2 left-0 w-[82%] max-w-[520px] rounded-lg border border-gray-100 bg-white object-cover shadow-2xl"
            :class="{ 'is-active': image.isActive }"
            :style="image.style"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.intro-stack-image {
  transform-origin: center;
  transition:
    transform 620ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 620ms ease;
}

.intro-stack.is-animating .intro-stack-image.is-active {
  opacity: 0;
  transform: translate(440px, 0) scale(1) rotate(18deg) !important;
}

@media (max-width: 1023px) {
  .intro-stack.is-animating .intro-stack-image.is-active {
    transform: translate(260px, 0) scale(0.98) rotate(16deg) !important;
  }
}
</style>
