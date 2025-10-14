import { TikTokAdapter } from '../modules/platforms/adapters/TikTok'

/**
 * TikTok 用户资料获取示例
 *
 * 展示如何使用新的 getTikTokProfile 方法获取TikTok用户资料
 * 包含完整的错误处理和最佳实践
 */

async function exampleGetTikTokProfile() {
  console.log('🎯 TikTok 用户资料获取示例\n')

  // 1. 创建 TikTok 适配器实例
  const tiktokAdapter = new TikTokAdapter()

  try {
    // 2. 初始化适配器
    await tiktokAdapter.initialize()
    console.log('✅ TikTok 适配器初始化成功\n')

    // 3. 定义要获取的用户列表
    const handles = [
      'stoolpresidente', // 示例用户
      '@tiktok',        // 带@符号的用户
      'exampleuser'     // 普通用户名
    ]

    // 4. 遍历获取每个用户的资料
    for (const handle of handles) {
      console.log(`👤 正在获取用户: ${handle}`)

      try {
        // 调用新的 getTikTokProfile 方法
        const result = await tiktokAdapter.getTikTokProfile(handle)

        if (result.success && result.data) {
          // 成功获取用户资料
          const { user, stats } = result.data

          console.log('✅ 成功获取用户资料:')
          console.log(`  🆔 用户ID: ${user.id}`)
          console.log(`  👤 用户名: @${user.uniqueId}`)
          console.log(`  📛 显示名称: ${user.nickname}`)
          console.log(`  📝 简介: ${user.signature || '无'}`)
          console.log(`  👥 粉丝数: ${stats.followerCount.toLocaleString()}`)
          console.log(`  🫶 关注数: ${stats.followingCount.toLocaleString()}`)
          console.log(`  🎥 视频数: ${stats.videoCount.toLocaleString()}`)
          console.log(`  ❤️ 获赞数: ${stats.heartCount.toLocaleString()}`)
          console.log(`  ✅ 认证状态: ${user.verified ? '已认证' : '未认证'}`)
          console.log(`  🔗 头像链接: ${user.avatarMedium}`)

          // 如果有外部链接
          if (user.bioLink?.link) {
            console.log(`  🔗 外部链接: ${user.bioLink.link}`)
          }
        } else {
          // 获取失败，显示错误信息
          console.log('❌ 获取用户资料失败:')
          console.log(`  🔴 错误信息: ${result.error}`)
          console.log(`  📊 状态码: ${result.statusCode || 'N/A'}`)
        }
      } catch (error) {
        console.log('💥 处理用户资料时发生异常:')
        console.log(`  🔴 错误: ${(error as Error).message}`)
      }

      console.log('─'.repeat(60))
    }

    // 5. 使用统一接口（兼容性方法）
    console.log('🔄 使用统一接口获取用户资料...')
    try {
      const profile = await tiktokAdapter.getProfile('tiktok')
      console.log('✅ 统一接口调用成功:')
      console.log(`  平台: ${profile.platform}`)
      console.log(`  用户名: ${profile.username}`)
      console.log(`  显示名: ${profile.displayName}`)
      console.log(`  粉丝数: ${profile.followerCount.toLocaleString()}`)
      console.log(`  个人资料链接: ${profile.profileUrl}`)
    } catch (error) {
      console.log('❌ 统一接口调用失败:')
      console.log(`  🔴 错误: ${(error as Error).message}`)
    }

  } catch (error) {
    console.error('💥 示例执行过程中发生严重错误:', error)
  } finally {
    // 6. 清理资源
    await tiktokAdapter.destroy()
    console.log('\n🧹 资源清理完成')
  }
}

/**
 * 错误处理最佳实践示例
 */
async function exampleErrorHandling() {
  console.log('\n🛡️ 错误处理最佳实践示例\n')

  const tiktokAdapter = new TikTokAdapter()

  try {
    await tiktokAdapter.initialize()
  } catch (error) {
    console.error('❌ 适配器初始化失败:', (error as Error).message)
    return
  }

  // 测试各种错误情况
  const testCases = [
    { handle: '', expectedError: 'Invalid handle' },
    { handle: '   ', expectedError: 'Invalid handle' },
    { handle: 'userthatdoesnotexist123456789', expectedError: 'Not found' }
  ]

  for (const testCase of testCases) {
    console.log(`测试错误情况: "${testCase.handle}"`)

    const result = await tiktokAdapter.getTikTokProfile(testCase.handle)

    if (!result.success) {
      console.log(`✅ 正确捕获错误: ${result.error}`)
      console.log(`状态码: ${result.statusCode}`)

      // 根据错误类型进行不同处理
      switch (result.statusCode) {
        case 400:
          console.log('💡 提示: 请检查用户名格式')
          break
        case 404:
          console.log('💡 提示: 用户不存在或已更改用户名')
          break
        case 429:
          console.log('💡 提示: 请求过于频繁，请稍后重试')
          break
        default:
          console.log('💡 提示: 请检查网络连接或联系管理员')
      }
    } else {
      console.log('⚠️ 预期错误但成功了')
    }

    console.log('─'.repeat(40))
  }

  await tiktokAdapter.destroy()
}

/**
 * 运行所有示例
 */
async function runExamples() {
  console.log('🚀 开始运行 TikTok API 示例...\n')

  await exampleGetTikTokProfile()
  await exampleErrorHandling()

  console.log('\n🎉 所有示例运行完成!')
}

// 如果直接运行此文件
if (require.main === module) {
  runExamples().catch(console.error)
}

export { exampleGetTikTokProfile, exampleErrorHandling, runExamples }