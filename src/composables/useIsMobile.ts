import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * 响应式判断是否为移动端（默认断点 767px）
 * 复刻参考项目 Gblox_Frontend_Rev 的实现
 */
export function useIsMobile(breakpoint = 767) {
  const query = `(max-width: ${breakpoint}px)`
  const mq =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(query)
      : ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} } as any)
  const isMobile = ref(mq.matches)

  const handler = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches
  }
  onMounted(() => mq.addEventListener('change', handler))
  onBeforeUnmount(() => mq.removeEventListener('change', handler))

  return { isMobile }
}

export default useIsMobile
