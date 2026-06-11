#!/usr/bin/env node

/**
 * prepare-harness.mjs — Harness 文件同步脚本
 *
 * 将 src/_templates/ 中的模板源文件组装为各 IDE 的入口文件。
 * 触发时机：npm prepare / husky post-checkout / husky post-merge
 *
 * 本脚本由 harness-init.mjs 自动生成，可按项目需要修改。
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const TEMPLATES = path.join(ROOT, 'src/_templates')

function p(...segs) { return path.join(ROOT, ...segs) }
function readTemplate(relPath) {
  const full = path.join(TEMPLATES, relPath)
  if (!fs.existsSync(full)) return ''
  return fs.readFileSync(full, 'utf-8')
}
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }) }
function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf-8')
}

// ─── 组装 AGENTS.md（内联所有内容） ───

function buildAgentsMd() {
  const parts = [
    '# AGENTS.md\n\n本文件由 prepare-harness.mjs 自动生成，请勿直接手改。',
    readTemplate('prompt/main.md'),
    '---',
    readTemplate('spec/sdd.md'),
    '---',
    readTemplate('rules/quality-gate.md'),
    '---',
    readTemplate('supervisor/checklist.md'),
  ]

  // Inject playbooks if any
  const playbooksDir = path.join(TEMPLATES, 'playbooks')
  if (fs.existsSync(playbooksDir)) {
    const playbooks = fs.readdirSync(playbooksDir).filter(f => f.endsWith('.md'))
    if (playbooks.length) {
      parts.push('---')
      for (const pb of playbooks) {
        parts.push(readTemplate(`playbooks/${pb}`))
        parts.push('---')
      }
    }
  }

  parts.push(`
## Harness 架构（AI Coding 约束体系）

### 模块知识卡片（修改前必读）
修改某个 feature 之前，先读取该模块的 CONTEXT.md。

### 领域范式（SDD 阶段注入）
任务涉及特定领域时，在生成 SDD 前读取对应 playbook。

### 知识循环（归档判断）
任务完成后，按 knowledge-refinement.md 判断是否需要归档。
`)

  return parts.filter(Boolean).join('\n\n')
}

// ─── 组装 CLAUDE.md（引用式） ───

function buildClaudeMd() {
  return `# CLAUDE.md

## 项目级稳定知识
开始任何任务前，阅读 \`src/_templates/prompt/main.md\` 获取核心知识。

## SDD 开发规范
阅读 \`src/_templates/spec/sdd.md\` 获取 SDD 流程。
所有编码任务必须先生成 SDD 并经用户确认。

## 质量门禁
阅读 \`src/_templates/rules/quality-gate.md\` 获取验证流程。

## QA 与评审
- QA 检查清单: \`src/_templates/supervisor/checklist.md\`
- 知识归档规则: \`src/_templates/supervisor/knowledge-refinement.md\`
- 任务类型匹配: \`src/_templates/supervisor/task-profiles.yaml\`

## Harness 架构
### 模块知识卡片（修改前必读）
修改某个 feature 之前，先读取该模块的 CONTEXT.md。
### 领域范式（SDD 阶段注入）
任务涉及特定领域时，读取 \`src/_templates/playbooks/\` 中的对应 playbook。
### 知识循环（归档判断）
任务完成后，按 knowledge-refinement.md 判断是否需要归档。
`
}

// ─── 同步规则到各 IDE ───

function syncRules() {
  const qualityGate = readTemplate('rules/quality-gate.md')
  if (qualityGate) {
    // Claude Code rules
    writeFile(p('.claude/rules/quality-gate.md'), qualityGate)

    // Cursor rules
    writeFile(p('.cursor/rules/quality-gate.mdc'), `---
description: 质量门禁规则
alwaysApply: true
---

${qualityGate}`)

    // Qoder rules
    writeFile(p('.qoder/rules/quality-gate.md'), qualityGate)
  }
}

// ─── 主流程 ───

function main() {
  console.log('[prepare-harness] 同步 Harness 文件…')

  writeFile(p('AGENTS.md'), buildAgentsMd())
  writeFile(p('CLAUDE.md'), buildClaudeMd())
  syncRules()

  console.log('[prepare-harness] 完成')
}

main()
