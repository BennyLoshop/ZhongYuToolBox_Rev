/**
 * 统一配置中心
 * 集中管理 API 基地址、代理地址、学校/学科常量、AES 密钥生成等。
 * 所有模块从此处读取，便于后续统一修改。
 */

const ls = window.localStorage

export const API_BASE_URL: string =
  ls.getItem('apiBaseUrl') || 'https://zyapi.loshop.com.cn'

export const API_BASE_BASE_URL: string =
  ls.getItem('apiBaseOrigin') || 'https://zyapi.loshop.com.cn'

export const SHARE_SERVER: string =
  ls.getItem('shareServer') || 'https://zytbshareapi.loshop.com.cn'

/** 远端代理（默认走服务器） */
export const PROXY_REMOTE = 'https://zytbdownloadagent.loshop.com.cn/download/'
/** 本地加速代理（检测到时使用） */
export const PROXY_LOCAL = 'http://127.0.0.1:5005/proxy/'
/** 本地代理探测地址 */
export const PROXY_LOCAL_PING = 'http://127.0.0.1:5005/proxy/ping'

/** 领创接口配置（复刻 linspirer.js） */
export const LINSPIRER = {
  KEY: '1191ADF18489D8DA',
  IV: '5E9B755A8B674394',
  API_BASE: 'https://zytb-linspirer-api.loshop.com.cn',
  API: 'https://zytb-linspirer-api.loshop.com.cn/public-interface.php',
  CLIENT_VERSION: 'zhongyukejiao_hem_6.10.004.6',
  FIXED_UUID: '40E06F51-30D0-D6AD-7F7D-008AD0ADC570'
}

/** 中育 AES 密钥（复刻 index.js generateAesKey） */
export function generateAesKey(): string {
  const e = ':F0wKU!Qg3}UkbW+w[:9|D3-5h=:T;7t#_GZ4#G;~ZNSq{8;}QIP>\'{q.lje'
  const t = new Date()
  const n = t.getFullYear()
  const r = t.getMonth() + 1
  const o = t.getDate()
  const i = 33 + o * r * 33
  const a = String.fromCharCode((i % 94) + 33)
  const s = e[o + r]
  const c = (n * r * o) % e.length
  const u = e.substring(c)
  const l = e.substring(0, c)
  const f = (u + l).substring(0, 14)
  return a + f + s
}

/** 学校选项（复刻 index.html #school_select） */
export interface SchoolOption {
  value: string
  label: string
}

export const SCHOOLS: SchoolOption[] = [
  { value: 'sxz', label: '省锡中' },
  { value: 'other', label: '其它学校' }
]

/** 学科常量（复刻 index.js 数组 a） */
export const SUBJECTS: Array<[number, string]> = [
  [4, '语文'],
  [5, '数学'],
  [6, '外语'],
  [7, '物理'],
  [8, '化学'],
  [9, '生物'],
  [10, '政治'],
  [11, '历史'],
  [12, '地理'],
  [13, '全科专用（级部发布）'],
  [14, '信息技术'],
  [15, '通用技术'],
  [24, '体育与健康'],
  [34, '技术'],
  [35, '艺术'],
  [41, '研创大任务'],
  [42, '级部管理'],
  [53, '家务劳动'],
  [66, '调查问卷']
]

/**
 * 嵌套 iframe 模块基地址（在线专栏 navPage.html / 选课 ezyRawContent.html）
 * 复刻旧 index.js 中 zxzl_set_url / ck_set_url：
 *   - 专栏：https://zyapi.loshop.com.cn/navPage.html?apiHost=<API_BASE_URL>&apiToken=<token>#/list?messageType=pager
 *   - 选课：ezyRawContent.html?apiHost=https://zyapi.loshop.com.cn&apiToken=<token>#/index/courseChoosing/StudentsCoursesList
 * apiToken 来自登录后的 token；CK 旧版用同源相对路径 ezyRawContent.html，
 * 以便 MutationObserver 能注入样式（见 useIframeInject）。新工程把 ezyRawContent.html
 * 放入 public/ 以复用该同源行为。
 */
export const IFRAME_BASE = ls.getItem('iframeBase') || 'https://zyapi.loshop.com.cn'

/** OSS 上传类型前缀（复刻 index.html #selectFc 选项） */
export const OSS_PREFIXES: string[] = [
  'note_v2',
  'eval_v2',
  'quora_v2',
  'mistake_v2',
  'study_v2',
  'column_v2',
  'paper_v2',
  'revise_v2',
  'selection_v2',
  'manage_v2'
]
