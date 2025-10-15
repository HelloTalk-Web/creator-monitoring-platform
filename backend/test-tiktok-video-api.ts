/**
 * 测试TikTok视频API
 */

const API_BASE_URL = process.env.SCRAPE_CREATORS_BASE_URL || 'https://api.scrapecreators.com'
const API_KEY = process.env.SCRAPE_CREATORS_API_KEY || 'iaVCWYNfwfXjcB1irpLRB6ehQuB3'

async function testTikTokVideoAPI() {
  const videoUrl = 'https://www.tiktok.com/@dansukiii/video/7526056131303656725'

  console.log('🔄 测试TikTok视频API...\n')
  console.log(`📹 视频URL: ${videoUrl}\n`)
  console.log(`🔑 API Key: ${API_KEY}\n`)
  console.log(`🌐 API Base URL: ${API_BASE_URL}\n`)

  try {
    const params = new URLSearchParams({
      url: videoUrl,
      trim: 'false'
    })

    console.log(`📡 请求URL: ${API_BASE_URL}/v2/tiktok/video?${params}\n`)

    const response = await fetch(`${API_BASE_URL}/v2/tiktok/video?${params}`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    })

    console.log(`📊 响应状态: ${response.status} ${response.statusText}\n`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API请求失败!')
      console.error(`错误信息: ${errorText}`)
      process.exit(1)
    }

    const data = await response.json()

    console.log('✅ API请求成功!\n')
    console.log('响应数据结构:')
    console.log(`  - status_code: ${data.status_code}`)
    console.log(`  - aweme_detail存在: ${!!data.aweme_detail}`)

    if (data.aweme_detail) {
      console.log(`  - aweme_id: ${data.aweme_detail.aweme_id}`)
      console.log(`  - desc: ${data.aweme_detail.desc?.substring(0, 50)}...`)
      console.log(`  - statistics: ${JSON.stringify(data.aweme_detail.statistics)}`)
    }

    console.log('\n完整响应（前500字符）:')
    console.log(JSON.stringify(data, null, 2).substring(0, 500))

  } catch (error) {
    console.error('❌ 请求失败:', error)
    process.exit(1)
  }
}

testTikTokVideoAPI()
