# Research: UI Redesign with Spireflow Style

**Feature**: UI Redesign with Spireflow Style
**Date**: 2025-10-23
**Purpose**: 解决技术上下文中的待澄清项,并研究最佳实践

## Unknowns to Resolve

从技术上下文识别的待澄清项:

1. **测试框架选择**: 前端测试框架未明确 - Jest/Vitest/Playwright?
2. **主题系统实现方式**: CSS变量 vs CSS-in-JS vs Tailwind配置
3. **性能优化策略**: 大量卡片渲染的虚拟滚动方案
4. **无障碍最佳实践**: WCAG AA对比度测试和验证工具

---

## Decision 1: 测试框架选择

### Decision
选择 **Vitest + React Testing Library + Playwright** 组合方案

### Rationale

**Vitest**用于单元测试和组件测试:
- 与Next.js和TypeScript原生兼容,配置简单
- 比Jest更快的测试执行速度(使用Vite底层)
- 现代化的API,支持ESM
- Next.js 15官方推荐的测试框架

**React Testing Library**用于组件交互测试:
- 专注于用户行为测试,而非实现细节
- 与无障碍测试结合良好(测试ARIA属性等)
- 社区标准,Radix UI组件已广泛使用

**Playwright**用于端到端测试:
- 测试主题切换、响应式布局等集成场景
- 支持多浏览器测试(Chrome、Firefox、Safari)
- 可以截图对比,验证视觉回归

### Alternatives Considered

**Jest**:
- 拒绝原因: 配置复杂,对Next.js App Router支持不如Vitest,执行速度较慢

**Cypress**:
- 拒绝原因: 虽然E2E能力强,但Playwright对多浏览器支持更好,性能更优

**仅使用Vitest**:
- 拒绝原因: 需要Playwright补充真实浏览器环境的E2E测试(主题切换、响应式等)

---

## Decision 2: 主题系统实现方式

### Decision
选择 **CSS变量 + Tailwind CSS配置扩展** 混合方案

### Rationale

**CSS变量(CSS Custom Properties)**用于颜色定义:
- 可以在运行时动态切换,无需重新编译
- 浏览器原生支持,性能优秀
- 支持服务端渲染(SSR),避免闪烁
- 示例: `--color-primary-bg: #1a1a2e;`

**Tailwind配置扩展**用于工具类映射:
- 将CSS变量映射到Tailwind工具类: `bg-primaryBg`
- 保持开发者体验一致,继续使用utility类
- 响应式和状态变体自动生成: `hover:bg-primaryBg`

**ThemeProvider组件**管理主题状态:
- React Context提供当前主题
- localStorage持久化用户偏好
- 检测系统颜色模式(`prefers-color-scheme`)

### Implementation Pattern

```typescript
// 1. CSS变量定义 (styles/themes/midnight.css)
:root[data-theme="midnight"] {
  --color-primary-bg: #1a1a2e;
  --color-secondary-bg: #16213e;
  --color-primary-text: #e4e4e7;
  --color-main-border: #3a3f5c;
}

// 2. Tailwind配置扩展 (tailwind.config.ts)
theme: {
  extend: {
    colors: {
      primaryBg: 'var(--color-primary-bg)',
      secondaryBg: 'var(--color-secondary-bg)',
      // ...
    }
  }
}

// 3. ThemeProvider使用
<ThemeProvider>
  <App />
</ThemeProvider>
```

### Alternatives Considered

**CSS-in-JS (styled-components/emotion)**:
- 拒绝原因: 性能开销大(运行时生成样式),与Tailwind生态冲突,增加bundle大小

**仅Tailwind配置(dark模式)**:
- 拒绝原因: 只支持light/dark两种模式,不支持多个预设主题(midnight/charcoal/obsidian)

**分离的CSS文件(无CSS变量)**:
- 拒绝原因: 无法运行时切换主题,需要重新加载页面,用户体验差

---

## Decision 3: 性能优化策略 - 虚拟滚动

### Decision
选择 **TanStack Virtual(原react-virtual)** 作为虚拟滚动解决方案

### Rationale

**TanStack Virtual**优势:
- 轻量级(~3KB gzipped),无额外依赖
- 支持动态高度卡片(每个卡片高度可能不同)
- 支持响应式(窗口resize时自动重新计算)
- 与React 19兼容,TypeScript类型完善
- 同时支持垂直和水平虚拟滚动

**实现策略**:
- 仅在数据项>100时启用虚拟滚动
- 小于100项时使用普通渲染,避免过度工程化
- 预估卡片高度,减少重排(reflow)

### Performance Target

- 1000个卡片: 首次渲染<2s,滚动帧率60fps
- 内存占用: 仅渲染可视区域+缓冲区(约10-20个卡片),而非全部1000个

### Alternatives Considered

**react-window**:
- 拒绝原因: 不支持动态高度,需要预先知道每个项的精确高度,不适合卡片高度可变的场景

**react-virtuoso**:
- 拒绝原因: 功能强大但体积较大(~15KB),对于本项目需求过重

**分页加载**:
- 拒绝原因: 用户体验不如无限滚动,需要额外的分页UI和状态管理

---

## Decision 4: 无障碍最佳实践

### Decision
采用 **axe DevTools + ARIA最佳实践 + 对比度验证工具** 组合方案

### Rationale

**axe DevTools**用于自动化无障碍检测:
- Chrome/Firefox浏览器扩展,开发时实时检测
- 检测ARIA属性、对比度、键盘导航等问题
- 符合WCAG 2.1标准

**ARIA最佳实践**:
- 使用Radix UI组件,已内置ARIA属性
- 卡片添加`role="article"`,可点击卡片添加`role="button"`
- 确保键盘可访问: Tab导航、Enter/Space激活

**对比度验证**:
- 开发阶段: 使用[WebAIM对比度检查器](https://webaim.org/resources/contrastchecker/)
- CI/CD阶段: 集成axe-core自动化测试
- 目标: 所有文本与背景对比度≥4.5:1(WCAG AA标准)

### Testing Checklist

- [ ] 所有颜色组合通过4.5:1对比度测试
- [ ] 主题切换后无障碍属性保持正确
- [ ] 键盘可以访问所有交互元素
- [ ] 屏幕阅读器可以正确朗读卡片内容
- [ ] Focus状态有明确的视觉指示

### Alternatives Considered

**仅依赖手动测试**:
- 拒绝原因: 容易遗漏问题,不可持续,团队成员无障碍意识不一致

**仅使用Lighthouse**:
- 拒绝原因: Lighthouse检测范围有限,axe DevTools更专业,检测项更全面

---

## Additional Best Practices Research

### 1. 主题切换无闪烁策略

**问题**: 页面加载时,从默认主题切换到用户保存的主题会有闪烁

**解决方案**:
```typescript
// 在<head>中注入阻塞脚本,在页面渲染前应用主题
<script dangerouslySetInnerHTML={{
  __html: `
    (function() {
      const theme = localStorage.getItem('theme') || 'midnight';
      document.documentElement.setAttribute('data-theme', theme);
    })();
  `
}} />
```

**原理**: 阻塞脚本在DOM解析前执行,避免样式切换闪烁(FOUC - Flash of Unstyled Content)

### 2. 响应式断点策略

遵循Tailwind CSS 4.x默认断点:
- `sm`: 640px - 小屏手机横屏
- `md`: 768px - 平板竖屏
- `lg`: 1024px - 平板横屏/小笔记本
- `xl`: 1280px - 桌面显示器
- `2xl`: 1536px - 大屏显示器

**移动优先(Mobile-First)**:
```tsx
// 基础样式为移动端,逐步增强
<div className="
  grid grid-cols-1      // 移动端: 1列
  md:grid-cols-2        // 平板: 2列
  xl:grid-cols-3        // 桌面: 3列
  gap-4 md:gap-6 xl:gap-8  // 间距逐渐增大
">
```

### 3. 卡片组件设计模式

参考Spireflow风格,卡片组件应包含:
- 圆角: `rounded-xl` (12px)
- 阴影: `shadow-lg`
- 边框: `border border-mainBorder`
- Padding: `p-4 md:p-6` (响应式)
- Hover效果: `hover:border-mainColor hover:shadow-xl transition-all duration-300`

**可访问性增强**:
```tsx
<article
  role="article"
  tabIndex={0}
  className="card"
  aria-label={cardTitle}
>
  {children}
</article>
```

---

## Technology Stack Summary

基于研究决策,最终技术栈:

**核心框架**:
- Next.js 15.5.5 (App Router)
- React 19.1.0
- TypeScript 5.x

**样式方案**:
- Tailwind CSS 4.x (工具类)
- CSS Variables (主题变量)
- PostCSS (处理)

**组件库**:
- Radix UI (无障碍基础组件)
- TanStack Virtual (虚拟滚动)

**测试工具**:
- Vitest (单元测试)
- React Testing Library (组件测试)
- Playwright (E2E测试)
- axe DevTools (无障碍检测)

**开发工具**:
- ESLint + Prettier (代码规范)
- TypeScript (类型检查)
- Turbopack (开发服务器)

---

## Next Steps

Phase 0研究完成,所有待澄清项已解决。准备进入Phase 1:

1. **数据模型定义** (data-model.md): 定义Theme、ColorScheme等实体
2. **API契约** (contracts/): UI重构不涉及API,跳过
3. **快速开始指南** (quickstart.md): 开发环境设置、主题系统使用说明
4. **更新AI代理上下文**: 添加新技术到.claude/CLAUDE.md

**未解决的开放问题**: 无
