# Data Model: UI Redesign with Spireflow Style

**Feature**: UI Redesign with Spireflow Style
**Date**: 2025-10-23
**Purpose**: 定义主题系统相关的数据实体和结构

## Overview

UI重构引入主题系统,需要定义以下数据实体:
1. **Theme** - 主题配置实体
2. **ColorScheme** - 颜色方案
3. **ThemePreference** - 用户主题偏好(存储在localStorage)
4. **BreakpointConfig** - 响应式断点配置

**注意**: 这些实体主要用于前端状态管理和localStorage,不涉及后端数据库存储。

---

## Entity 1: Theme

### Description
主题配置实体,定义一个完整的主题包含的所有属性。

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | string | 主题唯一标识符 | 必填,唯一值,如"midnight"、"charcoal"、"obsidian" |
| `name` | string | 主题显示名称 | 必填,用于UI展示,如"午夜蓝"、"木炭灰" |
| `mode` | "light" \| "dark" | 主题模式 | 必填,默认"dark" |
| `colors` | ColorScheme | 颜色方案对象 | 必填,包含所有颜色变量 |
| `description` | string | 主题描述 | 可选,简短描述主题特点 |
| `previewImage` | string | 主题预览图URL | 可选,用于主题选择器展示 |

### Example

```typescript
const midnightTheme: Theme = {
  id: 'midnight',
  name: '午夜蓝',
  mode: 'dark',
  colors: {
    primaryBg: '#1a1a2e',
    secondaryBg: '#16213e',
    primaryText: '#e4e4e7',
    secondaryText: '#a1a1aa',
    mainBorder: '#3a3f5c',
    mainColor: '#7c3aed',
    accentColor: '#06b6d4',
    successColor: '#10b981',
    warningColor: '#f59e0b',
    errorColor: '#ef4444'
  },
  description: '深邃的午夜蓝色调,适合长时间专注工作',
  previewImage: '/themes/midnight-preview.jpg'
}
```

### Relationships

- 包含一个 `ColorScheme` 对象
- 被 `ThemePreference` 引用(通过theme ID)

---

## Entity 2: ColorScheme

### Description
颜色方案,定义主题的所有颜色变量。

### Fields

**基于 Spireflow 真实实现,定义 30+ 个核心颜色变量**

#### 文本颜色 (8个)

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `primaryText` | string | 主文字色 | 必填,与primaryBg对比度≥4.5:1 |
| `secondaryText` | string | 次文字色 | 必填,用于描述、提示等 |
| `secondaryTextHover` | string | 次文字悬停色 | 必填,悬停状态文字 |
| `coloredText` | string | 强调文字色 | 必填,品牌色文字 |
| `coloredTextHover` | string | 强调文字悬停色 | 必填,悬停状态 |
| `navItemText` | string | 导航项文字色 | 必填,导航菜单文字 |
| `navItemTextActive` | string | 导航激活文字色 | 必填,当前激活项 |
| `navSectionTitle` | string | 导航分组标题色 | 必填,章节标题 |

#### 背景颜色 (15个)

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `primaryBg` | string | 主背景色 | 必填,CSS颜色值(HEX/RGB/HSL) |
| `secondaryBg` | string | 次背景色 | 必填,用于卡片、模态框等 |
| `mainColor` | string | 品牌主题色 | 必填,品牌色,用于按钮、链接 |
| `navigationBg` | string | 导航背景色 | 必填,侧边栏背景 |
| `navItemBg` | string | 导航项背景色 | 必填,默认导航项背景 |
| `navItemBgHover` | string | 导航项悬停背景 | 必填,悬停状态 |
| `navItemActiveBg` | string | 导航激活背景 | 必填,当前激活项 |
| `navItemActiveBgHover` | string | 导航激活悬停背景 | 必填,激活项悬停 |
| `inputBg` | string | 输入框背景色 | 必填,表单输入背景 |
| `inputBgHover` | string | 输入框悬停背景 | 必填,悬停状态 |
| `outlinedButtonBg` | string | 轮廓按钮背景 | 必填,次要按钮 |
| `outlinedButtonBgHover` | string | 轮廓按钮悬停背景 | 必填,悬停状态 |
| `containedButtonBg` | string | 实心按钮背景 | 必填,主要按钮 |
| `containedButtonBgHover` | string | 实心按钮悬停背景 | 必填,悬停状态 |
| `dropdownBg` | string | 下拉菜单背景 | 必填,下拉列表背景 |

#### 边框颜色 (4个)

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `mainBorder` | string | 主边框色 | 必填,用于卡片边框、分割线 |
| `mainBorderHover` | string | 主边框悬停色 | 必填,悬停状态边框 |
| `inputBorder` | string | 输入框边框色 | 必填,表单边框 |
| `inputBorderHover` | string | 输入框悬停边框 | 必填,悬停状态 |

#### 图标颜色 (2个)

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `grayIcon` | string | 灰色图标 | 必填,默认图标颜色 |
| `navItemIconActive` | string | 导航激活图标 | 必填,激活项图标 |

#### 状态颜色 (3个,保持原有)

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `successColor` | string | 成功状态色 | 必填,绿色系 |
| `warningColor` | string | 警告状态色 | 必填,黄/橙色系 |
| `errorColor` | string | 错误状态色 | 必填,红色系 |

### Validation Rules

1. **对比度要求**:
   - `primaryText` vs `primaryBg`: 对比度 ≥ 4.5:1 (WCAG AA)
   - `secondaryText` vs `secondaryBg`: 对比度 ≥ 4.5:1

2. **颜色格式**:
   - 支持HEX: `#1a1a2e`
   - 支持RGB: `rgb(26, 26, 46)`
   - 支持HSL: `hsl(240, 28%, 14%)`

3. **状态色可辨识性**:
   - `successColor`、`warningColor`、`errorColor`需要明显区分
   - 即使色盲用户也能通过明度区分

### Example

**基于 Spireflow 真实颜色值**:

```typescript
// Obsidian 主题 (默认深色主题 - 绿色品牌色)
const obsidianColors: ColorScheme = {
  // 文本
  primaryText: "rgb(231, 233, 236)",
  secondaryText: "rgb(201, 203, 207)",
  secondaryTextHover: "rgb(255, 255, 255, 0.8)",
  coloredText: "rgb(61, 185, 133)",
  coloredTextHover: "rgb(105, 217, 170)",
  navItemText: "rgb(224, 227, 230, 0.8)",
  navItemTextActive: "rgb(255,255,255)",
  navSectionTitle: "rgb(225, 227, 230)",

  // 背景
  primaryBg: "rgb(36, 40, 45)",
  secondaryBg: "rgb(31, 34, 38)",
  mainColor: "rgb(61, 185, 133)",
  navigationBg: "rgb(36, 40, 45)",
  navItemBg: "rgb(12, 18, 24, 0)",
  navItemBgHover: "rgb(255,255,255,0.03)",
  navItemActiveBg: "rgb(255,255,255,0.07)",
  navItemActiveBgHover: "rgb(255,255,255,0.1)",
  inputBg: "rgb(255, 255, 255, 0.05)",
  inputBgHover: "rgb(255, 255, 255, 0.07)",
  outlinedButtonBg: "rgb(255, 255, 255, 0.05)",
  outlinedButtonBgHover: "rgb(255, 255, 255, 0.07)",
  containedButtonBg: "rgb(61, 142, 108)",
  containedButtonBgHover: "rgb(61, 185, 133)",
  dropdownBg: "rgb(44, 49, 55)",

  // 边框
  mainBorder: "rgb(255,255,255,0.08)",
  mainBorderHover: "rgb(255,255,255, 0.25)",
  inputBorder: "rgb(255,255,255,0.15)",
  inputBorderHover: "rgb(255,255,255,0.25)",

  // 图标
  grayIcon: "rgb(160, 165, 170)",
  navItemIconActive: "rgb(61, 185, 133)",

  // 状态色
  successColor: "rgb(110, 231, 183)",
  warningColor: "rgb(253, 186, 116)",
  errorColor: "rgb(253, 164, 175)"
}

// Midnight 主题 (深蓝色 - 青色品牌色)
const midnightColors: ColorScheme = {
  primaryBg: "rgb(48, 52, 62)",
  secondaryBg: "rgb(41, 45, 55)",
  mainColor: "#06b6d4",
  primaryText: "white",
  secondaryText: "rgb(255,255,255,0.6)",
  // ... 其他颜色
}

// Charcoal 主题 (灰色 - 蓝色品牌色)
const charcoalColors: ColorScheme = {
  primaryBg: "rgb(44, 47, 53)",
  secondaryBg: "rgb(36, 39, 45)",
  mainColor: "rgb(98, 136, 227)",
  primaryText: "rgb(235, 235, 235)",
  secondaryText: "rgb(209, 209, 211)",
  // ... 其他颜色
}
```

---

## Entity 3: ThemePreference

### Description
用户主题偏好,存储在浏览器localStorage,用于持久化用户的主题选择。

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `themeId` | string | 选中的主题ID | 必填,对应Theme.id |
| `mode` | "light" \| "dark" \| "auto" | 模式偏好 | 必填,"auto"表示跟随系统 |
| `lastUpdated` | number | 最后更新时间戳 | 必填,Unix时间戳(毫秒) |

### Storage

存储位置: `localStorage`
存储键: `theme-preference`

### Example

```typescript
// localStorage中的数据
const preference: ThemePreference = {
  themeId: 'midnight',
  mode: 'dark',
  lastUpdated: 1729670400000
}

// 存储
localStorage.setItem('theme-preference', JSON.stringify(preference))

// 读取
const stored = localStorage.getItem('theme-preference')
const preference = stored ? JSON.parse(stored) : null
```

### State Transitions

```
[初次访问] → 检测系统颜色模式 → 应用默认主题(midnight)
[用户切换主题] → 更新localStorage → 应用新主题 → 更新lastUpdated
[再次访问] → 读取localStorage → 应用保存的主题
[用户选择"auto"] → 监听系统颜色模式变化 → 自动切换light/dark
```

---

## Entity 4: BreakpointConfig

### Description
响应式断点配置,定义不同屏幕尺寸下的布局参数。

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `breakpoint` | string | 断点标识 | 必填,"xs"\|"sm"\|"md"\|"lg"\|"xl"\|"2xl" |
| `minWidth` | number | 最小宽度(px) | 必填,断点触发的最小屏幕宽度 |
| `columns` | number | 网格列数 | 必填,卡片网格布局的列数 |
| `gap` | number | 间距大小(px) | 必填,卡片之间的间距 |
| `cardPadding` | number | 卡片内边距(px) | 必填,卡片内部padding |
| `containerPadding` | number | 容器内边距(px) | 必填,页面容器的padding |

### Predefined Breakpoints

```typescript
const breakpoints: BreakpointConfig[] = [
  {
    breakpoint: 'xs',
    minWidth: 0,
    columns: 1,
    gap: 16,
    cardPadding: 16,
    containerPadding: 16
  },
  {
    breakpoint: 'sm',
    minWidth: 640,
    columns: 1,
    gap: 16,
    cardPadding: 20,
    containerPadding: 20
  },
  {
    breakpoint: 'md',
    minWidth: 768,
    columns: 2,
    gap: 24,
    cardPadding: 24,
    containerPadding: 24
  },
  {
    breakpoint: 'lg',
    minWidth: 1024,
    columns: 2,
    gap: 24,
    cardPadding: 24,
    containerPadding: 32
  },
  {
    breakpoint: 'xl',
    minWidth: 1280,
    columns: 3,
    gap: 32,
    cardPadding: 24,
    containerPadding: 40
  },
  {
    breakpoint: '2xl',
    minWidth: 1536,
    columns: 4,
    gap: 32,
    cardPadding: 24,
    containerPadding: 48
  }
]
```

---

## TypeScript Type Definitions

**完整类型定义 (基于 Spireflow 实际实现)**:

```typescript
// types/theme.ts

export type ThemeMode = 'light' | 'dark'
export type ThemeModePreference = ThemeMode | 'auto'

/**
 * 颜色方案接口 - 基于 Spireflow 的真实实现
 * 包含 32 个核心颜色变量
 */
export interface ColorScheme {
  // === 文本颜色 (8个) ===
  primaryText: string
  secondaryText: string
  secondaryTextHover: string
  coloredText: string
  coloredTextHover: string
  navItemText: string
  navItemTextActive: string
  navSectionTitle: string

  // === 背景颜色 (15个) ===
  primaryBg: string
  secondaryBg: string
  mainColor: string
  navigationBg: string
  navItemBg: string
  navItemBgHover: string
  navItemActiveBg: string
  navItemActiveBgHover: string
  inputBg: string
  inputBgHover: string
  outlinedButtonBg: string
  outlinedButtonBgHover: string
  containedButtonBg: string
  containedButtonBgHover: string
  dropdownBg: string

  // === 边框颜色 (4个) ===
  mainBorder: string
  mainBorderHover: string
  inputBorder: string
  inputBorderHover: string

  // === 图标颜色 (2个) ===
  grayIcon: string
  navItemIconActive: string

  // === 状态颜色 (3个) ===
  successColor: string
  warningColor: string
  errorColor: string
}

export interface Theme {
  id: string
  name: string
  mode: ThemeMode
  colors: ColorScheme
  description?: string
  previewImage?: string
}

export interface ThemePreference {
  themeId: string
  mode: ThemeModePreference
  lastUpdated: number
}

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

export interface BreakpointConfig {
  breakpoint: Breakpoint
  minWidth: number
  columns: number
  gap: number
  cardPadding: number
  containerPadding: number
}

/**
 * 主题上下文值 - 使用 next-themes
 * 注意: next-themes 提供的 useTheme hook 返回类型略有不同
 */
export interface ThemeContextValue {
  currentTheme: Theme
  themes: Theme[]
  setTheme: (themeId: string) => void
  // next-themes 原生提供的额外功能
  theme?: string
  systemTheme?: 'light' | 'dark'
  resolvedTheme?: string
}
```

---

## Data Flow Diagram

```
┌─────────────────┐
│ User Action     │
│ (切换主题按钮)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ThemeProvider   │
│ (React Context) │
└────────┬────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│ localStorage    │  │ CSS Variables   │
│ (持久化偏好)     │  │ (应用样式)       │
└─────────────────┘  └─────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ Re-render UI    │
                     │ (新主题生效)     │
                     └─────────────────┘
```

---

## Migration Considerations

### 现有数据兼容性

**账号和视频数据**: 完全不受影响,UI重构仅修改展示层,数据结构保持不变。

**用户偏好迁移**: 如果之前有其他主题设置(如简单的dark mode开关),需要迁移:

```typescript
// 迁移脚本示例
function migrateOldThemePreference() {
  const oldDarkMode = localStorage.getItem('dark-mode') // 旧版可能的键名
  if (oldDarkMode && !localStorage.getItem('theme-preference')) {
    const preference: ThemePreference = {
      themeId: 'midnight',
      mode: oldDarkMode === 'true' ? 'dark' : 'light',
      lastUpdated: Date.now()
    }
    localStorage.setItem('theme-preference', JSON.stringify(preference))
    localStorage.removeItem('dark-mode') // 清理旧数据
  }
}
```

---

## Summary

定义了4个核心实体:

1. **Theme**: 主题配置(3个预设主题: midnight、charcoal、obsidian)
2. **ColorScheme**: 颜色变量集合(**32个颜色变量** - 基于 Spireflow 实际实现)
3. **ThemePreference**: 用户偏好(存储在localStorage)
4. **BreakpointConfig**: 响应式断点(7个断点配置,包括3xl)

所有实体均为前端状态管理,不涉及后端API或数据库,简化实现复杂度。

---

## 实施方案要点

基于 Spireflow 源码分析,推荐使用以下技术方案:

### 1. 使用 tw-colors 插件

**优势**:
- 自动生成 CSS 类名,无需手动管理 CSS 变量
- 主题切换通过修改 HTML class 实现,性能优秀
- 类型安全,TypeScript 支持完善

**配置示例**:
```javascript
// tailwind.config.js
const { createThemes } = require("tw-colors");
const { obsidianTheme, midnightTheme, charcoalTheme } = require("./theme-config");

module.exports = {
  plugins: [
    createThemes({
      obsidian: obsidianTheme,
      midnight: midnightTheme,
      charcoal: charcoalTheme,
    }),
  ],
};
```

### 2. 使用 next-themes 库

**优势**:
- 自动处理 localStorage 持久化
- SSR 支持,无闪烁加载
- 系统颜色模式检测
- 提供 useTheme hook,简化状态管理

**使用示例**:
```typescript
import { ThemeProvider } from 'next-themes';

<ThemeProvider
  attribute="class"
  defaultTheme="obsidian"
  themes={["obsidian", "midnight", "charcoal"]}
>
  <App />
</ThemeProvider>
```

### 3. 主题定义文件结构

```
frontend/
├── styles/
│   └── themes/
│       ├── obsidian.ts      // Obsidian 主题对象
│       ├── midnight.ts       // Midnight 主题对象
│       ├── charcoal.ts       // Charcoal 主题对象
│       └── index.ts          // 导出所有主题
```

**注意**: 不需要创建独立的 CSS 文件,tw-colors 会自动处理。
