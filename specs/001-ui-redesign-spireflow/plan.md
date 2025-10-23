# Implementation Plan: UI Redesign with Spireflow Style

**Branch**: `001-ui-redesign-spireflow` | **Date**: 2025-10-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ui-redesign-spireflow/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

本功能旨在重构创作者监控平台的UI设计,采用Spireflow风格的现代化深色主题系统。核心目标包括:

1. **深色主题系统**: 实现基于CSS变量的深色主题,支持多种预设配色方案(midnight、charcoal、obsidian)
2. **卡片式布局**: 重构账号列表、视频数据展示,采用统一的卡片组件设计
3. **响应式设计**: 确保在移动设备(xs/sm)、平板(md/lg)、桌面(xl/2xl/3xl)等断点上的最佳体验
4. **主题切换**: 支持用户在预设主题间切换,支持深色/浅色模式,并持久化用户偏好

技术方法: 基于现有的Next.js + Tailwind CSS技术栈,利用CSS自定义属性实现主题系统,使用Tailwind的响应式工具类实现布局适配,结合localStorage持久化用户偏好。

## Technical Context

**Language/Version**: TypeScript 5.x (前端) / TypeScript 5.4+ (后端)
**Primary Dependencies**:
- Frontend: Next.js 15.5.5, React 19.1.0, Tailwind CSS 4.x, Radix UI组件库
- Backend: Express 4.x, Drizzle ORM, PostgreSQL
**Storage**: N/A (UI重构不涉及数据存储修改)
**Testing**: Vitest (单元测试) + React Testing Library (组件测试) + Playwright (E2E测试) + axe DevTools (无障碍测试)
**Target Platform**: Web浏览器(Chrome、Firefox、Safari、Edge),移动端Web(iOS Safari、Android Chrome)
**Project Type**: Web应用(前后端分离架构)
**Performance Goals**:
- 主题切换响应时间 <500ms
- 移动设备首次渲染 <2s
- LCP(最大内容绘制) <2.5s
- 支持渲染1000+卡片数据项
**Constraints**:
- 必须保持与现有业务逻辑完全兼容
- 不支持IE11,仅支持现代浏览器
- 必须遵循移动优先(mobile-first)设计原则
- CSS对比度符合WCAG AA标准(4.5:1)
**Scale/Scope**:
- 影响范围: 前端所有页面(账号列表、视频列表、仪表板等)
- 预计修改文件: 20-30个组件文件、全局样式配置、主题系统
- 新增功能: 主题切换UI、主题上下文Provider

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: 项目宪章文件为模板状态,以下基于UI重构项目的标准实践进行检查:

| Principle | Status | Notes |
|-----------|--------|-------|
| **组件化设计** | ✅ PASS | 采用可复用的卡片组件、主题Provider等模块化设计 |
| **可维护性** | ✅ PASS | 使用CSS变量集中管理主题,便于未来调整 |
| **性能优先** | ✅ PASS | 明确定义性能目标(主题切换<500ms、LCP<2.5s等) |
| **无障碍访问** | ✅ PASS | 要求WCAG AA对比度标准,使用Radix UI无障碍组件 |
| **测试覆盖** | ✅ PASS | 已确定测试方案: Vitest + Playwright + axe DevTools |
| **向后兼容** | ✅ PASS | 规格明确要求保持现有业务逻辑完全兼容 |

**初步评估**: ✅ 通过

**Phase 1后重新评估**: ✅ 全部通过 - 所有待澄清项已在Phase 0研究阶段解决,设计方案符合所有原则。

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── app/                          # Next.js App Router页面
│   ├── accounts/                 # 账号列表页面 - 需要卡片化重构
│   ├── videos/                   # 视频列表页面 - 需要卡片化重构
│   ├── dashboard/                # 仪表板页面 - 需要卡片化重构
│   ├── globals.css               # 全局样式 - 需要添加CSS变量
│   └── layout.tsx                # 根布局 - 需要集成ThemeProvider
├── components/                   # React组件
│   ├── ui/                       # 基础UI组件(Radix UI封装)
│   │   └── card.tsx              # 新增: 统一卡片组件
│   ├── theme/                    # 新增: 主题相关组件
│   │   ├── theme-provider.tsx    # 主题上下文Provider
│   │   ├── theme-switcher.tsx    # 主题切换UI组件
│   │   └── theme-config.ts       # 主题配置定义
│   └── layout/                   # 布局组件
│       └── responsive-grid.tsx   # 新增: 响应式网格容器
├── lib/                          # 工具函数
│   └── theme-utils.ts            # 新增: 主题工具函数
├── styles/                       # 样式文件
│   ├── themes/                   # 新增: 主题定义
│   │   ├── midnight.css          # midnight主题变量
│   │   ├── charcoal.css          # charcoal主题变量
│   │   └── obsidian.css          # obsidian主题变量
│   └── variables.css             # 新增: CSS变量定义
├── tailwind.config.ts            # Tailwind配置 - 需要扩展主题变量
└── next.config.ts                # Next.js配置

backend/                          # 后端不涉及本次UI重构
└── (不修改)
```

**Structure Decision**: 选择Web应用架构(Option 2)。本次UI重构专注于frontend目录,不涉及backend修改。主要新增theme相关目录和组件,重构现有页面的卡片式布局。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

无违规项需要记录。宪章检查已通过,仅有测试框架选择待在Phase 0研究阶段明确。
