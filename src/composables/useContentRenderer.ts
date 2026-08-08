/**
 * 优客畅学内容渲染（复刻旧 index.js change_all / change_object / change_video / change_div）
 * 把章节内容 HTML 中的 <object>/<video>/<div data-type> 标签改写为
 * 「在线查看 / 点击下载」的交互链接。
 *
 * 用法：在父组件用 v-html 注入内容后，调用 render(container) 进行改写。
 */

import { proxyUrl, proxyImgSrc } from '@/utils/proxy'

export interface AttachmentHandlers {
  /** object / video 在线查看（视频播放） */
  onViewObject: (url: string, name: string) => void
  /** ppt 在线查看（Office Online） */
  onViewPpt: (url: string, name: string) => void
  /** pdf 在线查看（pdf.js） */
  onViewPdf: (url: string, name: string) => void
  /** 下载任意附件 */
  onDownload: (url: string, name: string) => void
}

const DOWNLOAD_PROXY_HOST = 'https://zytbdownloadagent.loshop.com.cn/download/'

function makeLinkRow(
  name: string,
  view: (() => void) | null,
  download: () => void
): HTMLParagraphElement {
  const p = document.createElement('p')
  p.style.margin = '6px 0'
  p.append('附件：' + (name || '未命名') + ' ')
  if (view) {
    const a1 = document.createElement('a')
    a1.textContent = '在线查看'
    a1.href = 'javascript:void(0)'
    a1.className = 'lesson-link'
    a1.addEventListener('click', view)
    p.appendChild(a1)
    p.append(' ')
  }
  const a2 = document.createElement('a')
  a2.textContent = '点击下载'
  a2.href = 'javascript:void(0)'
  a2.className = 'lesson-link'
  a2.addEventListener('click', download)
  p.appendChild(a2)
  return p
}

function changeObject(container: HTMLElement, h: AttachmentHandlers): number {
  const objs = Array.from(container.getElementsByTagName('object'))
  objs.forEach((ob) => {
    const name = ob.getAttribute('name') || '附件'
    const link = proxyUrl(ob.getAttribute('data') || '')
    const p = makeLinkRow(
      name,
      () => h.onViewObject(link, name),
      () => h.onDownload(link, name)
    )
    container.insertBefore(p, ob)
    ob.remove()
  })
  return objs.length
}

function changeVideo(container: HTMLElement, h: AttachmentHandlers): number {
  const vids = Array.from(container.getElementsByTagName('video'))
  vids.forEach((v) => {
    if (v.hasAttribute('controls')) return // 已是可控播放器，跳过
    const name = v.getAttribute('src') || '视频'
    const link = proxyUrl(v.getAttribute('src') || '')
    const p = makeLinkRow(
      name,
      () => h.onViewObject(link, name),
      () => h.onDownload(link, name)
    )
    container.insertBefore(p, v)
    v.remove()
  })
  return vids.length
}

function changeDiv(container: HTMLElement, h: AttachmentHandlers): number {
  let changed = 0
  const divs = Array.from(container.getElementsByTagName('div'))
  divs.forEach((d) => {
    if (d.hasAttribute('data-type')) {
      const type = d.getAttribute('data-type')
      if (type === 'ppt') {
        const name = d.getAttribute('data-name') || 'PPT'
        const url = d.getAttribute('data-url') || ''
        const p = makeLinkRow(
          name,
          () => h.onViewPpt(url, name),
          () => h.onDownload(proxyUrl(url), name)
        )
        container.insertBefore(p, d)
        d.remove()
        changed++
      } else if (type === 'pdf') {
        const name = d.getAttribute('data-name') || 'PDF'
        const link = proxyUrl(d.getAttribute('data-url') || '')
        const p = makeLinkRow(
          name,
          () => h.onViewPdf(link, name),
          () => h.onDownload(link, name)
        )
        container.insertBefore(p, d)
        d.remove()
        changed++
      } else if (type === 'image-block') {
        const img = d.querySelector('img')
        if (img) {
          img.setAttribute('width', '100%')
          img.setAttribute('src', proxyImgSrc(img.getAttribute('src') || ''))
        }
        d.setAttribute('data-type', 'image-block-changed')
        changed++
      }
    } else if (d.hasAttribute('data-id')) {
      // 习题类：旧逻辑仅提示「无法查看习题」
      const name = d.getAttribute('data-title') || '习题'
      const p = document.createElement('p')
      p.className = 'lesson-exercise'
      p.textContent = '无法查看习题：' + name
      container.insertBefore(p, d)
      d.remove()
      changed++
    }
  })
  return changed
}

/** 对容器内容做完整改写（复刻 change_all） */
export function renderLessonContent(container: HTMLElement, handlers: AttachmentHandlers): void {
  let guard = 0
  while (changeObject(container, handlers) !== 0 && guard++ < 50) { /* loop */ }
  guard = 0
  while (changeVideo(container, handlers) !== 0 && guard++ < 50) { /* loop */ }
  guard = 0
  while (changeDiv(container, handlers) !== 0 && guard++ < 50) { /* loop */ }
  void DOWNLOAD_PROXY_HOST
}

/** 是否含有尚未改写的附件标签（用于「手动渲染」按钮判断） */
export function hasRawAttachments(container: HTMLElement): boolean {
  return (
    container.getElementsByTagName('object').length > 0 ||
    Array.from(container.getElementsByTagName('video')).some((v) => !v.hasAttribute('controls')) ||
    Array.from(container.getElementsByTagName('div')).some(
      (d) => d.hasAttribute('data-type') || d.hasAttribute('data-id')
    )
  )
}
