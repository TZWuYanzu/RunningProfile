# Design System — 亮色主题（Swiss 瑞士排版）

> 前卫 · 潮流 · 简约 · 温暖点缀

基于国际主义排版风格（International Typographic Style），以**极致的字号对比**和**红色点缀**为核心视觉语言。所有设计决策服务于一个目标：让数据清晰、让操作明确、让界面安静但不冰冷。

---

## 1. 色彩系统

### 语义色（CSS 变量 → Tailwind 映射）

| 语义名 | 亮色值 | Tailwind token | 用途 |
|--------|--------|----------------|------|
| `--color-bg` | `#ffffff` | `bg-app` | 全局页面背景 |
| `--color-surface` | `#f9fafb` | `bg-surface` | 卡片次级背景（助手气泡、计划卡） |
| `--color-accent` | `#ef4444` | `bg-accent` / `text-accent` | 红色强调：指示条、分隔线、活跃Tab、发送按钮 |
| `--color-text-primary` | `#000000` | `text-primary` | 主标题、数字、用户气泡 |
| `--color-text-secondary` | `#6b7280` | `text-secondary` | 描述文字、卡片正文 |
| `--color-text-tertiary` | `#9ca3af` | `text-tertiary` | 标签、日期注释、section label |
| `--color-text-muted` | `#d1d3d7` | `text-muted` | 单位、未激活Tab、已完成项 |
| `--color-border-strong` | `#000000` | `border-strong` | TabBar 顶部、输入框底线 |
| `--color-border-subtle` | `#f3f4f6` | `border-subtle` | 行分隔、输入框顶部 |
| `--color-invert-bg` | `#000000` | `bg-invert` | 反转块：赛事卡、今日高亮 |
| `--color-invert-text` | `#ffffff` | `text-invert` | 反转块内文字 |

### 强调色规则

- **只用一个强调色**：红色 (`red-500`)。不用蓝色、绿色或其他彩色做装饰。
- 红色仅出现在 3 种场景：① header 指示条 ② section 分隔线 ③ 交互按钮（发送、活跃Tab）。
- 数据本身不着色——数字永远是黑色或白色（反转块内），不因语义（好/坏）改变颜色。

### 反转色块

用 `bg-black text-white` 创建视觉锚点：今日日历高亮、赛事倒计时卡。反转块内的次级文字用 `text-white/40`，标签用 `text-red-400`。

---

## 2. 字体系统

### 字体栈

```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

不使用自定义字体。系统字体保证渲染速度和原生感。

### 字号层级

Swiss 风格的核心：**极端的字号对比**（最大 60px / 最小 8px = 7.5x 比率）。

| 层级 | 字号 | 字重 | 颜色 | 场景 |
|------|------|------|------|------|
| Display | `text-6xl` (60px) | `font-black` (900) | primary | 概览页主数字（周跑量） |
| Monogram | `text-5xl` (48px) | `font-black` | primary | 头像首字母 |
| Date Hero | `text-4xl` (36px) | `font-black` | primary | 日历日期大字 |
| Metric | `text-3xl` (30px) | `font-black` | primary | 健康指标数字、倒计时天数 |
| Stat | `text-2xl` (24px) | `font-black` | primary | 概览次级统计 |
| Inline Metric | `text-lg` (18px) | `font-black` | primary | 配速、距离、心率区间 |
| Title | `text-base` (16px) | `font-bold` (700) | primary | 卡片标题、昵称 |
| Header | `text-sm` (14px) | `font-bold` | primary | 页面标题（"教练"、"计划"） |
| Body | `text-sm` (14px) | normal (400) | primary | 聊天文字 |
| Description | `text-xs` (12px) | normal | secondary | 卡片描述、日期注释 |
| Label | `text-[10px]` | normal | tertiary | section 标签、单位 |
| Micro | `text-[9px]` | normal/medium | tertiary/muted | Tab 标签、睡眠值 |
| Nano | `text-[8px]` | normal | tertiary | 日历格内类型标签 |

### 字体修饰规则

- **所有数字**加 `tabular-nums`，保证对齐。
- **section 标签**统一 `uppercase tracking-wider`。
- **大数字**加 `leading-none`，消除行高。
- **阅读文字**（聊天、描述）加 `leading-relaxed`。
- **已完成项**加 `line-through text-muted`。

---

## 3. 间距系统

### 页面级

| 位置 | 值 | 说明 |
|------|------|------|
| 水平内边距 | `px-5` (20px) | 所有页面统一 |
| Header 上边距 | `pt-6` (24px) | 给状态栏留空 |
| 内容底部留白 | `pb-14` (56px) | 为 TabBar 留空 |
| 聊天底部留白 | `pb-24` (96px) | 为输入框 + TabBar 留空 |

### 卡片/区块间距

| 元素 | 间距 | 说明 |
|------|------|------|
| section 标签 → 内容 | `mb-2` 到 `mb-3` | 标签后留白 |
| 区块之间 | `mt-5` 到 `mt-6` | 纵向区块间距 |
| 卡片内部 | `p-4` (16px) | 统一内边距 |
| 聊天气泡间 | `space-y-3` | 消息间距 |

### Grid 间距

| 布局 | 配置 |
|------|------|
| 健康指标 | `grid grid-cols-2 gap-x-8 gap-y-5` |
| 日历 | `grid grid-cols-7 gap-1` |
| 柱状图 | `flex items-end gap-2` + `flex-1` children |
| 训练指标行 | `flex gap-6` |

---

## 4. 边框与圆角

### 圆角规则

- **卡片、内容块：无圆角**（`rounded-none`，隐含默认）。直角是 Swiss 风格的核心。
- **聊天气泡：`rounded-2xl`** + 尾部去圆角（`rounded-br-none` / `rounded-bl-none`）。
- **今日高亮：`rounded-lg`**（日历格内的唯一圆角）。
- **Header 指示条：`rounded-full`**（红色竖条是装饰元素，允许圆形）。
- **发送按钮：无圆角**（方形，与 Swiss 风格一致）。

### 边框规则

- **TabBar 顶部：`border-t border-black`**（粗实线分隔）。
- **行分隔：`border-b border-subtle`**（极淡，几乎不可见）。
- **红色分隔线：`h-px bg-accent`**（用 div 而非 border，宽度 100%）。
- **输入框底线：`border-b-2 border-black`**（2px 黑色底线，无边框）。
- 不使用 `border-gray-200` 等中间灰度边框——要么黑色，要么极淡，不做折中。

### 阴影

**不使用任何 box-shadow**。层次感通过颜色对比（white/surface/black）和间距实现。

---

## 5. 标志性设计元素

### 5.1 红色指示条

```tsx
<div className="w-1 h-4 bg-accent rounded-full" />
```

出现在每个页面 header 的左侧，是品牌识别元素。

### 5.2 红色分隔线

```tsx
<div className="h-px bg-accent" />
```

用于 section 之间的视觉分割，替代传统的灰色 border。

### 5.3 极端字号对比

同一屏幕内，主数字（`text-6xl font-black`）与标签（`text-[9px] uppercase tracking-wider`）共存，比率 7.5x。这是 Swiss 风格的灵魂。

### 5.4 黑白反转块

```tsx
<div className="bg-invert text-invert p-4">
  <div className="text-[9px] text-accent uppercase tracking-wider">标签</div>
  <div className="text-sm font-bold">内容</div>
</div>
```

用于视觉锚点：赛事卡、今日高亮。

### 5.5 聊天气泡

- 用户：`bg-black text-white rounded-2xl rounded-br-none`
- 助手：`bg-surface text-primary rounded-2xl rounded-bl-none`
- 发送按钮：`bg-accent text-white` 方形（无圆角）

---

## 6. 组件模式

### 页面结构

```tsx
<div className="bg-app min-h-full flex flex-col">
  {/* Header */}
  <div className="px-5 pt-6 pb-2 flex items-center gap-2">
    <div className="w-1 h-4 bg-accent rounded-full" />
    <span className="text-sm font-bold text-primary tracking-tight">页面标题</span>
  </div>

  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto pb-14 px-5">
    {/* content */}
  </div>

  {/* TabBar */}
  <div className="absolute bottom-0 left-0 right-0 bg-app border-t border-strong h-12 flex justify-around items-center">
    {/* tabs */}
  </div>
</div>
```

### 指标展示（大数字 + 小标签）

```tsx
<div>
  <div className="text-[9px] text-tertiary uppercase tracking-wider mb-1">标签</div>
  <div className="flex items-baseline gap-1">
    <span className="text-3xl font-black text-primary tabular-nums leading-none">48</span>
    <span className="text-xs text-muted">bpm</span>
  </div>
</div>
```

### 列表行（标签 + 数值）

```tsx
<div className="flex items-baseline justify-between border-b border-subtle pb-2">
  <span className="text-xs text-tertiary">静息心率</span>
  <span className="text-lg font-black text-primary tabular-nums">48<span className="text-[10px] text-muted ml-0.5">bpm</span></span>
</div>
```

---

## 7. CSS 变量实现

在 `src/styles/index.css` 中定义：

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f9fafb;
  --color-accent: #ef4444;
  --color-text-primary: #000000;
  --color-text-secondary: #6b7280;
  --color-text-tertiary: #9ca3af;
  --color-text-muted: #d1d3d7;
  --color-border-strong: #000000;
  --color-border-subtle: #f3f4f6;
  --color-invert-bg: #000000;
  --color-invert-text: #ffffff;
}
```

在 `tailwind.config.js` 中映射：

```js
colors: {
  app: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  accent: 'var(--color-accent)',
  primary: 'var(--color-text-primary)',
  secondary: 'var(--color-text-secondary)',
  tertiary: 'var(--color-text-tertiary)',
  muted: 'var(--color-text-muted)',
  strong: 'var(--color-border-strong)',
  subtle: 'var(--color-border-subtle)',
  invert: 'var(--color-invert-bg)',
  'invert-text': 'var(--color-invert-text)',
},
```

切换主题只需覆盖 CSS 变量（通过 `data-theme="dark"` 或 `@media (prefers-color-scheme: dark)`），组件代码无需改动。

---

## 8. 不做的事

- **不用彩色语义化数据**——数字不因好坏变绿/红，保持黑白。
- **不用阴影**——层次用颜色和间距表达。
- **不用中间灰度边框**——要么 `border-black`，要么 `border-subtle`。
- **不用多个强调色**——只有红色。
- **不用自定义图标**——使用 emoji 或系统图标。
- **不用渐变**——纯色填充。
- **不用圆角卡片**——直角（聊天气泡除外）。
