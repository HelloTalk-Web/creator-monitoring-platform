# Quick Start 摘要 · OpenList 图片管线

1. **设置环境变量**
   ```env
   OPENLIST_URL=...
   OPENLIST_USERNAME=...
   OPENLIST_PASSWORD=...
   ```

2. **重启后端**: `cd backend && npm run dev`

3. **上传自检**:
   ```ts
   import { openlistClient } from './src/modules/openlist';
   const result = await openlistClient.upload(buffer, '/images/demo.jpg');
   console.log(result.url);
   ```

4. **访问接口**: 打开 `http://localhost:8000/api/images/thumbnail/{id}`
   - 首次访问触发下载+上传, 之后图片应直接显示、不再触发下载

5. **日志检查**: 在后端日志中查找 `proxy=openlist` 或 `proxy=fallback` 标记, 确认两条路径都健壮

6. **批量重新爬取**: 在账号管理页勾选多个账号, 点击“批量重新爬取”验证批量刷新流程

> 需要降级或扩展时, 参见完整版 [quickstart.md](./quickstart.md)。
