# yihong.run — 项目级稳定知识

> 本文件只记录长期稳定的项目共识，不记录具体迭代需求。
> 真相源优先级：代码与接口行为 > 本文件 > 本地辅助文档

## 技术栈

- react
- typescript
- python
- 构建工具: vite
- 路由: react-router
- 包管理器: pnpm

## 核心目录职责

- `src/components`：跨模块复用的公共组件
- `src/pages`：路由注册与页面结构
- `src/hooks`：自定义 Hooks
- `src/utils`：工具函数库
- `src/api`：API 接口层
- `src/types`：全局类型定义
- `src/styles`：全局样式
- `server`：后端服务
- `server/routers`：API 接口层
- `server/db`：数据库模型与连接
- `server/agent`：AI Agent 模块

## 数据请求约定

- 默认使用 `fetch` 进行数据请求
- API 返回应定义统一类型
- 重要接口类型应沉淀到 types 目录

## 状态管理约定

- 全局状态仅限 app/config 层定义
- 模块内局部状态优先使用 useState / useReducer
- 禁止在 feature 之间通过 Context 传递数据

## 编码约定

- 使用函数组件 + Hooks，不使用 class 组件
- 路径别名使用 `@` 指向 src
- Python 代码使用类型注解
- API 路由使用 Pydantic 模型进行参数校验
- 代码格式化使用 Prettier
- 代码规范使用 ESLint

## 常用命令

- 类型检查: `npx tsc --noEmit`
- Lint: `pnpm run lint`
- 构建: `pnpm run build`

## 关键架构原则

- 小步修改、局部收敛，避免为单个需求做无关的大范围重构
- 依赖方向单向流动，禁止反向依赖
- 能复用已有组件/工具时，不重复造轮子
- 当本文件与当前代码行为不一致时，以代码为准
