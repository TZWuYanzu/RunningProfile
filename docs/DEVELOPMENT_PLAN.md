# AI 教练 + 训练日历 · 开发规划

## Context

基于 `PRODUCT_SPEC.md` v1.1，实现 AI 教练（Phase 1）和训练日历（Phase 2）功能。

**现状**：项目是一个纯静态站点生成器（Python 同步数据 → SQLite → JSON → React 渲染），没有后端 API 服务器，没有移动端。FIT 文件解析只提取了基础字段（距离/时间/均心率/配速），**缺失海拔 D+/D-、心率区间分布、最大心率、步频、功率、分圈数据、GAP 等 AI 教练必需的数据**。

**策略**：后端 + API 先行，用 curl/Postman 验证，教练优先日历跟上。

---

## Milestone 0 · 数据基础（第 1 周）

> 目标：让 data.db 里有足够丰富的活动数据，供 AI 教练使用。

### 0.1 扩展 FIT 文件解析器

**文件**：`run_page/gpxtrackposter/track.py` → `_load_fit_data()` 方法

当前只从 `session_mesgs[0]` 读取 7 个字段，需要扩展到读取以下字段：

```
Session 级（直接读取）:
  total_ascent, total_descent, max_heart_rate,
  avg_running_cadence, avg_power, total_calories,
  avg_temperature, time_in_hr_zone (array)

Record 级（逐条遍历，当前只读 lat/lng）:
  heart_rate, enhanced_altitude, enhanced_speed,
  cadence, power, grade

Lap 级（当前完全未访问 lap_mesgs）:
  每圈的 distance, total_timer_time, avg_heart_rate,
  avg_speed, total_ascent, total_descent
```

### 0.2 扩展 Track 类和数据库 Schema

**文件**：`run_page/gpxtrackposter/track.py` → Track 类新增属性
**文件**：`run_page/generator/db.py` → Activity 表新增列

```
新增列：
  elevation_gain      Float   -- D+ 总爬升(m)
  elevation_loss      Float   -- D- 总下降(m)
  max_heartrate       Float   -- 最大心率
  avg_cadence         Float   -- 平均步频
  avg_power           Float   -- 平均功率
  calories            Float   -- 卡路里
  avg_temperature     Float   -- 平均温度
  hr_zone_time        String  -- JSON: [z1_sec, z2_sec, z3_sec, z4_sec, z5_sec]
  laps                String  -- JSON: [{distance, time, avg_hr, avg_pace, ascent, descent}, ...]
  location_name       String  -- 地名（反向地理编码，非坐标）
```

利用现有 `add_missing_columns()` 机制（db.py:151），新增列会自动 ALTER TABLE，不破坏已有数据。

### 0.3 同步生成 data.db

运行 COROS 同步，用 FIT_OUT/ 已有的 202 个 FIT 文件生成 data.db：
```bash
cd run_page && python coros_sync.py
```

### 0.4 创建 server/ 目录骨架

```
server/
├── main.py              ← FastAPI 入口 + CORS + 路由挂载
├── config.py            ← 环境变量配置（DB_PATH, API_KEYS, etc.）
├── requirements.txt     ← FastAPI, uvicorn, openai/httpx, etc.
├── db/
│   ├── engine.py        ← SQLAlchemy 引擎初始化 + WAL 模式
│   ├── models.py        ← 所有表模型（复用 Activity + 新增记忆表）
│   └── repositories.py  ← Repository 接口 + SQLite 实现
├── routers/
│   ├── coach.py         ← /api/coach/* 教练对话相关
│   ├── activities.py    ← /api/activities/* 活动数据查询
│   ├── calendar.py      ← /api/calendar/* 训练计划日历
│   └── auth.py          ← /api/auth/* 认证（Phase 1 简化）
├── agent/
│   ├── router.py        ← Model Router（三层路由）
│   ├── prompts.py       ← System prompt 四层架构
│   └── tools.py         ← Function calling 工具定义
├── memory/
│   ├── profile.py       ← 学员档案 CRUD
│   ├── notes.py         ← 训练观察
│   ├── timeline.py      ← 对话时间线
│   └── consolidation.py ← 记忆固化（staging 机制）
└── eval/
    ├── trail.py         ← 越野模式 6 维评估
    └── road.py          ← 公路模式 6 维评估
```

---

## Milestone 1 · 服务器基础设施（第 1-2 周）

> 目标：FastAPI 跑起来，数据库可读写，基本 API 可用。

### 1.1 FastAPI 项目初始化

- `server/main.py`：FastAPI app + CORS 中间件 + 路由挂载
- `server/config.py`：通过 `pydantic-settings` 管理配置
- `server/requirements.txt`：`fastapi`, `uvicorn[standard]`, `sqlalchemy`, `httpx`, `openai`（用于 DeepSeek 兼容接口）, `pydantic`, `pydantic-settings`

### 1.2 数据库层

- **`server/db/models.py`**：定义所有 SQLAlchemy 模型
  - 复用现有 `Activity` 模型（从 `run_page/generator/db.py` 迁移并扩展）
  - 新增：`athlete_profile`, `training_notes`, `dialogue_timeline`, `profile_staging`（按 PRODUCT_SPEC 7.7 节定义）
  - 新增：`training_plans`（日历功能需要）

- **`server/db/repositories.py`**：Repository 接口（Protocol）
  - `ActivityRepository`：活动记录查询（按日期/地点/类型/爬升筛选）
  - `ProfileRepository`：学员档案 CRUD
  - `TrainingNotesRepository`：教练点评 CRUD
  - `DialogueRepository`：对话时间线 append + 查询
  - `StagingRepository`：staging 区 CRUD
  - `PlanRepository`：训练计划 CRUD
  - 全部提供 SQLite 实现类

### 1.3 活动数据 API

- `GET /api/activities` — 活动列表（分页、筛选）
- `GET /api/activities/{id}` — 单条活动详情（含分圈数据）
- `GET /api/activities/summary` — 汇总统计（周/月跑量、D+ 累计等）
- `POST /api/sync/trigger` — 手动触发数据同步

### 1.4 认证（Phase 1 简化）

Phase 1 是个人使用，不走完整 OAuth 流程。使用固定 `user_id` + API Key 认证：
- 请求头 `Authorization: Bearer <API_KEY>`
- `API_KEY` 在 `server/.env` 中配置
- 所有记忆读写绑定 `user_id`，数据模型保持多用户兼容

### 验证点
```bash
# 启动服务
cd server && uvicorn main:app --reload
# 测试活动 API
curl http://localhost:8000/api/activities?limit=5
curl http://localhost:8000/api/activities/summary
```

---

## Milestone 2 · AI 教练核心（第 2-4 周）

> 目标：能和教练对话，教练能读历史数据、做能力评估、记住对话内容。

### 2.1 Model Router

**文件**：`server/agent/router.py`

```python
class ModelRouter:
    # 规则引擎路由，不用 LLM 判断
    # Tier 1 (DeepSeek V3): 日常对话
    # Tier 2 (DeepSeek R1): 训练分析、能力评估、计划生成
    # Tier 3 (Qwen-Max): 比赛策略（Phase 3）
    # 使用 OpenAI 兼容 SDK（DeepSeek 和 Qwen 都支持）
```

### 2.2 System Prompt 设计

**文件**：`server/agent/prompts.py`

四层结构，所有 Tier 共用 Layer 1+2：
- **Layer 1 · 教练人设**：理性数据型，冷静专业，用数据说话，不空洞鼓励，建议者非命令者
- **Layer 2 · 学员档案**：动态注入当前用户的 athlete_profile 数据
- **Layer 3 · 场景指令**：按 Tier 切换回答深度要求
- **Layer 4 · Few-shot 示例**：2-3 个示例对话，统一不同模型的输出风格

含专项 prompt 模块：
- 主观 vs 客观数据冲突追问（PRODUCT_SPEC 3.5 节）
- 72h 间隔破冰开场（PRODUCT_SPEC 3.3 节）

### 2.3 Tool Calling 定义

**文件**：`server/agent/tools.py`

| 工具 | 实现 | 本 Milestone 交付 |
|------|------|------------------|
| `evaluate_ability(mode)` | 调用 `eval/trail.py` 或 `eval/road.py` | ✅ |
| `search_history(query)` | SQL 结构化检索 | ✅ |
| `get_profile()` | 读取 athlete_profile | ✅ |
| `get_recent_activities(n)` | 最近 n 条活动摘要 | ✅ |
| `update_plan(changes)` | 修改训练计划 | Milestone 4 |
| `generate_race_strategy()` | 比赛策略 | Phase 3 |

### 2.4 能力评估引擎

**文件**：`server/eval/trail.py`, `server/eval/road.py`

从 `data.db` 活动数据计算 6 维评分（0-100），每个维度包含：
- 计算逻辑（SQL 聚合 + Python 统计）
- 文字解读模板（教练能说出来的话）
- 趋势判断（近 4 周 vs 历史）

越野模式：有氧基础 / 爬升能力 / 下降能力 / 越野效率 / 长时续航 / 负荷风险
公路模式：有氧基础 / 配速稳定性 / 耐力天花板 / 恢复能力 / 竞技状态 / 负荷风险

### 2.5 SSE 流式对话端点

**文件**：`server/routers/coach.py`

```
POST /api/coach/chat
  Body: { "message": "...", "user_id": "..." }
  Response: SSE stream (text/event-stream)
  
  每个 SSE event:
    data: {"type": "token", "content": "你"}
    data: {"type": "token", "content": "最近"}
    ...
    data: {"type": "tool_call", "name": "evaluate_ability", "args": {...}}
    data: {"type": "tool_result", "content": {...}}
    ...
    data: {"type": "done", "message_id": 42}
```

**流程**：
1. 接收用户消息 → 写入 dialogue_timeline
2. 组装上下文：system prompt + 学员档案 + 近期对话（2-4 周）
3. Model Router 选择模型
4. 调用 LLM（streaming），处理 tool_call → 执行 → 回传
5. 教练回复写入 dialogue_timeline
6. 异步触发记忆固化

### 2.6 记忆系统

- **学员档案**（`server/memory/profile.py`）：初始化为空，Onboarding 后填充
- **训练观察**（`server/memory/notes.py`）：每次活动同步后，AI 自动生成点评（batch job）
- **对话时间线**（`server/memory/timeline.py`）：append-only，查询近期 N 条
- **记忆固化**（`server/memory/consolidation.py`）：对话结束后异步 LLM 调用 → staging → apply

### 2.7 Onboarding 流程

首次打开教练 Tab（`athlete_profile` 为空时）：
1. 系统自动读取全部历史活动，执行双专项评估
2. 教练发出破冰消息：基于评估结果的能力画像 + 针对性问询
3. 用户回答后，记忆固化写入档案

### 2.8 历史检索（SimpleRetriever）

**文件**：`server/agent/tools.py` 中 `search_history` 的实现

Phase 1 纯 SQL 方案：LLM 从自然语言提取结构化过滤条件 → SQL 查询活动 + 教练点评 + 归档摘要 → 返回 Top-K 结果。

### 验证点
```bash
# 测试对话 SSE 流
curl -N -X POST http://localhost:8000/api/coach/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "我现在什么水平？", "user_id": "default"}'

# 测试 Onboarding
curl -X POST http://localhost:8000/api/coach/onboarding \
  -H "Content-Type: application/json" \
  -d '{"user_id": "default"}'

# 测试记忆固化
curl http://localhost:8000/api/memory/profile/default
curl http://localhost:8000/api/memory/staging/default
```

---

## Milestone 3 · 教练打磨（第 4-5 周）

> 目标：教练体验从"能用"到"好用"。

### 3.1 对话归档

- 超过 4 周或 200 条的对话 → 触发摘要压缩
- 摘要 LLM 提取关键信息 → 写入 `archived_summary` 字段
- 原始对话标记 `is_archived = 1`，不再进入 LLM 上下文
- `GET /api/coach/history` 支持翻看归档对话（用户可读，教练不读）

### 3.2 破冰机制

- `GET /api/coach/greeting` — 检查最后对话时间，超过 72h 返回教练破冰消息
- 破冰消息基于：上次对话摘要 + 期间新同步的活动数据
- 需要在 system prompt 中加入"间隔破冰"场景指令

### 3.3 训练观察自动生成

- 数据同步完成后，对新增活动批量生成教练点评
- `POST /api/sync/trigger` → 同步数据 → 对新活动调用 LLM 生成 training_notes
- 点评写入 `training_notes` 表，带标签（如 `["爬升", "配速控制", "恢复"]`）

### 3.4 主观 vs 客观冲突处理

在 system prompt 中加入专项指令，当检测到用户主观反馈与数据矛盾时：
- 不直接裁判
- 追问区分身体 vs 心理
- 根据回答调整建议

### 验证点
```bash
# 多轮对话后检查记忆固化
curl http://localhost:8000/api/memory/profile/default
# 检查训练观察
curl http://localhost:8000/api/memory/notes/default?limit=5
# 测试破冰
curl http://localhost:8000/api/coach/greeting?user_id=default
```

---

## Milestone 4 · 训练日历（第 5-7 周）

> 目标：教练能生成训练计划，用户在日历上查看，系统自动对比执行。

### 4.1 训练计划数据模型

```sql
CREATE TABLE training_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    plan_date TEXT NOT NULL,          -- YYYY-MM-DD
    plan_type TEXT,                   -- 'easy_run' | 'interval' | 'long_run' | 'rest' | 'trail' | ...
    title TEXT,                       -- "轻松跑 8km"
    description TEXT,                 -- 详细说明
    target_distance_km REAL,
    target_duration_min REAL,
    target_elevation_m REAL,          -- 越野：目标 D+
    target_hr_zone TEXT,              -- "Z2" 或 "Z3-Z4"
    target_pace TEXT,                 -- "5'30-5'50/km"
    intensity TEXT,                   -- 'easy' | 'moderate' | 'hard'
    actual_activity_id INTEGER,       -- 关联实际完成的活动 run_id（NULL=未完成）
    completion_status TEXT,           -- 'pending' | 'completed' | 'partial' | 'skipped' | 'rest_day'
    coach_feedback TEXT,              -- 教练对执行情况的简短点评
    source TEXT,                      -- 'ai_generated' | 'user_created' | 'ai_adjusted'
    created_at TEXT,
    updated_at TEXT
);
```

### 4.2 日历 API

- `GET /api/calendar?month=2026-06` — 获取月视图计划列表
- `GET /api/calendar/{date}` — 获取某日计划详情
- `POST /api/calendar/generate` — AI 生成训练周期（参数：目标赛事、周期长度、当前能力评分）
- `PUT /api/calendar/{plan_id}` — 修改计划（用户手动或教练通过 tool calling）
- `POST /api/calendar/compare` — 触发当日计划 vs 实际对比

### 4.3 计划生成（Tool Calling 集成）

在教练 tools 中新增 `update_plan(changes)`：
- 用户对教练说"帮我排下周的训练计划" → 教练调用 tool 生成 7 天计划
- 用户说"周三改成休息" → 教练调用 tool 修改特定日期

计划生成 LLM 调用使用 Tier 2 模型（DeepSeek R1），输入：
- 学员档案（能力评分 + 目标赛事 + 伤病史）
- 近期训练负荷统计
- 目标赛事倒计时
- 训练周期阶段

### 4.4 计划 vs 实际自动对比

每日同步后（或手动触发），系统自动：
1. 查找当日 `training_plans` 记录
2. 匹配当日新同步的活动记录（按日期 + 类型）
3. 计算偏差（距离差 / 配速差 / 心率差）
4. 写入 `completion_status` 和 `coach_feedback`
5. 差异数据存入 `training_notes`，供教练后续对话引用

### 4.5 周训练总结

每周日晚或周一早上，后台自动触发 LLM 生成周总结：
- 本周计划 vs 实际完成率
- 训练负荷趋势
- 关键改善/退步点
- 下周建议调整
- 写入 dialogue_timeline（教练主动发起消息）

### 验证点
```bash
# 生成训练计划
curl -X POST http://localhost:8000/api/calendar/generate \
  -H "Content-Type: application/json" \
  -d '{"user_id": "default", "weeks": 4, "goal": "越野 50km 备赛"}'

# 查看月日历
curl http://localhost:8000/api/calendar?month=2026-07&user_id=default

# 通过对话调整计划
curl -N -X POST http://localhost:8000/api/coach/chat \
  -d '{"message": "这周三我有事，能改成休息日吗？", "user_id": "default"}'

# 检查计划执行对比
curl -X POST http://localhost:8000/api/calendar/compare \
  -d '{"user_id": "default", "date": "2026-07-01"}'
```

---

## Milestone 5 · 运动详情与分享卡片（第 7-8 周）

> 目标：用户可查看运动历史详情，并生成精美的分享图片。
> 来源：小程序竞品调研（MINIPROGRAM_RESEARCH.md §5.7）—— 用户强调此功能非常重要。

### 5.1 运动详情页 API

- `GET /api/activities/{id}/detail` — 完整运动详情（含轨迹点、分圈数据、心率/配速/海拔曲线数据）
- 返回前端渲染所需的全部结构化数据

### 5.2 分享卡片生成

**参考产品**：Strava 的活动分享图、digrun 的跑步海报

**实现方案**：
- `GET /api/activities/{id}/share-card` — 服务端生成分享图片（PNG）
- 卡片内容包含：
  - 运动轨迹地图（静态地图截图）
  - 核心数据：距离、时间、配速、爬升、心率
  - 分圈配速图/海拔剖面（精简版）
  - 用户昵称 + 日期
  - 产品 logo + 二维码（引流）
- 技术选型：Pillow（Python 图片合成）或 html2image（HTML 模板 → 截图）
- 支持多套模板/风格切换（至少 2 套：公路风 / 越野风）

### 5.3 成绩档案

**参考产品**：RQRun 的跑者成绩档案

- `GET /api/activities/race-history` — 汇总所有标记为"比赛"的活动
  - 按赛事分类（5K/10K/半马/全马/越野按距离分段）
  - 每个距离的 PB 高亮
  - 趋势分析数据（同距离跨时间的成绩变化）
- 教练可通过 tool calling 调用，在对话中引用："你上半年跑了 3 个半马，PB 从 1:52 提升到 1:45"

### 5.4 月度/年度训练报告卡片

- `GET /api/activities/report?period=2026-06` — 月度训练汇总
  - 总跑量/总爬升/训练天数/最长距离
  - 配速趋势/心率趋势
  - AI 教练一句话点评
- 可生成为分享图片（同 §5.2 机制），用于朋友圈晒图

---

## Milestone 6 · 集成验证（第 8-9 周）

> 目标：全链路跑通，为前端开发做好准备。

### 6.1 端到端测试脚本

编写 Python 测试脚本模拟完整用户旅程：
1. 数据同步 → data.db 生成
2. Onboarding → 教练初评 → 学员档案建立
3. 多轮对话 → 记忆固化 → 档案更新验证
4. 训练计划生成 → 日历查询
5. 模拟新数据同步 → 计划执行对比
6. 72h 后破冰消息
7. 对话归档触发

### 6.2 API 文档

FastAPI 自带 Swagger UI（`/docs`），确保所有 endpoint 有清晰的：
- 请求/响应 schema
- 示例值
- 错误码说明

### 6.3 性能基准

- 对话首 token 延迟 < 2s
- 能力评估 Tool 执行 < 3s
- 活动列表查询 < 200ms
- 记忆固化异步完成 < 10s

---

## 当前进度与 TODO

**状态截至 2026-06-09：**

| Milestone | 状态 | 说明 |
|-----------|------|------|
| M0 数据基础 | ✅ 完成 | FIT 解析扩展、DB Schema 扩展、server 骨架 |
| M1 服务器基础设施 | ✅ 完成 | FastAPI + DB + 活动 API + 认证 |
| M2 AI 教练核心 | ✅ 完成 | 对话/评估/记忆/Tool Calling |
| M3 教练打磨 | ✅ 完成 | 归档/破冰/训练观察/冲突处理 |
| M4 训练日历 | ✅ 完成 | 计划引擎 + 执行匹配 + 日历 API |
| M5 运动详情与分享卡片 | ⏳ 待做 | 下一优先级 |
| M6 集成验证 | ⏳ 待做 | M5 完成后进行 |

### TODO 清单

**P0 — 高优先级：**
- [ ] M5.2 分享卡片生成（参考 Strava/digrun，支持公路/越野双风格模板）
- [ ] M5.3 成绩档案 API（赛事分类、PB 高亮、趋势分析）
- [ ] FastAPI 完整启动验证（安装依赖 `pip install -r server/requirements.txt` 后确认 `uvicorn main:app` 正常）
- [ ] 以 ITRA Performance Index 作为核心能力评估标准（替代自创评分）

**P1 — 正常优先级：**
- [ ] M5.1 运动详情页 API（轨迹点、曲线数据）
- [ ] M5.4 月度/年度训练报告卡片
- [ ] M6.1 端到端测试脚本
- [ ] 教练 prompt 注入本周计划概要（active plan 时自动注入 context）

**P2 — 保留项：**
- [ ] 实时赛事追踪功能
- [ ] 自创运动评价体系（暂用 ITRA 标准）
- [ ] 小程序轻量入口（Web App 为主体）

---

## 关键技术决策总结

| 决策 | 选择 | 理由 |
|------|------|------|
| 数据库 | SQLite + Repository 抽象 | 单用户足够，接口预留迁移能力 |
| LLM SDK | OpenAI 兼容客户端 | DeepSeek/Qwen 都支持 OpenAI 格式 |
| 流式传输 | SSE（FastAPI StreamingResponse） | 比 WebSocket 简单，自带重连 |
| 认证 | Phase 1 简化为 API Key | 个人使用，不增加复杂度 |
| FIT 解析 | 扩展现有 track.py | 复用已有基础设施 |
| 数据库访问 | 复用 `run_page/data.db` 路径 | server/ 直接读取同一份 data.db |

## 文件修改清单

| 操作 | 文件 |
|------|------|
| **修改** | `run_page/gpxtrackposter/track.py` — 扩展 FIT 解析字段 |
| **修改** | `run_page/generator/db.py` — Activity 表新增列 |
| **修改** | `run_page/generator/__init__.py` — 传递新字段到 DB |
| **新建** | `server/` 整个目录（约 15 个文件） |
| **新建** | `server/requirements.txt` |
