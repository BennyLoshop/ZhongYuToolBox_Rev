/**
 * 分享模块接口层
 * 对应旧项目 share_server.py（Flask 分享服务）
 * 端点：
 *   POST   /api/share/create          创建分享（立即从 API 拉取内容入库）
 *   GET    /api/share/{id}/info       分享信息（不含内容，用于密码校验前）
 *   POST   /api/share/{id}            访问分享内容（可带密码）
 *   GET    /api/shares                我的分享列表（需 Authorization）
 *   DELETE /api/share/{id}            删除分享（需 Authorization）
 */
import { SHARE_SERVER } from '@/config'
import { useAuthStore } from '@/stores/auth'

const BASE = SHARE_SERVER.replace(/\/$/, '')

async function shareFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const resp = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  const text = await resp.text()
  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('分享服务返回非 JSON：' + text.slice(0, 200))
  }
  if (data && data.success === false) {
    throw new Error(data.error || '操作失败')
  }
  return data as T
}

export type ShareResourceType =
  | 'mistake'
  | 'evaluation'
  | 'course'
  | 'chapter'
  | 'quora'
  | 'note'
  | 'note_folder'

export interface CreateSharePayload {
  api_base: string
  resource_type: ShareResourceType
  resource_id: string
  chapter_id?: string
  title?: string
  password?: string
  expires_hours?: number
  max_views?: number
}

export interface CreateShareResult {
  share_id: string
  share_url: string
  has_password: boolean
  expires_at: string | null
}

export interface ShareInfo {
  share_id: string
  resource_type: ShareResourceType
  title: string
  has_password: boolean
  created_at: string
  expires_at: string | null
  view_count: number
  max_views: number
}

export interface ShareContent {
  _meta: {
    share_id: string
    resource_type: ShareResourceType
    title: string
    username: string
    created_at: string
  }
  [key: string]: any
}

export interface MyShareItem {
  share_id: string
  api_base: string
  username: string
  resource_type: ShareResourceType
  resource_id: string
  title: string
  created_at: string
  expires_at: string | null
  view_count: number
  max_views: number
  has_password: number | boolean
}

/** 创建分享（写入当前登录 token，便于后续在「我的分享」中管理/删除） */
export async function createShare(payload: CreateSharePayload): Promise<CreateShareResult> {
  const auth = useAuthStore()
  const body = {
    api_base: payload.api_base,
    token: auth.token || '',
    username: auth.userName || auth.realName || '',
    resource_type: payload.resource_type,
    resource_id: payload.resource_id,
    chapter_id: payload.chapter_id || '',
    title: payload.title || '',
    password: payload.password || '',
    expires_hours: payload.expires_hours || 0,
    max_views: payload.max_views || 0
  }
  return shareFetch<CreateShareResult>('/api/share/create', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

/** 分享信息（不含内容），用于判断是否需要密码 */
export async function getShareInfo(shareId: string): Promise<ShareInfo> {
  const data = await shareFetch<{ success: true } & ShareInfo>(`/api/share/${shareId}/info`)
  const { success, ...info } = data as any
  return info as ShareInfo
}

/** 访问分享内容（可带密码），返回完整 content */
export async function accessShare(shareId: string, password = ''): Promise<ShareContent> {
  const data = await shareFetch<{ success: true; content: ShareContent }>(
    `/api/share/${shareId}`,
    {
      method: 'POST',
      body: JSON.stringify({ password })
    }
  )
  return data.content
}

/** 我的分享列表（需登录 token） */
export async function listMyShares(): Promise<MyShareItem[]> {
  const auth = useAuthStore()
  const data = await shareFetch<{ success: true; shares: MyShareItem[] }>('/api/shares', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token || ''}`
    }
  })
  return data.shares || []
}

/** 删除分享（需登录 token，且为创建者） */
export async function deleteShare(shareId: string): Promise<void> {
  const auth = useAuthStore()
  await shareFetch(`/api/share/${shareId}/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token || ''}`
    }
  })
}
