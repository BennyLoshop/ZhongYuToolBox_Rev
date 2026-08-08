/**
 * PDF 工具（复刻 pdf-upload.js 的核心能力）
 * - convertPdfToImages: 调 pdf2img.zyai.cc 转图并下载为 webp
 * - blobToWebp / blobToMd5: 图片格式转换与 MD5
 * - zipBlobs: 打包为 zip（用于下载）
 */
import CryptoJS from 'crypto-js'
import JSZip from 'jszip'
import { proxyImgSrc } from '@/utils/proxy'

const PDF2IMG_ENDPOINT = 'https://pdf2img.zyai.cc/upload'

export interface PdfPageImage {
  pageNum: number
  blob: Blob
  url: string
}

/** 将图片 blob 转 webp（不支持则原样返回） */
export function convertBlobToWebp(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        resolve(blob)
        return
      }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (webpBlob) => {
          URL.revokeObjectURL(url)
          if (webpBlob && webpBlob.type === 'image/webp') resolve(webpBlob)
          else resolve(blob)
        },
        'image/webp',
        0.85
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片解码失败'))
    }
    img.src = url
  })
}

/** 计算 blob 的 MD5（大写） */
export async function blobToMd5(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const wordArray = CryptoJS.lib.WordArray.create(buffer as any)
  return CryptoJS.MD5(wordArray).toString().toUpperCase()
}

/** PDF 转图片（调服务端 pdf2img，再下载转 webp） */
export async function convertPdfToImages(
  pdfFile: File,
  onProgress?: (percent: number, current: number, total: number) => void
): Promise<PdfPageImage[]> {
  const formData = new FormData()
  formData.append('file', pdfFile, pdfFile.name)

  onProgress?.(0.1, 0, 1)

  const resp = await fetch(PDF2IMG_ENDPOINT, { method: 'POST', body: formData })
  if (!resp.ok) throw new Error('PDF转图片失败: HTTP ' + resp.status)
  const result = await resp.json()
  if (!result.imgPaths || !Array.isArray(result.imgPaths)) {
    throw new Error('PDF转图片返回格式错误: ' + JSON.stringify(result))
  }

  const imgPaths: string[] = result.imgPaths
  const images: PdfPageImage[] = []

  for (let i = 0; i < imgPaths.length; i++) {
    onProgress?.((i + 1) / imgPaths.length * 0.9, i + 1, imgPaths.length)
    const imgUrl = proxyImgSrc(imgPaths[i])
    const imgResp = await fetch(imgUrl)
    if (!imgResp.ok) throw new Error('下载第 ' + (i + 1) + ' 页图片失败: ' + imgResp.status)
    let blob = await imgResp.blob()
    if (blob.type !== 'image/webp') blob = await convertBlobToWebp(blob)
    images.push({ pageNum: i + 1, blob, url: imgPaths[i] })
  }

  onProgress?.(1.0, imgPaths.length, imgPaths.length)
  return images
}

/** 将多张图片打包为 zip 下载 */
export async function zipBlobs(
  files: Array<{ name: string; blob: Blob }>
): Promise<Blob> {
  const zip = new JSZip()
  for (const f of files) {
    zip.file(f.name, f.blob)
  }
  return await zip.generateAsync({ type: 'blob' })
}
