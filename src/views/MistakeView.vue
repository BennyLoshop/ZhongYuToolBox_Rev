<template>
  <div class="mistake-page">
    <el-empty v-if="!booksLoading && books.length === 0" description="暂无错题本" />

    <el-tabs v-else v-model="activeBookId" class="mistake-tabs" @tab-change="onTabChange">
      <el-tab-pane v-for="b in books" :key="b.id" :label="b.topic.content" :name="String(b.id)">
        <div v-loading="loading" class="mistake-list">
          <el-empty v-if="!loading && list.length === 0" :description="`「${b.topic.content}」暂无错题`" />
          <div
            v-for="(item, idx) in list"
            :key="item.id"
            class="mistake-card"
            @click="openDetail(item)"
          >
            <div class="idx">{{ idx + 1 }}</div>
            <el-image :src="proxyImgSrc(item.stemShoot)" fit="cover" class="thumb">
              <template #error>
                <div class="thumb-ph"><el-icon><Picture /></el-icon></div>
              </template>
            </el-image>
            <div class="meta">
              <div class="src">{{ item.source || '未命名题目' }}</div>
              <div class="time">{{ item.creationTime }}</div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { proxyImgSrc } from '@/utils/proxy'
import {
  getMyMistakeBooks,
  searchMistakes,
  type MistakeBook,
  type MistakeItem
} from '@/api/mistake'

const router = useRouter()
const booksLoading = ref(false)
const books = ref<MistakeBook[]>([])
const activeBookId = ref<string>('')
const loading = ref(false)
const list = ref<MistakeItem[]>([])
const bookCache = ref<Map<string, MistakeItem[]>>(new Map())

async function initBooks() {
  booksLoading.value = true
  try {
    const res = await getMyMistakeBooks()
    books.value = res || []
    if (books.value.length > 0) {
      activeBookId.value = String(books.value[0].id)
      await loadBook(activeBookId.value)
    }
  } catch (e: any) {
    ElMessage.error('加载错题本失败：' + (e.message || e))
  } finally {
    booksLoading.value = false
  }
}

async function loadBook(id: string) {
  if (bookCache.value.has(id)) {
    list.value = bookCache.value.get(id) || []
    return
  }
  loading.value = true
  try {
    const res = await searchMistakes(id)
    const items = res.items || []
    bookCache.value.set(id, items)
    list.value = items
  } catch (e: any) {
    ElMessage.error('加载失败：' + (e.message || e))
  } finally {
    loading.value = false
  }
}

function onTabChange(name: string | number) {
  const id = String(name)
  activeBookId.value = id
  loadBook(id)
}

function openDetail(item: MistakeItem) {
  router.push({
    path: `/mistake/${item.id}`,
    query: { book: activeBookId.value, source: item.source }
  })
}

onMounted(initBooks)
</script>

<style scoped>
.mistake-page {
  max-width: 1100px;
  margin: 0 auto;
}
.mistake-tabs {
  --el-tabs-header-height: 48px;
}
.mistake-list {
  min-height: 160px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-top: 8px;
}
.mistake-card {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.1s ease;
}
.mistake-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
.idx {
  flex-shrink: 0;
  width: 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
.thumb {
  flex-shrink: 0;
  width: 88px;
  height: 88px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}
.thumb-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--el-text-color-placeholder);
}
.meta {
  min-width: 0;
  flex: 1 1 auto;
}
.src {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.time {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 767px) {
  .mistake-page {
    padding: 0 4px;
  }
  .mistake-list {
    grid-template-columns: 1fr;
  }
}
</style>
