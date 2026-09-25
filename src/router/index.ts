import { createRouter, createWebHistory } from 'vue-router'
import EditorView from '@/views/EditorView.vue'
import IntroView from '@/views/IntroView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/editor',
    },
    {
      path: '/editor',
      name: 'editor',
      component: EditorView,
    },
    {
      path: '/intro',
      name: 'intro',
      component: IntroView,
    },
  ],
})

export default router
