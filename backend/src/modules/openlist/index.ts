export * from './client';
export * from './types';

import { OpenListClient } from './client';

// 创建并导出单例实例
export const openlistClient = new OpenListClient();
