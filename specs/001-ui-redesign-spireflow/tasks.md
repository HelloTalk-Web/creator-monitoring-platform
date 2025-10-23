# Implementation Tasks: UI Redesign with Spireflow Style

**Feature**: UI Redesign with Spireflow Style
**Branch**: `001-ui-redesign-spireflow`
**Created**: 2025-10-23
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Task Summary

- **Total Tasks**: 58
- **Phase 1 (Setup)**: 8 tasks
- **Phase 2 (Foundational)**: 6 tasks
- **Phase 3 (US1 - 深色主题体验)**: 12 tasks
- **Phase 4 (US2 - 卡片式数据呈现)**: 15 tasks
- **Phase 5 (US3 - 响应式多设备适配)**: 9 tasks
- **Phase 6 (US4 - 主题切换系统)**: 6 tasks
- **Phase 7 (Polish)**: 2 tasks
- **Parallel Opportunities**: 35 tasks可并行执行

## MVP Scope

**建议MVP**: User Story 1 (深色主题体验)
- 最小可交付价值: 用户可以看到现代化深色主题界面
- 包含任务: T001-T026 (Phase 1-3)
- 验收标准: 访问任意页面,呈现深色主题,对比度符合WCAG AA标准

---

## Phase 1: Setup & Dependencies

**Goal**: 安装依赖,配置开发环境,创建基础目录结构

### Tasks

- [ ] T001 安装前端测试依赖到 frontend/package.json (Vitest, React Testing Library, Playwright, axe-core)
- [ ] T002 [P] 创建 frontend/vitest.config.ts 配置文件
- [ ] T003 [P] 创建 frontend/vitest.setup.ts 测试环境设置
- [ ] T004 [P] 创建 frontend/playwright.config.ts E2E测试配置
- [ ] T005 安装虚拟滚动库 @tanstack/react-virtual 到 frontend/package.json
- [ ] T006 [P] 创建目录 frontend/types/ 存放类型定义
- [ ] T007 [P] 创建目录 frontend/components/theme/ 存放主题组件
- [ ] T008 [P] 创建目录 frontend/styles/themes/ 存放主题CSS文件

**Parallel Execution Example**:
```bash
# 可以并行执行 T002-T004, T006-T008 (独立文件创建)
```

---

## Phase 2: Foundational - Type Definitions & Theme Infrastructure

**Goal**: 定义TypeScript类型,创建主题配置基础,为所有User Story提供共享基础设施

**Why Foundational**: 所有后续User Story都依赖这些类型定义和主题配置

### Tasks

- [ ] T009 创建 frontend/types/theme.ts 定义Theme、ColorScheme、ThemePreference、BreakpointConfig类型
- [ ] T010 [P] 创建 frontend/components/theme/theme-config.ts 定义3个预设主题(midnight、charcoal、obsidian)
- [ ] T011 [P] 创建 frontend/styles/themes/midnight.css 定义midnight主题CSS变量
- [ ] T012 [P] 创建 frontend/styles/themes/charcoal.css 定义charcoal主题CSS变量
- [ ] T013 [P] 创建 frontend/styles/themes/obsidian.css 定义obsidian主题CSS变量
- [ ] T014 更新 frontend/tailwind.config.ts 扩展颜色变量映射(primaryBg、secondaryBg等)

**Parallel Execution Example**:
```bash
# T010-T013 可以并行执行(独立主题文件)
```

**Foundational Completion Gate**: 完成T009-T014后,才能开始Phase 3

---

## Phase 3: User Story 1 - 深色主题体验 (P1)

**Story Goal**: 用户访问平台时,看到现代化的深色主题界面,视觉舒适,信息层次清晰

**Independent Test Criteria**:
- ✅ 访问任意页面,背景色为深色(primaryBg)
- ✅ 文字颜色清晰可读(primaryText)
- ✅ 对比度符合WCAG AA标准(≥4.5:1)
- ✅ 所有页面保持一致的深色主题风格

### Tasks

- [ ] T015 [US1] 创建 frontend/lib/theme-utils.ts 工具函数(主题应用、localStorage读写)
- [ ] T016 [US1] 创建 frontend/components/theme/theme-provider.tsx ThemeContext和Provider组件
- [ ] T017 [US1] 更新 frontend/app/layout.tsx 集成ThemeProvider,添加阻塞脚本防止闪烁
- [ ] T018 [P] [US1] 更新 frontend/app/globals.css 引入主题CSS文件和CSS变量
- [ ] T019 [P] [US1] 更新 frontend/app/accounts/page.tsx 应用深色主题样式类(bg-primaryBg、text-primaryText)
- [ ] T020 [P] [US1] 更新 frontend/app/videos/page.tsx 应用深色主题样式类
- [ ] T021 [P] [US1] 更新 frontend/app/dashboard/page.tsx 应用深色主题样式类
- [ ] T022 [US1] 编写单元测试 frontend/components/theme/__tests__/theme-provider.test.tsx
- [ ] T023 [US1] 编写E2E测试 frontend/e2e/theme-default.spec.ts 验证默认主题加载
- [ ] T024 [US1] 编写无障碍测试 frontend/e2e/accessibility-contrast.spec.ts 验证对比度
- [ ] T025 [US1] 在Chrome DevTools验证主题变量应用,确认无闪烁
- [ ] T026 [US1] 运行pnpm vitest和pnpm exec playwright test,确保所有测试通过

**Parallel Execution Example**:
```bash
# T018-T021 可以并行执行(不同页面文件修改)
# T022-T024 测试可以并行编写
```

**Story Completion Gate**: 完成T015-T026后,User Story 1完成,可独立验收

---

## Phase 4: User Story 2 - 卡片式数据呈现 (P1)

**Story Goal**: 用户查看账号列表、视频数据时,信息以清晰的卡片形式呈现,易于扫描和对比

**Independent Test Criteria**:
- ✅ 账号列表页面每个账号以卡片形式展示
- ✅ 卡片有圆角边框、阴影效果、统一padding
- ✅ Hover卡片时有视觉反馈(边框高亮、阴影加深)
- ✅ 卡片布局整齐对齐,间距均匀

**Dependencies**: 依赖Phase 3 (需要深色主题CSS变量)

### Tasks

- [ ] T027 [US2] 创建 frontend/components/ui/card.tsx 统一卡片组件(圆角、阴影、边框)
- [ ] T028 [US2] 创建 frontend/components/ui/account-card.tsx 账号卡片组件,使用Card组件
- [ ] T029 [P] [US2] 创建 frontend/components/ui/video-card.tsx 视频卡片组件
- [ ] T030 [P] [US2] 创建 frontend/components/ui/stats-card.tsx 统计数据卡片组件(仪表板用)
- [ ] T031 [US2] 重构 frontend/app/accounts/page.tsx 使用AccountCard替换现有列表项
- [ ] T032 [US2] 重构 frontend/app/videos/page.tsx 使用VideoCard替换现有列表项
- [ ] T033 [US2] 重构 frontend/app/dashboard/page.tsx 使用StatsCard显示统计数据
- [ ] T034 [P] [US2] 在 frontend/components/ui/card.tsx 添加hover状态样式(transition、border-mainColor)
- [ ] T035 [P] [US2] 在 frontend/app/accounts/page.tsx 添加网格布局容器(grid、gap-6)
- [ ] T036 [P] [US2] 在 frontend/app/videos/page.tsx 添加网格布局容器
- [ ] T037 [P] [US2] 在 frontend/app/dashboard/page.tsx 添加网格布局容器
- [ ] T038 [US2] 编写组件测试 frontend/components/ui/__tests__/card.test.tsx
- [ ] T039 [US2] 编写组件测试 frontend/components/ui/__tests__/account-card.test.tsx
- [ ] T040 [US2] 编写E2E测试 frontend/e2e/card-layout.spec.ts 验证卡片布局和hover效果
- [ ] T041 [US2] 运行测试并截图对比,确认卡片样式符合设计

**Parallel Execution Example**:
```bash
# T028-T030 可以并行创建(不同卡片组件)
# T031-T033 可以并行重构(不同页面)
# T034-T037 可以并行添加样式(独立文件)
# T038-T039 测试可以并行编写
```

**Story Completion Gate**: 完成T027-T041后,User Story 2完成

---

## Phase 5: User Story 3 - 响应式多设备适配 (P2)

**Story Goal**: 用户在不同设备上访问平台,界面自动适配屏幕尺寸,布局合理

**Independent Test Criteria**:
- ✅ 手机(375px): 卡片单列排列,导航收起,padding小
- ✅ 平板(768px): 卡片双列排列,侧边栏显示
- ✅ 桌面(1440px): 卡片3-4列排列,布局宽松
- ✅ 设备旋转时布局自动调整

**Dependencies**: 依赖Phase 4 (需要卡片组件)

### Tasks

- [ ] T042 [US3] 创建 frontend/components/layout/responsive-grid.tsx 响应式网格容器组件
- [ ] T043 [US3] 在 frontend/components/ui/card.tsx 添加响应式padding类(p-4、md:p-6)
- [ ] T044 [P] [US3] 在 frontend/app/accounts/page.tsx 使用ResponsiveGrid替换grid,配置列数断点
- [ ] T045 [P] [US3] 在 frontend/app/videos/page.tsx 使用ResponsiveGrid
- [ ] T046 [P] [US3] 在 frontend/app/dashboard/page.tsx 使用ResponsiveGrid
- [ ] T047 [US3] 编写E2E测试 frontend/e2e/responsive-mobile.spec.ts 验证移动端布局(Pixel 5)
- [ ] T048 [US3] 编写E2E测试 frontend/e2e/responsive-tablet.spec.ts 验证平板布局(iPad)
- [ ] T049 [US3] 编写E2E测试 frontend/e2e/responsive-desktop.spec.ts 验证桌面布局(1440px)
- [ ] T050 [US3] 在真实设备上测试(iOS Safari、Android Chrome),验证旋转适配

**Parallel Execution Example**:
```bash
# T044-T046 可以并行修改(不同页面)
# T047-T049 测试可以并行执行(不同viewport)
```

**Story Completion Gate**: 完成T042-T050后,User Story 3完成

---

## Phase 6: User Story 4 - 主题切换系统 (P3)

**Story Goal**: 用户可以在预设主题间切换,偏好被保存,下次访问自动应用

**Independent Test Criteria**:
- ✅ 用户点击主题切换器,颜色立即切换
- ✅ 关闭浏览器后重新打开,主题保持不变
- ✅ 系统颜色模式(prefers-color-scheme)自动检测
- ✅ 主题切换响应时间<500ms

**Dependencies**: 依赖Phase 3 (需要ThemeProvider)

### Tasks

- [ ] T051 [US4] 创建 frontend/components/theme/theme-switcher.tsx 主题切换UI组件(下拉菜单)
- [ ] T052 [US4] 在 frontend/app/layout.tsx 添加ThemeSwitcher到导航栏
- [ ] T053 [US4] 在 frontend/components/theme/theme-provider.tsx 添加系统颜色模式检测逻辑(prefers-color-scheme)
- [ ] T054 [US4] 编写组件测试 frontend/components/theme/__tests__/theme-switcher.test.tsx
- [ ] T055 [US4] 编写E2E测试 frontend/e2e/theme-switching.spec.ts 验证主题切换和持久化
- [ ] T056 [US4] 性能测试: 使用Chrome DevTools Performance面板测量主题切换时间,确保<500ms

**Parallel Execution Example**:
```bash
# T054-T055 测试可以并行编写
```

**Story Completion Gate**: 完成T051-T056后,User Story 4完成

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: 优化性能,完善边缘情况处理,最终审查

### Tasks

- [ ] T057 实现虚拟滚动: 在 frontend/app/accounts/page.tsx 和 videos/page.tsx 使用 @tanstack/react-virtual (仅当数据>100项时)
- [ ] T058 运行完整的无障碍审计(axe DevTools),修复所有违规项,生成报告到 specs/001-ui-redesign-spireflow/accessibility-report.md

**Polish Completion Gate**: 完成T057-T058后,整个功能完成

---

## Dependencies Graph

```
Phase 1 (Setup)
  └─> Phase 2 (Foundational - Types & Theme Config)
        └─> Phase 3 (US1 - 深色主题) ✓ MVP End
              └─> Phase 4 (US2 - 卡片式布局)
                    └─> Phase 5 (US3 - 响应式)
              └─> Phase 6 (US4 - 主题切换)
        └─> Phase 7 (Polish)
```

**Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 7

**Independent Branches**:
- Phase 6可以在Phase 3完成后并行开始(不依赖Phase 4-5)
- Phase 7的T057依赖Phase 4-5,但可以与Phase 6并行

---

## Implementation Strategy

### Incremental Delivery Plan

**Week 1 - MVP (US1)**:
- Day 1-2: Phase 1-2 (Setup + Foundational)
- Day 3-4: Phase 3 (深色主题体验)
- Day 5: 测试和验收US1

**Week 2 - Core Features (US2)**:
- Day 1-3: Phase 4 (卡片式布局)
- Day 4-5: 测试和验收US2

**Week 3 - Enhanced Experience (US3, US4)**:
- Day 1-2: Phase 5 (响应式)
- Day 3-4: Phase 6 (主题切换)
- Day 5: 测试和验收US3+US4

**Week 4 - Polish**:
- Day 1-2: Phase 7 (性能优化、无障碍审计)
- Day 3-5: 完整回归测试、性能测试、文档完善

### Testing Strategy

**单元测试覆盖**:
- ThemeProvider组件
- Card组件及其变体
- ThemeSwitcher组件

**集成测试覆盖**:
- 主题加载和切换流程
- 卡片布局渲染
- 响应式断点切换

**E2E测试覆盖**:
- 默认主题加载(无闪烁)
- 主题切换和持久化
- 多设备响应式布局
- 无障碍对比度验证

### Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| 主题切换时间 | <500ms | Chrome DevTools Performance |
| LCP (移动设备) | <2.5s | Lighthouse |
| 1000项卡片渲染 | 60fps滚动 | React DevTools Profiler |
| 对比度 | ≥4.5:1 | axe DevTools |

---

## Validation Checklist

在完成所有任务后,验证以下内容:

- [ ] 所有58个任务已完成并标记为checked
- [ ] 所有单元测试通过(pnpm vitest)
- [ ] 所有E2E测试通过(pnpm exec playwright test)
- [ ] 无障碍审计无违规项(axe DevTools)
- [ ] 对比度符合WCAG AA标准(≥4.5:1)
- [ ] 主题切换时间<500ms
- [ ] 移动设备LCP<2.5s
- [ ] 1000项卡片滚动流畅(60fps)
- [ ] 所有4个User Story的验收标准已通过
- [ ] 文档已更新(README、quickstart.md)

---

## Next Steps

完成tasks.md后:

1. 执行 `/speckit.implement` 开始逐任务实施
2. 或手动按Phase顺序执行,每完成一个Phase验收后再继续
3. 遇到阻塞问题时,更新tasks.md添加新任务或调整依赖关系

**Ready to implement!** 🚀
