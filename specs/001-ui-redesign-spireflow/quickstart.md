# Quick Start: UI Redesign Development

**Feature**: UI Redesign with Spireflow Style
**Date**: 2025-10-23
**Purpose**: 开发环境设置和主题系统使用指南

## Prerequisites

确保已安装以下工具:

- **Node.js**: >= 18.0.0 (推荐使用v20 LTS)
- **pnpm**: >= 8.0.0 (项目包管理器)
- **Git**: 用于版本控制
- **VSCode**: 推荐编辑器,配合扩展使用

### 推荐VSCode扩展

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "axe-core.axe-linter"
  ]
}
```

---

## Environment Setup

### 1. 切换到功能分支

```bash
# 确认当前在功能分支
git branch
# 应该显示: * 001-ui-redesign-spireflow

# 如果不在,切换到功能分支
git checkout 001-ui-redesign-spireflow
```

### 2. 安装依赖

```bash
cd frontend
pnpm install
```

### 3. 安装新增依赖(测试工具)

```bash
# 安装Vitest和测试工具
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event

# 安装Playwright(E2E测试)
pnpm add -D @playwright/test
pnpm exec playwright install

# 安装虚拟滚动库
pnpm add @tanstack/react-virtual

# 安装axe无障碍测试库
pnpm add -D axe-core @axe-core/playwright
```

### 4. 配置Vitest

创建 `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

创建 `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

### 5. 配置Playwright

创建 `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 6. 启动开发服务器

```bash
pnpm dev
# 访问 http://localhost:4000
```

---

## Project Structure Overview

```
frontend/
├── app/
│   ├── globals.css           # 全局样式,引入CSS变量
│   └── layout.tsx             # 根布局,包裹ThemeProvider
├── components/
│   ├── theme/                 # 主题相关组件(需要创建)
│   │   ├── theme-provider.tsx
│   │   ├── theme-switcher.tsx
│   │   └── theme-config.ts
│   └── ui/                    # UI组件
│       └── card.tsx           # 统一卡片组件(需要创建)
├── styles/
│   ├── themes/                # 主题CSS文件(需要创建)
│   │   ├── midnight.css
│   │   ├── charcoal.css
│   │   └── obsidian.css
│   └── variables.css          # CSS变量定义(需要创建)
├── lib/
│   └── theme-utils.ts         # 主题工具函数(需要创建)
├── types/
│   └── theme.ts               # 主题类型定义(需要创建)
├── vitest.config.ts           # Vitest配置
├── playwright.config.ts       # Playwright配置
└── package.json
```

---

## Development Workflow

### 步骤1: 创建主题系统基础

#### 1.1 定义类型

创建 `types/theme.ts`:

```typescript
export type ThemeMode = 'light' | 'dark'
export type ThemeModePreference = ThemeMode | 'auto'

export interface ColorScheme {
  primaryBg: string
  secondaryBg: string
  primaryText: string
  secondaryText: string
  mainBorder: string
  mainColor: string
  accentColor: string
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
}

export interface ThemePreference {
  themeId: string
  mode: ThemeModePreference
  lastUpdated: number
}
```

#### 1.2 创建主题配置

创建 `components/theme/theme-config.ts`:

```typescript
import { Theme } from '@/types/theme'

export const themes: Theme[] = [
  {
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
      errorColor: '#ef4444',
    },
    description: '深邃的午夜蓝色调,适合长时间专注工作',
  },
  // 后续添加 charcoal 和 obsidian
]

export const defaultTheme = themes[0]
```

#### 1.3 创建CSS变量文件

创建 `styles/themes/midnight.css`:

```css
:root[data-theme="midnight"] {
  --color-primary-bg: #1a1a2e;
  --color-secondary-bg: #16213e;
  --color-primary-text: #e4e4e7;
  --color-secondary-text: #a1a1aa;
  --color-main-border: #3a3f5c;
  --color-main-color: #7c3aed;
  --color-accent-color: #06b6d4;
  --color-success-color: #10b981;
  --color-warning-color: #f59e0b;
  --color-error-color: #ef4444;
}
```

#### 1.4 更新Tailwind配置

编辑 `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primaryBg: 'var(--color-primary-bg)',
        secondaryBg: 'var(--color-secondary-bg)',
        primaryText: 'var(--color-primary-text)',
        secondaryText: 'var(--color-secondary-text)',
        mainBorder: 'var(--color-main-border)',
        mainColor: 'var(--color-main-color)',
        accentColor: 'var(--color-accent-color)',
        successColor: 'var(--color-success-color)',
        warningColor: 'var(--color-warning-color)',
        errorColor: 'var(--color-error-color)',
      },
    },
  },
  plugins: [],
}
export default config
```

### 步骤2: 实现ThemeProvider

创建 `components/theme/theme-provider.tsx`:

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Theme, ThemePreference } from '@/types/theme'
import { themes, defaultTheme } from './theme-config'

interface ThemeContextValue {
  currentTheme: Theme
  preference: ThemePreference
  setTheme: (themeId: string) => void
  setMode: (mode: 'light' | 'dark' | 'auto') => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme)
  const [preference, setPreference] = useState<ThemePreference>({
    themeId: defaultTheme.id,
    mode: 'dark',
    lastUpdated: Date.now(),
  })

  // 初始化: 从localStorage读取偏好
  useEffect(() => {
    const stored = localStorage.getItem('theme-preference')
    if (stored) {
      const pref: ThemePreference = JSON.parse(stored)
      const theme = themes.find(t => t.id === pref.themeId) || defaultTheme
      setCurrentTheme(theme)
      setPreference(pref)
      applyTheme(theme)
    }
  }, [])

  // 应用主题到DOM
  const applyTheme = (theme: Theme) => {
    document.documentElement.setAttribute('data-theme', theme.id)
  }

  // 切换主题
  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId)
    if (theme) {
      setCurrentTheme(theme)
      const newPref = { ...preference, themeId, lastUpdated: Date.now() }
      setPreference(newPref)
      localStorage.setItem('theme-preference', JSON.stringify(newPref))
      applyTheme(theme)
    }
  }

  const setMode = (mode: 'light' | 'dark' | 'auto') => {
    const newPref = { ...preference, mode, lastUpdated: Date.now() }
    setPreference(newPref)
    localStorage.setItem('theme-preference', JSON.stringify(newPref))
  }

  return (
    <ThemeContext.Provider value={{ currentTheme, preference, setTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

### 步骤3: 集成到App

编辑 `app/layout.tsx`:

```typescript
import { ThemeProvider } from '@/components/theme/theme-provider'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const pref = localStorage.getItem('theme-preference');
                if (pref) {
                  const { themeId } = JSON.parse(pref);
                  document.documentElement.setAttribute('data-theme', themeId);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-primaryBg text-primaryText">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

---

## Testing Guide

### 单元测试(Vitest)

创建 `components/theme/__tests__/theme-provider.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../theme-provider'

function TestComponent() {
  const { currentTheme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme-id">{currentTheme.id}</span>
      <button onClick={() => setTheme('charcoal')}>Change Theme</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should render with default theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme-id')).toHaveTextContent('midnight')
  })

  it('should change theme on button click', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    fireEvent.click(screen.getByText('Change Theme'))
    expect(screen.getByTestId('theme-id')).toHaveTextContent('charcoal')
  })
})
```

运行测试:

```bash
pnpm vitest
```

### E2E测试(Playwright)

创建 `e2e/theme-switching.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Theme Switching', () => {
  test('should switch theme and persist preference', async ({ page }) => {
    await page.goto('/')

    // 默认应该是midnight主题
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'midnight')

    // 点击主题切换器
    await page.click('[data-testid="theme-switcher"]')
    await page.click('text=木炭灰')

    // 验证主题已切换
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'charcoal')

    // 刷新页面,验证偏好持久化
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'charcoal')
  })

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    await page.goto('/accounts')

    if (isMobile) {
      // 验证移动端布局:单列
      const cards = page.locator('[data-testid="account-card"]')
      const firstCard = cards.first()
      const box = await firstCard.boundingBox()

      // 卡片宽度应该接近屏幕宽度(减去padding)
      expect(box?.width).toBeGreaterThan(300)
    }
  })
})
```

运行E2E测试:

```bash
pnpm exec playwright test
```

### 无障碍测试

创建 `e2e/accessibility.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test('should not have accessibility violations', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})
```

---

## Common Tasks

### 添加新主题

1. 在 `theme-config.ts` 中添加主题定义
2. 创建对应的CSS变量文件 `styles/themes/your-theme.css`
3. 在 `globals.css` 中导入CSS文件
4. 测试主题切换和持久化

### 创建卡片组件

```typescript
// components/ui/card.tsx
interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <article
      className={`
        rounded-xl shadow-lg border border-mainBorder
        bg-secondaryBg p-4 md:p-6
        hover:border-mainColor hover:shadow-xl
        transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </article>
  )
}
```

### 使用虚拟滚动

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

function AccountList({ accounts }: { accounts: Account[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: accounts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // 预估卡片高度
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <AccountCard account={accounts[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Troubleshooting

### 主题切换有闪烁

**原因**: localStorage读取在客户端渲染后
**解决**: 确保在 `<head>` 中注入阻塞脚本(已在layout.tsx中实现)

### Tailwind类不生效

**原因**: CSS变量未正确定义或Tailwind配置未扩展
**解决**: 检查 `tailwind.config.ts` 中的 `colors` 扩展

### 无障碍测试失败

**原因**: 颜色对比度不足
**解决**: 使用WebAIM对比度检查器调整颜色值,确保≥4.5:1

---

## Next Steps

完成环境设置后:

1. 运行 `/speckit.tasks` 生成详细任务清单
2. 按照任务清单逐步实现功能
3. 每个阶段运行测试确保质量
4. 提交代码前运行无障碍审计

**Ready to code!** 🚀
