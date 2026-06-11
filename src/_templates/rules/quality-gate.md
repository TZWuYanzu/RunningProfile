# Quality Gate — 实现后验证规则

每次编码完成后，按以下门禁逐项验证。全部通过才可提交。

## 修改范围分级

| 级别 | 范围 | 要求 |
|------|------|------|
| 高影响 | 公共模块（components/utils/hooks/types/config） | 全部 Gate + 影响分析 |
| 标准 | 业务模块（features/pages） | Gate 1-2 + Gate 4（如有 UI） |
| 低影响 | 配置/文档/样式微调 | Gate 1（如适用） |

## 验证门禁

### Gate 1: 类型检查

```bash
npx tsc --noEmit
```

必须 0 error。warning 可暂时忽略。

### Gate 2: 代码规范

```bash
npx eslint <修改文件> --ext .ts,.tsx,.js,.jsx
```

必须 0 error。

### Gate 3: 影响分析

若修改了公共模块（components / utils / hooks / types / config 等），必须：

1. 列出所有引用方
2. 评估是否有破坏性变更
3. 在验证报告中注明影响范围

### Gate 4: 视觉验证

若涉及 UI 变更：

1. 启动开发服务器 `pnpm run dev`
2. 在浏览器中验证变更效果
3. 提醒用户确认 UI 符合预期

## 验证报告

每次验证后输出以下格式：

```
## 验证报告
- Gate 1 (类型检查): ✅/❌
- Gate 2 (代码规范): ✅/❌
- Gate 3 (影响分析): ✅/N/A
- Gate 4 (视觉验证): ✅/N/A
- Gate 5 (测试): ✅/N/A
- 修改文件: <列表>
```

## 禁止行为

- 跳过 Gate 1/2 直接提交
- 忽略编译或 lint 错误
- 修改公共模块但不输出影响分析
