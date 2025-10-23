import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 存储阈值: 10GB
const MIN_FREE_SPACE_GB = 10;
const MIN_FREE_SPACE_BYTES = MIN_FREE_SPACE_GB * 1024 * 1024 * 1024;

export class StorageMonitorService {
  private isPaused = false;

  /**
   * 检查磁盘空间
   * 返回: { totalSpace, freeSpace, usedSpace, freeSpaceGB, shouldPause }
   */
  async checkDiskSpace(): Promise<{
    totalSpace: number;
    freeSpace: number;
    usedSpace: number;
    freeSpaceGB: number;
    shouldPause: boolean;
  }> {
    try {
      // 获取下载目录路径
      const downloadDir = path.join(__dirname, '../../static/images/downloaded');

      // 确保目录存在
      await fs.mkdir(downloadDir, { recursive: true });

      // 获取文件系统信息
      // 注意: Node.js 没有直接的磁盘空间 API,需要使用系统命令
      // 这里使用简化方案: 检查 tmpdir 的可用空间作为估算
      const tmpDir = os.tmpdir();

      // 在实际生产环境中,应该使用 statvfs (Linux) 或 GetDiskFreeSpaceEx (Windows)
      // 这里我们使用一个简化的估算方案
      const stats = await fs.statfs(downloadDir);

      const totalSpace = stats.blocks * stats.bsize;
      const freeSpace = stats.bfree * stats.bsize;
      const usedSpace = totalSpace - freeSpace;
      const freeSpaceGB = freeSpace / (1024 * 1024 * 1024);

      const shouldPause = freeSpace < MIN_FREE_SPACE_BYTES;

      return {
        totalSpace,
        freeSpace,
        usedSpace,
        freeSpaceGB: parseFloat(freeSpaceGB.toFixed(2)),
        shouldPause
      };
    } catch (error) {
      console.error('[StorageMonitorService] 检查磁盘空间失败:', error);

      // 如果检查失败,默认不暂停下载
      return {
        totalSpace: 0,
        freeSpace: 0,
        usedSpace: 0,
        freeSpaceGB: 0,
        shouldPause: false
      };
    }
  }

  /**
   * 暂停下载 (当空间不足时)
   */
  pauseDownloads() {
    if (!this.isPaused) {
      this.isPaused = true;
      console.error(
        `[StorageMonitorService] ⚠️  磁盘空间不足 (< ${MIN_FREE_SPACE_GB}GB)! 已暂停图片下载任务`
      );
      console.error('[StorageMonitorService] 请管理员清理磁盘空间后重启服务');
    }
  }

  /**
   * 恢复下载
   */
  resumeDownloads() {
    if (this.isPaused) {
      this.isPaused = false;
      console.log('[StorageMonitorService] ✅ 磁盘空间充足,已恢复图片下载任务');
    }
  }

  /**
   * 检查是否应该暂停下载
   */
  shouldPauseDownloads(): boolean {
    return this.isPaused;
  }

  /**
   * 监控存储空间并自动暂停/恢复下载
   */
  async monitorStorage() {
    try {
      const status = await this.checkDiskSpace();

      console.log(
        `[StorageMonitorService] 磁盘空间: ${status.freeSpaceGB}GB 可用 / ${(status.totalSpace / (1024 * 1024 * 1024)).toFixed(2)}GB 总计`
      );

      if (status.shouldPause) {
        this.pauseDownloads();
      } else {
        this.resumeDownloads();
      }

      return status;
    } catch (error) {
      console.error('[StorageMonitorService] 监控存储空间时出错:', error);
      return null;
    }
  }

  /**
   * 获取下载目录的使用情况
   */
  async getDownloadDirectoryStats(): Promise<{
    fileCount: number;
    totalSizeBytes: number;
    totalSizeGB: number;
  }> {
    try {
      const downloadDir = path.join(__dirname, '../../static/images/downloaded');

      // 确保目录存在
      await fs.mkdir(downloadDir, { recursive: true });

      const files = await fs.readdir(downloadDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(downloadDir, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile()) {
          totalSize += stats.size;
        }
      }

      return {
        fileCount: files.length,
        totalSizeBytes: totalSize,
        totalSizeGB: parseFloat((totalSize / (1024 * 1024 * 1024)).toFixed(2))
      };
    } catch (error) {
      console.error('[StorageMonitorService] 获取下载目录统计信息失败:', error);
      return {
        fileCount: 0,
        totalSizeBytes: 0,
        totalSizeGB: 0
      };
    }
  }
}
