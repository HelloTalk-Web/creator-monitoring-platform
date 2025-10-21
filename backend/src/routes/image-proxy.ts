import express from 'express'
import axios from 'axios'
import { logger } from '../shared/utils/logger'

const router = express.Router()

// 图片代理端点
router.get('/image', async (req, res) => {
  try {
    const { url } = req.query

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'URL parameter is required and must be a string'
        }
      })
    }

    // 验证URL格式
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

    logger.info('Proxying image request', { url })

    // 设置请求头，更彻底地模拟浏览器访问
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.instagram.com/',
      'Connection': 'keep-alive'
    }

    // 发起图片请求
    const response = await axios.get(url, {
      headers,
      responseType: 'stream',
      timeout: 10000, // 10秒超时
      maxRedirects: 5
    })

    // 设置响应头
    const contentType = response.headers['content-type']
    const contentLength = response.headers['content-length']

    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }
    if (contentLength) {
      res.setHeader('Content-Length', contentLength)
    }

    // 设置缓存头
    res.setHeader('Cache-Control', 'public, max-age=3600') // 缓存1小时
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // 将图片流转发给客户端
    response.data.pipe(res)

  } catch (error: any) {
    logger.error('Failed to proxy image', {
      url: req.query.url,
      error: (error as Error).message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers
    })

    // 如果是axios错误，返回原始状态码
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: {
          code: 'IMAGE_FETCH_FAILED',
          message: `Failed to fetch image: ${error.response.statusText}`,
          originalStatus: error.response.status
        }
      })
    }

    // 其他错误
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error while fetching image'
      }
    })
  }
})

// 支持OPTIONS请求（CORS预检）
router.options('/image', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.status(200).end()
})

export default router
