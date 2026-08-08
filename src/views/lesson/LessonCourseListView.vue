<template>
  <div class="lesson-course-page">
    <el-input v-model="search" placeholder="搜索课程..." clearable class="mb-3 search" />

    <div v-loading="loading" class="course-grid">
      <el-empty v-if="!loading && filtered.length === 0" description="暂无课程" />
      <div
        v-for="c in filtered"
        :key="c.id"
        class="course-card"
        :class="{ disabled: c.status === 0 }"
        @click="c.status === 0 ? null : openCourse(c)"
      >
        <img :src="coverOf(c)" class="course-cover" alt="封面" />
        <div class="course-body">
          <div class="course-title">
            {{ c.title }}<span v-if="c.status === 0" class="down-tag">（已下架）</span>
          </div>
          <div class="course-meta">学科：{{ c.subjectName || '未知' }}</div>
          <div class="course-meta">教师：{{ c.userName || '未知' }}</div>
          <div class="course-meta">进度：{{ c.progress || 0 }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { LessonCourse } from '@/api/lesson'
import { getLearningCourses } from '@/api/lesson'
import { proxyImgSrc, detectLocalProxy } from '@/utils/proxy'

const router = useRouter()
const loading = ref(false)
const search = ref('')
const courses = ref<LessonCourse[]>([])

const filtered = computed(() =>
  courses.value.filter((c) => c.title?.toLowerCase().includes(search.value.toLowerCase()))
)

function coverOf(c: LessonCourse): string {
  if (!c.cover) return ''
  return proxyImgSrc(c.cover)
}

function openCourse(c: LessonCourse) {
  router.push(`/lesson/${c.id}`)
}

async function load() {
  loading.value = true
  try {
    courses.value = await getLearningCourses()
  } catch (e: any) {
    ElMessage.error('加载课程失败：' + (e.message || e))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await detectLocalProxy()
  await load()
})
</script>

<style scoped>
.lesson-course-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mb-3 {
  margin-bottom: 12px;
}
.search {
  max-width: 360px;
}
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  min-height: 200px;
}
.course-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.course-card:hover {
  box-shadow: var(--el-box-shadow-light);
}
.course-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.course-cover {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
}
.course-body {
  padding: 10px;
}
.course-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.course-meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.down-tag {
  color: var(--el-color-danger);
  font-weight: 400;
}
</style>
