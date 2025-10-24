# Quick Start · OpenList 图片管线

本指南帮助你在 5 分钟内验证新的图片管线是否正常工作。

## 1. 环境变量

在 `backend/.env` 或运行环境中设置以下变量:

```env
OPENLIST_URL=http://117.72.221.238:5244
OPENLIST_USERNAME=your_username
OPENLIST_PASSWORD=your_password
OPENLIST_STORAGE_PATH=/images        # 可选, 留空则直接使用根目录
MAX_CONCURRENT_UPLOADS=5            # 可选, 供未来脚本使用
```

保存后重启后台服务 (`cd backend && npm run dev`)。

## 2. 上传验证 (脚本调用)

```ts
import { openlistClient } from './src/modules/openlist';

const buffer = await fs.promises.readFile('sample.jpg');
const result = await openlistClient.upload(buffer, '/images/test/sample.jpg');
console.log(result.url); // 应该是 OpenList raw_url
```

若 `upload` 报错, 首先确认账号密码与 `OPENLIST_URL` 是否正确, 然后查看后台日志。

## 3. 爬虫联调

1. 运行一次抓取命令或触发已有爬虫入口。
2. 在数据库中确认 `creator_accounts.avatar_url` / `videos.thumbnail_url` 已更新为 OpenList raw_url。
3. 查看 `image_metadata` 表, 对应记录的 `download_status` 应为 `completed`。

## 4. 接口验证

直接用浏览器或 curl 访问统一接口:

```bash
curl -I "http://localhost:8000/api/images/thumbnail/8610"
```

- 响应应返回 `200 OK` 与 `Content-Type: image/*`
- 不应包含 `Content-Disposition: attachment`

## 5. 降级测试

临时断开 OpenList 网络 (或修改密码使其失败), 再次访问同一接口:

- 接口仍应返回 302 或 JSON 错误, 服务不会崩溃。
- 日志中会看到 `proxy=fallback` 的记录。

## 6. 常见问题

| 现象 | 排查建议 |
| --- | --- |
| 上传报 `AUTH_FAILED` | 核对账号、密码, 并确认 OpenList 服务可访问 |
| 图片仍被下载 | 确认 `/api/images` 路由已更新并重启服务 |
| 数据库存的是旧外链 | 上传失败时会保留外链, 查看日志中的错误原因 |

完成以上步骤即表示 OpenList 图片管线运作正常。
