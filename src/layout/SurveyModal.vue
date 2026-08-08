<template>
  <el-dialog
    v-model="visible"
    title="问卷调查邀请"
    width="560px"
    align-center
    :show-close="true"
    @closed="onClosed"
  >
    <div style="font-size: 15px; line-height: 1.6; color: #303133;">
      您好，抽空帮我们填写一份中育ToolBox使用体验问卷可以吗？您的反馈对Loshop非常重要，将帮助我们持续改进工具体验。
    </div>
    <template #footer>
      <el-button @click="neverShow">不再提示</el-button>
      <el-button @click="visible = false">暂时不了</el-button>
      <el-button type="primary" style="background: #e65100; border-color: #e65100" @click="goSurvey">
        好的，前往填写
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const DB_NAME = 'ZhongyuSurveyStorage'
const STORE_NAME = 'survey_state'
const DB_VERSION = 1

const SURVEY_URL = 'https://zytbcert.loshop.com.cn/wj.html'

const visible = ref(false)

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result)
    request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error)
  })
}

function getKV(key: string): Promise<any> {
  return getDB().then(
    (db) =>
      new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const req = tx.objectStore(STORE_NAME).get(key)
        req.onsuccess = () => resolve(req.result)
      })
  )
}

function setKV(key: string, value: any): Promise<void> {
  return getDB().then(
    (db) =>
      new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const req = tx.objectStore(STORE_NAME).put(value, key)
        req.onsuccess = () => resolve()
      })
  )
}

async function initSurvey() {
  const status = await getKV('status')
  if (status === 'answered' || status === 'never_show') return
  const realName = localStorage.getItem('realName') || '未录入'
  ;(window as any).__surveyRealName = realName
  visible.value = true
}

function goSurvey() {
  const realName = (window as any).__surveyRealName || '未录入'
  window.open(`${SURVEY_URL}?realName=${encodeURIComponent(realName)}`, '_blank')
}

async function neverShow() {
  await setKV('status', 'never_show')
  visible.value = false
  ElMessage.success('已设置不再提示')
}

function onClosed() {
  /* 关闭后不记录，下次仍会弹出 */
}

// 监听 iframe 完成通知
function onMessage(e: MessageEvent) {
  if (e.data === 'survey_completed') {
    setKV('status', 'answered')
    visible.value = false
  }
}

onMounted(() => {
  initSurvey()
  window.addEventListener('message', onMessage)
})
</script>
