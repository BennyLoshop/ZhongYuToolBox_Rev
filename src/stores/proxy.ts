/**
 * 代理状态 store
 */
import { defineStore } from 'pinia'
import { getProxyBaseUrl } from '@/utils/proxy'

export const useProxyStore = defineStore('proxy', {
  state: () => ({
    localEnabled: false,
    baseUrl: getProxyBaseUrl()
  }),
  actions: {
    setStatus(localEnabled: boolean, baseUrl: string) {
      this.localEnabled = localEnabled
      this.baseUrl = baseUrl
    }
  }
})
