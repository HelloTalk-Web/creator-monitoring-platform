# 发布验收清单 · OpenList 图片管线

本清单用于上线前自检, 结合新的精简范围, 仅关注实际交付的能力。

## 功能验证

- [x] OpenListClient 登录/上传/下载/获取 raw_url 测试通过
- [x] 新增账号或视频时, avatar/thumbnail 字段保存为 raw_url
- [x] `/api/images/:type/:id` 能正确流式返回 OpenList 图片
- [x] OpenList 不可达时, 自动降级到传统代理并记录 `proxy=fallback`

## 配置与运维

- [x] 环境变量 `OPENLIST_URL` / `OPENLIST_USERNAME` / `OPENLIST_PASSWORD` 已配置
- [x] 日志中可区分 OpenList 命中与降级路径
- [ ] (可选) 监控或报警覆盖 OpenList 连接失败场景

## 文档

- [x] spec / plan / tasks 与代码一致
- [x] quickstart 指南可复现 end-to-end 流程

> 如果仅关注当前功能, 以上检查项满足即可上线; 其余扩展需求（批量迁移、临时文件清理等）已明确不在范围内。
