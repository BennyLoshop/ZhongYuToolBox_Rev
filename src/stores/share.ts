/**
 * 分享状态 store
 */
import { defineStore } from 'pinia'

export interface ShareTarget {
  type: string
  id: string
  title: string
  chapterId?: string
}

export const useShareStore = defineStore('share', {
  state: () => ({
    current: null as ShareTarget | null
  }),
  actions: {
    setCurrent(target: ShareTarget | null) {
      this.current = target
    }
  }
})
