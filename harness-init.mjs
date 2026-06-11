#!/usr/bin/env node

/**
 * harness-init.mjs — AI Coding Harness 通用初始化脚本
 *
 * 用法：将此文件拷贝到任意项目根目录，执行 node harness-init.mjs
 * 标志：--force（覆盖已有文件）--dry-run（仅分析不生成）--verbose（详细日志）
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()
const ARGS = new Set(process.argv.slice(2))
const FORCE = ARGS.has('--force')
const DRY_RUN = ARGS.has('--dry-run')
const VERBOSE = ARGS.has('--verbose')

const log = (msg) => console.log(`  ${msg}`)
const info = (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`)
const warn = (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`)
const ok = (msg) => console.log(`\x1b[32m  ✓\x1b[0m ${msg}`)
const skip = (msg) => console.log(`\x1b[90m  ⊘\x1b[0m ${msg} (已存在，用 --force 覆盖)`)
const verbose = (msg) => VERBOSE && console.log(`\x1b[90m  … ${msg}\x1b[0m`)

// ═══════════════════════════════════════════════════════════
// Phase 1: ANALYZE
// ═══════════════════════════════════════════════════════════

function analyze() {
  info('Phase 1: 分析项目结构…')
  const result = {
    name: path.basename(ROOT),
    stacks: [],       // ['react', 'typescript', 'python', 'fastapi', ...]
    framework: null,   // 'react' | 'vue' | 'angular' | 'fastapi' | 'express' | 'gin' | null
    bundler: null,     // 'vite' | 'webpack' | 'turbopack' | null
    uiLib: null,       // 'antd' | 'mui' | 'shadcn' | 'element' | null
    qualityTools: [],  // ['eslint', 'prettier', 'tsc', 'pytest', ...]
    srcDir: null,      // 'src' | 'app' | 'lib' | null
    modules: [],       // [{ name, path, type: 'feature'|'component'|'page'|'api' }]
    routing: null,     // 'wouter' | 'react-router' | 'next' | 'vue-router' | null
    dataFetching: null, // 'fetchAPI' | 'axios' | 'swr' | 'fetch' | null
    stateManagement: null, // 'redux' | 'zustand' | 'context' | 'pinia' | null
    packageManager: null, // 'npm' | 'pnpm' | 'yarn' | null
    existingHarness: { claudeMd: false, agentsMd: false, cursor: false, qoder: false, templates: false },
    isMonorepo: false,
    hasPython: false,
    hasGo: false,
    commands: { build: null, lint: null, typeCheck: null, test: null, dev: null },
  }

  // --- Detect package manager ---
  if (fs.existsSync(p('pnpm-lock.yaml'))) result.packageManager = 'pnpm'
  else if (fs.existsSync(p('yarn.lock'))) result.packageManager = 'yarn'
  else if (fs.existsSync(p('package-lock.json'))) result.packageManager = 'npm'
  else if (fs.existsSync(p('bun.lockb'))) result.packageManager = 'bun'

  // --- Detect Node.js project ---
  const pkg = readJson('package.json')
  if (pkg) {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }

    // Framework
    if (allDeps.react) { result.framework = 'react'; result.stacks.push('react') }
    else if (allDeps.vue) { result.framework = 'vue'; result.stacks.push('vue') }
    else if (allDeps['@angular/core']) { result.framework = 'angular'; result.stacks.push('angular') }
    else if (allDeps.next) { result.framework = 'next'; result.stacks.push('next', 'react') }
    else if (allDeps.nuxt) { result.framework = 'nuxt'; result.stacks.push('nuxt', 'vue') }
    else if (allDeps.svelte) { result.framework = 'svelte'; result.stacks.push('svelte') }

    // TypeScript
    if (allDeps.typescript || fs.existsSync(p('tsconfig.json'))) result.stacks.push('typescript')

    // Bundler
    if (allDeps.vite) result.bundler = 'vite'
    else if (allDeps.webpack) result.bundler = 'webpack'
    else if (allDeps.turbopack || allDeps['@vercel/turbopack']) result.bundler = 'turbopack'
    else if (allDeps.esbuild) result.bundler = 'esbuild'

    // UI Library
    if (allDeps.antd || allDeps['ant-design-vue']) result.uiLib = 'antd'
    else if (allDeps['@mui/material']) result.uiLib = 'mui'
    else if (allDeps['element-plus'] || allDeps['element-ui']) result.uiLib = 'element'
    // shadcn doesn't have a single dep, check for the components/ui directory
    else if (fs.existsSync(p('src/components/ui'))) result.uiLib = 'shadcn'

    // Quality tools
    if (allDeps.eslint) result.qualityTools.push('eslint')
    if (allDeps.prettier) result.qualityTools.push('prettier')
    if (allDeps.stylelint) result.qualityTools.push('stylelint')
    if (allDeps.vitest) result.qualityTools.push('vitest')
    if (allDeps.jest) result.qualityTools.push('jest')
    if (allDeps.cypress) result.qualityTools.push('cypress')
    if (allDeps.playwright || allDeps['@playwright/test']) result.qualityTools.push('playwright')
    if (result.stacks.includes('typescript')) result.qualityTools.push('tsc')

    // Routing
    if (allDeps.wouter) result.routing = 'wouter'
    else if (allDeps['react-router-dom'] || allDeps['react-router']) result.routing = 'react-router'
    else if (allDeps['vue-router']) result.routing = 'vue-router'
    else if (allDeps.next) result.routing = 'next-pages'

    // Data fetching
    if (allDeps.swr) result.stacks.push('swr')
    if (allDeps.axios) result.dataFetching = 'axios'
    else if (allDeps['@tanstack/react-query']) result.dataFetching = 'react-query'

    // State management
    if (allDeps.redux || allDeps['@reduxjs/toolkit']) result.stateManagement = 'redux'
    else if (allDeps.zustand) result.stateManagement = 'zustand'
    else if (allDeps.pinia) result.stateManagement = 'pinia'
    else if (allDeps.mobx) result.stateManagement = 'mobx'
    else if (allDeps.jotai) result.stateManagement = 'jotai'

    // Build commands
    const scripts = pkg.scripts || {}
    result.commands.build = scripts.build ? `${result.packageManager || 'npm'} run build` : null
    result.commands.dev = scripts.dev ? `${result.packageManager || 'npm'} run dev` : (scripts.start ? `${result.packageManager || 'npm'} run start` : null)
    result.commands.lint = scripts.lint ? `${result.packageManager || 'npm'} run lint` : (result.qualityTools.includes('eslint') ? 'npx eslint' : null)
    result.commands.test = scripts.test ? `${result.packageManager || 'npm'} run test` : null

    result.name = pkg.name || result.name
  }

  // --- Detect Python project ---
  const pyFiles = ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile']
  for (const f of pyFiles) {
    if (fs.existsSync(p(f))) {
      result.hasPython = true
      result.stacks.push('python')
      const content = safeRead(p(f))
      if (content.includes('fastapi')) { result.stacks.push('fastapi'); if (!result.framework) result.framework = 'fastapi' }
      if (content.includes('django')) { result.stacks.push('django'); if (!result.framework) result.framework = 'django' }
      if (content.includes('flask')) { result.stacks.push('flask'); if (!result.framework) result.framework = 'flask' }
      if (content.includes('pytest')) result.qualityTools.push('pytest')
      if (content.includes('ruff')) result.qualityTools.push('ruff')
      if (content.includes('mypy')) result.qualityTools.push('mypy')
      if (content.includes('black')) result.qualityTools.push('black')
      break
    }
  }

  // --- Detect Go project ---
  if (fs.existsSync(p('go.mod'))) {
    result.hasGo = true
    result.stacks.push('go')
    const gomod = safeRead(p('go.mod'))
    if (gomod.includes('gin-gonic')) { result.stacks.push('gin'); if (!result.framework) result.framework = 'gin' }
    if (gomod.includes('echo')) { result.stacks.push('echo'); if (!result.framework) result.framework = 'echo' }
    result.qualityTools.push('go-vet')
  }

  // --- Detect Rust project ---
  if (fs.existsSync(p('Cargo.toml'))) {
    result.stacks.push('rust')
    result.qualityTools.push('cargo-clippy')
  }

  // --- Detect source directory ---
  for (const dir of ['src', 'app', 'lib', 'packages']) {
    if (fs.existsSync(p(dir)) && fs.statSync(p(dir)).isDirectory()) {
      result.srcDir = dir
      break
    }
  }

  // --- Detect modules ---
  const moduleDirs = [
    { pattern: 'src/features', type: 'feature' },
    { pattern: 'src/vibe-features', type: 'vibe-feature' },
    { pattern: 'src/components', type: 'component' },
    { pattern: 'src/pages', type: 'page' },
    { pattern: 'src/hooks', type: 'hook' },
    { pattern: 'src/utils', type: 'util' },
    { pattern: 'src/api', type: 'api' },
    { pattern: 'src/stores', type: 'store' },
    { pattern: 'src/types', type: 'type' },
    { pattern: 'src/config', type: 'config' },
    { pattern: 'src/styles', type: 'style' },
    { pattern: 'src/app', type: 'app' },
    // Python patterns
    { pattern: 'server', type: 'server' },
    { pattern: 'server/routers', type: 'api' },
    { pattern: 'server/db', type: 'database' },
    { pattern: 'server/agent', type: 'agent' },
    // Go patterns
    { pattern: 'internal', type: 'internal' },
    { pattern: 'cmd', type: 'cmd' },
    { pattern: 'pkg', type: 'pkg' },
  ]

  for (const { pattern, type } of moduleDirs) {
    const fullPath = p(pattern)
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      if (type === 'feature' || type === 'vibe-feature') {
        const children = fs.readdirSync(fullPath).filter(f =>
          fs.statSync(path.join(fullPath, f)).isDirectory() && !f.startsWith('.')
        )
        for (const child of children) {
          result.modules.push({ name: child, path: `${pattern}/${child}`, type })
        }
      } else {
        result.modules.push({ name: path.basename(pattern), path: pattern, type })
      }
    }
  }

  // --- Detect data fetching pattern (from code) ---
  if (!result.dataFetching && result.srcDir) {
    try {
      const grep = execSync(
        `grep -rEl '(fetchAPI|useFetch|useSimpleFetch)' ${result.srcDir}/ --include='*.ts' --include='*.tsx' 2>/dev/null | head -3`,
        { cwd: ROOT, encoding: 'utf-8' }
      ).trim()
      if (grep) result.dataFetching = 'fetchAPI'
    } catch { /* no match */ }

    if (!result.dataFetching) {
      try {
        const grep = execSync(
          `grep -rEl 'from.*axios' ${result.srcDir}/ --include='*.ts' --include='*.tsx' 2>/dev/null | head -3`,
          { cwd: ROOT, encoding: 'utf-8' }
        ).trim()
        if (grep) result.dataFetching = 'axios'
      } catch { /* no match */ }
    }

    if (!result.dataFetching) result.dataFetching = 'fetch'
  }

  // --- TypeCheck command ---
  if (result.stacks.includes('typescript')) {
    if (result.framework === 'vue') result.commands.typeCheck = 'npx vue-tsc --noEmit'
    else result.commands.typeCheck = 'npx tsc --noEmit'
  }
  if (result.hasPython && result.qualityTools.includes('mypy')) {
    result.commands.typeCheck = (result.commands.typeCheck ? result.commands.typeCheck + ' && ' : '') + 'mypy .'
  }

  // --- Detect existing harness ---
  result.existingHarness.claudeMd = fs.existsSync(p('CLAUDE.md'))
  result.existingHarness.agentsMd = fs.existsSync(p('AGENTS.md'))
  result.existingHarness.cursor = fs.existsSync(p('.cursor/rules'))
  result.existingHarness.qoder = fs.existsSync(p('.qoder/rules'))
  result.existingHarness.templates = fs.existsSync(p('src/_templates'))

  // --- Detect monorepo ---
  result.isMonorepo = fs.existsSync(p('packages')) || fs.existsSync(p('apps')) || (pkg && pkg.workspaces)

  // --- Print report ---
  console.log('')
  console.log('┌─────────────────────────────────────────────────┐')
  console.log('│         项目分析报告                            │')
  console.log('└─────────────────────────────────────────────────┘')
  log(`项目名称: ${result.name}`)
  log(`技术栈:   ${result.stacks.join(', ') || '未检测到'}`)
  log(`框架:     ${result.framework || '未检测到'}`)
  log(`构建工具: ${result.bundler || '未检测到'}`)
  log(`UI 库:    ${result.uiLib || '未检测到'}`)
  log(`路由:     ${result.routing || '未检测到'}`)
  log(`数据请求: ${result.dataFetching || '未检测到'}`)
  log(`状态管理: ${result.stateManagement || '未检测到'}`)
  log(`质量工具: ${result.qualityTools.join(', ') || '无'}`)
  log(`包管理器: ${result.packageManager || '未检测到'}`)
  log(`源码目录: ${result.srcDir || '未检测到'}`)
  log(`检测到 ${result.modules.filter(m => m.type === 'feature').length} 个 feature 模块`)
  log(`检测到 ${result.modules.length} 个目录模块`)
  if (result.hasPython) log(`Python 后端: 是`)
  if (result.hasGo) log(`Go 后端: 是`)

  const existing = Object.entries(result.existingHarness).filter(([, v]) => v).map(([k]) => k)
  if (existing.length) log(`已有 AI 工具链: ${existing.join(', ')}`)
  else log(`已有 AI 工具链: 无`)

  console.log('')

  return result
}

// ═══════════════════════════════════════════════════════════
// Phase 2: GENERATE
// ═══════════════════════════════════════════════════════════

function generate(analysis) {
  info('Phase 2: 生成 Harness 文件…')
  if (DRY_RUN) {
    warn('--dry-run 模式，不会写入任何文件')
    return
  }

  const files = []

  // ─── 通用文件 ───

  files.push({
    path: templatePath('spec/sdd.md'),
    content: generateSDD(),
  })

  files.push({
    path: templatePath('supervisor/checklist.md'),
    content: generateChecklist(analysis),
  })

  files.push({
    path: templatePath('supervisor/knowledge-refinement.md'),
    content: generateKnowledgeRefinement(),
  })

  files.push({
    path: templatePath('supervisor/archive-triggers.md'),
    content: generateArchiveTriggers(),
  })

  files.push({
    path: templatePath('supervisor/task-profiles.yaml'),
    content: generateTaskProfiles(analysis),
  })

  files.push({
    path: templatePath('memory-archivist/workflow.md'),
    content: generateArchivistWorkflow(),
  })

  files.push({
    path: templatePath('rules/quality-gate.md'),
    content: generateQualityGate(analysis),
  })

  // ─── 项目特定文件 ───

  files.push({
    path: templatePath('prompt/main.md'),
    content: generateMainPrompt(analysis),
  })

  // CONTEXT.md for each feature module
  const featureModules = analysis.modules.filter(m => m.type === 'feature')
  for (const mod of featureModules) {
    const contextPath = path.join(ROOT, mod.path, 'CONTEXT.md')
    files.push({
      path: contextPath,
      content: generateContextMd(mod, analysis),
    })
  }

  // ─── IDE 入口文件 ───

  files.push({
    path: p('CLAUDE.md'),
    content: generateClaudeMd(analysis),
  })

  files.push({
    path: p('AGENTS.md'),
    content: generateAgentsMd(analysis),
  })

  files.push({
    path: p('.cursor/rules/project.mdc'),
    content: generateCursorRules(analysis),
  })

  files.push({
    path: p('.qoder/rules/project.md'),
    content: generateQoderRules(analysis),
  })

  // ─── Memory 目录 ───

  files.push({
    path: p('memory/README.md'),
    content: generateMemoryReadme(),
  })

  // ─── 写入文件 ───

  let created = 0
  let skipped = 0

  for (const { path: filePath, content } of files) {
    if (fs.existsSync(filePath) && !FORCE) {
      skip(rel(filePath))
      skipped++
    } else {
      ensureDir(path.dirname(filePath))
      fs.writeFileSync(filePath, content, 'utf-8')
      ok(rel(filePath))
      created++
    }
  }

  console.log('')
  log(`创建 ${created} 个文件，跳过 ${skipped} 个已存在文件`)
}

// ═══════════════════════════════════════════════════════════
// Phase 3: INTEGRATE
// ═══════════════════════════════════════════════════════════

function integrate(analysis) {
  info('Phase 3: 集成到项目工作流…')
  if (DRY_RUN) return

  // --- Update .gitignore ---
  const gitignorePath = p('.gitignore')
  const harnessIgnores = [
    '',
    '# AI Harness (generated, do not commit)',
    'AGENTS.md',
    'CLAUDE.md',
    '.claude/',
  ]

  if (fs.existsSync(gitignorePath)) {
    const content = safeRead(gitignorePath)
    const missing = harnessIgnores.filter(line =>
      line && !content.includes(line)
    )
    if (missing.length) {
      const append = '\n' + harnessIgnores.join('\n') + '\n'
      fs.appendFileSync(gitignorePath, append)
      ok('.gitignore — 已追加 harness 忽略规则')
    } else {
      skip('.gitignore — harness 规则已存在')
    }
  } else {
    fs.writeFileSync(gitignorePath, harnessIgnores.join('\n') + '\n')
    ok('.gitignore — 已创建')
  }

  // --- Generate prepare-harness.mjs ---
  const prepareScript = generatePrepareScript(analysis)
  const preparePath = p('scripts/prepare-harness.mjs')
  if (fs.existsSync(preparePath) && !FORCE) {
    skip(rel(preparePath))
  } else {
    ensureDir(path.dirname(preparePath))
    fs.writeFileSync(preparePath, prepareScript, 'utf-8')
    ok(rel(preparePath))
  }

  console.log('')
  info('初始化完成！')
  console.log('')
  console.log('┌─────────────────────────────────────────────────┐')
  console.log('│         下一步操作                              │')
  console.log('└─────────────────────────────────────────────────┘')
  log('1. 检查并完善 src/_templates/prompt/main.md（项目级知识）')
  log('2. 为核心模块完善 CONTEXT.md（模块级知识卡片）')
  log('3. 根据业务领域添加 playbook（src/_templates/playbooks/）')
  log('4. 将 prepare-harness 集成到 npm prepare hook:')
  log('   在 package.json scripts 中添加:')
  log('   "prepare": "node scripts/prepare-harness.mjs"')
  log('5. 让 AI 尝试执行一个小任务，验证流程打通')
  console.log('')
}

// ═══════════════════════════════════════════════════════════
// Template Generators
// ═══════════════════════════════════════════════════════════

function generateSDD() {
  return `# SDD 开发规范

本规范用于约束 AI 在本项目中的日常编码行为。

## 核心原则

- 先澄清，再编码；先约束边界，再生成代码。
- 需求不清、边界不清、影响范围不清时，禁止直接开工。

## 任务分级

### 小需求

- 只涉及 1 个文件，或局部修改 1 个功能点
- 没有复杂接口联动或架构权衡
- 用户已明确指出修改位置或目标

处理方式：先生成超短 SDD → 对话中确认 → 实现。

### 中需求

- 涉及 2+ 功能模块，或单模块内需修改 5+ 文件
- 有权限差异、接口映射、状态回显要求
- 有明确的"不能改什么"边界

处理方式：必须先生成 SDD → 用户确认 → 再实现。

### 大需求

- 涉及 3+ feature 模块或页面
- 需要新增/修改后端接口
- 引入新的技术方案或数据流模式

处理方式：先进入 Plan 模式 → 拆解为多个子 SDD → 逐个执行。

## 标准工作流

1. 判断任务级别（小/中/大）
2. 阅读 CONTEXT.md（目标模块）和相关 playbook
3. 生成超短 SDD，不直接开始编码
4. 与用户确认目标、范围、约束和验收标准
5. **SDD 确认前禁止编码**
6. 确认后实施代码修改
7. 完成后提供变更说明与验证结果

## 超短 SDD 模板

\`\`\`yaml
task: <一句话说明要做什么>
scope:
  - <允许修改的文件或模块>
constraints:
  - <不能改什么>
  - <必须遵守什么约束>
impact:
  - <可能影响的其他模块>
dependencies:
  - <依赖的接口/模块/前置条件>
acceptance:
  - item: <完成条件>
    verify: <验证方式>
\`\`\`

## 变更修订策略

- SDD 初始版本为 v1.0
- 实现中发生需求变更时，追加修订（v1.1、v1.2…）
- 每次修订标注原因和变更摘要
- 修订后需重新确认

## 禁止事项

- 未生成 SDD 就直接对中需求编码
- 边界不清时靠猜测补需求
- 为满足局部需求做无关的大范围重构
`
}

function generateChecklist(a) {
  const typeCheckCmd = a.commands.typeCheck || 'npx tsc --noEmit'
  const lintCmd = a.commands.lint || 'npx eslint'
  const testCmd = a.commands.test || '# 无测试命令'
  const buildCmd = a.commands.build || '# 无构建命令'

  return `# QA 五维度检查清单

代码实现完成后，按本清单逐项检查。所有 Must 项必须通过。

## 快速验证命令

\`\`\`bash
# 类型检查
${typeCheckCmd}

# 代码规范
${lintCmd} <修改文件>

# 测试
${testCmd}

# 构建
${buildCmd}
\`\`\`

## 维度一：编译与运行（Must）

- [ ] 1.1 类型检查通过 \`${typeCheckCmd}\`（0 error）
- [ ] 1.2 Lint 通过（0 error）
- [ ] 1.3 ${a.commands.build ? '构建通过' : '无构建错误'}

## 维度二：目录与模块合规（Must）

- [ ] 2.1 新增文件放在正确目录下
- [ ] 2.2 依赖方向正确，无反向依赖
- [ ] 2.3 不在公共模块中引入业务模块

## 维度三：编码规范（Must/Warn）

- [ ] 3.1 [Must] 无硬编码的秘钥、密码或敏感信息
- [ ] 3.2 [Must] 无未处理的异常（try/catch 或错误边界）
- [ ] 3.3 [Warn] 命名清晰，符合项目约定
- [ ] 3.4 [Warn] 无冗余代码或未使用的导入

## 维度四：交互与功能完整性（Must/Warn）

- [ ] 4.1 [Must] 主流程可正常运行
- [ ] 4.2 [Must] 错误场景有用户可见的提示
- [ ] 4.3 [Warn] 加载状态有反馈
- [ ] 4.4 [Warn] 边界情况已处理（空数据、超长文本等）

## 维度五：可维护性（Warn）

- [ ] 5.1 公共模块变更附带影响分析
- [ ] 5.2 复杂逻辑有必要的注释
- [ ] 5.3 无过度抽象或提前优化

## 验证报告模板

\`\`\`
## 验证报告
- 类型检查: ✅/❌
- Lint: ✅/❌
- 测试: ✅/❌/N/A
- 构建: ✅/❌/N/A
- 影响模块: <列出>
- UI 变更: 是/否（如是，需用户确认）
\`\`\`
`
}

function generateKnowledgeRefinement() {
  return `# Knowledge Refinement Model

## 三级知识模型

| 级别 | 载体 | 生命周期 | 更新频率 |
|------|------|----------|----------|
| Level 1 | 对话态（IDE Memory / 对话上下文） | 短期 | 每次对话 |
| Level 2 | 仓库态（memory/ + CONTEXT.md） | 中期 | 每个迭代 |
| Level 3 | 规则态（rules / playbooks / main.md） | 长期 | 季度 review |

## Level 1 → Level 2：归档触发条件

以下任一条件满足时，将对话中的知识归档到仓库：

1. **架构决策** — 写入 \`memory/DECISIONS/\` 作为 ADR
2. **接口变更** — 更新 \`memory/CHANGELOG_AGENT.md\`
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

归档时遵循 \`memory-archivist/workflow.md\` 中的标准流程。
`
}

function generateArchiveTriggers() {
  return `# Archive Triggers

## 何时触发归档

在任务完成后，检查以下条件。满足任一条则执行对应归档动作。

| 触发条件 | 归档动作 | 目标文件 |
|----------|----------|----------|
| 做出了非平凡的架构决策 | 写入 ADR | \`memory/DECISIONS/YYYY-MM-DD-<slug>.md\` |
| 新增/修改了 API 接口 | 更新变更日志 | \`memory/CHANGELOG_AGENT.md\` |
| 修改了模块的职责或对外 API | 更新知识卡片 | \`<feature>/CONTEXT.md\` |
| 发现了反复出现的坑 | 更新 playbook 或 rules | \`src/_templates/playbooks/\` |
| 本次无需归档 | 无动作 | — |

## 判断原则

- 只归档**非显而易见**的知识（能从代码直接推断的不归档）
- 归档内容应对**未来的 AI 和开发者**有价值
- 宁可漏归档也不要过度归档，保持信噪比
`
}

function generateArchivistWorkflow() {
  return `# Memory Archivist — 归档执行工作流

当 archive-triggers 判断需要归档时，按以下流程执行。

## 归档类型

### Type A: ADR（架构决策记录）

1. 创建文件: \`memory/DECISIONS/YYYY-MM-DD-<slug>.md\`
2. 格式:
\`\`\`markdown
# <决策标题>

## 背景
<为什么需要做这个决策>

## 决策
<做了什么决策>

## 影响
<这个决策影响了什么>

## 替代方案
<考虑过但未采用的方案>
\`\`\`

### Type B: 变更日志

1. 在 \`memory/CHANGELOG_AGENT.md\` 顶部追加条目
2. 格式:
\`\`\`markdown
## YYYY-MM-DD — <变更摘要>
- **范围**: <影响的模块>
- **内容**: <具体变更>
- **原因**: <为什么这样改>
\`\`\`

### Type C: 模块知识卡片更新

1. 更新对应 feature 目录下的 \`CONTEXT.md\`
2. 只更新变化的部分，保持整体结构不变

## 执行原则

- 每次归档后输出一行摘要说明归档了什么
- 归档文件必须提交到仓库（不在 .gitignore 中）
- 归档内容应简洁，控制在 50 行以内
`
}

function generateTaskProfiles(a) {
  const profiles = []

  // Auto-generate profiles based on detected modules
  const featureNames = a.modules.filter(m => m.type === 'feature').map(m => m.name)

  if (a.framework === 'react' || a.framework === 'vue' || a.framework === 'angular') {
    profiles.push(`  ui-page:
    match_keywords: [页面, 列表, 表格, 表单, 详情, 看板, 弹窗, 抽屉]
    playbooks: []
    extra_checks:
      - 页面在目标路由下可正常访问
      - 加载态和空数据态已处理
      - 移动端/窄屏适配（如适用）`)

    profiles.push(`  data-crud:
    match_keywords: [新增, 编辑, 删除, 保存, 提交, 创建]
    playbooks: []
    extra_checks:
      - 接口调用参数正确
      - 成功/失败反馈到位
      - 操作后数据自动刷新`)

    profiles.push(`  component:
    match_keywords: [组件, 公共, 复用, 封装]
    playbooks: []
    extra_checks:
      - Props 类型完整
      - 有默认值处理
      - 影响分析已输出（谁在用这个组件）`)
  }

  if (a.hasPython || a.hasGo) {
    profiles.push(`  api-endpoint:
    match_keywords: [接口, API, endpoint, 路由, router]
    playbooks: []
    extra_checks:
      - 请求参数校验完整
      - 错误码和错误信息规范
      - 接口文档已更新`)

    profiles.push(`  data-model:
    match_keywords: [模型, model, schema, 数据库, 表, 字段]
    playbooks: []
    extra_checks:
      - 数据库迁移脚本已生成
      - 索引考虑
      - 向后兼容性`)
  }

  if (a.stacks.includes('fastapi') || a.stacks.includes('django') || a.stacks.includes('flask')) {
    profiles.push(`  python-service:
    match_keywords: [服务, service, 后端, backend, 逻辑]
    playbooks: []
    extra_checks:
      - 类型注解完整
      - 异常处理覆盖
      - 日志关键节点已添加`)
  }

  profiles.push(`  bug-fix:
    match_keywords: [修复, 修复, bug, fix, 报错, 异常, 问题]
    playbooks: []
    extra_checks:
      - 根因已定位并修复（非表面补丁）
      - 相关场景回归测试
      - 不引入新问题`)

  const moduleSummary = featureNames.length
    ? `\n# 检测到的 feature 模块: ${featureNames.join(', ')}`
    : ''

  return `# Task Profiles
# 任务类型自动匹配规则
#
# 使用方式：
# 1. SDD 生成阶段：AI 从 task 描述中提取关键词，匹配 profile
# 2. 匹配后：读取对应 playbook 文件作为领域知识注入
# 3. QA 阶段：在标准检查之外，额外逐项验证 extra_checks
# 4. 未匹配：仅走标准审查
${moduleSummary}

profiles:
${profiles.join('\n\n')}
`
}

function generateQualityGate(a) {
  const gates = []

  // Gate 1: Type checking
  if (a.stacks.includes('typescript')) {
    const cmd = a.framework === 'vue' ? 'npx vue-tsc --noEmit' : 'npx tsc --noEmit'
    gates.push(`### Gate 1: 类型检查

\`\`\`bash
${cmd}
\`\`\`

必须 0 error。warning 可暂时忽略。`)
  } else if (a.hasPython && a.qualityTools.includes('mypy')) {
    gates.push(`### Gate 1: 类型检查

\`\`\`bash
mypy <修改文件>
\`\`\`

必须 0 error。`)
  } else if (a.hasGo) {
    gates.push(`### Gate 1: 编译检查

\`\`\`bash
go build ./...
\`\`\`

必须编译通过。`)
  }

  // Gate 2: Linting
  if (a.qualityTools.includes('eslint')) {
    gates.push(`### Gate 2: 代码规范

\`\`\`bash
npx eslint <修改文件> --ext .ts,.tsx,.js,.jsx
\`\`\`

必须 0 error。`)
  }
  if (a.qualityTools.includes('ruff')) {
    gates.push(`### Gate 2: 代码规范（Python）

\`\`\`bash
ruff check <修改文件>
ruff format --check <修改文件>
\`\`\`

必须 0 error。`)
  }
  if (a.hasGo) {
    gates.push(`### Gate 2: 代码规范（Go）

\`\`\`bash
go vet ./...
\`\`\`

必须 0 error。`)
  }

  // Gate 3: Impact analysis
  gates.push(`### Gate 3: 影响分析

若修改了公共模块（components / utils / hooks / types / config 等），必须：

1. 列出所有引用方
2. 评估是否有破坏性变更
3. 在验证报告中注明影响范围`)

  // Gate 4: Visual verification
  if (a.framework === 'react' || a.framework === 'vue' || a.framework === 'angular' || a.framework === 'next' || a.framework === 'nuxt' || a.framework === 'svelte') {
    const devCmd = a.commands.dev || `${a.packageManager || 'npm'} run dev`
    gates.push(`### Gate 4: 视觉验证

若涉及 UI 变更：

1. 启动开发服务器 \`${devCmd}\`
2. 在浏览器中验证变更效果
3. 提醒用户确认 UI 符合预期`)
  }

  // Gate 5: Tests
  if (a.commands.test) {
    gates.push(`### Gate 5: 测试

\`\`\`bash
${a.commands.test}
\`\`\`

已有测试必须通过。新功能建议补充测试。`)
  }

  return `# Quality Gate — 实现后验证规则

每次编码完成后，按以下门禁逐项验证。全部通过才可提交。

## 修改范围分级

| 级别 | 范围 | 要求 |
|------|------|------|
| 高影响 | 公共模块（components/utils/hooks/types/config） | 全部 Gate + 影响分析 |
| 标准 | 业务模块（features/pages） | Gate 1-2 + Gate 4（如有 UI） |
| 低影响 | 配置/文档/样式微调 | Gate 1（如适用） |

## 验证门禁

${gates.join('\n\n')}

## 验证报告

每次验证后输出以下格式：

\`\`\`
## 验证报告
- Gate 1 (类型检查): ✅/❌
- Gate 2 (代码规范): ✅/❌
- Gate 3 (影响分析): ✅/N/A
- Gate 4 (视觉验证): ✅/N/A
- Gate 5 (测试): ✅/N/A
- 修改文件: <列表>
\`\`\`

## 禁止行为

- 跳过 Gate 1/2 直接提交
- 忽略编译或 lint 错误
- 修改公共模块但不输出影响分析
`
}

function generateMainPrompt(a) {
  const sections = []

  // Project intro
  sections.push(`# ${a.name} — 项目级稳定知识

> 本文件只记录长期稳定的项目共识，不记录具体迭代需求。
> 真相源优先级：代码与接口行为 > 本文件 > 本地辅助文档`)

  // Tech stack
  const stackList = [...new Set(a.stacks)].filter(Boolean)
  if (stackList.length) {
    const extras = [
      a.bundler && `- 构建工具: ${a.bundler}`,
      a.uiLib && `- UI 组件库: ${a.uiLib}`,
      a.routing && `- 路由: ${a.routing}`,
      a.packageManager && `- 包管理器: ${a.packageManager}`,
    ].filter(Boolean)

    sections.push(`## 技术栈

${[...stackList.map(s => `- ${s}`), ...extras].join('\n')}`)
  }

  // Directory structure
  const topDirs = a.modules.filter(m => !['feature', 'vibe-feature'].includes(m.type))
  const features = a.modules.filter(m => m.type === 'feature')
  const vibeFeatures = a.modules.filter(m => m.type === 'vibe-feature')

  const dirParts = [topDirs.map(m => `- \`${m.path}\`：${dirDescription(m)}`).join('\n')]
  if (features.length) dirParts.push(`\n### Feature 模块\n\n${features.map(m => `- \`${m.path}\``).join('\n')}`)
  if (vibeFeatures.length) dirParts.push(`\n### Vibe Feature 模块\n\n${vibeFeatures.map(m => `- \`${m.path}\``).join('\n')}`)

  sections.push(`## 核心目录职责

${dirParts.join('\n')}`)

  // Data fetching
  if (a.dataFetching) {
    sections.push(`## 数据请求约定

- 默认使用 \`${a.dataFetching}\` 进行数据请求
- API 返回应定义统一类型
- 重要接口类型应沉淀到 types 目录`)
  }

  // State management
  if (a.stateManagement) {
    sections.push(`## 状态管理约定

- 使用 ${a.stateManagement} 管理状态
- 全局状态限制在 app/config 层
- 模块内局部状态优先使用组件内 state`)
  } else if (a.framework === 'react') {
    sections.push(`## 状态管理约定

- 全局状态仅限 app/config 层定义
- 模块内局部状态优先使用 useState / useReducer
- 禁止在 feature 之间通过 Context 传递数据`)
  }

  // Coding conventions
  const conventions = []
  if (a.framework === 'react') {
    conventions.push('- 使用函数组件 + Hooks，不使用 class 组件')
    conventions.push('- 路径别名使用 `@` 指向 src')
  }
  if (a.framework === 'vue') {
    conventions.push('- 使用 Composition API（setup script）')
    conventions.push('- 路径别名使用 `@` 指向 src')
  }
  if (a.hasPython) {
    conventions.push('- Python 代码使用类型注解')
    conventions.push('- API 路由使用 Pydantic 模型进行参数校验')
  }
  if (a.qualityTools.includes('prettier')) conventions.push('- 代码格式化使用 Prettier')
  if (a.qualityTools.includes('eslint')) conventions.push('- 代码规范使用 ESLint')

  if (conventions.length) {
    sections.push(`## 编码约定

${conventions.join('\n')}`)
  }

  // Quality commands
  const cmds = []
  if (a.commands.typeCheck) cmds.push(`- 类型检查: \`${a.commands.typeCheck}\``)
  if (a.commands.lint) cmds.push(`- Lint: \`${a.commands.lint}\``)
  if (a.commands.test) cmds.push(`- 测试: \`${a.commands.test}\``)
  if (a.commands.build) cmds.push(`- 构建: \`${a.commands.build}\``)
  if (a.commands.dev) cmds.push(`- 开发: \`${a.commands.dev}\``)

  if (cmds.length) {
    sections.push(`## 常用命令

${cmds.join('\n')}`)
  }

  // Architecture principles
  sections.push(`## 关键架构原则

- 小步修改、局部收敛，避免为单个需求做无关的大范围重构
- 依赖方向单向流动，禁止反向依赖
- 能复用已有组件/工具时，不重复造轮子
- 当本文件与当前代码行为不一致时，以代码为准`)

  return sections.join('\n\n') + '\n'
}

function generateContextMd(mod, a) {
  return `# ${mod.name}

## 职责

<!-- 一句话描述该模块做什么 -->

## 对外 API（其他模块怎么用我）

组件：
- <!-- ComponentA — 用途 -->

工具函数：
- <!-- funcA(params) — 用途 -->

导出类型：
- <!-- TypeA { field1, field2 } -->

## 核心状态

- <!-- stateA: TypeA — 说明 -->

## 依赖

- <!-- @/features/xxx：用它做什么 -->

## 约束

- <!-- 约束1 -->
`
}

function generateClaudeMd(a) {
  const sections = []

  sections.push(`# CLAUDE.md

## 项目级稳定知识

开始任何任务前，阅读 \`${templatePath('prompt/main.md', true)}\` 获取项目架构、编码约定等核心知识。`)

  sections.push(`## SDD 开发规范

阅读 \`${templatePath('spec/sdd.md', true)}\` 获取 SDD 开发流程和模板。
所有编码任务必须先生成 SDD 并经用户确认，再进入实现阶段。`)

  sections.push(`## 质量门禁

阅读 \`${templatePath('rules/quality-gate.md', true)}\` 获取完整验证流程。

实现完成后必须执行：
${a.commands.typeCheck ? `1. \`${a.commands.typeCheck}\` — 类型检查必须 0 error` : '1. 编译检查 — 必须 0 error'}
${a.commands.lint ? `2. \`${a.commands.lint} <修改文件>\` — Lint 必须 0 error` : '2. 代码规范检查 — 必须 0 error'}
3. 若修改了公共模块：输出影响分析
4. 若涉及 UI 变更：提醒用户确认`)

  sections.push(`## QA 与评审

- QA 五维度检查清单: \`${templatePath('supervisor/checklist.md', true)}\`
- 知识归档规则: \`${templatePath('supervisor/knowledge-refinement.md', true)}\`
- 任务类型匹配: \`${templatePath('supervisor/task-profiles.yaml', true)}\``)

  sections.push(`## Harness 架构（AI Coding 约束体系）

### 模块知识卡片（修改前必读）

修改某个 feature 之前，先读取该模块的 \`CONTEXT.md\`。

### 领域范式（SDD 阶段注入）

任务涉及特定领域时，在生成 SDD 前读取 \`${templatePath('playbooks/', true)}\` 中的对应 playbook。

### 任务类型匹配（QA 阶段）

实现完成后，按 \`${templatePath('supervisor/task-profiles.yaml', true)}\` 匹配 profile，额外验证 extra_checks。

### 知识循环（归档判断）

任务完成后，按 \`${templatePath('supervisor/knowledge-refinement.md', true)}\` 判断是否需要归档。`)

  return sections.join('\n\n') + '\n'
}

function generateAgentsMd(a) {
  const sections = []

  sections.push(`# AGENTS.md

本文件由 harness 体系自动生成，请勿直接手改。`)

  // Inline main.md content
  const mainMdPath = templatePath('prompt/main.md')
  if (fs.existsSync(mainMdPath)) {
    sections.push(safeRead(mainMdPath))
  } else {
    sections.push(generateMainPrompt(a))
  }

  sections.push('---')

  // Inline SDD
  sections.push(generateSDD())

  sections.push('---')

  // Inline quality gate
  sections.push(generateQualityGate(a))

  sections.push('---')

  // Inline checklist
  sections.push(generateChecklist(a))

  sections.push(`---

## Harness 架构（AI Coding 约束体系）

### 模块知识卡片（修改前必读）

修改某个 feature 之前，先读取该模块的 \`CONTEXT.md\`。

### 领域范式（SDD 阶段注入）

任务涉及特定领域时，在生成 SDD 前读取对应 playbook（\`${templatePath('playbooks/', true)}\`）。

### 任务类型匹配（QA 阶段）

实现完成后，按 task-profiles.yaml 匹配 profile，额外验证 extra_checks。

### 知识循环（归档判断）

任务完成后，按 knowledge-refinement.md 判断是否需要归档。

## 维护原则

- 本文件只在系统边界、目录职责、统一约束发生明显变化时更新
- 日常需求迭代不要求更新本文件
- 当本文件与当前代码行为不一致时，以代码为准
`)

  return sections.join('\n\n') + '\n'
}

function generateCursorRules(a) {
  const mainPromptContent = generateMainPrompt(a)

  return `---
description: 项目级 AI 编码规范
alwaysApply: true
---

${mainPromptContent}

---

## Harness 架构（AI Coding 约束体系）

### 模块知识卡片（修改前必读）

修改某个 feature 之前，先读取该模块的 \`CONTEXT.md\`。

### UI 变更预览（编码前必须确认）

涉及 UI 变更时，在编码前用 ASCII 线框图描述变更后的结构，等用户确认。

### 领域范式（SDD 阶段注入）

任务涉及特定领域时，在生成 SDD 前读取对应 playbook。

### 任务类型匹配（QA 阶段）

实现完成后，按 task-profiles.yaml 匹配 profile，额外验证 extra_checks。

### QA 五维度检查（实现后必做）

代码实现完成后，按 \`${templatePath('supervisor/checklist.md', true)}\` 逐项检查。所有 Must 项必须通过。

### 实现后验证（必做）

${a.commands.typeCheck ? `1. \`${a.commands.typeCheck}\` — 0 error` : '1. 编译检查 — 0 error'}
${a.commands.lint ? `2. \`${a.commands.lint} <修改文件>\` — 0 error` : '2. 代码规范 — 0 error'}
3. 若修改了公共模块：输出影响分析
4. 若涉及 UI 变更：提醒用户确认

### 知识循环（归档判断）

任务完成后，按 knowledge-refinement.md 判断是否需要归档。
`
}

function generateQoderRules(a) {
  // Qoder uses similar format to Cursor but without frontmatter
  const mainPromptContent = generateMainPrompt(a)

  return `${mainPromptContent}

---

## Harness 架构（AI Coding 约束体系）

### 模块知识卡片（修改前必读）

修改某个 feature 之前，先读取该模块的 \`CONTEXT.md\`。

### 领域范式（SDD 阶段注入）

任务涉及特定领域时，在生成 SDD 前读取对应 playbook。

### 任务类型匹配（QA 阶段）

实现完成后，按 task-profiles.yaml 匹配 profile，额外验证 extra_checks。

### QA 五维度检查（实现后必做）

代码实现完成后，按 \`${templatePath('supervisor/checklist.md', true)}\` 逐项检查。所有 Must 项必须通过。

### 实现后验证（必做）

${a.commands.typeCheck ? `1. \`${a.commands.typeCheck}\` — 0 error` : '1. 编译检查 — 0 error'}
${a.commands.lint ? `2. \`${a.commands.lint} <修改文件>\` — 0 error` : '2. 代码规范 — 0 error'}
3. 若修改了公共模块：输出影响分析
4. 若涉及 UI 变更：提醒用户确认

### 知识循环（归档判断）

任务完成后，按 knowledge-refinement.md 判断是否需要归档。
`
}

function generateMemoryReadme() {
  return `# Memory — 仓库态知识

本目录存放 Level 2（仓库态）知识，由 AI 和开发者共同维护。

## 目录结构

\`\`\`
memory/
├── README.md              # 本文件
├── CHANGELOG_AGENT.md     # AI 辅助的结构化变更摘要
└── DECISIONS/             # ADR（架构决策记录）
    └── YYYY-MM-DD-<slug>.md
\`\`\`

## 使用约定

- **CHANGELOG_AGENT.md**：每次有意义的功能完成后追加条目
- **DECISIONS/**：架构级决策（技术选型、方案取舍等）写入 ADR
- 内容应简洁、聚焦，控制在 50 行以内
- 过时内容在 release review 时清理

## 归档触发

参见 \`src/_templates/supervisor/archive-triggers.md\`
`
}

function generatePrepareScript(a) {
  const typeCheckCmd = a.commands.typeCheck || ''
  const lintExt = a.stacks.includes('typescript') ? '.ts,.tsx' : '.js,.jsx'

  return `#!/usr/bin/env node

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
const TEMPLATES = path.join(ROOT, '${a.srcDir || 'src'}/_templates')

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
    '# AGENTS.md\\n\\n本文件由 prepare-harness.mjs 自动生成，请勿直接手改。',
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
        parts.push(readTemplate(\`playbooks/\${pb}\`))
        parts.push('---')
      }
    }
  }

  parts.push(\`
## Harness 架构（AI Coding 约束体系）

### 模块知识卡片（修改前必读）
修改某个 feature 之前，先读取该模块的 CONTEXT.md。

### 领域范式（SDD 阶段注入）
任务涉及特定领域时，在生成 SDD 前读取对应 playbook。

### 知识循环（归档判断）
任务完成后，按 knowledge-refinement.md 判断是否需要归档。
\`)

  return parts.filter(Boolean).join('\\n\\n')
}

// ─── 组装 CLAUDE.md（引用式） ───

function buildClaudeMd() {
  return \`# CLAUDE.md

## 项目级稳定知识
开始任何任务前，阅读 \\\`${a.srcDir || 'src'}/_templates/prompt/main.md\\\` 获取核心知识。

## SDD 开发规范
阅读 \\\`${a.srcDir || 'src'}/_templates/spec/sdd.md\\\` 获取 SDD 流程。
所有编码任务必须先生成 SDD 并经用户确认。

## 质量门禁
阅读 \\\`${a.srcDir || 'src'}/_templates/rules/quality-gate.md\\\` 获取验证流程。

## QA 与评审
- QA 检查清单: \\\`${a.srcDir || 'src'}/_templates/supervisor/checklist.md\\\`
- 知识归档规则: \\\`${a.srcDir || 'src'}/_templates/supervisor/knowledge-refinement.md\\\`
- 任务类型匹配: \\\`${a.srcDir || 'src'}/_templates/supervisor/task-profiles.yaml\\\`

## Harness 架构
### 模块知识卡片（修改前必读）
修改某个 feature 之前，先读取该模块的 CONTEXT.md。
### 领域范式（SDD 阶段注入）
任务涉及特定领域时，读取 \\\`${a.srcDir || 'src'}/_templates/playbooks/\\\` 中的对应 playbook。
### 知识循环（归档判断）
任务完成后，按 knowledge-refinement.md 判断是否需要归档。
\`
}

// ─── 同步规则到各 IDE ───

function syncRules() {
  const qualityGate = readTemplate('rules/quality-gate.md')
  if (qualityGate) {
    // Claude Code rules
    writeFile(p('.claude/rules/quality-gate.md'), qualityGate)

    // Cursor rules
    writeFile(p('.cursor/rules/quality-gate.mdc'), \`---
description: 质量门禁规则
alwaysApply: true
---

\${qualityGate}\`)

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
`
}

// ═══════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════

function p(...segs) { return path.join(ROOT, ...segs) }
function rel(absPath) { return path.relative(ROOT, absPath) }
function safeRead(filePath) { try { return fs.readFileSync(filePath, 'utf-8') } catch { return '' } }
function readJson(relPath) { try { return JSON.parse(safeRead(p(relPath))) } catch { return null } }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }) }

function templatePath(relPath, relative = false) {
  const srcDir = 'src'  // could be parameterized
  const full = path.join(ROOT, srcDir, '_templates', relPath)
  return relative ? path.join(srcDir, '_templates', relPath) : full
}

function dirDescription(mod) {
  const descriptions = {
    component: '跨模块复用的公共组件',
    page: '路由注册与页面结构',
    hook: '自定义 Hooks',
    util: '工具函数库',
    api: 'API 接口层',
    store: '状态管理',
    type: '全局类型定义',
    config: '全局配置（环境、用户、主题等）',
    style: '全局样式',
    app: '应用入口与全局 Provider',
    server: '后端服务',
    database: '数据库模型与连接',
    agent: 'AI Agent 模块',
    internal: '内部包',
    cmd: '命令行入口',
    pkg: '公共库',
  }
  return descriptions[mod.type] || mod.type
}

// ═══════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════

console.log('')
console.log('╔═════════════════════════════════════════════════╗')
console.log('║  harness-init.mjs — AI Coding Harness 初始化   ║')
console.log('╚═════════════════════════════════════════════════╝')
console.log('')

const analysis = analyze()

if (DRY_RUN) {
  info('--dry-run 模式，分析完成，未生成任何文件')
  process.exit(0)
}

generate(analysis)
integrate(analysis)
