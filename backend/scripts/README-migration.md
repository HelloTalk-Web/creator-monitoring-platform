# OpenList 静态资源迁移指南

## 脚本功能

这个迁移脚本会将 `backend/static/images` 目录下的所有图片批量上传到 OpenList，并更新数据库中的 URL 引用。

### 核心特性

✅ **智能并发控制**: 5个文件并发上传，避免压垮 OpenList 服务
✅ **自动重试机制**: 失败自动重试3次，带指数退避
✅ **进度实时显示**: 清晰展示上传进度和统计信息
✅ **数据库自动更新**: 上传成功后自动更新 `creator_accounts` 和 `videos` 表
✅ **详细迁移报告**: 生成 JSON 格式的完整迁移报告
✅ **安全的 DRY-RUN 模式**: 测试运行不会实际上传

## 使用方法

### 1️⃣ 测试运行 (推荐先做!)

```bash
# 模拟运行,不实际上传,检查是否有问题
npx tsx backend/scripts/migrate-to-openlist.ts --dry-run
```

**预期输出**:
```
🚀 OpenList 静态资源迁移工具

配置:
  - 静态目录: /path/to/backend/static/images
  - 并发数: 5
  - 重试次数: 3
  - 目标目录: 全部
  - 模式: DRY-RUN (不实际上传)

📁 扫描文件...

✅ 找到 2587 个图片文件

📤 开始批量上传 (并发: 5)

[1/3] 上传: avatar_123.jpg → /images/avatars/avatar_123.jpg
  [DRY-RUN] 将上传: /images/avatars/avatar_123.jpg (45.23KB)
  ✅ 成功: [dry-run]/images/avatars/avatar_123.jpg

📊 进度: 100/2587 (3.9%) | 成功: 100 | 失败: 0
...
```

### 2️⃣ 部分迁移 (建议分步执行)

```bash
# 只迁移头像目录 (124个文件)
npx tsx backend/scripts/migrate-to-openlist.ts --dir=avatars

# 只迁移缩略图目录 (1285个文件)
npx tsx backend/scripts/migrate-to-openlist.ts --dir=thumbnails

# 只迁移 proxied 目录 (1172个文件)
npx tsx backend/scripts/migrate-to-openlist.ts --dir=proxied
```

### 3️⃣ 全量迁移

```bash
# 迁移所有文件 (2587个文件, 164MB)
npx tsx backend/scripts/migrate-to-openlist.ts
```

**⚠️ 注意**: 全量迁移预计耗时 **30-60分钟** (取决于网络速度)

## 迁移策略建议

基于你的数据量 (2587个文件, 164MB)，我建议采用**分步迁移策略**:

### 推荐执行顺序:

```bash
# 第1步: DRY-RUN 测试 (必做!)
npx tsx backend/scripts/migrate-to-openlist.ts --dry-run

# 第2步: 先迁移头像 (文件少,容易验证)
npx tsx backend/scripts/migrate-to-openlist.ts --dir=avatars

# 验证: 检查几个账号的头像是否正常显示
# 前端访问: http://localhost:3000/creators
# 查看头像是否从 OpenList 加载

# 第3步: 迁移缩略图
npx tsx backend/scripts/migrate-to-openlist.ts --dir=thumbnails

# 验证: 检查视频列表的缩略图

# 第4步: 迁移 proxied 目录 (历史遗留文件)
npx tsx backend/scripts/migrate-to-openlist.ts --dir=proxied

# 第5步: 查看最终报告
cat backend/scripts/migration-report-*.json
```

## 目录映射规则

脚本会自动映射本地目录到 OpenList 路径:

| 本地路径 | OpenList 路径 | 说明 |
|---------|--------------|------|
| `static/images/avatars/avatar_123.jpg` | `/images/avatars/avatar_123.jpg` | 账号头像 |
| `static/images/thumbnails/thumbnail_456.jpg` | `/images/thumbnails/thumbnail_456.jpg` | 视频缩略图 |
| `static/images/proxied/abc123.jpg` | `/images/legacy/abc123.jpg` | 历史代理文件 |

**注意**: `proxied` 目录会映射为 `legacy` 目录,语义更清晰。

## 数据库更新逻辑

上传成功后,脚本会自动更新数据库:

### 1. 更新 creator_accounts 表

```sql
UPDATE creator_accounts
SET avatar_url = 'http://117.72.221.238:5244/d/百度网盘/images/avatars/avatar_123.jpg'
WHERE id = 123;
```

### 2. 更新 videos 表

```sql
UPDATE videos
SET thumbnail_url = 'http://117.72.221.238:5244/d/百度网盘/images/thumbnails/thumbnail_456.jpg'
WHERE id = 456;
```

### 3. 创建 image_metadata 记录

```sql
INSERT INTO image_metadata (original_url, url_hash, local_path, download_status, ...)
VALUES (...);
```

## 迁移报告示例

脚本完成后会生成详细的 JSON 报告:

```json
{
  "total": 2587,
  "success": 2580,
  "failed": 7,
  "skipped": 0,
  "totalSize": 171966464,
  "successSize": 171234567,
  "failedFiles": [
    {
      "file": "avatars/avatar_999.jpg",
      "error": "文件过大: 12.34MB"
    }
  ],
  "startTime": "2025-10-24T10:00:00.000Z",
  "endTime": "2025-10-24T10:45:30.000Z"
}
```

## 常见问题

### Q1: 上传速度太慢怎么办?

**A**: 可以调整并发数 (默认5)。编辑脚本中的:

```typescript
const CONFIG = {
  concurrency: 10,  // 改为 10 (不建议超过10)
  ...
};
```

### Q2: 某些文件上传失败怎么办?

**A**:
1. 查看失败原因 (报告中的 `failedFiles`)
2. 常见原因:
   - 文件过大 (>10MB): OpenList 限制
   - 网络超时: 重新运行脚本会自动跳过已上传的文件
   - 权限问题: 检查 OpenList 账号权限

### Q3: 如何验证迁移成功?

**A**:
```bash
# 1. 查看迁移报告
cat backend/scripts/migration-report-*.json

# 2. 检查数据库
psql -d your_database -c "SELECT COUNT(*) FROM creator_accounts WHERE avatar_url LIKE '%117.72.221.238%';"

# 3. 前端访问测试
# 打开浏览器访问几个账号/视频页面,查看图片是否正常加载
```

### Q4: 迁移失败如何回滚?

**A**:
数据库有备份的话:
```sql
-- 恢复 avatar_url
UPDATE creator_accounts
SET avatar_url = old_avatar_url_backup;

-- 恢复 thumbnail_url
UPDATE videos
SET thumbnail_url = old_thumbnail_url_backup;
```

如果没有备份,本地文件仍然存在,可以通过传统代理访问。

### Q5: 可以中断后继续吗?

**A**:
可以! 脚本会检查文件是否已在 OpenList 上,如果已存在会自动跳过。
你可以随时 Ctrl+C 中断,然后重新运行。

## 性能预估

基于你的数据量:

| 指标 | 预估值 |
|------|--------|
| 总文件数 | 2,587 个 |
| 总大小 | 164 MB |
| 平均文件大小 | 65 KB |
| 预计耗时 (全量) | 30-60 分钟 |
| 预计耗时 (avatars) | 3-5 分钟 |
| 预计耗时 (thumbnails) | 15-25 分钟 |
| 预计耗时 (proxied) | 15-20 分钟 |
| 成功率 | >99% (失败主要是文件过大) |

## 安全检查清单

在执行迁移前,请确认:

- [ ] 已配置 OpenList 环境变量 (OPENLIST_URL, OPENLIST_USERNAME, OPENLIST_PASSWORD)
- [ ] OpenList 服务可访问 (ping 117.72.221.238)
- [ ] 百度网盘有足够空间 (至少 200MB 余量)
- [ ] 数据库有备份 (以防万一)
- [ ] 已执行过 DRY-RUN 测试
- [ ] 当前没有正在运行的爬虫任务 (避免冲突)

## 执行后验证步骤

1. **查看报告**: 检查成功率是否 >95%
2. **数据库验证**: 查询 URL 是否已更新
3. **前端测试**: 随机访问10个账号/视频,查看图片加载
4. **性能测试**: 测量图片加载时间,确保 <2秒
5. **清理旧文件**: 确认迁移成功后,可删除 `static/images` 目录 (保留备份!)

## 技术支持

如遇到问题:
1. 查看控制台输出的错误信息
2. 检查 `migration-report-*.json` 中的 `failedFiles`
3. 查看 OpenList 日志
4. 联系技术负责人

---

**祝迁移顺利! 🚀**
