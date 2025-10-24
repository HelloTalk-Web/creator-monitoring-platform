# Tasks · OpenList 图片管线精简

本清单记录已完成的交付项, 方便回顾和回归测试。所有任务均为 ✅ 已完成, 无额外待办。

## 1. 基础能力

- [x] 创建 `openlistClient` 单例并封装 login / upload / download / getProxyUrl
- [x] 处理 401 自动重登录与网络错误单次重试
- [x] 通过 `openlist.config.ts` 管理必需环境变量

## 2. 图片写入流程

- [x] 爬虫阶段保留平台返回的原始头像/封面 URL
- [x] `ImageDownloadService` 支持按需下载+上传, 生成稳定文件名
- [x] `ImageStorageService` 维护 `image_metadata` 状态并首次上传后回写数据库字段

## 3. 图片访问

- [x] `/api/images/:type/:id` 支持 OpenList 流式、本地文件、传统代理三种分支
- [x] 删除 `/api/openlist-proxy` 路由, 避免重复入口
- [x] 统一日志输出 (成功、降级、错误)

## 4. 账号批量操作

- [x] 新增后台接口, 可按账号ID批量重新爬取
- [x] 账号管理页支持多选并显示“批量重新爬取”按钮

## 4. 验证

- [x] 手动确认浏览器访问不再触发图片下载弹窗
- [x] 打通爬虫落库外链 → `/api/images` 首次访问触发上传 → 回写 raw_url 全链路
- [x] 日志中可区分 `proxy=openlist` / `proxy=fallback`

## 5. 后续关注 (非阻塞)

- [ ] 如需批量迁移历史数据, 另行编写脚本 (当前不在范围内)
- [ ] 按需补充自动化测试, 关注 401 自动重登与降级路径
