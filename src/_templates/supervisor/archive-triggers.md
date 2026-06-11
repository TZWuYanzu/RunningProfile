# Archive Triggers

## 何时触发归档

在任务完成后，检查以下条件。满足任一条则执行对应归档动作。

| 触发条件 | 归档动作 | 目标文件 |
|----------|----------|----------|
| 做出了非平凡的架构决策 | 写入 ADR | `memory/DECISIONS/YYYY-MM-DD-<slug>.md` |
| 新增/修改了 API 接口 | 更新变更日志 | `memory/CHANGELOG_AGENT.md` |
| 修改了模块的职责或对外 API | 更新知识卡片 | `<feature>/CONTEXT.md` |
| 发现了反复出现的坑 | 更新 playbook 或 rules | `src/_templates/playbooks/` |
| 本次无需归档 | 无动作 | — |

## 判断原则

- 只归档**非显而易见**的知识（能从代码直接推断的不归档）
- 归档内容应对**未来的 AI 和开发者**有价值
- 宁可漏归档也不要过度归档，保持信噪比
