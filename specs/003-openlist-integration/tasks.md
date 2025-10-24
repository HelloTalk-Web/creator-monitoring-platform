# Tasks · OpenList 图片管线精简

本清单记录已完成的交付项, 方便回顾和回归测试。所有任务均为 ✅ 已完成, 无额外待办。

## 1. 基础能力

- [x] 创建 `openlistClient` 单例并封装 login / upload / download / getProxyUrl
- [x] 处理 401 自动重登录与网络错误单次重试
- [x] 通过 `openlist.config.ts` 管理必需环境变量

## 2. 图片写入流程

- [x] `ImageDownloadService.downloadAvatar` / `downloadThumbnail` 上传至 OpenList, 成功返回 raw_url, 失败保留原 URL
- [x] 生成稳定文件名 (账号/视频标识 + 扩展名 或 URL hash)
- [x] `ScraperManager` 使用新结果写入数据库字段
- [x] `ImageStorageService` 维护 `image_metadata` 状态 (pending/downloading/completed/failed)

## 3. 图片访问

- [x] `/api/images/:type/:id` 支持 OpenList 流式、本地文件、传统代理三种分支
- [x] 删除 `/api/openlist-proxy` 路由, 避免重复入口
- [x] 统一日志输出 (成功、降级、错误)

## 4. 验证

- [x] 手动确认浏览器访问不再触发图片下载弹窗
- [x] 打通爬虫 → 上传 → 数据库存储 → `/api/images` 全链路
- [x] 日志中可区分 `proxy=openlist` / `proxy=fallback`

## 5. 后续关注 (非阻塞)

- [ ] 如需批量迁移历史数据, 另行编写脚本 (当前不在范围内)
- [ ] 按需补充自动化测试, 关注 401 自动重登与降级路径
