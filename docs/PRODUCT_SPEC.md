# AI 私教跑步 App · 产品规格文档

> 本文档沉淀自产品设计对话，是后续开发的指导性文件。
> 最后更新：2026-06-08（v1.1：专家评审补充）

---

## 目录

1. [产品定位](#1-产品定位)
2. [核心设计原则](#2-核心设计原则)
3. [功能规格](#3-功能规格)
4. [AI 教练设计](#4-ai-教练设计)
5. [能力评估框架](#5-能力评估框架)
6. [数据与隐私](#6-数据与隐私)
7. [技术架构](#7-技术架构)
8. [开发路线图](#8-开发路线图)
9. [竞品差异化](#9-竞品差异化)
10. [商业化方案](#10-商业化方案)
11. [待决策事项](#11-待决策事项)

---

## 1. 产品定位

### 一句话定义

> **一个读懂我历史数据、像真人一样持续认知我、用数据帮我训练的 AI 越野跑私教——同时在马拉松上同样专业。**

### 核心专项

- **越野跑为主**：深度专项，理解 D+/D-、GAP、地形难度、ITRA 积分体系
- **马拉松并重**：基于 Jack Daniels VDOT 体系，公路训练同等专业
- 两个专项的训练底层互补（有氧基础共用，专项指标分轨）

### 与现有产品的本质区别

| 维度 | 现有产品（高驰/佳明/Strava） | 本产品 |
|---|---|---|
| 核心功能 | 记录我跑了什么 | 告诉我该怎么跑 |
| 计划性质 | 静态，人工制定 | 动态，AI 对话调整 |
| 对话能力 | 无或极弱 | 核心功能，有持续记忆 |
| 越野专项 | 附带支持 | 深度专项 |
| ITRA 体系 | 无 | 支持表现分预测与策略制定 |

---

## 2. 核心设计原则

### 原则一：反 Session 的「持续认知」架构

**不做的事**：像千问/元宝/豆包一样，每次对话都是独立 session，靠历史记录假装记得用户。

**要做的事**：AI 教练与用户是持续演进的师生关系。教练对用户的认知随每次训练和对话累积增长，对话界面是一条连续的时间线，没有「新建对话」入口。

> 工程实现参考：MemGPT / mem0 的长短期记忆分层范式，结合「记忆固化」机制。

### 原则二：每句评估背后都要有数据支撑

教练的评估和建议不是空话，每一句都对应可从 `data.db` 中计算出的真实指标。这是区别于泛化 AI 产品的关键。

### 原则三：用户保有最终决策权

教练给建议，用户可以接受、协商、或直接跳过。教练记录用户的选择和原因，不强制执行。教练不是命令者，是顾问。

### 原则四：越野跑的训练逻辑与公路跑不同

- 越野跑以**时间和 D+ 爬升量**衡量训练负荷，而非距离
- 配速因地形而变，**GAP（坡度调整配速）** 才是跨地形的比较基准
- 越野选手训练前研读策略，比赛中靠努力感执行，不完全依赖设备实时提示

---

## 3. 功能规格

### 3.1 App 导航结构（移动端 5-Tab）

```
Tab 1 · 概览    数据 Dashboard：跑量趋势、体能状态、近期表现
Tab 2 · 历史    训练记录列表：地图轨迹、详细数据
Tab 3 · 教练    ★ 核心入口：AI 对话、持续记忆、连续时间线
Tab 4 · 计划    训练日历：日期上显示简要计划，点击展开详情
Tab 5 · 我的    设备、账号、目标设定
```

Tab 3（教练）在视觉上作为中心主 Tab，视觉权重最高。

### 3.2 数据同步策略

- **自动同步**：每日一次，同步 COROS/设备数据至 `data.db`
- **手动同步**：用户在「历史」Tab 下拉时触发
- **教练感知范围**：教练能感知昨日及以前的数据（当日数据同步后方可获取）

### 3.3 对话间隔处理（连续时间线的破冰机制）

连续时间线对高频用户是优势，对一周跑 2-3 次的用户，间隔数天后看到长时间线可能产生压力。

**触发规则**：超过 **72 小时** 未与教练对话时，用户下次打开教练 Tab，**由教练主动发出第一句话**：

```
"上次我们聊到你最近爬升训练的配速控制问题，
 这两天你有出去跑了吗？"
```

这模拟了真人教练的自然行为——间隔几天后不是沉默等待，而是主动续上上次的话题。

### 3.4 计划执行闭环

1. 每日同步后，系统自动对比「当日计划 vs 实际活动记录」
2. 当天有计划时，弹轻量确认提示：「今天计划了 10km 轻松跑，完成了吗？」
3. 差异数据写入训练观察，供教练在后续对话中参考

### 3.5 主观感受 vs 客观数据冲突处理

当用户反馈（如「今天很累」）与客观数据（如恢复评分高）冲突时：

- 教练**不直接裁判**，而是追问：「你说的累是身体上感觉重，还是心理上不想跑？」
- 根据用户回答分辨原因后，再给出调整建议
- 这是体现「真人教练感」的核心交互场景，需在 system prompt 中专门设计

### 3.6 比赛策略功能（Phase 3）

**输入（用户提供）**
- 赛道 GPX 文件（必填）
- 目标 ITRA 表现分（必填）
- 天气情况（选填）
- 路况说明（选填）

**核心计算**
```
目标 ITRA 分
    ↓
km-effort = 距离(km) + D+(m) / 100        ← 公开公式
历史同难度赛事表现数据（爬虫积累）
    ↓  统计模型
目标完赛时间
    ↓  GAP 坡度调整 + 体能分配模型
分段配速策略
    ↓  AI 解释层
结构化文字策略报告
```

**输出格式（示例）**
```
第 1 段：起点 → 石门垭口（8km，D+ 620m）
配速参考：7'30"–8'00"/km（GAP 等效 5'50"）
注意事项：前 3km 人多，压住出发冲动，控心率 ≤ 155
体力分配：全程最高坡度集中区，留足 70% 余量进入第 2 段
预计到达：1h 04min
```

**不做的事**：不集成 COROS Pace Strategy 导出（技术兼容性差，且越野选手赛前研读后自行记忆，不依赖设备实时提示）。

---

## 4. AI 教练设计

### 4.1 教练人设

- **类型**：理性数据型
- **风格**：冷静、专业、用数据说话；不空洞鼓励，每句评估有数据依据
- **边界**：建议者而非命令者；面对用户质疑时解释理由，双方协商后调整

### 4.2 首次开场流程（Onboarding）

| 阶段 | 发起方 | 内容 |
|---|---|---|
| 数据初评 | 教练（自动） | 读取全部历史活动，执行双专项能力评估，生成能力画像 |
| 破冰开场 | 教练 → 用户 | 「我看完了你的数据，先说说我的判断……」 |
| 针对性问询 | 教练 → 用户 | 数据答不了的问题：目标赛事？伤病史？跑龄？偏好训练时间？ |
| 建立档案 | 系统（后台） | 数据画像 + 问答结果写入学员档案，师生关系正式建立 |

### 4.3 三层记忆模型

#### 层 1：学员档案（Athlete Profile）
- 性质：结构化，长期，精确读写
- 内容：能力 6 维评估值 / 目标赛事 / 伤病史 / 训练偏好 / 性格特点
- 更新：每次对话/训练后「记忆固化」机制写回
- 存储：SQLite 关系表（与 `data.db` 同库或分库）

#### 层 2：训练观察（Training Notes）
- 性质：半结构化，中期
- 内容：教练对每次训练的点评笔记（「今天配速波动大，呼吸节奏需练」）
- 更新：每次活动同步后，由 AI 自动生成
- 存储：SQLite 表 + 标签字段

#### 层 3：对话时间线（Dialogue Timeline）
- 性质：连续文本流，不分 session
- 内容：完整的师生对话历史，可回溯，不分段
- 更新：实时追加
- 存储：SQLite 表（append-only）

### 4.4 记忆固化机制（Memory Consolidation）

> 这是「每次训练后教练对我的认识增长一分」的工程实现。

每次对话结束后，后台异步触发一次 LLM 调用（使用专用 consolidation prompt，**不使用教练人设**），执行以下操作：

```
输入：本次对话内容 + 当前学员档案
任务：识别本次对话中的新信息（ADD / UPDATE / DELETE / NOOP）
输出：结构化变更指令（含 field / old_value / new_value / reason）
写入：staging 表（待审核区），再由 staging 生效到正式档案
```

#### Staging 机制（草稿区）

LLM 提取结果**不直接覆写学员档案**，先写入 `profile_staging` 临时表。Phase 1 采用**自动生效模式**——staging 写入后立即应用，但保留完整审计日志供回滚。

```sql
CREATE TABLE profile_staging (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    op TEXT NOT NULL,              -- 'ADD' | 'UPDATE' | 'DELETE' | 'NOOP'
    field_name TEXT,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,                   -- LLM 给出的变更理由
    source_dialogue_id INTEGER,    -- 关联触发此变更的对话 ID（可追溯）
    status TEXT DEFAULT 'pending', -- 'pending' | 'applied' | 'rejected'
    reviewed_at TEXT,
    created_at TEXT NOT NULL
);
```

**核心价值**：任何档案变更都能回溯到「是哪次对话触发的」；LLM 提取出错时可按 `source_dialogue_id` 批量撤销。Phase 2 可在 App 中增加「教练笔记」入口，让用户查看/确认教练对自己的认知记录，增强信任感。

### 4.5 教练工具（Tool Calling）设计

教练的能力通过 **Function Calling** 暴露为工具，而非预计算。教练在对话中按需调用，更自然、更省算力。

| 工具名 | 触发场景 | 功能 |
|--------|---------|------|
| `evaluate_ability(mode)` | "我现在什么水平" | 执行双专项能力评估，返回 6 维评分 |
| `search_history(query)` | "上个月那次武功山的训练" | 结构化 + 语义检索历史活动和教练点评 |
| `get_profile()` | 教练需要了解用户档案 | 读取完整学员档案 |
| `get_recent_activities(n)` | "最近几次训练" | 拉取最近 n 条活动摘要 |
| `update_plan(changes)` | 用户要求调整计划 | 修改训练计划（Phase 2） |
| `generate_race_strategy(gpx, target_score)` | "帮我制定比赛策略" | 生成分段比赛策略报告（Phase 3） |

### 4.6 对话历史膨胀处理

对话时间线长期增长会超出 LLM 上下文窗口，处理策略：

- **近期（2–4 周）**：完整对话内容保留在上下文
- **历史（更早）**：定期触发摘要压缩，关键信息提炼后写入学员档案，原始对话可归档
- **不删除**：历史对话归档保存，用户可查看，但不参与每次 LLM 调用

---

## 5. 能力评估框架

教练评估用户能力时，基于双专项框架。根据用户当前训练目标切换侧重。

### 5.1 越野跑模式（Trail Mode）

| 维度 | 数据来源 | 教练能说出的话 | 共用 |
|---|---|---|---|
| 有氧基础 | 低心率效率 + 周训练时间 | 「有氧底座是越野的命根子」 | ✅ |
| 爬升能力 | D+/小时、坡段心率、徒步效率 | 「你上坡偏力量型，可以更放松地跑坡」 | |
| 下降能力 | 下坡配速 + 赛后腿部恢复时长 | 「你的四头肌在长下坡后撑不住」 | |
| 越野效率 | GAP vs 实际配速差值 | 「你在技术路段损耗偏多」 | |
| 长时续航 | time-on-feet 衰减 / 后段强度保持 | 「5 小时以上你的节奏控制很稳」 | ✅ |
| 负荷与风险 | D+ 累积 ACWR + 坡度负荷 | 「这周坡度累积太高，悠着点」 | ✅ |

### 5.2 公路跑模式（Road Mode）

| 维度 | 数据来源 | 教练能说出的话 |
|---|---|---|
| 有氧基础 | 低心率配速 + 周跑量累积 | 「你的有氧底子打得扎实」 |
| 配速稳定性 | 同强度跑的心率/配速方差 | 「节奏感还需要练」 |
| 耐力天花板 | 长距离配速衰减曲线 | 「你 15km 后明显掉速」 |
| 恢复能力 | 训练间隔 + 连训后表现 | 「恢复快，可以加密度」 |
| 竞技状态 | 近 4 周 vs 历史趋势 | 「你最近状态在往上走」 |
| 负荷/伤病风险 | 跑量增幅 ACWR | 「这周加太猛，悠着点」 |

### 5.3 训练知识体系

**公路跑**：Jack Daniels VDOT 体系
- 5 个训练强度区间：E（轻松）/ M（马配）/ T（乳酸阈值）/ I（间歇）/ R（重复）
- 基于完赛时间推算 VDOT 值，再推算各区间对应配速
- 周期化训练：基础期 → 质量期 → 峰值期 → 减量期

**越野跑**：
- GAP（Grade Adjusted Pace）：坡度调整配速，统一不同地形训练的努力感比较基准
- 以时间和 D+ 计训练量（不以距离）：如「本周完成 12 小时训练，累计 D+ 4500m」
- ITRA km-effort 体系：`km-effort = 距离(km) + D+(m) / 100`
- ITRA 积分分级（0–6 stones）及 UTMB World Series 资格体系

---

## 6. 数据与隐私

### 6.1 数据分层处理

| 数据类型 | 敏感程度 | 处理方式 |
|---|---|---|
| 经纬度 GPS 轨迹 | 高（暴露位置） | 本地存储，不发送给 LLM |
| 海拔剖面曲线 | 低（越野必要） | 本地转换后发送（D+/D-/坡度统计）|
| 心率/配速/时间 | 低 | 发送统计摘要（均值/区间分布）|
| 学员档案 | 中（个人信息）| 存储在自有服务器，以标识加密 |
| 对话内容 | 中 | 经 HTTPS 加密传输，使用零留存协议供应商 |

### 6.2 发送给 LLM 的数据示例

```python
# 发送的内容（统计摘要，非原始数据）
{
  "activity_summary": {
    "date": "2026-06-01",
    "type": "trail_run",
    "duration_min": 142,
    "distance_km": 18.3,
    "elevation_gain_m": 1240,
    "elevation_loss_m": 890,
    "max_grade_pct": 34,
    "avg_hr": 158,
    "max_hr": 174,
    "hr_zone_distribution": {"z1": 12, "z2": 38, "z3": 35, "z4": 15},
    "city": "上海",
    "terrain_type": "mountain_trail"
    # 无经纬度，无具体坐标
  }
}
```

### 6.3 身份认证

- **方式**：OAuth（Apple Sign-In / Google OAuth）
- **关键约束**：所有记忆读写从第一天起绑定 `user_id`，为多用户化预留
- **单用户阶段**：仍需走完整 auth 流程，避免后期改造成本

---

## 7. 技术架构

### 7.1 项目结构（单仓库）

```
running_page/                    ← 现有项目根目录
├── run_page/                    ← Python 数据同步（已有，复用）
│   ├── coros_sync.py
│   ├── generator/
│   │   └── db.py                ← SQLite 数据模型
│   └── data.db                  ← 唯一数据真相源（所有端共用）
│
├── src/                         ← Web 前端（已有，继续迭代）
│
├── mobile/                      ← 新增：Flutter 移动端
│   ├── lib/
│   │   ├── screens/             ← 5 个 Tab 页面
│   │   ├── coach/               ← AI 教练对话 + 流式渲染
│   │   └── widgets/
│   └── pubspec.yaml
│
├── server/                      ← 新增：AI 后端
│   ├── main.py                  ← FastAPI 入口
│   ├── agent/                   ← 教练 Agent（model router）
│   ├── memory/                  ← 三层记忆服务
│   │   ├── profile.py           ← 学员档案 CRUD
│   │   ├── notes.py             ← 训练观察
│   │   └── timeline.py          ← 对话时间线
│   ├── eval/                    ← 能力评估引擎
│   │   ├── trail.py             ← 越野模式评估
│   │   └── road.py              ← 公路模式评估
│   └── requirements.txt
│
├── shared/                      ← 新增：共享数据模型
│   └── types/                   ← 跨端共用的数据结构定义
│
└── docs/
    └── PRODUCT_SPEC.md          ← 本文档
```

### 7.2 技术选型

| 层 | 选型 | 理由 |
|---|---|---|
| 移动端 | Flutter | 独立移动端，体验优先 |
| 后端框架 | FastAPI (Python) | 原生 async，SSE 友好，与数据同步同语言 |
| 流式传输 | SSE over HTTP | 2026 行业标准，比 WebSocket 简单，自带重连 |
| LLM 接入 | Model Router 抽象层 | DeepSeek V3 / GPT-4o 一行配置切换，不锁定供应商 |
| 记忆存储 | SQLite（与 data.db 同库或分库） | 单用户初期无需向量库，长上下文模型全量喂入即可 |
| 记忆固化 | 手写 LLM 抽取（先）→ mem0（规模化后） | 今天不为还没到来的规模付复杂度 |
| 认证 | OAuth（Apple / Google） | 支持未来多用户 |
| Web 前端 | 现有 React + Vite（继续迭代） | 不改动 |

### 7.3 三层模型路由（Model Router）

日常对话用最便宜的模型，只在真正需要时升级。人格一致性靠 system prompt 保证，不依赖特定模型。

| 层级 | 场景 | 模型 | 月成本参考 |
|------|------|------|-----------|
| **Tier 1 · 日常对话** | 闲聊、鼓励、简单确认、情绪回应 | DeepSeek V3 | 极低 |
| **Tier 2 · 专业分析** | 能力评估、训练数据解读、计划生成、周总结 | DeepSeek R1 | 中等 |
| **Tier 3 · 复杂推理** | 比赛策略、多赛事周期规划、伤病综合判断 | Qwen-Max | 按需 |

**单用户月成本估算：≈ ¥3–5**（含 LLM + 服务器分摊，毛利率 70–83%）

**路由规则**：使用关键词 + 简单分类器（不用 LLM 判断，避免额外成本）。边界模糊场景**默认升级到 Tier 2**，宁可多花几分钱，不因浅薄分析损害教练可信度。

**System Prompt 四层结构**（所有 Tier 共用前两层）：
1. 教练人设（风格指令 + 语气示例 + 禁止行为）
2. 学员档案（动态注入当前用户状态）
3. 场景指令（按 Tier 切换深度要求）
4. Few-shot 示例（2–3 个，确保不同模型输出风格一致）

> **大陆合规注意**：Phase 1–2 以 DeepSeek 系列为主力，Qwen-Max 做高端备选。Claude 留给未来国际化版本。

### 7.4 历史检索架构（search_history Tool）

用户可能随时问"上个月武功山那次爬升训练你怎么评价的"——教练必须能精确召回，而不是说"我不记得了"。

**Phase 1：纯结构化 SQL 检索（无需向量库）**

```python
class SimpleRetriever:
    def retrieve(self, user_query: str, user_id: str) -> RetrievalResult:
        # 1. LLM 从自然语言提取结构化过滤条件
        filters = self.llm_extract_filters(user_query)
        # → {"date_after": "2026-05-01", "location_like": "武功山", "type": "trail_run"}

        # 2. SQL 查询活动记录（data.db）
        activities = self.db.query_activities(user_id, **filters)

        # 3. 拉取对应教练点评（training_notes）
        notes = self.db.get_notes_by_activity_ids([a.id for a in activities])

        # 4. 拉取时间范围内归档对话摘要
        summaries = self.db.get_archived_summaries(user_id, filters)

        return RetrievalResult(activities, notes, summaries)
```

**4 个可检索索引**：

| 索引 | 数据来源 | 检索方式 |
|------|---------|---------|
| 活动记录 | `data.db` activities 表 | SQL 按日期/地点/类型/爬升筛选 |
| 教练点评 | `training_notes` 表 | SQL 标签筛选 |
| 学员档案 | `athlete_profile` 表 | 全量读取（量小） |
| 归档对话 | `dialogue_timeline`（已归档）| SQL 摘要字段匹配 |

**⚠️ 必须在 Phase 1 完成**：`data.db` 活动记录需要 `location_name` 字段（地名，非坐标）。在数据同步时对 GPS 首尾点做反向地理编码，提取城市/山名后存入，GPS 坐标本身不存储。

**升级路径**：

| 阶段 | 方案 | 触发条件 |
|------|------|---------|
| Phase 1 | 纯结构化 SQL | 单用户，<1000 条记录 |
| Phase 2 | SQL + SQLite FTS5 | 数据量增长，模糊查询增多 |
| Phase 3 | SQL + pgvector | 多用户，>10k 条记录 |

### 7.5 Flutter ↔ FastAPI 流式通信

```
Flutter (dio, ResponseType.stream)
    ──HTTPS/SSE──▶
FastAPI (StreamingResponse)
    ──▶ Model Router（三层路由）
    ──▶ DeepSeek V3 / R1 / Qwen-Max (streaming)
    ──▶ token-by-token SSE 回传（携带消息 ID）
    ──▶ Flutter UI 增量渲染
```

**关键约束**：
- API Key 只存在后端环境变量，绝不进入 Flutter 包（APK 可被反编译）
- 刷新频率节流至 5–20 次/秒，防止 UI 掉帧
- 必须实现取消按钮（中断生成节省费用）
- 429 限流时展示友好提示 + 指数退避重试
- **弱网断线重连**：每条 SSE 消息携带 `id` 字段，断线重连时发送 `Last-Event-ID`，从断点续传而非重新发起整个对话

### 7.6 SQLite 渐进式迁移策略

**核心原则：今天不为还没到来的规模付复杂度。**

从 Phase 1 起用 **Repository 模式**封装所有数据库访问。这是唯一需要从第一天就做的事——业务逻辑不直接耦合 SQLite，未来切换数据库只需实现新的 Repository，不改业务代码。

```python
# 正确做法（通过接口抽象）
class TrainingNotesRepository(Protocol):
    def get_by_user(self, user_id: str) -> list[TrainingNote]: ...
    def get_by_activity(self, activity_id: int) -> list[TrainingNote]: ...
    def create(self, note: TrainingNote) -> int: ...

class SQLiteTrainingNotesRepo:    # Phase 1–2 实现
    ...
class PostgresTrainingNotesRepo:  # Phase 3 实现，切换时只改注入
    ...
```

| 阶段 | 数据库 | 额外改动 |
|------|-------|---------|
| Phase 1 | SQLite | 仅做 Repository 接口抽象 |
| Phase 2 | SQLite + WAL + FTS5 | `PRAGMA journal_mode=WAL`（解决并发锁）+ FTS5 虚拟表（全文检索）|
| Phase 3 | 视信号迁移 PostgreSQL + pgvector | 多用户上线或并发写 >50次/秒时触发 |

> **FTS5 中文分词注意**：`unicode61` tokenizer 不支持中文语义，需在写入前对中文内容预处理分词（如用 `jieba`），再存入 FTS 表。

### 7.7 记忆数据库表结构（草案）

```sql
-- 学员档案（长期，结构化）
CREATE TABLE athlete_profile (
    user_id TEXT PRIMARY KEY,
    aerobic_base_score REAL,
    climbing_ability_score REAL,
    descent_ability_score REAL,
    trail_efficiency_score REAL,
    endurance_score REAL,
    load_risk_score REAL,
    current_mode TEXT,           -- 'trail' | 'road'
    primary_goal TEXT,
    target_race TEXT,
    injury_history TEXT,
    running_experience_years INTEGER,
    preferred_training_time TEXT,
    personality_notes TEXT,
    updated_at TEXT
);

-- 训练观察（中期，教练点评）
CREATE TABLE training_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    activity_id INTEGER,         -- 关联 data.db 中的 run_id
    coach_note TEXT,
    tags TEXT,                   -- JSON array: ["稳定性", "爬升", "恢复"]
    created_at TEXT
);

-- 对话时间线（连续，append-only）
CREATE TABLE dialogue_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    role TEXT,                   -- 'user' | 'coach'
    content TEXT,
    is_archived INTEGER DEFAULT 0,
    archived_summary TEXT,       -- 归档后的摘要（NULL 表示未归档）
    created_at TEXT
);
```

---

## 8. 开发路线图

### Phase 1（4–6 周）：AI 教练 MVP

**目标**：能跟教练对话，教练依据历史数据评估当下能力，给出有依据的指导，对话后「更懂我」。

**功能清单**：
- [ ] COROS/Garmin 历史数据接入（`data.db` 已有，读取 API）
- [ ] 双专项能力评估引擎（6 维，全部数据驱动）
- [ ] 混合式 Onboarding（自动初评 + 针对性问询）
- [ ] 理性数据型教练对话（FastAPI + SSE 流式输出）
- [ ] 连续对话时间线（无 session，无「新建对话」）
- [ ] 记忆固化机制（对话后异步写回学员档案）
- [ ] OAuth 登录（Apple Sign-In / Google）
- [ ] Flutter 移动端基础框架 + 教练 Tab UI

**Demo 验收标准**：
1. 教练能读懂我的历史训练数据
2. 能给出有数据依据的能力评估（不是空洞夸奖）
3. 建议具体可执行（「这两周轻松跑控心率 145 以下」而非「继续加油」）
4. 对话结束后，档案里多了对我的新认识
5. 下次打开，教练记得上次说的短板

### Phase 2（4–6 周）：计划 × 日历

**功能清单**：
- [ ] 训练日历 Tab（日期显示简要计划，点击展开详情）
- [ ] 基于目标赛事的训练周期生成（12 周备赛计划）
- [ ] 训练计划动态调整（通过对话重排）
- [ ] 计划 vs 实际每日对比 + 弹窗确认
- [ ] 周训练总结（教练主动发起）

### Phase 3（6–8 周）：比赛策略 + 进阶分析

**功能清单**：
- [ ] ITRA 表现分反向计算（目标分 → 目标完赛时间）
- [ ] 赛道 GPX 解析 + km-effort 计算
- [ ] 分段比赛策略生成（配速参考 + 注意事项 + 体力分配）
- [ ] ITRA 认证赛事数据库（爬虫积累）
- [ ] 过训练预警（ACWR 超阈值主动提醒）
- [ ] 训后深度分析

---

## 9. 竞品差异化

### 9.1 竞品对比

| 产品 | 越野专项 | 马拉松专项 | AI 对话教练 | 持续记忆 | ITRA 体系 |
|---|---|---|---|---|---|
| 高驰 (COROS) App | 数据记录，分析浅 | ✅ | 无 | 无 | 无 |
| 佳明 Connect | 数据记录，分析浅 | ✅ | 极弱 | 无 | 无 |
| Strava | 附带 | ✅ | 无 | 无 | 无 |
| TrailForks | 路线库，无训练功能 | 无 | 无 | 无 | 无 |
| Sigma | 未突出 | 基础记录 | ✅ 北体大知识库 | 弱（主动对话） | 无 |
| **本产品** | **深度专项** | **✅** | **核心功能** | **核心功能** | **Phase 3** |

> Sigma 详细调研见 [COMPETITOR_SIGMA.md](./COMPETITOR_SIGMA.md)（2026-06-11）

### 9.2 两个真正的护城河

**护城河 1：持续认知的 AI 教练**
没有任何跑步 App 实现了「反 session、有记忆、认知持续增长」的 AI 教练。这是最难被快速复制的差异化，因为它需要正确的架构设计，而不只是接入一个 LLM API。

**护城河 2：ITRA 分 → 比赛策略的完整链路**
COROS Pace Strategy（2026 年 3 月上线）只做了「目标完赛时间 → 分段配速」，缺失 ITRA 维度和 AI 解释层。本产品做的是「目标 ITRA 分 → 逆推完赛时间 → 分段策略 + 教练解释」，有更高的信息密度和专业价值。

---

## 10. 商业化方案

> Phase 1 不考虑变现，打磨核心体验。Phase 2 内测验证 PMF，Phase 3 后上线订阅制。

### 10.1 Freemium + 订阅制

#### 基础版（永久免费）

| 功能 | 说明 |
|------|------|
| 数据同步 | COROS/Garmin 数据自动同步 |
| 训练历史 | 完整记录查看、地图轨迹、基础统计 |
| 概览 Dashboard | 跑量趋势、近期表现（基础图表） |
| AI 教练对话 | **限 3 次/周**（不锁数据，只限 AI 交互频次）|

> 设计逻辑：让用户先感受教练能力，3 次/周够触发「不够用」的需求，驱动付费转化。

#### Pro 版（付费）

| 功能 | 说明 |
|------|------|
| AI 教练对话 | 不限次数，完整持续记忆 |
| 动态训练计划 | AI 生成 + 对话调整 |
| 计划 vs 实际对比 | 每日自动对比 + 教练点评 |
| 周/月训练总结 | 教练主动发起定期复盘 |
| 能力评估更新 | 6 维持续追踪、趋势图表 |
| 比赛策略生成 | GPX + ITRA 分 → 策略报告（Phase 3）|
| 数据导出 | 训练数据 + 教练点评导出 |

#### 定价

| 方案 | 价格 | 说明 |
|------|------|------|
| 首月体验 | ¥1 | 极低门槛，让用户体验完整教练能力 |
| 月付 | ¥29/月 | 冲动消费友好 |
| 年付 | ¥198/年（¥16.5/月）| 年付优惠 43%，引导长期绑定 |

> **定价逻辑**：对标 AI 教练类 App（Freeletics/Fitbod ≈ ¥400–600/年），我们定更低以建立早期口碑，后续随品牌认知度提价。单用户月成本 ≈ ¥5，毛利率 70–83%。

### 10.2 补充收入（Phase 3+）

| 来源 | 模式 | 说明 |
|------|------|------|
| 比赛策略报告 | ¥9.9–29.9/份单买 | 可作为独立免费获客工具，无需注册即可生成，策略报告内引导转化 Pro |
| 装备推荐佣金 | CPS 分成 | 根据训练数据推荐跑鞋/装备，接入电商联盟 |
| 企业/跑团版 | B2B 定价 | 远期，跑团批量授权 |

### 10.3 冷启动策略

**比赛策略报告作为获客入口**（M-S1，专家建议）：

Phase 3 的比赛策略功能可做成独立免费工具页，**不要求注册**：
- 上传赛道 GPX + 填入目标 ITRA 分 → 生成结构化策略报告
- 报告末尾引导：「想持续追踪训练，让教练帮你备赛？试试 AI 教练」

越野跑圈子小、口碑传播高效——一份好的赛前策略报告会在圈内自发扩散，是比任何广告投放都低成本的获客方式。

---

## 11. 待决策事项

以下事项在产品讨论中尚未最终确定，开发前需明确：

| 事项 | 背景 | 建议 |
|---|---|---|
| ITRA 数据爬虫合规性 | 爬取 ITRA 公开数据是否违反 ToS | Phase 3 启动前做法律评估 |
| 后端部署方案 | 单机 vs 容器 vs 云函数 | Phase 1 单机，Phase 2 容器化 |
| 对话历史归档触发条件 | 多长时间/多少条触发摘要压缩 | 建议：超过 4 周或 200 条时归档 |
| 多用户开放时间 | 何时对外发布、是否订阅制 | Phase 1-2 仅个人使用，Phase 3 后评估 |
| Garmin/Apple Watch 扩展 | 是否扩展设备支持 | Phase 2 后评估，优先 COROS |

---

*本文档应随产品迭代持续更新。每次重大决策变更后，在对应章节注明变更日期和原因。*
