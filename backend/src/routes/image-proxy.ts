import express from 'express'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { logger } from '../shared/utils/logger'

const router = express.Router()

/**
 * 图片智能本地化代理
 *
 * @deprecated 此路由已废弃,请使用 /api/images/:type/:id 替代
 *
 * 工作流程：
 * 1. 检查本地是否已存在 → 存在则重定向到本地
 * 2. 本地不存在 → 下载并保存到本地
 * 3. 下载失败 → 实时代理（保底方案）
 */
router.get('/image', async (req, res) => {
  // 添加废弃警告头
  res.setHeader('X-Deprecated', 'true');
  res.setHeader('X-Deprecated-Message', 'Use /api/images/:type/:id instead');

  try {
    const { url } = req.query

    // 记录废弃警告
    console.warn('[DEPRECATED] /api/image-proxy/image is deprecated. Use /api/images/:type/:id instead.');

    // 参数验证
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'URL parameter is required and must be a string'
        }
      })
    }

    // URL格式验证
    try {
      new URL(url)
    } catch {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL_FORMAT',
          message: 'Invalid URL format'
        }
      })
    }

    logger.info('图片代理请求', { url })

    // 🎯 步骤1：检查本地是否已存在
    const localPath = checkLocalFile(url)
    if (localPath && fs.existsSync(localPath)) {
      // 使用绝对路径，确保以 / 开头
      let webPath = localPath.replace('./static', '/static')
      if (!webPath.startsWith('/')) {
        webPath = '/' + webPath
      }
      logger.info('✅ 图片已本地化，重定向到本地', { url, webPath })
      // 重定向响应需要CORS头
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      return res.redirect(webPath)
    }

    // 🎯 步骤2：本地不存在，下载并保存
    logger.info('📥 图片未本地化，开始下载', { url })

    try {
      // 下载图片
      const imageData = await downloadImageData(url)

      // 保存到本地
      const savedPath = saveImageToLocal(imageData, url)

      // 重定向到本地文件，使用绝对路径
      let webPath = savedPath.replace('./static', '/static')
      if (!webPath.startsWith('/')) {
        webPath = '/' + webPath
      }
      logger.info('✅ 图片下载并保存成功', { url, webPath })
      // 重定向响应需要CORS头
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      return res.redirect(webPath)

    } catch (downloadError) {
      // 🎯 步骤3：下载失败，使用实时代理
      logger.warn('⚠️ 下载失败，使用实时代理', {
        url,
        error: (downloadError as Error).message
      })
      return proxyImageRealtime(url, res)
    }

  } catch (error: any) {
    logger.error('❌ 图片代理失败', {
      url: req.query.url,
      error: error.message,
      stack: error.stack
    })

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error while processing image'
      }
    })
  }
})

// ========== 辅助函数 ==========

/**
 * 检查本地文件是否存在
 */
function checkLocalFile(url: string): string | null {
  const hash = crypto.createHash('md5').update(url).digest('hex')
  const baseDir = './static/images/proxied'

  // 尝试常见图片扩展名
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

  for (const ext of extensions) {
    const filePath = path.join(baseDir, `${hash}${ext}`)
    if (fs.existsSync(filePath)) {
      return filePath
    }
  }

  return null
}

/**
 * 下载图片数据 (带重试机制)
 */
async function downloadImageData(url: string, retryCount = 0): Promise<Buffer> {
  const headers = getPlatformHeaders(url)
  const maxRetries = 3
  const timeout = 20000 // 增加到20秒

  try {
    const response = await axios.get(url, {
      headers,
      responseType: 'arraybuffer',
      timeout,
      maxRedirects: 5
    })

    if (response.status === 200) {
      return response.data
    }

    throw new Error(`HTTP ${response.status}`)
  } catch (error: any) {
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
    const isNetworkError = error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED'

    // 对超时和网络错误进行重试
    if ((isTimeout || isNetworkError) && retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000) // 指数退避，最多5秒
      logger.warn(`下载失败，${delay}ms后重试 (${retryCount + 1}/${maxRetries})`, {
        url: url.substring(0, 100),
        error: error.code || error.message
      })

      await new Promise(resolve => setTimeout(resolve, delay))
      return downloadImageData(url, retryCount + 1)
    }

    // 重试次数用尽或其他错误，抛出
    throw error
  }
}

/**
 * 保存图片到本地
 */
function saveImageToLocal(data: Buffer, url: string): string {
  const baseDir = './static/images/proxied'

  // 确保目录存在
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true })
    logger.info('创建proxied目录', { baseDir })
  }

  // 生成唯一文件名（基于URL的MD5）
  const hash = crypto.createHash('md5').update(url).digest('hex')

  // 从URL提取扩展名
  let ext = '.jpg'
  try {
    const urlPath = new URL(url).pathname
    const urlExt = path.extname(urlPath).split('?')[0].toLowerCase()
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(urlExt)) {
      ext = urlExt
    }
  } catch (error) {
    // 使用默认扩展名
  }

  const filename = `${hash}${ext}`
  const filePath = path.join(baseDir, filename)

  // 保存文件
  fs.writeFileSync(filePath, data)
  logger.info('💾 图片已保存', { filePath, size: data.length })

  return filePath
}

/**
 * 实时代理（保底方案）
 */
async function proxyImageRealtime(url: string, res: express.Response) {
  try {
    const headers = getPlatformHeaders(url)

    const response = await axios.get(url, {
      headers,
      responseType: 'stream',
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500 // 接受所有< 500的状态码
    })

    // 如果是403或其他错误状态，返回错误
    if (response.status >= 400) {
      logger.warn('实时代理失败，返回错误状态', {
        url: url.substring(0, 100),
        status: response.status
      })
      // 设置CORS头
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      return res.status(response.status).json({
        success: false,
        error: {
          code: 'PROXY_FAILED',
          message: `Failed to proxy image: HTTP ${response.status}`
        }
      })
    }

    // 设置响应头
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type'])
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length'])
    }

    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')

    // 流式转发
    response.data.pipe(res)
  } catch (error: any) {
    logger.error('实时代理异常', {
      url: url.substring(0, 100),
      error: error.message
    })

    // 确保返回响应，避免挂起
    if (!res.headersSent) {
      // 设置CORS头
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      return res.status(500).json({
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: 'Failed to proxy image'
        }
      })
    }
  }
}

/**
 * 获取平台特定请求头
 */
function getPlatformHeaders(url: string): Record<string, string> {
  const baseHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  }

  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname

    // Instagram
    if (hostname.includes('instagram') || hostname.includes('cdninstagram') || hostname.includes('fbcdn.net')) {
      return {
        ...baseHeaders,
        'Referer': 'https://www.instagram.com/',
        'Origin': 'https://www.instagram.com'
      }
    }

    // TikTok
    if (hostname.includes('tiktok')) {
      return {
        ...baseHeaders,
        'Referer': 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com'
      }
    }
  } catch (error) {
    // 使用默认headers
  }

  return baseHeaders
}

// CORS预检
router.options('/image', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.status(200).end()
})

export default router
