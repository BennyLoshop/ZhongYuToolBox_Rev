<template>
  <div class="detail-page">
    <!-- 顶部栏：与笔记详情 appbar 一模一样 -->
    <div class="appbar">
      <el-icon class="back" @click="goBack"><ArrowLeft /></el-icon>
      <span class="appbar-title">{{ detail?.title || '文章详情' }}</span>
    </div>

    <!-- 内容区：保留原版 HTML 样式（含 easy-editor-upload pdf-wrapper 等） -->
    <div
      v-loading="loadingDetail"
      class="detail-body"
      @click.capture="onBodyClick"
      v-html="detail ? proxyContentImages(processPdfs(processVideos(detail.content))) : ''"
    ></div>

    <!-- 底部栏：更新时间 + 互动数据 -->
    <div v-if="detail" class="detail-footer">
      <span class="detail-update-time">最近更新: {{ detail.lastModificationTime }}</span>
      <div class="detail-stats">
        <span class="detail-stat-item">
          <el-icon><Pointer /></el-icon> {{ detail.stars }}
        </span>
        <span class="detail-stat-item">
          <el-icon><Star /></el-icon> {{ detail.collects }}
        </span>
        <span class="detail-stat-item">
          <el-icon><ChatDotRound /></el-icon> {{ detail.comments }}
        </span>
      </div>
    </div>

    <!-- 发布人（仅名称） -->
    <div v-if="detail?.creatorUser?.fullName" class="detail-publisher">
      发布人：{{ detail.creatorUser.fullName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ChatDotRound, Pointer, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getPageDetail, hitPage } from '@/api/column'
import type { ColumnPageDetail } from '@/api/column'
import { proxyImgSrc } from '@/utils/proxy'

const route = useRoute()
const router = useRouter()

const pageId = computed(() => route.params.pageId as string)

const loadingDetail = ref(true)
const detail = ref<ColumnPageDetail | null>(null)

/* 加载详情 + 调用已读 API */
async function loadDetail() {
  if (!pageId.value) return
  loadingDetail.value = true
  try {
    detail.value = await getPageDetail(pageId.value)
    // 调用已读 API
    try {
      await hitPage(pageId.value)
    } catch {
      /* 静默失败 */
    }
  } catch (e: any) {
    ElMessage.error('加载文章详情失败：' + (e?.message || e))
  } finally {
    loadingDetail.value = false
  }
}

function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/column')
}

/**
 * 将文章 HTML 中的 <img src> 统一替换为代理地址（alicdn 源换 OSS，其余走代理）。
 * 在 v-html 之前做字符串预处理，避免 Vue 重渲染覆盖 DOM 后处理。
 */
function proxyContentImages(html: string): string {
  if (!html) return html
  return html.replace(
    /(<img\b[^>]*?\ssrc=["'])([^"']+)(["'][^>]*?>)/gi,
    (_m, pre: string, src: string, post: string) => pre + proxyImgSrc(src) + post
  )
}

/**
 * 将文章 HTML 中的 <video> 替换为统一的附件卡片（点击跳优客畅学播放器）。
 */
function processVideos(html: string): string {
  if (!html) return html
  return html.replace(
    /<video\b[^>]*?\ssrc=["']([^"']+)["'][^>]*?>\s*<\/video>/gi,
    (_m, src: string) =>
      `<div class="col-file-card" data-file-url="${src}" data-file-kind="video">` +
      `<span class="col-file-icon video"></span>` +
      `<span class="col-file-name">播放视频</span>` +
      `<span class="col-file-action">播放</span></div>`
  )
}

/**
 * 将文章 HTML 中的 PDF 附件块（pdf-wrapper / data-url=*.pdf）替换为统一附件卡片，
 * 与视频卡片外观一致。从原结构提取文件名作为卡片标题。
 */
function processPdfs(html: string): string {
  if (!html) return html
  // 匹配 <div ... pdf-wrapper ... data-url=...>...</div>
  // data-url 可能带引号也可能不带（裸属性），需两种都兼容
  return html.replace(
    /<div\b[^>]*?\bpdf-wrapper\b[^>]*?\bdata-url=(["']?)([^"'\s>]+)\1[^>]*>([\s\S]*?)<\/div>/gi,
    (_m, _q: string, dataUrl: string, inner: string) => {
      // 尽量提取原文件名（<a> 文本或 data-url 末段）
      const nameMatch = inner.match(/<a[^>]*>([^<]+)<\/a>/i)
      let name = nameMatch ? nameMatch[1].trim() : ''
      if (!name) {
        const decoded = decodeURIComponent(dataUrl.split('?')[0].split('/').pop() || '')
        name = decoded || 'PDF 文件'
      }
      return (
        `<div class="col-file-card" data-file-url="${dataUrl}" data-file-kind="pdf">` +
        `<span class="col-file-icon pdf"></span>` +
        `<span class="col-file-name">${name}</span>` +
        `<span class="col-file-action">查看</span></div>`
      )
    }
  )
}

/** 跳转到优客畅学的附件查看器（复用其 mp4 / pdf 播放器） */
function jumpViewer(kind: 'pdf' | 'video', url: string, name: string) {
  // 不手动 encodeURIComponent，交给 Vue Router 编码一次，避免双重编码。
  router.push({
    path: '/lesson/viewer',
    query: { kind, url, name }
  })
}

/**
 * 事件委托：拦截统一附件卡片 [data-file-url] 的点击，
 * 根据 data-file-kind（pdf/video）跳转到优客畅学对应的播放器。
 */
function onBodyClick(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  if (!target) return

  const card = target.closest('[data-file-url]') as HTMLElement | null
  if (card) {
    const fileUrl = card.getAttribute('data-file-url') || ''
    const kind = card.getAttribute('data-file-kind') === 'video' ? 'video' : 'pdf'
    if (fileUrl) {
      e.preventDefault()
      e.stopImmediatePropagation()
      e.stopPropagation()
      const fallbackName = kind === 'video' ? '视频' : 'PDF'
      jumpViewer(kind, fileUrl, detail.value?.title || fallbackName)
    }
    return
  }

  // 兜底：从点击元素向上找含附件链接的 a 标签（非卡片场景）
  const anchor = target.closest('a[href]') as HTMLAnchorElement | null
  if (anchor) {
    const href = anchor.getAttribute('href') || ''
    if (/\.(pdf|mp4|webm|ogg|mov)(\?|#|$)/i.test(href)) {
      e.preventDefault()
      e.stopImmediatePropagation()
      e.stopPropagation()
      const isVideo = /\.(mp4|webm|ogg|mov)/i.test(href)
      jumpViewer(isVideo ? 'video' : 'pdf', href, detail.value?.title || (isVideo ? '视频' : 'PDF'))
    }
  }
}

onMounted(loadDetail)
</script>

<style scoped>
.detail-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}

/* 顶部栏：与笔记详情 appbar 一致 */
.appbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 16px;
  margin-bottom: 12px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}
.appbar .back {
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;
  color: var(--el-text-color-regular);
}
.appbar-title {
  flex: 1;
  min-width: 0;
  font-size: 17px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 内容区：保留原版 HTML 样式，仅做基础排版约束 */
.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  min-height: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-primary);
}
.detail-body :deep(img) {
  max-width: 100%;
}
.detail-body :deep(a) {
  color: var(--el-color-primary);
}
/* 原版 easy-editor-upload 附件区域样式兼容（图标/链接/查看按钮） */
.detail-body :deep(.easy-editor-upload.pdf-wrapper) {
  margin: 12px 0;
}
.detail-body :deep(.easy-editor-upload__wrapper) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.detail-body :deep(.easy-editor-upload__name a) {
  color: var(--el-color-primary);
  text-decoration: none;
  cursor: pointer;
}
.detail-body :deep(.easy-editor-upload__name a:hover) {
  text-decoration: underline;
}
.detail-body :deep(.easy-editor-upload__see) {
  display: inline-block;
  width: 22px;
  height: 22px;
  cursor: pointer;
  vertical-align: middle;
  background-repeat: no-repeat;
  background-position: center;
}
/* 附件统一卡片（PDF / 视频） */
.detail-body :deep(.col-file-card) {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0;
  padding: 12px 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s, border-color 0.15s;
}
.detail-body :deep(.col-file-card:hover) {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}
.detail-body :deep(.col-file-icon) {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--el-color-primary-light-3);
  position: relative;
}
.detail-body :deep(.col-file-icon.pdf) {
  background: #f56c6c;
}
.detail-body :deep(.col-file-icon.video) {
  background: #409eff;
}
/* 图标内的白色符号（pdf: 文档角标 / video: 播放三角） */
.detail-body :deep(.col-file-icon.pdf)::after {
  content: 'PDF';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
}
.detail-body :deep(.col-file-icon.video)::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 54%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 7px 0 7px 12px;
  border-color: transparent transparent transparent #fff;
}
.detail-body :deep(.col-file-name) {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.detail-body :deep(.col-file-action) {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--el-color-primary);
  padding: 4px 10px;
  border: 1px solid var(--el-color-primary);
  border-radius: 6px;
}

/* 底部栏：更新时间 + 互动数据 */
.detail-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.detail-update-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.detail-stats {
  display: flex;
  gap: 18px;
}
.detail-stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.detail-stat-item .el-icon {
  vertical-align: -2px;
}

/* 发布人（仅名称） */
.detail-publisher {
  flex-shrink: 0;
  padding: 6px 24px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
}

/* 移动端：顶栏通栏 */
@media (max-width: 767px) {
  .appbar {
    margin-bottom: 8px;
    padding: 0 10px;
  }
  .detail-body {
    padding: 12px 14px;
  }
  .detail-footer,
  .detail-publisher {
    padding-left: 14px;
    padding-right: 14px;
  }
}
</style>
