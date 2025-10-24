/**
 * 批量迁移静态资源到 OpenList
 *
 * 功能:
 * 1. 扫描 backend/static/images 目录下的所有图片
 * 2. 批量上传到 OpenList (5并发)
 * 3. 更新数据库中的 URL 引用
 * 4. 生成详细的迁移报告
 *
 * 使用方法:
 *   npx tsx backend/scripts/migrate-to-openlist.ts [--dry-run] [--dir avatars|thumbnails|proxied]
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { openlistClient } from '../src/modules/openlist/index.js';
import { db } from '../src/shared/database/db.js';
import { creatorAccounts, videos, imageMetadata } from '../src/shared/database/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// ESM 模式下获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  staticDir: path.join(__dirname, '../static/images'),
  concurrency: 3,  // 降低并发数避免内存问题
  maxRetries: 3,
  dryRun: process.argv.includes('--dry-run'),
  targetDir: getTargetDir(),
};

function getTargetDir(): string | null {
  const dirArg = process.argv.find(arg => arg.startsWith('--dir='));
  if (dirArg) {
    return dirArg.split('=')[1];
  }
  return null;
}

// 统计数据
interface MigrationStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  totalSize: number;
  successSize: number;
  failedFiles: Array<{ file: string; error: string }>;
  startTime: Date;
  endTime?: Date;
}

const stats: MigrationStats = {
  total: 0,
  success: 0,
  failed: 0,
  skipped: 0,
  totalSize: 0,
  successSize: 0,
  failedFiles: [],
  startTime: new Date(),
};

/**
 * 扫描目录获取所有图片文件
 */
async function scanDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'placeholders' || entry.name === 'downloaded') {
          continue;
        }

        if (CONFIG.targetDir && entry.name !== CONFIG.targetDir) {
          continue;
        }

        await scan(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  await scan(dir);
  return files;
}

/**
 * 生成 OpenList 远程路径
 */
function generateRemotePath(localPath: string): string {
  const relativePath = path.relative(CONFIG.staticDir, localPath);
  const parts = relativePath.split(path.sep);

  if (parts[0] === 'proxied') {
    parts[0] = 'legacy';
  }

  return '/' + parts.join('/');
}

/**
 * 上传单个文件到 OpenList
 */
async function uploadFile(localPath: string): Promise<{ success: boolean; url?: string; error?: string }> {
  const remotePath = generateRemotePath(localPath);

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      console.log(`[${attempt}/${CONFIG.maxRetries}] 上传: ${path.basename(localPath)} → ${remotePath}`);

      const fileBuffer = await fs.readFile(localPath);
      const fileSize = fileBuffer.length;

      if (fileSize > 10 * 1024 * 1024) {
        return {
          success: false,
          error: `文件过大: ${(fileSize / 1024 / 1024).toFixed(2)}MB`,
        };
      }

      if (CONFIG.dryRun) {
        console.log(`  [DRY-RUN] 将上传: ${remotePath} (${(fileSize / 1024).toFixed(2)}KB)`);
        // 释放内存
        return { success: true, url: `http://example.com${remotePath}` };
      }

      const result = await openlistClient.upload(fileBuffer, remotePath);
      console.log(`  ✅ 成功: ${result.url.substring(0, 60)}...`);

      stats.successSize += fileSize;
      return { success: true, url: result.url };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ 失败 (尝试 ${attempt}/${CONFIG.maxRetries}): ${errorMsg}`);

      if (attempt === CONFIG.maxRetries) {
        return { success: false, error: errorMsg };
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  return { success: false, error: 'Unknown error' };
}

/**
 * 批量上传文件 (使用简单的并发控制)
 */
async function uploadBatch(files: string[]): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();

  console.log(`\n📤 开始批量上传 (并发: ${CONFIG.concurrency}, 总数: ${files.length})\n`);

  // 使用简单的分批处理
  for (let i = 0; i < files.length; i += CONFIG.concurrency) {
    const batch = files.slice(i, i + CONFIG.concurrency);

    const results = await Promise.allSettled(
      batch.map(async (file) => {
        const fileStat = await fs.stat(file);
        stats.total++;
        stats.totalSize += fileStat.size;

        const result = await uploadFile(file);

        if (result.success && result.url) {
          stats.success++;
          return { file, url: result.url };
        } else {
          stats.failed++;
          stats.failedFiles.push({
            file: path.relative(CONFIG.staticDir, file),
            error: result.error || 'Unknown error',
          });
          return null;
        }
      })
    );

    // 处理结果
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        urlMap.set(result.value.file, result.value.url);
      }
    }

    // 进度显示
    const progress = ((stats.success + stats.failed) / stats.total * 100).toFixed(1);
    console.log(`\n📊 进度: ${stats.success + stats.failed}/${stats.total} (${progress}%) | 成功: ${stats.success} | 失败: ${stats.failed}\n`);

    // 强制垃圾回收 (如果可用)
    if (global.gc) {
      global.gc();
    }
  }

  return urlMap;
}

/**
 * 更新数据库中的 URL 引用
 */
async function updateDatabaseUrls(urlMap: Map<string, string>): Promise<void> {
  if (CONFIG.dryRun) {
    console.log('\n[DRY-RUN] 跳过数据库更新\n');
    return;
  }

  console.log('\n📝 更新数据库 URL 引用...\n');

  let updatedAccounts = 0;
  let updatedVideos = 0;
  let createdMetadata = 0;

  for (const [localPath, openlistUrl] of urlMap.entries()) {
    const relativePath = path.relative(CONFIG.staticDir, localPath);
    const parts = relativePath.split(path.sep);
    const filename = path.basename(localPath);

    try {
      if (parts[0] === 'avatars') {
        const match = filename.match(/avatar_(\d+)\./);
        if (match) {
          const accountId = parseInt(match[1], 10);
          await db
            .update(creatorAccounts)
            .set({ avatarUrl: openlistUrl })
            .where(eq(creatorAccounts.id, accountId));
          updatedAccounts++;
        }
      } else if (parts[0] === 'thumbnails') {
        const match = filename.match(/thumbnail_(\d+)\./);
        if (match) {
          const videoId = parseInt(match[1], 10);
          await db
            .update(videos)
            .set({ thumbnailUrl: openlistUrl })
            .where(eq(videos.id, videoId));
          updatedVideos++;
        }
      }

      const urlHash = crypto.createHash('md5').update(openlistUrl).digest('hex');
      const now = new Date().toISOString();

      await db.insert(imageMetadata).values({
        originalUrl: openlistUrl,
        urlHash,
        localPath: openlistUrl,
        downloadStatus: 'completed',
        fileSize: null,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing();

      createdMetadata++;

    } catch (error) {
      console.error(`  ❌ 更新失败: ${relativePath}`, error);
    }
  }

  console.log(`\n✅ 数据库更新完成:`);
  console.log(`  - 更新账号头像: ${updatedAccounts} 条`);
  console.log(`  - 更新视频缩略图: ${updatedVideos} 条`);
  console.log(`  - 创建元数据记录: ${createdMetadata} 条\n`);
}

/**
 * 生成迁移报告
 */
async function generateReport(): Promise<void> {
  stats.endTime = new Date();
  const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;

  console.log('\n' + '='.repeat(60));
  console.log('📋 迁移报告');
  console.log('='.repeat(60));
  console.log(`开始时间: ${stats.startTime.toLocaleString()}`);
  console.log(`结束时间: ${stats.endTime.toLocaleString()}`);
  console.log(`总耗时: ${duration.toFixed(1)} 秒`);
  console.log(`\n📊 统计信息:`);
  console.log(`  - 总文件数: ${stats.total}`);
  console.log(`  - 成功上传: ${stats.success} (${(stats.success / stats.total * 100).toFixed(1)}%)`);
  console.log(`  - 失败: ${stats.failed}`);
  console.log(`  - 总大小: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  - 成功上传: ${(stats.successSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  - 平均速度: ${(stats.successSize / 1024 / duration).toFixed(2)} KB/s`);

  if (stats.failedFiles.length > 0) {
    console.log(`\n❌ 失败文件列表 (前10个):`);
    stats.failedFiles.slice(0, 10).forEach(({ file, error }, index) => {
      console.log(`  ${index + 1}. ${file}`);
      console.log(`     错误: ${error}`);
    });
    if (stats.failedFiles.length > 10) {
      console.log(`  ... 还有 ${stats.failedFiles.length - 10} 个失败文件`);
    }
  }

  console.log('\n' + '='.repeat(60));

  const reportPath = path.join(__dirname, `migration-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(stats, null, 2));
  console.log(`\n💾 详细报告已保存: ${reportPath}\n`);
}

/**
 * 主函数
 */
async function main() {
  console.log('\n🚀 OpenList 静态资源迁移工具\n');
  console.log(`配置:`);
  console.log(`  - 静态目录: ${CONFIG.staticDir}`);
  console.log(`  - 并发数: ${CONFIG.concurrency}`);
  console.log(`  - 重试次数: ${CONFIG.maxRetries}`);
  console.log(`  - 目标目录: ${CONFIG.targetDir || '全部'}`);
  console.log(`  - 模式: ${CONFIG.dryRun ? 'DRY-RUN (不实际上传)' : '正式上传'}`);

  try {
    console.log(`\n📁 扫描文件...\n`);
    const files = await scanDirectory(CONFIG.staticDir);
    console.log(`✅ 找到 ${files.length} 个图片文件\n`);

    if (files.length === 0) {
      console.log('❌ 没有找到需要迁移的文件');
      return;
    }

    const urlMap = await uploadBatch(files);
    await updateDatabaseUrls(urlMap);
    await generateReport();

    if (CONFIG.dryRun) {
      console.log('\n💡 这是 DRY-RUN 模式，没有实际上传文件');
      console.log('   移除 --dry-run 参数以执行实际迁移\n');
    }

  } catch (error) {
    console.error('\n❌ 迁移过程出错:', error);
    process.exit(1);
  }
}

main().catch(console.error);
