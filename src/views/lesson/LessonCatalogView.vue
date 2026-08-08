<template>
  <div class="lesson-catalog-page">
    <div class="appbar">
      <el-icon class="back" @click="goBack"><ArrowLeft /></el-icon>
      <span class="appbar-title">{{ courseTitle || ('课程 ' + courseId) }}</span>
    </div>

    <el-card class="chapter-card" shadow="never">
      <div v-loading="loading">
        <div v-if="!loading && catalogs.length === 0" class="muted center">暂无章节</div>
        <el-tree
          v-else
          class="catalog-tree"
          node-key="id"
          :data="catalogs"
          :props="treeProps"
          :default-expanded-keys="expandedIds"
          :expand-on-click-node="false"
          highlight-current
          :current-key="selectedId"
          @node-click="onNodeClick"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { LessonCatalog, LessonCourse } from '@/api/lesson'
import { getCourseDetail, getLearningCourses } from '@/api/lesson'

const router = useRouter()
const route = useRoute()
const courseId = ref(String(route.params.courseId))
const courseTitle = ref('')
const loading = ref(false)
const catalogs = ref<LessonCatalog[]>([])
const expandedIds = ref<string[]>([])
const selectedId = ref('')

const treeProps = {
  label: 'title',
  children: 'children'
}

function collectFolderIds(nodes: LessonCatalog[], depth: number, acc: string[] = []): string[] {
  if (depth >= 2) return acc
  nodes.forEach((n) => {
    if (!n.isLeaf && n.children?.length) {
      acc.push(n.id)
      collectFolderIds(n.children, depth + 1, acc)
    }
  })
  return acc
}

function onNodeClick(data: LessonCatalog) {
  if (data.isLeaf) {
    selectedId.value = data.id
    router.push(`/lesson/${courseId.value}/${data.id}`)
  }
}

function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/lesson')
}

async function load() {
  loading.value = true
  try {
    const [detail, list] = await Promise.all([
      getCourseDetail(courseId.value),
      getLearningCourses().catch(() => [] as LessonCourse[])
    ])
    catalogs.value = detail
    expandedIds.value = collectFolderIds(detail, 0)
    const found = (list as LessonCourse[]).find((c) => String(c.id) === courseId.value)
    if (found) courseTitle.value = found.title
  } catch (e: any) {
    ElMessage.error('加载章节失败：' + (e.message || e))
  } finally {
    loading.value = false
  }
}

onMounted(load)

watch(
  () => route.params.courseId,
  (id) => {
    courseId.value = String(id)
    catalogs.value = []
    expandedIds.value = []
    courseTitle.value = ''
    selectedId.value = ''
    load()
  }
)
</script>

<style scoped>
.lesson-catalog-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
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
.chapter-card {
  border-radius: 8px;
}
.catalog-tree {
  padding: 4px 0;
}
.center {
  text-align: center;
  padding: 40px 0;
}
@media (max-width: 767px) {
  .appbar {
    margin-bottom: 8px;
    padding: 0 10px;
  }
}
</style>
