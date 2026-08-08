/**
 * 优客畅学（SelfStudy）接口（复刻旧 index.js show_lesson / show_class / show_page）
 * 所有请求自动附带 Authorization: Bearer <token>（见 utils/request）
 */

import { request } from '@/utils/request'
import { unwrapResult } from '@/utils/request'

/** 课程摘要 */
export interface LessonCourse {
  id: number
  title: string
  status: number // 0 = 已下架
  cover: string
  progress: number
  userName: string
  subjectName: string
  [key: string]: any
}

/** 章节节点（树） */
export interface LessonCatalog {
  id: string
  title: string
  isLeaf: boolean
  children?: LessonCatalog[]
  [key: string]: any
}

/** 分页拉取全部在学课程（复刻 show_lesson 的 while 分页） */
export async function getLearningCourses(): Promise<LessonCourse[]> {
  const all: LessonCourse[] = []
  let page = 1
  while (true) {
    const res = await request<{ data: LessonCourse[] }>(
      `/SelfStudy/api/Learn/LearningCourses?page=${page}`
    )
    const list = res.data || []
    if (list.length > 0) {
      all.push(...list)
      page++
    } else {
      break
    }
  }
  return all
}

/** 课程章节目录（复刻 show_class） */
export async function getCourseDetail(courseId: number | string): Promise<LessonCatalog[]> {
  const res = await request<{ data: { catalogs: LessonCatalog[] } }>(
    `/SelfStudy/api/Learn/CourseDetail?id=${courseId}`
  )
  return res.data?.catalogs || []
}

/** 读取章节内容（HTML 字符串）复刻 show_page */
export async function readContent(
  catalogId: string,
  courseId: number | string
): Promise<string> {
  const res = await request<{ data: { content: string } }>(
    `/SelfStudy/api/learn/readContent?catalogId=${catalogId}&courseId=${courseId}`
  )
  return res.data?.content || ''
}

/** 兼容 ABP 包装：部分接口 data 在 result 下 */
export { unwrapResult }
