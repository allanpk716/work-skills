# 代码点技能重构设计规格

> 日期：2026-04-18
> 状态：设计完成，待实现

---

## 一、背景与动机

原始代码点技能是基于微博用户 zhh-4096（Lealone 数据库作者）的方法论开发的，核心是运行时堆栈捕获探针。

作者后续补充了关键洞察：

1. **集合论原理**：给定提示词 + 集合 → LLM 筛选子集 → 解决问题。代码点应组成集合，找到子集即可定位问题。
2. **效率对比**：传统 grep 搜索代码调用链需几分钟且有遗漏，代码点方案只需 3-5 秒且准确率极高。
3. **TDD 式闭环**：分析、埋点、验收缺一不可，没有验收的埋点不可信。

现有技能的问题：
- 代码点是孤立的探针，没有集合/流程的组织结构
- 只有运行时捕获，没有代码库扫描和分析能力
- 没有验收机制，无法验证埋点是否有效
- 不支持新功能开发时的埋点规划

## 二、核心设计决策

| 决策项 | 结论 |
|--------|------|
| 数据模型 | 代码点独立存在，业务流程引用代码点的有序组合，集合分组流程 |
| 扫描粒度 | 两阶段：先全局概览识别模块，再按模块深入分析 |
| 存储格式 | Markdown 文档（人类可读）+ JSON 索引（AI 查询） |
| 技能边界 | 全流程：分析 → 自动埋点 → TDD 式自动化验收 |
| 触发机制 | 独立斜杠命令 + 全局 CLAUDE.md 提醒 + 关键词自动检测 |
| 与其他技能关系 | 完全独立，不修改 brainstorming/GSD 等技能 |

## 三、数据模型

### 3.1 三层结构

```
代码点（CodePoint）—— 最小独立单元
├── id: "cp-user-auth-check"
├── location: "src/auth/handler.go:42"
├── description: "用户认证校验入口"
├── type: "entry | boundary | state-change | concurrency | error"
├── probe_template: 根据语言生成的探针代码片段
└── enabled: true/false

业务流程（Flow）—— 代码点的有序组合
├── id: "flow-user-login"
├── name: "用户登录流程"
├── sequence: [cp-login-entry → cp-auth-check → cp-session-create → cp-login-complete]
├── trigger: "POST /api/login"
└── test_cases: 正常/边界/异常场景定义

集合（Collection）—— 流程的分组
├── id: "col-user-management"
├── name: "用户管理"
├── flows: [flow-user-login, flow-user-register, flow-user-update]
```

### 3.2 存储目录结构

```
.codepoints/
├── index.json                  # 全局索引
├── collections/
│   └── user-management.md      # 集合文档
├── flows/
│   ├── user-login.md           # 流程文档
│   └── user-register.md
├── points/
│   ├── cp-auth-check.md        # 代码点详情
│   ├── cp-login-entry.md
└── verification/
    └── user-login-verify.md    # 验收报告
```

### 3.3 index.json 格式

```json
{
  "version": "2.0",
  "project": "my-api",
  "language": "go",
  "collections": [
    {
      "id": "col-user-management",
      "name": "用户管理",
      "flows": ["flow-user-login", "flow-user-register"]
    }
  ],
  "flows": [
    {
      "id": "flow-user-login",
      "name": "用户登录流程",
      "collection": "col-user-management",
      "sequence": ["cp-login-entry", "cp-auth-check", "cp-session-create"],
      "trigger": "POST /api/login"
    }
  ],
  "points": [
    {
      "id": "cp-auth-check",
      "location": "src/auth/handler.go:42",
      "description": "用户认证校验入口",
      "type": "boundary",
      "flows": ["flow-user-login", "flow-token-refresh"]
    }
  ]
}
```

## 四、技能结构与命令

### 4.1 文件结构

```
plugins/codepoint/
├── skills/
│   ├── codepoint/
│   │   └── SKILL.md          # 主入口
│   ├── scan/
│   │   └── SKILL.md          # 扫描已有代码
│   ├── plan/
│   │   └── SKILL.md          # 规划新功能埋点
│   └── implement/
│       └── SKILL.md          # 执行埋点+验收
```

### 4.2 命令与触发

| 命令 | 用途 | 触发关键词 |
|------|------|-----------|
| `/codepoint` | 主入口，显示帮助 | "代码点"、"codepoint" |
| `/codepoint-scan` | 扫描已有代码库 | "扫描代码点"、"代码点扫描" |
| `/codepoint-plan` | 规划新功能埋点 | "规划埋点"、"新功能代码点" |
| `/codepoint-implement` | 执行埋点+验收 | "执行代码点"、"埋点验收" |

### 4.3 提醒机制

双重保障：
1. 安装时在全局 `~/.claude/CLAUDE.md` 添加代码点提醒规则
2. SKILL.md 中定义触发关键词，superpowers 关键词检测自动推荐

## 五、三个核心能力

### 5.1 扫描已有代码（`/codepoint-scan`）

**两阶段流程：**

阶段一：概览
- 扫描代码库目录结构、入口文件、路由定义
- 识别所有模块和业务区域
- 输出候选集合和流程清单
- 用户审核确认，选择要深入的模块

阶段二：深入
- 分析选定模块的具体代码路径
- 确定关键埋点位置（模块边界、状态变更、并发交互、错误处理）
- 生成代码点、流程、集合的完整定义
- 输出到 `.codepoints/` 目录

### 5.2 规划新功能埋点（`/codepoint-plan`）

- 分析 spec/设计文档中的功能流程
- 确定关键埋点位置和类型
- 规划代码点归属哪个流程和集合
- 检查是否复用已有代码点
- 输出埋点方案文档

### 5.3 执行+验收闭环（`/codepoint-implement`）

TDD 式三步闭环：

**Red — 埋点方案确认**
- 展示待执行的埋点方案
- 用户确认或调整

**Green — 自动生成探针代码**
- 根据语言模板生成探针代码
- 自动插入到指定位置
- 每个代码点携带唯一 id，输出统一 JSON 格式

**Verify — 自动化验收**
- 自动生成测试用例：
  - 正常流程：验证所有代码点按序触发，堆栈完整
  - 边界条件：验证极端输入下代码点仍能捕获关键信息
  - 失效模式：注入异常数据，验证代码点输出是否支持自动化问题定位
- 自动执行测试
- 输出验收报告到 `.codepoints/verification/`

探针输出格式：
```json
{
  "point_id": "cp-auth-check",
  "flow_id": "flow-user-login",
  "timestamp": "2026-04-18T10:30:00Z",
  "stack": ["main.handleLogin", "auth.Check", "..."],
  "metadata": { "user_id": "xxx", "status": "checking" }
}
```

## 六、语言支持

保持 Go、Python、TypeScript 三语言支持。

探针代码关键变化：
- 每个代码点携带唯一 `id`
- 输出统一 JSON 格式，包含 flow 上下文标识
- 支持按 flow 过滤输出
- 生成对应语言的验收测试代码

## 七、与其他技能的关系

代码点技能**完全独立**，不修改任何其他技能（brainstorming、GSD、superpowers 等）。

衔接方式：
- CLAUDE.md 全局提醒规则
- 关键词自动检测
- 用户手动调用

后续可考虑：
- 在 GSD 的 phase 类型中添加 "codepoint" phase
- 在 brainstorming 流程中添加代码点检查点
- 这些作为未来增强，不在本次重构范围内
