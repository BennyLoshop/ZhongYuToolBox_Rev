<template>
  <div class="lesson-viewer-page">
    <div class="appbar">
      <el-icon class="back" @click="goBack"><ArrowLeft /></el-icon>
      <span class="appbar-title">{{ name || '附件查看' }}</span>
    </div>

    <div class="viewer-body">
      <!-- 视频（DPlayer） -->
      <div v-if="kind === 'video'" ref="videoRef" class="video-box"></div>

      <!-- PDF（pdfjs 逐页渲染） -->
      <div v-else-if="kind === 'pdf'" ref="pdfRef" class="pdf-box" v-loading="pdfLoading"></div>

      <!-- PPT（@vue-office/pptx 组件渲染） -->
      <div v-else-if="kind === 'pptx'" class="pptx-box">
        <vue-office-pptx
          v-if="!pptxError"
          :src="url"
          class="pptx-el"
          @error="onPptxError"
        />
        <el-result
          v-else
          icon="error"
          title="PPT 预览失败"
          sub-title="当前环境无法渲染该文件，请改用下载后本地打开"
        >
          <template #extra>
            <el-button type="primary" @click="download">下载文件</el-button>
          </template>
        </el-result>
      </div>

      <el-empty v-else description="不支持的附件类型" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import DPlayer from 'dplayer'
import VueOfficePptx from '@vue-office/pptx'
import { proxyUrl } from '@/utils/proxy'

const route = useRoute()
const router = useRouter()

const kind = String(route.query.kind || '')
const url = String(route.query.url || '')
const name = String(route.query.name || '')

const pdfRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLElement | null>(null)
const pdfLoading = ref(false)
const pptxError = ref(false)
let dp: DPlayer | null = null

function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/lesson')
}

function download() {
  if (url) window.open(url, '_blank')
}

function onPptxError(e: any) {
  console.warn('pptx 渲染失败', e)
  pptxError.value = true
}

/* ---------- PDF 渲染（pdfjs-dist） ---------- */
async function renderPdf(src: string) {
  if (!pdfRef.value) return
  pdfLoading.value = true
  try {
    const pdfjs = await import('pdfjs-dist')
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.js?url')).default
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
    const container = pdfRef.value
    container.innerHTML = ''
    const doc = await pdfjs.getDocument(proxyUrl(src)).promise
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const viewport = page.getViewport({ scale: 1.4 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = '100%'
      canvas.style.marginBottom = '8px'
      container.appendChild(canvas)
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
    }
  } catch (e: any) {
    ElMessage.error('PDF 加载失败：' + (e.message || e))
  } finally {
    pdfLoading.value = false
  }
}

function initDPlayer(src: string) {
  if (!videoRef.value) return
  dp = new DPlayer({
    container: videoRef.value,
    video: { url: proxyUrl(src) }
  })
}

onMounted(() => {
  if (kind === 'video') initDPlayer(url)
  else if (kind === 'pdf') renderPdf(url)
})

onBeforeUnmount(() => {
  dp?.destroy()
  dp = null
})
</script>

<style scoped>
.lesson-viewer-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #1f1f1f;
}
.appbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 16px;
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
.viewer-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
}
.video-box {
  width: 100%;
  max-width: 1000px;
  max-height: calc(100vh - 84px);
  background: #000;
}
.video-box :deep(.dplayer) {
  width: 100%;
}
.pdf-box {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 300px;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
}
.pptx-box {
  width: 100%;
  max-width: 960px;
}
.pptx-el {
  width: 100%;
}
@media (max-width: 767px) {
  .appbar {
    padding: 0 10px;
  }
}
</style>
