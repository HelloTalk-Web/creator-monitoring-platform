/**
 * 测试脚本：更新单个视频数据
 *
 * 使用方法:
 * npx tsx test-update-video.ts <VIDEO_URL>
 *
 * 示例:
 * npx tsx test-update-video.ts "https://www.tiktok.com/@stoolpresidente/video/7463250363559218474"
 */

const API_BASE_URL = 'http://localhost:8000'
const API_KEY = process.env.SCRAPE_CREATORS_API_KEY || 'iaVCWYNfwfXjcB1irpLRB6ehQuB3'

async function testUpdateVideo(videoUrl: string) {
  console.log('🔄 开始测试视频更新接口...\n')
  console.log(`📹 视频URL: ${videoUrl}\n`)

  try {
    const response = await fetch(`${API_BASE_URL}/api/scrape/update-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        url: videoUrl
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ 更新失败!')
      console.error(`状态码: ${response.status}`)
      console.error('响应:', JSON.stringify(data, null, 2))
      process.exit(1)
    }

    console.log('✅ 视频更新成功!\n')
    console.log('响应数据:')
    console.log(JSON.stringify(data, null, 2))

    if (data.data) {
      console.log('\n📊 更新详情:')
      console.log(`  - 视频ID: ${data.data.videoId}`)
      console.log(`  - 更新状态: ${data.data.updated ? '成功' : '失败'}`)
      console.log(`  - 消息: ${data.data.message}`)
    }

  } catch (error) {
    console.error('❌ 请求失败:', error)
    process.exit(1)
  }
}

// 获取命令行参数
const videoUrl = process.argv[2]

if (!videoUrl) {
  console.error('❌ 错误: 请提供视频URL')
  console.log('\n使用方法:')
  console.log('  npx tsx test-update-video.ts <VIDEO_URL>')
  console.log('\n示例:')
  console.log('  npx tsx test-update-video.ts "https://www.tiktok.com/@stoolpresidente/video/7463250363559218474"')
  process.exit(1)
}

// 执行测试
testUpdateVideo(videoUrl)
