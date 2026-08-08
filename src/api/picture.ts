/**
 * 图库模块接口（复刻 index.js loadPictures / doUploadPicture）
 * - 列表：GET /api/services/app/PictureLibrary/GetAllPicturesFromLibrary
 * - 上传记录：POST /api/services/app/PictureLibrary/AddPictureAsync
 */
import { request } from '@/utils/request'

export interface PictureItem {
  picture: string
  name: string
  size: string
  createTime: string
  [key: string]: any
}

export interface PictureListResult {
  items: PictureItem[]
  totalCount: number
}

/** 分页拉取图库（isRecycleBin: false=正常, true=回收站） */
export async function getPictures(
  isRecycleBin: boolean,
  skip: number,
  maxResultCount: number
): Promise<PictureListResult> {
  const resp = await request<{ result: PictureListResult }>(
    `/api/services/app/PictureLibrary/GetAllPicturesFromLibrary?SkipCount=${skip}&MaxResultCount=${maxResultCount}&IsRecycleBin=${isRecycleBin}`,
    { method: 'GET' }
  )
  return resp.result
}

/** 上传后登记图片到图库 */
export async function addPicture(
  picture: string,
  name: string,
  size: string
): Promise<any> {
  return request(`/api/services/app/PictureLibrary/AddPictureAsync`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      AppName: 'com.zykj.manage',
      AppVersion: '32'
    },
    body: JSON.stringify({ picture, name, size })
  })
}

/** 格式化文件大小（复刻 index.js formatFileSize） */
export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}
