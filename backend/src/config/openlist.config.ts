/**
 * OpenList 配置
 */

export const openlistConfig = {
  baseURL: process.env.OPENLIST_URL || 'http://117.72.221.238:5244',
  username: process.env.OPENLIST_USERNAME || 'azu',
  password: process.env.OPENLIST_PASSWORD || '',
  storagePath: process.env.OPENLIST_STORAGE_PATH || '', // 空字符串表示没有前缀
  maxConcurrentUploads: parseInt(process.env.MAX_CONCURRENT_UPLOADS || '5', 10),
};

// 验证必需的配置项
if (!openlistConfig.password) {
  throw new Error('OPENLIST_PASSWORD is required in environment variables');
}

export default openlistConfig;
