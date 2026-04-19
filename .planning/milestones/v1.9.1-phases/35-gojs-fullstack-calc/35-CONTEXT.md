# Phase 35: Go+JS 全栈跨语言集成 - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

创建 Go+JS 全栈计算器项目，验证跨语言探针联动。前端 React JS 调用后端 Go API，前端探针数据通过 collector 端点被后端收集。运行完整 codepoint scan/plan/implement 流程，验证同一跨语言代码点在不同业务流程下输出完整的调用链堆栈信息。

</domain>

<decisions>
## Implementation Decisions

### 全栈项目架构
- **D-01:** 在 tmp/ 下创建全新项目 `tmp/gojs-calculator/`，不扩展现有 go-calculator。前后端代码在同一个项目中，前端构建后通过 go:embed 嵌入 Go binary。
- **D-02:** 前端使用 React 技术栈，构建产物嵌入 Go binary，通过 go:embed 提供静态文件服务。

### 前端业务流设计
- **D-03:** 前端完整复刻后端三个业务流：计算器 UI（调用 POST /api/calculate）、历史记录查询（调用 GET /api/history/{id}）、批量计算入口（调用批量 API）。每个前端流都设置对应的 flow_id（如 flow-api-calculate、flow-history-query、flow-batch-process）。

### 跨语言探针联动
- **D-04:** Collector 端点复用 golang.md 中的 collector.go 模板代码，注册 POST /__codepoint__ 路由。前端探针通过 POST 发送堆栈数据到后端。
- **D-05:** 前后端探针通过 flow_id 关联为主（如 flow-api-calculate 同时出现在 cp-go-*.log 和 cp-ts-*.log 中），时间戳用于定位同一次运行。

### 验证策略
- **D-06:** 运行完整 codepoint scan/plan/implement 流程验证技能工作流，不是手动编写探针代码。
- **D-07:** 多流程堆栈验证深度：验证同一跨语言代码点在不同流程下输出不同堆栈，且完整调用链包含前端和后端部分。与单语言验证模式一致。

### Claude's Discretion
- 前端 React 组件的具体实现（UI 细节、状态管理方式）
- 后端 API 路由的具体设计（是否完全复制 go-calculator 的路由结构）
- 批量计算的前端交互方式（文件上传还是文本输入）
- 测试用例的具体编写方式

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 技能参考文档（包含 collector 实现和探针模板）
- `plugins/codepoint/references/golang.md` §6 — Go Frontend Collector 实现代码（collector.go, CollectorHandler, go:embed 集成示例）
- `plugins/codepoint/references/frontend.md` — JS/TS 探针实现指南（base library, browser mode with backend collector）
- `plugins/codepoint/references/data-model.md` — 数据模型定义（CodePoint, Flow, Collection）

### 现有测试项目（架构参考）
- `tmp/go-calculator/` — Go 单语言计算器（多流程共享核心计算架构、探针代码模式参考）
- `tmp/go-calculator/internal/calculator/calculator.go` — FlowIDKey + GetFlowID 的 context 传播模式
- `tmp/go-calculator/internal/api/server.go` — API 路由和探针插入模式参考
- `tmp/go-calculator/codepoint/codepoint.go` — Go 基础库

### Phase 34 结果（模板修复上下文）
- `.planning/phases/34-single-lang-fix/34-CONTEXT.md` — golang.md 模板修复决策
- `.planning/phases/32-go-single-lang-calc/` — Go 单语言验证完整结果

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tmp/go-calculator/internal/calculator/calculator.go`: 核心计算逻辑（Evaluate: Parse → Validate → Compute → Format），可直接复用或参考
- `tmp/go-calculator/internal/history/store.go`: 历史存储，可复用
- `tmp/go-calculator/codepoint/codepoint.go`: Go 探针基础库，已修复 Frame 类型
- `golang.md` collector.go: 前端 collector 完整实现，包含 toggle 检查、文件写入、HTTP handler

### Established Patterns
- Go 探针: PointWithMeta + point_id + flow_id，context.Context 传播 flow_id
- 前端探针: point() / pointWithMeta()，browser mode POST 到 /__codepoint__
- Collector: toggle 文件控制启停，404 时前端停止发送（零开销）
- 输出文件: cp-go-*.log（Go 后端）+ cp-ts-*.log（前端通过 collector）

### Integration Points
- 前端 React 构建产物 → go:embed → Go binary 静态文件服务
- 前端探针 → POST /__codepoint__ → Go collector → cp-ts-*.log
- 前端 fetch → Go API 端点 → 共享计算路径 → Go 探针 → cp-go-*.log

</code_context>

<specifics>
## Specific Ideas

- 前端探针在发起 API 调用前设置 flow_id，后端在同一请求中通过 context 携带相同 flow_id——这样 cp-go 和 cp-ts 日志中出现相同 flow_id 即可确认跨语言调用链
- 验证时关注：同一代码点（如核心计算路径上的探针）在三个流程（计算/历史/批量）下输出不同的堆栈信息

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 35-gojs-fullstack-calc*
*Context gathered: 2026-04-18*
