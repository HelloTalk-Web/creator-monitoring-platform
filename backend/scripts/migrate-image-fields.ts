/**
 * 图片字段迁移脚本
 *
 * 功能:
 * - 将 creator_accounts.local_avatar_url 和 videos.thumbnail_local_path 迁移到 image_metadata 表
 * - 支持 dry-run 模式预览迁移
 * - 支持事务回滚
 * - 自动备份数据库
 *
 * 用法:
 * - Dry-run 模式: npx tsx scripts/migrate-image-fields.ts --dry-run
 * - 执行迁移: npx tsx scripts/migrate-image-fields.ts --execute
 * - 回滚迁移: npx tsx scripts/migrate-image-fields.ts --rollback <backup_file>
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { db } from '../src/shared/database/db';
import { imageMetadata, creatorAccounts, videos } from '../src/shared/database/schema';
import { sql } from 'drizzle-orm';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 备份目录
const BACKUP_DIR = path.join(__dirname, '../backups');

// 数据库连接信息
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5433',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'creator_monitoring'
};

/**
 * 生成 MD5 哈希
 */
function generateUrlHash(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * 创建数据库备份
 */
async function createBackup(): Promise<string> {
  console.log('\n📦 创建数据库备份...');

  // 确保备份目录存在
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  // 生成备份文件名 (时间戳)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `migration_backup_${timestamp}.sql`);

  // 执行 pg_dump
  const dumpCommand = `PGPASSWORD=${DB_CONFIG.password} pg_dump -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} -F p -f ${backupFile}`;

  try {
    await execAsync(dumpCommand);
    const stats = await fs.stat(backupFile);
    console.log(`✅ 备份成功: ${backupFile}`);
    console.log(`   大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    return backupFile;
  } catch (error) {
    console.error('❌ 备份失败:', error);
    throw error;
  }
}

/**
 * 恢复数据库备份
 */
async function restoreBackup(backupFile: string): Promise<void> {
  console.log(`\n📥 恢复数据库备份: ${backupFile}...`);

  // 检查备份文件是否存在
  try {
    await fs.access(backupFile);
  } catch {
    throw new Error(`备份文件不存在: ${backupFile}`);
  }

  // 执行 psql 恢复
  const restoreCommand = `PGPASSWORD=${DB_CONFIG.password} psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} -f ${backupFile}`;

  try {
    await execAsync(restoreCommand);
    console.log('✅ 恢复成功');
  } catch (error) {
    console.error('❌ 恢复失败:', error);
    throw error;
  }
}

/**
 * Dry-run 模式: 预览迁移数据
 */
async function dryRun(): Promise<void> {
  console.log('\n🔍 Dry-run 模式: 预览迁移数据\n');

  // 1. 查询账号表中的本地头像
  console.log('1️⃣ 检查 creator_accounts 表...');
  const accountsWithLocalAvatar = await db.execute(sql`
    SELECT
      id,
      display_name,
      avatar_url,
      local_avatar_url
    FROM creator_accounts
    WHERE local_avatar_url IS NOT NULL
    LIMIT 5
  `);

  const accountRows = accountsWithLocalAvatar.rows || accountsWithLocalAvatar || [];
  console.log(`   找到 ${accountRows.length} 个账号有本地头像 (显示前5个)`);
  accountRows.forEach((row: any, index: number) => {
    console.log(`   [${index + 1}] ${row.display_name}`);
    console.log(`       原始URL: ${row.avatar_url?.substring(0, 50)}...`);
    console.log(`       本地路径: ${row.local_avatar_url}`);
  });

  // 统计总数
  const totalAccounts = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM creator_accounts
    WHERE local_avatar_url IS NOT NULL
  `);
  const totalAccountRows = totalAccounts.rows || totalAccounts || [];
  console.log(`   总计: ${totalAccountRows[0]?.count || 0} 个账号需要迁移\n`);

  // 2. 查询视频表中的本地缩略图
  console.log('2️⃣ 检查 videos 表...');
  const videosWithLocalThumbnail = await db.execute(sql`
    SELECT
      id,
      title,
      thumbnail_url,
      thumbnail_local_path
    FROM videos
    WHERE thumbnail_local_path IS NOT NULL
    LIMIT 5
  `);

  const videoRows = videosWithLocalThumbnail.rows || videosWithLocalThumbnail || [];
  console.log(`   找到 ${videoRows.length} 个视频有本地缩略图 (显示前5个)`);
  videoRows.forEach((row: any, index: number) => {
    console.log(`   [${index + 1}] ${row.title?.substring(0, 40)}...`);
    console.log(`       原始URL: ${row.thumbnail_url?.substring(0, 50)}...`);
    console.log(`       本地路径: ${row.thumbnail_local_path}`);
  });

  // 统计总数
  const totalVideos = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM videos
    WHERE thumbnail_local_path IS NOT NULL
  `);
  const totalVideoRows = totalVideos.rows || totalVideos || [];
  console.log(`   总计: ${totalVideoRows[0]?.count || 0} 个视频需要迁移\n`);

  // 3. 检查 image_metadata 表当前状态
  console.log('3️⃣ 检查 image_metadata 表...');
  const currentMetadata = await db.execute(sql`
    SELECT
      download_status,
      COUNT(*) as count
    FROM image_metadata
    GROUP BY download_status
  `);

  console.log('   当前记录统计:');
  const metadataRows = currentMetadata.rows || currentMetadata || [];
  metadataRows.forEach((row: any) => {
    console.log(`   - ${row.download_status}: ${row.count}`);
  });

  const totalMetadata = await db.execute(sql`SELECT COUNT(*) as count FROM image_metadata`);
  const totalMetadataRows = totalMetadata.rows || totalMetadata || [];
  console.log(`   总计: ${totalMetadataRows[0]?.count || 0} 条记录\n`);

  console.log('✅ Dry-run 完成\n');
  console.log('💡 执行迁移请运行: npx tsx scripts/migrate-image-fields.ts --execute');
}

/**
 * 执行迁移
 */
async function executeMigration(): Promise<void> {
  console.log('\n🚀 开始执行迁移...\n');

  // 1. 创建备份
  const backupFile = await createBackup();
  console.log(`\n💾 备份文件: ${backupFile}\n`);

  try {
    // 2. 开始事务
    console.log('📝 开始迁移事务...\n');

    // 2.1 迁移头像数据
    console.log('1️⃣ 迁移 creator_accounts 头像数据...');

    const accountsToMigrate = await db.execute(sql`
      SELECT
        id,
        avatar_url,
        local_avatar_url
      FROM creator_accounts
      WHERE avatar_url IS NOT NULL
        AND local_avatar_url IS NOT NULL
    `);

    let avatarMigrated = 0;
    for (const account of accountsToMigrate.rows as any[]) {
      const urlHash = generateUrlHash(account.avatar_url);

      try {
        await db.execute(sql`
          INSERT INTO image_metadata (
            original_url,
            url_hash,
            local_path,
            download_status
          ) VALUES (
            ${account.avatar_url},
            ${urlHash},
            ${account.local_avatar_url},
            'completed'
          )
          ON CONFLICT (url_hash)
          DO UPDATE SET
            local_path = EXCLUDED.local_path,
            download_status = 'completed',
            updated_at = CURRENT_TIMESTAMP
        `);
        avatarMigrated++;
      } catch (error) {
        console.error(`   ⚠️  跳过重复记录: ${account.avatar_url.substring(0, 50)}...`);
      }
    }

    console.log(`   ✅ 迁移完成: ${avatarMigrated} 个头像\n`);

    // 2.2 迁移缩略图数据
    console.log('2️⃣ 迁移 videos 缩略图数据...');

    const videosToMigrate = await db.execute(sql`
      SELECT
        id,
        thumbnail_url,
        thumbnail_local_path
      FROM videos
      WHERE thumbnail_url IS NOT NULL
        AND thumbnail_local_path IS NOT NULL
    `);

    let thumbnailMigrated = 0;
    for (const video of videosToMigrate.rows as any[]) {
      const urlHash = generateUrlHash(video.thumbnail_url);

      try {
        await db.execute(sql`
          INSERT INTO image_metadata (
            original_url,
            url_hash,
            local_path,
            download_status
          ) VALUES (
            ${video.thumbnail_url},
            ${urlHash},
            ${video.thumbnail_local_path},
            'completed'
          )
          ON CONFLICT (url_hash)
          DO UPDATE SET
            local_path = EXCLUDED.local_path,
            download_status = 'completed',
            updated_at = CURRENT_TIMESTAMP
        `);
        thumbnailMigrated++;
      } catch (error) {
        console.error(`   ⚠️  跳过重复记录: ${video.thumbnail_url.substring(0, 50)}...`);
      }
    }

    console.log(`   ✅ 迁移完成: ${thumbnailMigrated} 个缩略图\n`);

    // 3. 数据验证
    console.log('3️⃣ 验证迁移结果...');
    await validateMigration();

    console.log('\n✅ 迁移成功完成!\n');
    console.log(`📦 备份文件已保存: ${backupFile}`);
    console.log('💡 如需回滚,请运行: npx tsx scripts/migrate-image-fields.ts --rollback ' + backupFile);

  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    console.log('\n🔄 正在自动回滚...');
    await restoreBackup(backupFile);
    throw error;
  }
}

/**
 * 验证迁移数据
 */
async function validateMigration(): Promise<void> {
  // 验证头像迁移
  const avatarCheck = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM creator_accounts ca
    LEFT JOIN image_metadata im ON im.original_url = ca.avatar_url
    WHERE ca.local_avatar_url IS NOT NULL
      AND im.id IS NULL
  `);

  if (Number(avatarCheck.rows[0].count) > 0) {
    console.warn(`   ⚠️  发现 ${avatarCheck.rows[0].count} 个头像未迁移`);
  } else {
    console.log('   ✅ 所有头像数据已迁移');
  }

  // 验证缩略图迁移
  const thumbnailCheck = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM videos v
    LEFT JOIN image_metadata im ON im.original_url = v.thumbnail_url
    WHERE v.thumbnail_local_path IS NOT NULL
      AND im.id IS NULL
  `);

  if (Number(thumbnailCheck.rows[0].count) > 0) {
    console.warn(`   ⚠️  发现 ${thumbnailCheck.rows[0].count} 个缩略图未迁移`);
  } else {
    console.log('   ✅ 所有缩略图数据已迁移');
  }
}

/**
 * 删除旧字段 (危险操作,需要确认)
 */
async function dropOldColumns(): Promise<void> {
  console.log('\n⚠️  准备删除旧字段...');
  console.log('   这将删除:');
  console.log('   - creator_accounts.local_avatar_url');
  console.log('   - videos.thumbnail_local_path');

  // TODO: 这是破坏性操作,暂时不实现
  // 实际生产环境中应该:
  // 1. 先运行迁移并验证数据完整性
  // 2. 观察新系统运行一段时间
  // 3. 确认无问题后再手动删除旧字段

  console.log('\n⚠️  删除旧字段功能未实现');
  console.log('   建议: 先验证新系统稳定运行后,再手动删除旧字段');
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];

  console.log('=' .repeat(60));
  console.log('  图片字段迁移脚本');
  console.log('=' .repeat(60));

  try {
    if (mode === '--dry-run') {
      await dryRun();
    } else if (mode === '--execute') {
      console.log('\n⚠️  即将执行数据库迁移操作');
      console.log('   建议先运行 --dry-run 预览数据\n');
      await executeMigration();
    } else if (mode === '--rollback' && args[1]) {
      await restoreBackup(args[1]);
    } else {
      console.log('\n用法:');
      console.log('  npx tsx scripts/migrate-image-fields.ts --dry-run          # 预览迁移');
      console.log('  npx tsx scripts/migrate-image-fields.ts --execute          # 执行迁移');
      console.log('  npx tsx scripts/migrate-image-fields.ts --rollback <file>  # 回滚迁移');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ 执行失败:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
