/**
 * 存储空间清理脚本
 *
 * 功能:
 * - 检测未被引用的本地图片文件
 * - 支持 dry-run 模式预览删除
 * - 安全检查防止误删
 *
 * 用法:
 * - Dry-run 模式: npx tsx scripts/cleanup-storage.ts --dry-run
 * - 执行清理: npx tsx scripts/cleanup-storage.ts --execute
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../src/shared/database/db';
import { imageMetadata } from '../src/shared/database/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 下载目录
const DOWNLOAD_DIR = path.join(__dirname, '../static/images/downloaded');

/**
 * 获取数据库中所有已记录的本地文件路径
 */
async function getReferencedFiles(): Promise<Set<string>> {
  console.log('📊 查询数据库中引用的文件...');

  const records = await db
    .select({
      localPath: imageMetadata.localPath
    })
    .from(imageMetadata);

  const referencedFiles = new Set<string>();

  for (const record of records) {
    if (record.localPath) {
      // 提取文件名 (localPath 格式: static/images/downloaded/xxx.jpg)
      const fileName = path.basename(record.localPath);
      referencedFiles.add(fileName);
    }
  }

  console.log(`   找到 ${referencedFiles.size} 个被引用的文件\n`);
  return referencedFiles;
}

/**
 * 扫描下载目录中的所有文件
 */
async function scanDownloadDirectory(): Promise<string[]> {
  console.log('📂 扫描下载目录...');

  try {
    // 确保目录存在
    await fs.mkdir(DOWNLOAD_DIR, { recursive: true });

    const files = await fs.readdir(DOWNLOAD_DIR);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });

    console.log(`   找到 ${imageFiles.length} 个图片文件\n`);
    return imageFiles;
  } catch (error) {
    console.error('❌ 扫描目录失败:', error);
    return [];
  }
}

/**
 * 查找未引用的文件
 */
async function findUnusedFiles(): Promise<{
  unusedFiles: string[];
  totalSize: number;
}> {
  const referencedFiles = await getReferencedFiles();
  const allFiles = await scanDownloadDirectory();

  console.log('🔍 检测未引用文件...');

  const unusedFiles: string[] = [];
  let totalSize = 0;

  for (const file of allFiles) {
    if (!referencedFiles.has(file)) {
      unusedFiles.push(file);

      // 获取文件大小
      const filePath = path.join(DOWNLOAD_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      } catch (error) {
        console.error(`   ⚠️  无法读取文件: ${file}`);
      }
    }
  }

  console.log(`   未引用文件: ${unusedFiles.length} 个`);
  console.log(`   可释放空间: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);

  return { unusedFiles, totalSize };
}

/**
 * Dry-run 模式: 预览清理结果
 */
async function dryRun(): Promise<void> {
  console.log('\n🔍 Dry-run 模式: 预览清理操作\n');
  console.log('=' .repeat(60));

  const { unusedFiles, totalSize } = await findUnusedFiles();

  if (unusedFiles.length === 0) {
    console.log('✅ 没有需要清理的文件\n');
    return;
  }

  console.log('📋 将要删除的文件 (前10个):');
  unusedFiles.slice(0, 10).forEach((file, index) => {
    console.log(`   [${index + 1}] ${file}`);
  });

  if (unusedFiles.length > 10) {
    console.log(`   ... 还有 ${unusedFiles.length - 10} 个文件`);
  }

  console.log(`\n💾 总计:`);
  console.log(`   - 文件数量: ${unusedFiles.length}`);
  console.log(`   - 释放空间: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n✅ Dry-run 完成\n');
  console.log('💡 执行清理请运行: npx tsx scripts/cleanup-storage.ts --execute');
}

/**
 * 执行清理
 */
async function executeCleanup(): Promise<void> {
  console.log('\n🚀 开始执行清理...\n');
  console.log('=' .repeat(60));

  const { unusedFiles, totalSize } = await findUnusedFiles();

  if (unusedFiles.length === 0) {
    console.log('✅ 没有需要清理的文件\n');
    return;
  }

  // 安全检查
  console.log('⚠️  安全检查...');
  console.log(`   将删除 ${unusedFiles.length} 个文件`);
  console.log(`   释放 ${(totalSize / 1024 / 1024).toFixed(2)} MB 空间`);

  // 限制单次删除数量
  if (unusedFiles.length > 1000) {
    console.error('\n❌ 单次删除文件数超过1000,请先使用 --dry-run 确认');
    process.exit(1);
  }

  console.log('\n🗑️  开始删除文件...');

  let deletedCount = 0;
  let failedCount = 0;

  for (const file of unusedFiles) {
    const filePath = path.join(DOWNLOAD_DIR, file);

    try {
      await fs.unlink(filePath);
      deletedCount++;

      if (deletedCount % 100 === 0) {
        console.log(`   已删除: ${deletedCount}/${unusedFiles.length}`);
      }
    } catch (error) {
      console.error(`   ❌ 删除失败: ${file}`);
      failedCount++;
    }
  }

  console.log('\n✅ 清理完成!');
  console.log(`   - 成功删除: ${deletedCount} 个文件`);
  console.log(`   - 删除失败: ${failedCount} 个文件`);
  console.log(`   - 释放空间: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);
}

/**
 * 统计存储使用情况
 */
async function showStorageStats(): Promise<void> {
  console.log('\n📊 存储使用统计\n');
  console.log('=' .repeat(60));

  // 1. 扫描下载目录
  const allFiles = await scanDownloadDirectory();
  let totalSize = 0;

  for (const file of allFiles) {
    const filePath = path.join(DOWNLOAD_DIR, file);
    try {
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    } catch (error) {
      // 忽略
    }
  }

  console.log('📁 下载目录:');
  console.log(`   - 文件数量: ${allFiles.length}`);
  console.log(`   - 总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);

  // 2. 数据库统计
  const referencedFiles = await getReferencedFiles();
  console.log('💾 数据库记录:');
  console.log(`   - 引用文件: ${referencedFiles.size} 个\n`);

  // 3. 未引用文件
  const unusedCount = allFiles.length - referencedFiles.size;
  console.log('🗑️  未引用文件:');
  console.log(`   - 数量: ${unusedCount} 个`);
  console.log(`   - 比例: ${((unusedCount / allFiles.length) * 100).toFixed(2)}%\n`);

  console.log('=' .repeat(60));
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];

  console.log('=' .repeat(60));
  console.log('  存储空间清理脚本');
  console.log('=' .repeat(60));

  try {
    if (mode === '--dry-run') {
      await dryRun();
    } else if (mode === '--execute') {
      console.log('\n⚠️  即将删除未引用的文件');
      console.log('   建议先运行 --dry-run 预览\n');
      await executeCleanup();
    } else if (mode === '--stats') {
      await showStorageStats();
    } else {
      console.log('\n用法:');
      console.log('  npx tsx scripts/cleanup-storage.ts --dry-run   # 预览清理');
      console.log('  npx tsx scripts/cleanup-storage.ts --execute   # 执行清理');
      console.log('  npx tsx scripts/cleanup-storage.ts --stats     # 查看统计');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ 执行失败:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
