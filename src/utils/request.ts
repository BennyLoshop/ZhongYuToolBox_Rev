/**
 * 统一请求封装（基于 fetch）
 * 自动附加 Authorization: Bearer <token>，统一 JSON 解析与错误处理。
 * 401 时自动恢复：先 refreshToken，失败再用记录的凭据自动重新登录，然后重试一次。
 */
import { API_BASE_URL } from '@/config'

export interface RequestOptions extends RequestInit {
  /** 是否跳过 token 注入（如登录接口） */
  skipAuth?: boolean
  /** 基础地址，默认 API_BASE_URL */
  baseUrl?: string
  /** 返回原始 Response（不解析 json） */
  raw?: boolean
  /** 跳过 401 自动恢复（用于恢复流程内部的请求，防止递归/死循环） */
  skipRecover?: boolean
}

/** 正在进行的恢复流程（并发 401 只处理一次） */
let recovering: Promise<boolean> | null = null

/** 尝试恢复登录态：先刷新 token，失败则自动重新登录 */
async function tryRecover(): Promise<boolean> {
  if (recovering) return recovering
  recovering = (async () => {
    const { useAuthStore } = await import('@/stores/auth')
    const auth = useAuthStore()
    try {
      const refreshed = await auth.doRefresh()
      if (refreshed) return true
      await auth.autoRelogin()
      return true
    } catch {
      return false
    }
  })()
  try {
    return await recovering
  } finally {
    recovering = null
  }
}

async function redirectLogin() {
  try {
    const { default: router } = await import('@/router')
    router.push('/login')
  } catch {
    /* ignore */
  }
}

export async function request<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth, baseUrl, raw, skipRecover, headers, ...rest } = options
  const token = localStorage.getItem('token')

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>)
  }
  if (!skipAuth && token) {
    finalHeaders['Authorization'] = `Bearer ${token}`
  }

  const fullUrl = url.startsWith('http')
    ? url
    : `${baseUrl || API_BASE_URL}${url}`

  const resp = await fetch(fullUrl, {
    ...rest,
    headers: finalHeaders
  })

  // 401：尝试恢复登录态并重试一次
  if (resp.status === 401 && !skipAuth && !skipRecover) {
    const recovered = await tryRecover()
    if (recovered) {
      return request<T>(url, { ...options, skipRecover: true })
    }
    const { useAuthStore } = await import('@/stores/auth')
    useAuthStore().logout()
    await redirectLogin()
    throw new Error('登录已过期，请重新登录')
  }

  if (!resp.ok) {
    let msg = `请求失败: ${resp.status}`
    try {
      const errJson = await resp.json()
      msg = errJson.error?.message || errJson.message || msg
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }

  if (raw) return resp as unknown as T
  return (await resp.json()) as T
}

/** ABP 框架接口返回结构：{ result, targetUrl, success, error, unAuthorizedRequest } */
export function unwrapResult<T = any>(resp: any): T {
  if (resp && 'result' in resp) return resp.result
  return resp
}
