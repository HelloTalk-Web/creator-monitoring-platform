// 简单的URL解析测试
console.log('🧪 开始测试URL修复...\n')

// URL清理函数
function cleanUrl(url) {
  return url.trim()
    .replace(/^["']/, '')  // 移除开头的引号
    .replace(/["']$/, '')  // 移除结尾的引号
    .split('?')[0]         // 移除查询参数
}

// 标识符提取函数
function extractIdentifier(url) {
  // 先清理URL
  const cleaned = cleanUrl(url)

  // 检查是否是reel链接
  const reelMatch = cleaned.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/)
  if (reelMatch) {
    return { type: 'reel', value: reelMatch[1] }
  }

  // 检查是否是post链接
  const postMatch = cleaned.match(/instagram\.com\/p\/([a-zA-Z0-9_-]+)/)
  if (postMatch) {
    return { type: 'post', value: postMatch[1] }
  }

  // 检查是否是用户主页链接
  const userMatch = cleaned.match(/instagram\.com\/([a-zA-Z0-9._]+)/)
  if (userMatch) {
    return { type: 'user', value: userMatch[1] }
  }

  throw new Error('Invalid Instagram URL format')
}

// URL验证函数
function isValidInstagramUrl(url) {
  // 先清理URL
  const cleaned = cleanUrl(url)

  const patterns = [
    /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/,
    /^https?:\/\/(www\.)?instagram\.com\/p\/[a-zA-Z0-9_-]+\/?$/,
    /^https?:\/\/(www\.)?instagram\.com\/reel\/[a-zA-Z0-9_-]+\/?$/
  ]

  return patterns.some(pattern => pattern.test(cleaned))
}

// URL标准化函数
function normalizeUrl(url) {
  const identifier = extractIdentifier(url)

  if (identifier.type === 'post' || identifier.type === 'reel') {
    // 对于post和reel链接，返回清理后的URL
    return cleanUrl(url)
  }

  // 对于用户主页，标准化格式
  return `https://www.instagram.com/${identifier.value}/`
}

// 测试用例
const testUrls = [
  // Reel链接（之前失败的）
  'https://www.instagram.com/reel/DOGIkoKEg6D/?igsh=MWRqeWFoNGNzcTB6',
  'https://www.instagram.com/reel/DPdiw_rACKA/?igsh=MW8waHJ1ZHg2NGZncg==',
  'https://www.instagram.com/reel/DPLpdjliUK3/?igsh=MTJpbmxhdmJ3Mncwdw==',

  // 有格式问题的URL
  '"https://www.instagram.com/ylrebkim2x',

  // 正常的用户主页URL
  'https://www.instagram.com/cherrish_11111111111?igsh=MWJpZ2o2NDc0dTZ1cg==',

  // Post链接
  'https://www.instagram.com/p/ABC123/?utm_source=ig_web_button_share_sheet',

  // 简单用户主页
  'https://www.instagram.com/englishwithvicky'
]

for (const url of testUrls) {
  console.log(`📝 测试URL: ${url}`)

  try {
    // 测试URL清理
    const cleaned = cleanUrl(url)
    console.log(`   🧹 清理后URL: ${cleaned}`)

    // 测试URL验证
    const isValid = isValidInstagramUrl(url)
    console.log(`   ✅ 验证结果: ${isValid}`)

    if (isValid) {
      // 测试标识符提取
      const identifier = extractIdentifier(url)
      console.log(`   🎯 提取结果: ${JSON.stringify(identifier)}`)

      // 测试URL标准化
      const normalized = normalizeUrl(url)
      console.log(`   🔗 标准化URL: ${normalized}`)
    }

  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`)
  }

  console.log('---')
}

console.log('🎉 测试完成！')