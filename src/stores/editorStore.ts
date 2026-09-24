import { defineStore } from 'pinia'
import { ref } from 'vue'

export type EditorPanelName = '排版區' | '資訊區' | '濾鏡區' | '版面調整'

export const useEditorStore = defineStore('editor', () => {
  const currentPanel = ref<EditorPanelName>('排版區')

  const selectPanel = (panel: EditorPanelName) => {
    currentPanel.value = panel
  }

  return {
    currentPanel,
    selectPanel,
  }
})
