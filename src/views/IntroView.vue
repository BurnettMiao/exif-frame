<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import introImage01 from '@/assets/intro/intro_01.jpg'
import introImage02 from '@/assets/intro/intro_02.jpg'
import introImage03 from '@/assets/intro/intro_03.jpg'
import introImage04 from '@/assets/intro/intro_04.jpg'
import introImage05 from '@/assets/intro/intro_05.jpg'
import introImage06 from '@/assets/intro/intro_06.jpg'
import appleLogo from '@/assets/logos/apple_logo.svg'
import canonLogo from '@/assets/logos/canon_logo.svg'
import fujifilmLogo from '@/assets/logos/fujifilm_logo.svg'
import googleLogo from '@/assets/logos/google_logo.svg'
import nikonLogo from '@/assets/logos/nikon_logo.svg'
import sonyLogo from '@/assets/logos/sony_logo.svg'

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

const workflowSteps = [
  {
    icon: 'ri-upload-cloud-2-line',
    title: '上傳照片',
    subtitle: 'Upload',
    description: '選擇一張或多張照片開始製作。',
  },
  {
    icon: 'ri-camera-lens-line',
    title: '讀取 EXIF',
    subtitle: 'Read EXIF',
    description: '自動讀取相機、鏡頭、快門、光圈、ISO',
  },
  {
    icon: 'ri-equalizer-3-line',
    title: '自訂樣式',
    subtitle: 'Customize',
    description: '調整版型、Logo、資訊顯示、濾鏡與噪點',
  },
  {
    icon: 'ri-folder-zip-line',
    title: '匯出成品',
    subtitle: 'Export',
    description: '匯出單張或批次 ZIP',
  },
]

const privacyPoints = [
  {
    title: '不會上傳照片',
    subtitle: 'No uploads',
  },
  {
    title: '不需要登入帳號',
    subtitle: 'No accounts required',
  },
  {
    title: '沒有伺服器端圖片處理',
    subtitle: 'No server-side image processing',
  },
]

const featureHighlights = [
  {
    icon: 'ri-file-info-line',
    title: 'EXIF 資訊相框',
    subtitle: 'EXIF metadata frames',
    description: '把相機、鏡頭、快門、光圈與 ISO 整合進照片版面。',
  },
  {
    icon: 'ri-camera-3-line',
    title: '相機品牌 Logo',
    subtitle: 'Camera brand logo support',
    description: '依照片品牌顯示對應 Logo，讓輸出更有完整感。',
  },
  {
    icon: 'ri-layout-4-line',
    title: '版面與色彩控制',
    subtitle: 'Layout and color control',
    description: '調整邊距、資訊位置、背景與文字顏色。',
  },
  {
    icon: 'ri-contrast-drop-2-line',
    title: '底片感濾鏡與噪點',
    subtitle: 'Film filters and grain',
    description: '加入濾鏡與噪點，做出更接近底片的復古質感。',
  },
]

const supportedBrandLogos = [
  {
    name: 'Sony',
    src: sonyLogo,
  },
  {
    name: 'Nikon',
    src: nikonLogo,
  },
  {
    name: 'Canon',
    src: canonLogo,
  },
  {
    name: 'Fujifilm',
    src: fujifilmLogo,
  },
  {
    name: 'Apple',
    src: appleLogo,
  },
  {
    name: 'Google',
    src: googleLogo,
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
// const supportUrl = ''
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

// const openSupportLink = () => {
//   if (!supportUrl) {
//     window.alert('支持連結準備中，之後會放上 Buy Me a Coffee。')
//     return
//   }
//
//   window.open(supportUrl, '_blank', 'noopener,noreferrer')
// }

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
    <main
      class="mx-auto flex min-h-full w-full max-w-384 flex-col justify-center px-5 py-12 sm:px-6 lg:px-8"
    >
      <section
        class="grid w-full items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-16"
      >
        <div class="order-2 max-w-2xl lg:order-1">
          <p class="mb-4 text-sm font-semibold tracking-wide text-amber-600 uppercase">
            Exif Frame
          </p>
          <h1 class="text-3xl leading-tight font-bold text-gray-950 sm:text-5xl lg:text-6xl">
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
            <!-- <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-amber-300 hover:text-amber-600"
              title="支持開發"
              @click="openSupportLink"
            >
              <i class="ri-cup-line text-lg" aria-hidden="true"></i>
              請我喝杯咖啡
            </button> -->
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
            class="intro-stack-image absolute top-0 left-0 w-[82%] max-w-[520px] rounded-lg border border-gray-100 bg-white object-cover shadow-2xl"
            :class="{ 'is-active': image.isActive }"
            :style="image.style"
          />
        </div>
      </section>

      <section class="w-full pt-14 pb-8 sm:py-12 lg:py-16">
        <div class="mb-8 sm:mb-10">
          <p class="mb-4 text-sm font-semibold tracking-wide text-amber-600 uppercase">
            How it works
          </p>
          <h2 class="text-2xl font-bold text-gray-950 sm:text-3xl">從上傳到匯出，只需要幾步</h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            A simple local workflow for turning your photos into polished metadata frames.
          </p>
        </div>

        <div class="grid gap-x-10 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
          <template v-for="(step, index) in workflowSteps" :key="step.title">
            <div
              class="relative flex min-h-24 items-center gap-4 overflow-hidden rounded-lg border border-gray-100 bg-white p-4 pr-10 shadow-sm"
            >
              <div
                class="absolute top-0 right-0 flex size-12 items-start justify-end rounded-bl-full bg-gray-900 pt-2 pr-3 text-xl font-semibold text-white"
              >
                {{ index + 1 }}
              </div>
              <div
                class="flex size-13 shrink-0 items-center justify-center rounded-full bg-amber-50 text-2xl text-amber-600 ring-1 ring-amber-100"
              >
                <i :class="step.icon" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <h3 class="text-lg sm:text-xl font-bold text-gray-950">{{ step.title }}</h3>
                  <p class="text-sm font-semibold text-gray-950">{{ step.subtitle }}</p>
                </div>
                <p class="mt-3 text-sm leading-6 text-gray-600">{{ step.description }}</p>
              </div>
            </div>
          </template>
        </div>
      </section>

      <section class="w-full py-8 sm:py-12 lg:py-16">
        <div
          class="grid items-center gap-8 rounded-lg border border-gray-100 bg-gray-50 px-5 py-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-8"
        >
          <div>
            <p class="mb-4 text-sm font-semibold tracking-wide text-amber-600 uppercase">
              Local Processing
            </p>
            <h2 class="text-2xl font-bold text-gray-950 sm:text-3xl">照片只留在你的裝置上。</h2>
            <p class="mt-4 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Exif Frame keeps image processing inside your browser, so you can frame and export
              photos without sending them away.
            </p>
          </div>

          <div class="grid gap-3 lg:grid-cols-1">
            <div
              v-for="point in privacyPoints"
              :key="point.title"
              class="flex min-h-16 items-center gap-3 rounded-lg bg-white px-4 py-3 text-gray-800 ring-1 ring-gray-100"
            >
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600"
              >
                <i class="ri-check-line text-lg" aria-hidden="true"></i>
              </span>
              <span class="min-w-0">
                <span class="block text-lg sm:text-xl font-semibold text-gray-950">{{
                  point.title
                }}</span>
                <span class="mt-1 block text-sm font-semibold text-gray-950">{{
                  point.subtitle
                }}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="w-full py-8 sm:py-12 lg:py-16">
        <div class="mb-8 sm:mb-10">
          <p class="mb-4 text-sm font-semibold tracking-wide text-amber-600 uppercase">Features</p>
          <h2 class="text-2xl font-bold text-gray-950 sm:text-3xl">為攝影輸出準備的細節</h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Fine-tune metadata, branding, layout, color, and film-inspired finishing in one place.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="feature in featureHighlights"
            :key="feature.title"
            class="flex min-h-48 flex-col rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div
              class="mb-5 flex size-12 items-center justify-center rounded-full bg-gray-900 text-2xl text-white"
            >
              <i :class="feature.icon" aria-hidden="true"></i>
            </div>
            <h3 class="text-lg sm:text-xl font-semibold text-gray-950">{{ feature.title }}</h3>
            <p class="mt-1 text-sm font-semibold text-gray-950">{{ feature.subtitle }}</p>
            <p class="mt-3 text-sm leading-6 text-gray-600">{{ feature.description }}</p>
          </div>
        </div>
      </section>

      <section class="w-full py-8 sm:py-12 lg:py-16">
        <div class="mb-8 sm:mb-10">
          <p class="mb-4 text-sm font-semibold tracking-wide text-amber-600 uppercase">
            Supported Logos
          </p>
          <h2 class="text-2xl font-bold text-gray-950 sm:text-3xl">目前支援的廠牌 Logo</h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            匯入照片後，會依照 EXIF 中的相機廠牌自動套用對應 Logo。
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div
            v-for="brand in supportedBrandLogos"
            :key="brand.name"
            class="flex min-h-22 items-center justify-center rounded-lg border border-gray-100 bg-white px-4 py-5 shadow-sm"
          >
            <img
              :src="brand.src"
              :alt="`${brand.name} logo`"
              class="h-[35px] max-w-28 object-contain"
            />
          </div>
        </div>
      </section>

      <section class="w-full py-8 sm:py-12 lg:py-16">
        <div
          class="grid items-center gap-8 overflow-hidden rounded-lg bg-gray-900 px-5 py-7 text-white sm:px-0 sm:py-0 xl:grid-cols-[0.9fr_1.1fr]"
        >
          <div
            class="flex size-16 items-center justify-center rounded-full bg-white/10 text-3xl text-amber-300 ring-1 ring-white/10 sm:hidden"
          >
            <i class="ri-folder-zip-line" aria-hidden="true"></i>
          </div>

          <div class="hidden h-78 overflow-hidden sm:block">
            <div class="relative mx-auto h-full w-full max-w-[560px] xl:mx-0 xl:max-w-none">
              <img
                :src="introImage06"
                alt=""
                class="absolute top-20 left-4 z-30 aspect-[2112/1791] w-[78%] max-w-[420px] rotate-[-3deg] rounded-lg border border-white/10 bg-white object-cover shadow-2xl xl:left-8"
              />
              <img
                :src="introImage05"
                alt=""
                class="absolute top-16 left-18 z-20 aspect-[2112/1791] w-[72%] max-w-[390px] rotate-[4deg] rounded-lg border border-white/10 bg-white object-cover shadow-xl xl:left-24"
              />
              <img
                :src="introImage04"
                alt=""
                class="absolute top-12 left-30 z-10 aspect-[2112/1791] w-[66%] max-w-[360px] rotate-[9deg] rounded-lg border border-white/10 bg-white object-cover shadow-lg xl:left-38"
              />
            </div>
          </div>

          <div class="sm:px-6 sm:py-8 xl:px-8 xl:py-9">
            <p class="mb-4 text-sm font-semibold tracking-wide text-amber-300 uppercase">
              Batch Export
            </p>
            <h2 class="text-2xl font-bold sm:text-3xl">一次匯出整組照片。</h2>
            <p class="mt-2 text-xl font-semibold sm:text-2xl">Export a whole set at once.</p>
            <p class="mt-4 max-w-3xl text-sm leading-6 text-gray-300 sm:text-base">
              一次處理多張照片，套用同一組版面、資訊顯示、濾鏡與噪點，最後打包成 ZIP
              匯出，適合旅拍、活動紀錄或一整組作品整理。
            </p>
          </div>
        </div>
      </section>

      <section class="w-full pt-8 pb-14 text-center sm:pt-12 sm:pb-18 lg:pt-16">
        <p class="mb-4 text-sm font-semibold tracking-wide text-amber-600 uppercase">Start Now</p>
        <h2 class="text-3xl font-bold text-gray-950 sm:text-4xl">準備好完成你的照片了嗎？</h2>
        <p class="mt-2 text-xl font-semibold text-gray-950 sm:text-2xl">
          Ready to frame your shot?
        </p>
        <div class="mt-7 flex justify-center">
          <RouterLink
            to="/editor"
            class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500"
          >
            <i class="ri-arrow-right-line text-lg" aria-hidden="true"></i>
            開始編輯
          </RouterLink>
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
