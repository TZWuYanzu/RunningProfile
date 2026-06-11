# Knowledge Refinement Model

## 三级知识模型

| 级别 | 载体 | 生命周期 | 更新频率 |
|------|------|----------|----------|
| Level 1 | 对话态（IDE Memory / 对话上下文） | 短期 | 每次对话 |
| Level 2 | 仓库态（memory/ + CONTEXT.md） | 中期 | 每个迭代 |
| Level 3 | 规则态（rules / playbooks / main.md） | 长期 | 季度 review |

## Level 1 → Level 2：归档触发条件

以下任一条件满足时，将对话中的知识归档到仓库：

1. **架构决策** — 写入 `memory/DECISIONS/` 作为 ADR
2. **接口变更** — 更新 `memory/CHANGELOG_AGENT.md`
3. **跨模块影响** — ADR + 相关 CONTEXT.md
4. **功能完成** — 更新 CHANGELOG_AGENT
5. **模块职责变化** — 更新 CONTEXT.md

## Level 2 → Level 3：精炼触发条件

1. 同类经验重复 3+ 次
2. 跨迭代稳定存在
3. 频繁踩坑的模式
4. 产品级共识

## 遗忘策略

- Level 1：工具自动管理（IDE Memory TTL）
- Level 2：每个 release 后 review，清理过时内容
- Level 3：仅在与代码冲突时修订

## 归档执行

归档时遵循 `memory-archivist/workflow.md` 中的标准流程。
