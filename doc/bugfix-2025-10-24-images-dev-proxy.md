# Bugfix 记录｜开发态域名仅反代 4000 导致图片加载失败（2025-10-24）

## 背景
- 外部用户通过 cloudflared 隧道访问前端：`https://social.hellotalk.xyz → 本机 4000 (Next dev server)`。
- 后端本地监听 8000（Express）。
- 前端统一图片接口使用 `/api/images/:type/:id`，由后端决定走 OpenList 流式、本地文件或外链重定向。

## 现象
- Dashboard 数据接口在你本机开发时能返回，但外部机器访问时：
  - 早期：图片请求直接 `http://localhost:8000/...` → 外部浏览器连自己本机，`ERR_CONNECTION_REFUSED`。
  - 改成域名后：`https://social.hellotalk.xyz/api/...` 仍落在 4000（前端）而非 8000（后端），返回 404/HTML，数据与图片都拿不到。

## 根因
1) “同一个 baseURL 在 SSR 与浏览器端含义不同”：
   - SSR（服务端渲染）在本机发请求 → `http://localhost:8000` 可达，所以数据能拿到。
   - 浏览器在外部机器发请求 → `http://localhost:8000` 指向外部机器自身，必然失败。
2) cloudflared 隧道仅把域名反代到 4000，没有对 `/api/*` 分流到 8000。

## 修改点（本次修复）
仅改前端配置（开发态生效），不改后端：

1) 统一将前端对外的 API 基址设置为域名（避免编译进 `localhost`）：
   - 文件：`frontend/.env.local`
   - 建议：
     ```ini
     NEXT_PUBLIC_API_BASE_URL=https://social.hellotalk.xyz
     NODE_ENV=development
     ```

2) 在 Next 开发态添加代理，把 `/api/*` 转发到本机后端 8000：
   - 文件：`frontend/next.config.ts`
   - 新增：
     ```ts
     async rewrites() {
       if (process.env.NODE_ENV === 'development') {
         return [
           { source: '/api/:path*', destination: 'http://localhost:8000/api/:path*' },
         ]
       }
       return []
     }
     ```
   - 效果：外部浏览器请求 `https://social.hellotalk.xyz/api/...` → 先到 4000（Next dev），再由 Next 代理到 8000（后端）。

## 验证步骤
1) 重启前端 dev：
   ```bash
   npm run dev
   ```
2) 浏览器开发者工具 Network 检查：
   - 所有接口、图片请求应为 `https://social.hellotalk.xyz/api/...`，状态 200。
3) 终端自测（从外部机器或通过域名访问环境）：
   ```bash
   curl -i https://social.hellotalk.xyz/api/dashboard/stats      # 期望 200 JSON
   curl -I https://social.hellotalk.xyz/api/images/thumbnail/123 # 期望 200 且 Content-Type: image/*
   ```

## 注意事项 / 易踩坑
- `frontend/.env.production` 如含示例 localhost 值，正式构建请以平台环境变量为准，避免该文件干扰。
- 若以后用 docker-compose 对外暴露，不要把 `http://backend:8000` 下发到浏览器端——浏览器不认识容器名。
- 开发态代理仅在 `NODE_ENV=development` 生效；正式部署需要在反代层把 `/api/*` 分流到后端，或给后端独立域名（例如 `api.social.hellotalk.xyz`）。
- 若采用“后端独立子域名”，谨慎处理跨源图片的 CORP/COEP/COOP；当前 `/api/images/openlist` 分支可按需设置 `Cross-Origin-Resource-Policy: cross-origin`。

## 回滚策略
- 移除 `next.config.ts` 的 `rewrites()`；
- 将 `frontend/.env.local` 的 `NEXT_PUBLIC_API_BASE_URL` 恢复为本地需要的值；
- 重启 `npm run dev` 生效。

—— 记录人：AI 助手（Codex CLI）｜日期：2025-10-24

