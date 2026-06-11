# Memory Archivist — 归档执行工作流

当 archive-triggers 判断需要归档时，按以下流程执行。

## 归档类型

### Type A: ADR（架构决策记录）

1. 创建文件: `memory/DECISIONS/YYYY-MM-DD-<slug>.md`
2. 格式:
```markdown
# <决策标题>

## 背景
<为什么需要做这个决策>

## 决策
<做了什么决策>

## 影响
<这个决策影响了什么>

## 替代方案
<考虑过但未采用的方案>
```

### Type B: 变更日志

1. 在 `memory/CHANGELOG_AGENT.md` 顶部追加条目
2. 格式:
```markdown
## YYYY-MM-DD — <变更摘要>
- **范围**: <影响的模块>
- **内容**: <具体变更>
- **原因**: <为什么这样改>
```

### Type C: 模块知识卡片更新

1. 更新对应 feature 目录下的 `CONTEXT.md`
2. 只更新变化的部分，保持整体结构不变

## 执行原则

- 每次归档后输出一行摘要说明归档了什么
- 归档文件必须提交到仓库（不在 .gitignore 中）
- 归档内容应简洁，控制在 50 行以内
