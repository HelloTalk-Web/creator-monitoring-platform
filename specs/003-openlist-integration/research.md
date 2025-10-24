# Research Notes · OpenList 图片管线

记录这次改造过程中确认的关键决策, 为后续维护提供背景信息。

## R1 · 使用 raw_url 取代历史代理路由

- **问题**: OpenList 默认返回的 `raw_url` 会带 `Content-Disposition: attachment`, 浏览器直接访问会触发下载。
- **方案**: 让服务端流式获取 raw_url, 只保留 `Content-Type` 与缓存头, 不返回 `Content-Disposition`。
- **影响**: 可以在不依赖单独路由的情况下直接展示图片, `/api/openlist-proxy` 因此被淘汰。

## R2 · 上传失败的降级策略

- OpenList 若不可达, `ImageDownloadService` 直接返回原始 URL, `ImageStorageService` 记录失败并继续使用旧的 `/api/image-proxy`。
- 不做额外的队列或重试任务, 避免引入复杂度。

## R3 · 文件命名与哈希

- 头像/封面优先使用实体 ID 作为文件名, 若 ID 不可用则退回 URL 的 MD5 前 16 位。
- 这样保证同一实体重复抓取不会生成新文件, 方便缓存与覆盖。

## R4 · 为批量迁移预留空间

- 保留 `maxConcurrentUploads` 配置, 并通过 `image_metadata` 记录访问次数/状态。
- 如果后续要写迁移脚本, 可以直接复用 `OpenListClient` 与这些元数据, 本次不实现。

## R5 · 为何不做临时文件清理

- 现在所有上传都基于 Buffer, 不写入磁盘; 失败时直接丢弃 Buffer。
- 若未来新增磁盘缓存功能, 再引入清理策略即可。
