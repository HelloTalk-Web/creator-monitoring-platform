/**
 * Next.js Middleware - AI 爬虫检测和内容优化
 *
 * 检测到 AI 爬虫后直接返回优化的 Markdown 内容
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { H2MParser } from 'h2m-parser'

/**
 * 已知的 AI 爬虫 User-Agent 关键词
 */
const AI_BOT_PATTERNS: Record<string, string> = {
  'GPTBot': 'OpenAI',
  'ChatGPT-User': 'OpenAI',
  'ClaudeBot': 'Anthropic',
  'Claude-Web': 'Anthropic',
  'claude-code': 'Anthropic',
  'anthropic': 'Anthropic',
  'Google-Extended': 'Google',
  'Googlebot-Extended': 'Google',
  'PerplexityBot': 'Perplexity',
  'Bytespider': 'ByteDance',
}

/**
 * 检测是否是 AI 爬虫
 */
function detectAIBot(userAgent: string) {
  for (const [botName, vendor] of Object.entries(AI_BOT_PATTERNS)) {
    if (userAgent.includes(botName)) {
      return { isAIBot: true, botName, vendor }
    }
  }
  return { isAIBot: false, botName: 'unknown', vendor: 'unknown' }
}

/**
 * 根据路径生成 Markdown 内容 (静态版本,不依赖fetch)
 */
function generateMarkdownForPath(pathname: string): string {
  // 根据不同路径返回不同内容
  if (pathname === '/' || pathname === '/dashboard') {
    return `# 创作者监控平台 - 数据看板

## 平台简介

创作者监控平台是一个现代化的多平台创作者数据监控系统。

## 核心功能

### 📊 数据看板
实时查看所有创作者账号的数据概览,包括:
- 粉丝增长趋势
- 视频发布统计
- 互动数据分析

### 👤 账号管理
支持多平台创作者账号管理:
- **TikTok** - 全球短视频平台
- **抖音** - 中国短视频平台
- **YouTube** - 视频分享平台

### 📹 视频监控
自动抓取和分析视频数据:
- 播放量、点赞数、评论数、分享数
- 发布时间、视频时长
- 视频封面和描述

### 🔍 搜索过滤
- 按标题搜索视频
- 按平台筛选账号
- 分页浏览数据

## API 端点

本平台提供RESTful API:
- \`GET /api/platforms/accounts\` - 获取账号列表
- \`GET /api/v1/videos\` - 获取视频列表
- \`POST /api/scrape/complete\` - 抓取创作者数据

## 快速开始

访问以下页面开始使用:
- **/dashboard** - 查看数据看板
- **/accounts** - 管理创作者账号
- **/videos** - 浏览视频数据
`
  }

  if (pathname === '/accounts') {
    return `# 账号管理

## 功能说明

在账号管理页面,你可以:

1. **添加新账号** - 输入创作者主页URL,系统自动识别平台并抓取数据
2. **查看账号列表** - 浏览所有已添加的创作者账号
3. **删除账号** - 移除不需要的创作者账号
4. **查看视频** - 进入账号详情,查看该创作者的所有视频

## 支持的平台

- **TikTok** (tiktok.com/@username)
- **抖音** (douyin.com/user/xxx)
- **YouTube** (youtube.com/@channel)

## 数据字段

每个账号包含以下信息:
- 账号名称
- 平台类型
- 平台账号ID
- 粉丝数
- 添加时间

## API使用

获取所有账号:
\`\`\`
GET /api/platforms/accounts
\`\`\`

获取指定账号:
\`\`\`
GET /api/platforms/accounts?accountId={id}
\`\`\`
`
  }

  if (pathname.startsWith('/videos')) {
    return `# 视频管理

## 功能说明

视频管理页面提供:

1. **视频列表** - 展示创作者的所有视频
2. **搜索功能** - 按标题搜索视频
3. **分页浏览** - 支持大量视频的分页加载
4. **详细数据** - 查看每个视频的完整数据

## 视频数据字段

每个视频包含:
- 视频封面图
- 标题和描述
- 播放量 (playCount)
- 点赞数 (diggCount)
- 评论数 (commentCount)
- 分享数 (shareCount)
- 发布时间
- 视频时长

## API使用

获取视频列表:
\`\`\`
GET /api/v1/videos?accountId={id}&page=1&pageSize=20
\`\`\`

搜索视频:
\`\`\`
GET /api/v1/videos?accountId={id}&title={keyword}
\`\`\`
`
  }

  // 默认返回站点信息
  return `# 创作者监控平台

## 项目简介

一个现代化的多平台创作者数据监控系统,支持TikTok、抖音、YouTube等平台的账号管理和视频数据自动抓取。

## 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **UI库**: shadcn/ui + Tailwind CSS
- **语言**: TypeScript
- **HTTP客户端**: Axios

### 后端
- **运行时**: Node.js + TypeScript
- **框架**: Express.js
- **数据库**: PostgreSQL (Drizzle ORM)
- **爬虫**: Scrape Creators API

## 主要功能

- 🌐 **多平台支持** - TikTok、抖音、YouTube
- 👤 **账号管理** - 添加、查看、删除创作者账号
- 📹 **视频监控** - 自动抓取视频数据和互动指标
- 🔍 **搜索过滤** - 支持按标题搜索视频
- 📊 **数据展示** - 清晰的卡片式视频列表和统计信息

## 可用页面

- **/** - 首页,自动跳转到数据看板
- **/dashboard** - 数据看板,查看所有账号概览
- **/accounts** - 账号管理,管理创作者账号
- **/videos** - 视频管理,查看和分析视频数据

## GitHub

项目地址: https://github.com/HelloTalk-Web/creator-monitoring-platform

---

💡 **提示**: 这是为AI爬虫优化的Markdown版本,包含了网站的核心信息和功能说明。
`
}

export async function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const acceptHeader = request.headers.get('accept') || ''
  const pathname = request.nextUrl.pathname

  // 跳过内部请求,防止无限循环
  if (userAgent.includes('InternalFetcher')) {
    return NextResponse.next()
  }

  // 1. 检测是否是 AI 爬虫 (两种方式)
  const botInfo = detectAIBot(userAgent)
  const acceptsMarkdown = acceptHeader.includes('text/markdown')

  // 如果明确请求markdown格式,也视为AI爬虫
  const isAIRequest = botInfo.isAIBot || acceptsMarkdown

  // 如果是 AI 爬虫或请求markdown格式,直接返回 Markdown
  if (isAIRequest) {
    const source = acceptsMarkdown ? 'Accept: text/markdown' : `User-Agent: ${botInfo.botName}`
    console.log(`🤖 AI request detected (${source}) accessing ${pathname}`)

    try {
      // 生成基于路径的内容
      const markdown = generateMarkdownForPath(pathname)

      // 添加元数据
      const frontMatter = `---
title: "${pathname}"
optimized-for: AI
bot: ${botInfo.botName}
vendor: ${botInfo.vendor}
generated-at: ${new Date().toISOString()}
---

`

      const finalMarkdown = frontMatter + markdown

      console.log(`✅ Returned optimized Markdown for ${botInfo.botName}`)

      // 返回 Markdown (使用text/plain更好的兼容性)
      return new NextResponse(finalMarkdown, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-AI-Bot-Detected': botInfo.botName || 'Accept-Markdown',
          'X-Bot-Vendor': botInfo.vendor || 'Unknown',
          'X-Content-Format': 'markdown',
        },
      })
    } catch (error) {
      console.error('❌ Error in AI optimizer:', error)
      // 出错时继续正常流程
      return NextResponse.next()
    }
  }

  // 普通用户,继续正常流程
  return NextResponse.next()
}

/**
 * 配置需要优化的路径
 */
export const config = {
  matcher: [
    /*
     * 匹配所有页面路径,除了:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
