# Data Model · OpenList 图片管线

## 受影响的表

### videos
- `thumbnail_url` (text): 现在保存 OpenList raw_url 或原始外链。
- `metadata` (json): 仍存放平台原始数据, 供提取备用封面。

### creator_accounts
- `avatar_url` (text): 保存 OpenList raw_url 或外链, 与 `ImageDownloadService.downloadAvatar` 结果同步。

### image_metadata
用于跟踪单个 URL 的上传状态, 新字段含义如下:

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `original_url` | text | 原始外部链接, 用作去重键 |
| `url_hash` | text | `md5(original_url)` 用于快速查找 |
| `download_status` | text | `pending` / `downloading` / `completed` / `failed` |
| `local_path` | text | 保存 OpenList raw_url 或本地文件路径 |
| `access_count` | integer | `/api/images` 访问次数 |
| `first_accessed_at` / `last_accessed_at` | timestamp | 最近一次访问时间 |

## 数据写入流程摘要

1. 爬虫获得外部 URL 后调用 `ImageDownloadService`。
2. 成功上传时, 数据库字段保存 OpenList raw_url, `image_metadata.local_path` 同步为该 raw_url。
3. 失败时, 字段保留外链, `download_status` 设为 `failed`, 接口访问时触发传统代理。

## 兼容策略

- `ImageStorageService` 在读取旧数据时, 会自动识别 `/api/openlist-proxy?url=...` 并提取真实 raw_url。
- 未上传的数据保持原状, 不需要额外迁移脚本。
