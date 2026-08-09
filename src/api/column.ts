/**
 * 在线专栏（AppWebSite）接口封装
 * 复刻 api.md 中记录的 8 个接口：
 *   1. 文章更新消息      Message/GetMyMessageListAsync
 *   2. 我的收藏夹        AppWebSite/GetSpecialCatalogAsync
 *   3. 收藏夹里的文章     AppWebSite/GetMyCatalogPagesAsync
 *   4. 专栏里的文章       appWebSite/SearchMyPagesByColIdAsync
 *   5. 搜索专栏里的文章    appWebSite/SearchMyPagesByColIdAsync (pageTitle)
 *   6. 专栏列表+学科       appWebSite/GetTopicSpecialAsync
 *   7. 标记文章已读       AppWebSite/HitAsync
 *   8. 文章详情          appWebSite/GetPageAsync
 */

import { request, unwrapResult } from '@/utils/request'
import { API_BASE_URL } from '@/config'

/* ----------------------------- 类型定义 ----------------------------- */

/** 学科 + 专栏树节点 */
export interface TopicSpecial {
  topicId: number
  topicName: string
  cols: ColumnSummary[]
}

export interface ColumnSummary {
  id: number
  name: string
  sort: number
}

/** 专栏文章摘要（SearchMyPagesByColIdAsync 的 item） */
export interface ColumnPageItem {
  id: number
  specialColId: number
  title: string
  linkUrl: string | null
  description: string | null
  hits: number
  comments: number
  stars: number
  collects: number
  state: number
  publishTime: string
  isTop: boolean
  isRead: boolean
  publisher: string | null
  lastModificationTime: string
  lastModifierUserId: string | null
  creationTime: string
  creatorUserId: string | null
}

export interface PagedResult<T> {
  totalCount: number
  items: T[]
}

/** 收藏夹 */
export interface Catalog {
  id: number
  name: string
  collectCount: number
}

/** 收藏夹里的文章 */
export interface CatalogPageItem {
  id: number
  specialPageId: number
  title: string
  hits: number
  comments: number
  stars: number
  collects: number
  isActive: boolean
  collectTime: string
}

/** 文章更新消息 */
export interface AppMessage {
  isRead: boolean
  parameter: { id: number }
  senderInfo: {
    id: number
    userName: string
    fullName: string
    gender: number
    picture: string | null
    roleType: number
  }
  id: string
  title: string
  type: number
  creationTime: string
}

/** 文章详情 */
export interface ColumnPageDetail {
  hasStar: boolean
  creatorUser: {
    id: number
    userName: string
    fullName: string
    gender: number
    picture: string
    roleType: number
  }
  reads: any[]
  collectUsers: any[]
  id: number
  specialColId: number
  title: string
  linkUrl: string | null
  description: string | null
  content: string
  hits: number
  comments: number
  stars: number
  collects: number
  state: number
  isTop: boolean
  publishTime: string
  delayPublishTaskId: string | null
  allowReply: boolean
  isDeleted: boolean
  deleterUserId: string | null
  deletionTime: string | null
  lastModificationTime: string
  lastModifierUserId: string | null
  creationTime: string
  creatorUserId: string | null
}

/* ----------------------------- JsToJava 文件打开 ----------------------------- */

/**
 * 复刻 api.md 中文章详情 content 里的 JsToJava.open_file 逻辑。
 *
 * 旧代码：
 *   if(window.JsToJava) { window.JsToJava.open_file(url) }
 *   else { window.open(url) }
 *
 * 在 Web（Electron/浏览器）环境内没有 JsToJava 桥，统一回退为 window.open。
 * 在安卓/iOS App 内嵌 WebView 中若存在 JsToJava.open_file 则优先调用，
 * 由原生层接管 PDF 打开（避免浏览器直接下载）。
 */
interface JsToJavaBridge {
  open_file: (url: string) => void
}
declare global {
  interface Window {
    JsToJava?: JsToJavaBridge
  }
}

export function openFile(url: string): void {
  if (window.JsToJava && typeof window.JsToJava.open_file === 'function') {
    window.JsToJava.open_file(url)
  } else {
    window.open(url, '_blank')
  }
}

/**
 * 从文章详情 content (HTML) 中解析出 PDF / 附件链接。
 * content 形如：
 *   <div class="easy-editor-upload pdf-wrapper" data-url="http://...pdf"> ... </div>
 * 也兼容 <a href="..."> 形式。返回第一个可打开的文件地址。
 */
export function extractFileUrl(content: string): string | null {
  if (!content) return null
  // 优先取 data-url 属性
  const dataMatch = content.match(/data-url=(["']?)([^"'\s]+)\1/i)
  if (dataMatch && dataMatch[2]) return dataMatch[2]
  // 再取 <a href="...">
  const hrefMatch = content.match(/href=(["'])([^"']+)\1/i)
  if (hrefMatch && hrefMatch[2]) return hrefMatch[2]
  return null
}

/* ----------------------------- 接口实现 ----------------------------- */

/**
 * 获取专栏列表和对应学科
 * GET /api/services/app/appWebSite/GetTopicSpecialAsync
 */
export async function getTopicSpecial(): Promise<TopicSpecial[]> {
  const resp = await request<{ result: TopicSpecial[] }>(
    '/api/services/app/appWebSite/GetTopicSpecialAsync'
  )
  return unwrapResult<TopicSpecial[]>(resp)
}

/**
 * 查看专栏里的文章 / 搜索一个专栏里的文章
 * POST /api/services/app/appWebSite/SearchMyPagesByColIdAsync
 *
 * @param colId   专栏 id
 * @param pageTitle 可选，传入即视为「搜索专栏里的文章」（模糊匹配标题）
 * @param orderBy 排序字段，默认 PublishTime
 * @param skipCount 分页偏移
 * @param maxResultCount 每页数量
 */
export async function searchPagesByColId(
  colId: number | string,
  options: {
    pageTitle?: string
    orderBy?: string
    skipCount?: number
    maxResultCount?: number
  } = {}
): Promise<PagedResult<ColumnPageItem>> {
  const body: Record<string, any> = {
    colId,
    skipCount: options.skipCount ?? 0,
    maxResultCount: options.maxResultCount ?? 20,
    orderBy: options.orderBy ?? 'PublishTime'
  }
  if (options.pageTitle && options.pageTitle.trim()) {
    body.pageTitle = options.pageTitle.trim()
  }
  const resp = await request<{ result: PagedResult<ColumnPageItem> }>(
    '/api/services/app/appWebSite/SearchMyPagesByColIdAsync',
    {
      method: 'POST',
      body: JSON.stringify(body)
    }
  )
  return unwrapResult<PagedResult<ColumnPageItem>>(resp)
}

/**
 * 获取文章详情
 * GET /api/services/app/appWebSite/GetPageAsync?id=
 */
export async function getPageDetail(id: number | string): Promise<ColumnPageDetail> {
  const resp = await request<{ result: ColumnPageDetail }>(
    `/api/services/app/appWebSite/GetPageAsync?id=${id}`
  )
  return unwrapResult<ColumnPageDetail>(resp)
}

/**
 * 标记文章已读（命中/Hit）
 * POST /api/services/app/AppWebSite/HitAsync?pageId=
 */
export async function hitPage(pageId: number | string): Promise<void> {
  await request<{ success: boolean }>(
    `/api/services/app/AppWebSite/HitAsync?pageId=${pageId}`,
    { method: 'POST' }
  )
}

/**
 * 查看我的收藏夹
 * GET /api/services/app/AppWebSite/GetSpecialCatalogAsync
 */
export async function getSpecialCatalog(): Promise<Catalog[]> {
  const resp = await request<{ result: Catalog[] }>(
    '/api/services/app/AppWebSite/GetSpecialCatalogAsync'
  )
  return unwrapResult<Catalog[]>(resp)
}

/**
 * 查看收藏夹里的文章
 * GET /api/services/app/AppWebSite/GetMyCatalogPagesAsync?catalogId=&maxResultCount=&skipCount=
 */
export async function getMyCatalogPages(
  catalogId: number | string,
  options: { skipCount?: number; maxResultCount?: number } = {}
): Promise<PagedResult<CatalogPageItem>> {
  const skipCount = options.skipCount ?? 0
  const maxResultCount = options.maxResultCount ?? 20
  const resp = await request<{ result: PagedResult<CatalogPageItem> }>(
    `/api/services/app/AppWebSite/GetMyCatalogPagesAsync?catalogId=${catalogId}&maxResultCount=${maxResultCount}&skipCount=${skipCount}`
  )
  return unwrapResult<PagedResult<CatalogPageItem>>(resp)
}

/**
 * 标记单条消息已读（未读消息自己的已读 API）
 * POST /api/services/app/Message/SetMessageReadAsync?messageId=
 */
export async function setMessageRead(messageId: number | string): Promise<void> {
  await request<{ success: boolean }>(
    `/api/services/app/Message/SetMessageReadAsync?messageId=${messageId}`,
    { method: 'POST' }
  )
}

/**
 * 查看文章更新消息
 * POST /api/services/app/Message/GetMyMessageListAsync
 * @param type 消息类型（默认 2：专栏/文章发布更新）
 */
export async function getMyMessageList(
  type = 2,
  options: { skipCount?: number; maxResultCount?: number } = {}
): Promise<PagedResult<AppMessage>> {
  const body = {
    Type: type,
    skipCount: options.skipCount ?? 0,
    MaxResultCount: options.maxResultCount ?? 20
  }
  const resp = await request<{ result: PagedResult<AppMessage> }>(
    '/api/services/app/Message/GetMyMessageListAsync',
    {
      method: 'POST',
      body: JSON.stringify(body)
    }
  )
  return unwrapResult<PagedResult<AppMessage>>(resp)
}

/** 仅导出 base，便于必要时手动拼接 */
export const COLUMN_API_BASE = API_BASE_URL
