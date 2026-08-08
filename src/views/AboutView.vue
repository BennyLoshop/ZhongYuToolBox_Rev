<template>
  <div class="about-page">
    <el-card class="block">
      <h2 class="title">中育工具箱 · 说明与致谢</h2>
      <p>
        中育工具箱是一款面向中育账号用户的资源聚合工具，整合了云笔记、图库、错题本、随身答、
        新测评、在线专栏、选课、优客畅学、领创、分享等十余个功能模块，旨在为中育生态用户提供统一、便捷的工具入口。
      </p>
      <p class="muted">
        本工具仅供学习与交流使用，所有数据均来自中育官方接口，账号与凭证仅保存在本机浏览器中。
      </p>
    </el-card>

    <el-card class="block" header="技术栈">
      <ul class="tech">
        <li>Vue 3 + TypeScript + Vite</li>
        <li>Element Plus 组件库</li>
        <li>Pinia 状态管理 / Vue Router 路由</li>
        <li>crypto-js（AES/MD5 加解密）、ali-oss（对象存储直传）</li>
        <li>pdfjs-dist（PDF 转图）、jszip（打包）、fabric（画板）</li>
        <li>DPlayer（视频播放）</li>
      </ul>
    </el-card>

    <el-card class="block" header="致谢">
      <p>感谢中育开放平台提供的接口能力，以及所有为工具箱迭代献策的用户。</p>
    </el-card>

    <el-card class="block" header="更新日志">
      <el-timeline v-if="changelog.length">
        <el-timeline-item
          v-for="(log, i) in changelog"
          :key="i"
          :timestamp="log.date"
          placement="top"
        >
          <div v-for="(item, j) in log.items" :key="j" class="log-item">{{ item }}</div>
        </el-timeline-item>
      </el-timeline>
      <p v-else class="muted">加载中…</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface UpdateEntry {
  date: string
  items: string[]
}

const changelog = ref<UpdateEntry[]>([])

async function loadChangelog() {
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}update.json?t=${Date.now()}`)
    if (!resp.ok) return
    const data = (await resp.json()) as UpdateEntry[]
    // 最新在前
    changelog.value = data.slice().reverse()
  } catch {
    // 忽略加载失败
  }
}

onMounted(loadChangelog)
</script>

<style scoped>
.about-page {
  max-width: 880px;
  margin: 0 auto;
}
.block {
  margin-bottom: 16px;
}
.title {
  margin: 0 0 12px;
}
.tech {
  margin: 0;
  padding-left: 20px;
  line-height: 1.9;
}
.muted {
  color: var(--el-text-color-secondary);
}
.log-item {
  line-height: 1.8;
}
@media (max-width: 767px) {
  .about-page {
    padding: 0 4px;
  }
}
</style>
