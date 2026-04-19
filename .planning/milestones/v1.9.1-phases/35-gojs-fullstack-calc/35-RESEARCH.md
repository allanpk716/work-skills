# Phase 35: Go+JS 全栈跨语言集成 - Research

**Researched:** 2026-04-18
**Domain:** Go+JS fullstack integration with go:embed, cross-language codepoint probe correlation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 在 tmp/ 下创建全新项目 `tmp/gojs-calculator/`，不扩展现有 go-calculator。前后端代码在同一个项目中，前端构建后通过 go:embed 嵌入 Go binary。
- **D-02:** 前端使用 React 技术栈，构建产物嵌入 Go binary，通过 go:embed 提供静态文件服务。
- **D-03:** 前端完整复刻后端三个业务流：计算器 UI（调用 POST /api/calculate）、历史记录查询（调用 GET /api/history/{id}）、批量计算入口（调用批量 API）。每个前端流都设置对应的 flow_id（如 flow-api-calculate、flow-history-query、flow-batch-process）。
- **D-04:** Collector 端点复用 golang.md 中的 collector.go 模板代码，注册 POST /__codepoint__ 路由。前端探针通过 POST 发送堆栈数据到后端。
- **D-05:** 前后端探针通过 flow_id 关联为主（如 flow-api-calculate 同时出现在 cp-go-*.log 和 cp-ts-*.log 中），时间戳用于定位同一次运行。
- **D-06:** 运行完整 codepoint scan/plan/implement 流程验证技能工作流，不是手动编写探针代码。
- **D-07:** 多流程堆栈验证深度：验证同一跨语言代码点在不同流程下输出不同堆栈，且完整调用链包含前端和后端部分。与单语言验证模式一致。

### Claude's Discretion
- 前端 React 组件的具体实现（UI 细节、状态管理方式）
- 后端 API 路由的具体设计（是否完全复制 go-calculator 的路由结构）
- 批量计算的前端交互方式（文件上传还是文本输入）
- 测试用例的具体编写方式

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FULL-01 | 创建 Go+JS 全栈计算器项目，前端 JS 调用后端 Go API，业务流跨前后端且共享核心代码点 | go:embed 集成模式 (golang.md §6)，Vite+React 构建配置，SPA fallback 路由模式 |
| FULL-02 | 在 Go+JS 项目上运行 `/codepoint:scan`，识别前后端各自的业务流及跨语言调用链路 | codepoint scan 技能流程，多语言项目检测模式（go.mod + package.json 同时存在） |
| FULL-03 | Go 后端 collector 通过 `/__codepoint__/` 端点收集前端 JS 探针数据，验证跨语言探针联动 | golang.md collector.go 模板，frontend.md browser mode + sendToCollector，**关键：collector 缺少 flow_id 路由** |
| FULL-04 | 运行全栈业务流程，验证同一跨语言代码点在不同流程下的完整调用链堆栈信息 | flow_id 关联机制，时间戳对齐，前后端探针输出格式对比 |
</phase_requirements>

## Summary

Phase 35 创建一个 Go+JS 全栈计算器项目（`tmp/gojs-calculator/`），前端 React 通过 Vite 构建后通过 `go:embed` 嵌入 Go binary。后端 Go 提供 API 端点 + collector 端点，前端探针通过 POST `/__codepoint__` 将堆栈数据发送到后端。关键目标是验证跨语言探针联动——同一 flow_id 同时出现在 Go 日志（cp-go-*.log）和前端日志（cp-ts-*.log）中。

**研究发现的关键问题：** golang.md 中的 collector.go 模板存在功能缺口——它接收前端发送的 `Meta` 字段（包含 `flow_id`），但写入时完全丢弃了 Meta，只写入 `[CODEPOINT] name\nstack\n` 纯文本格式。这意味着前端即使使用 `pointWithMeta` 带 flow_id，collector 也不会像 Go 端那样路由到 flow-specific 文件。实现 FULL-03/FULL-04 时需要决定是增强 collector 还是接受单文件输出模式。

**Primary recommendation:** 创建独立的 gojs-calculator 项目，复用 go-calculator 的 Go 后端架构（calculator/history/batch），增加 collector.go 和 go:embed 集成。前端使用 Vite+React，base 设为 `/`，构建输出到 `frontend/dist/`。增强 collector.go 支持 flow_id 路由以匹配 Go 端的 per-flow 文件输出模式。

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 计算器核心逻辑 (Parse/Validate/Compute/Format) | API / Backend | — | 纯业务逻辑，Go 端实现 |
| HTTP API 路由 (calculate/history/batch) | API / Backend | — | Go http.ServeMux 处理 |
| 前端探针数据收集 (collector) | API / Backend | — | Go collector handler 写入 cp-ts-*.log |
| 前端 UI 渲染 (计算器/历史/批量) | Browser / Client | — | React 组件渲染 |
| 前端 API 调用 (fetch 到后端) | Browser / Client | — | 浏览器 fetch API |
| 前端探针采集 (point/pointWithMeta) | Browser / Client | API / Backend | 采集在浏览器，通过 POST 发送到后端 collector |
| 静态文件服务 (go:embed) | API / Backend | — | Go 嵌入并服务前端构建产物 |
| flow_id 跨语言关联 | API / Backend + Browser / Client | — | 前端设置 flow_id，后端通过 context 传播 |
| 探针日志输出 (cp-go/cp-ts) | API / Backend | — | Go 进程统一管理所有输出文件 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Go | 1.24.11 | 后端 API + collector + 静态文件服务 | 项目已有 go-calculator 使用此版本 [VERIFIED: go version] |
| React | 18.x (latest) | 前端 UI 组件 | 成熟稳定，前端探针模板基于 React patterns [ASSUMED] |
| Vite | 6.x (latest) | 前端构建工具 | 快速构建，go:embed 需要预构建产物 [ASSUMED] |
| TypeScript | 5.x (latest) | 前端类型安全 | codepoint.ts 基础库使用 TypeScript [VERIFIED: frontend.md] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitejs/plugin-react | latest | Vite React 插件 | Vite + React 项目必需 [ASSUMED] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite | CRA (Create React App) | CRA 已废弃，Vite 是社区标准 |
| React | Vue/Svelte | frontend.md 模板基于 React patterns，保持一致 |
| go:embed | 独立前端 dev server | go:embed 更符合 D-01/D-02 决策——单 binary 部署 |

**Installation:**
```bash
# 前端
cd tmp/gojs-calculator/frontend
npm create vite@latest . -- --template react-ts
npm install

# 后端无需额外依赖（标准库 + go:embed）
```

**Version verification:** Go 1.24.11 已安装 [VERIFIED: `go version`]。Node.js v22.14.0 和 npm 10.9.2 已安装 [VERIFIED: `node --version`]。

## Architecture Patterns

### System Architecture Diagram

```
                     Browser
                   ┌─────────────────────────────────────────┐
                   │                                         │
                   │  React App (Vite build → go:embed)       │
                   │                                         │
                   │  ┌─────────┐  ┌──────────┐  ┌────────┐ │
                   │  │Calculator│  │ History  │  │ Batch  │ │
                   │  │   UI     │  │   UI     │  │   UI   │ │
                   │  └────┬─────┘  └────┬─────┘  └───┬────┘ │
                   │       │             │            │       │
                   │       ▼             ▼            ▼       │
                   │  ┌────────────────────────────────────┐  │
                   │  │ codepoint.ts (base library)        │  │
                   │  │ point() / pointWithMeta()          │  │
                   │  └───────┬─────────────┬──────────────┘  │
                   │          │             │                 │
                   │          │ flow_id     │ stack traces    │
                   │          ▼             ▼                 │
                   │   fetch /api/*    POST /__codepoint__    │
                   └──────────┼────────────┼──────────────────┘
                              │            │
                   ───────────┼────────────┼────────────────── HTTP
                              │            │
                   ┌──────────▼────────────▼──────────────────┐
                   │           Go HTTP Server                  │
                   │           (net/http)                      │
                   │                                          │
                   │  ┌──────────────┐  ┌───────────────────┐  │
                   │  │  API Routes   │  │ Collector Handler │  │
                   │  │ /api/calc*    │  │ /__codepoint__    │  │
                   │  │ /api/history* │  │                   │  │
                   │  └──────┬───────┘  └────────┬──────────┘  │
                   │         │                   │             │
                   │         ▼                   ▼             │
                   │  ┌────────────────────────────────────┐   │
                   │  │  Business Logic (Shared)           │   │
                   │  │  calculator.Evaluate()             │   │
                   │  │    → Parse → Validate → Compute    │   │
                   │  │    → Format                        │   │
                   │  └──────────────┬─────────────────────┘   │
                   │                 │                         │
                   │                 ▼                         │
                   │  ┌────────────────────────────────────┐   │
                   │  │  codepoint.go (Go probe library)   │   │
                   │  │  PointWithMeta(name, {flow_id})   │   │
                   │  └──────────────┬─────────────────────┘   │
                   │                 │                         │
                   └─────────────────┼─────────────────────────┘
                                     │
                                     ▼
                   ┌─────────────────────────────────────────┐
                   │  ~/.codepoint/gojs-calculator/          │
                   │                                         │
                   │  cp-go-*.log          ← Go backend      │
                   │  cp-go-flow-{id}-*.log ← Go per-flow    │
                   │  cp-ts-*.log          ← Frontend        │
                   │  cp-ts-flow-{id}-*.log ← TS per-flow*   │
                   │                                         │
                   │  *需要增强 collector 支持 flow 路由      │
                   └─────────────────────────────────────────┘
```

### Recommended Project Structure
```
tmp/gojs-calculator/
├── main.go                    # Go 入口，go:embed + 路由注册 + collector
├── go.mod                     # module gojs-calculator, go 1.24
├── codepoint/
│   ├── codepoint.go           # Go 探针基础库（复用 go-calculator 的已修复版本）
│   └── collector.go           # 前端 collector 端点（从 golang.md 模板，需增强）
├── internal/
│   ├── calculator/
│   │   └── calculator.go      # 核心计算逻辑（复用 go-calculator）
│   ├── api/
│   │   └── server.go          # API 路由（calculate, history, batch）
│   ├── history/
│   │   └── store.go           # 内存历史存储（复用 go-calculator）
│   └── batch/
│       └── processor.go       # 批量处理逻辑（复用 go-calculator）
├── frontend/                  # React 前端项目
│   ├── package.json
│   ├── vite.config.ts         # base: '/', outDir: 'dist'
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx           # React 入口
│       ├── App.tsx            # 根组件（路由切换）
│       ├── lib/
│       │   └── codepoint.ts   # 前端探针基础库（从 frontend.md 模板）
│       ├── components/
│       │   ├── Calculator.tsx # 计算器 UI（flow-api-calculate）
│       │   ├── History.tsx    # 历史记录 UI（flow-history-query）
│       │   └── BatchCalc.tsx  # 批量计算 UI（flow-batch-process）
│       └── api/
│           └── client.ts      # API 调用封装
└── .codepoints/               # codepoint scan 输出
    ├── index.json
    ├── collections/
    ├── flows/
    └── points/
```

### Pattern 1: go:embed + SPA Fallback
**What:** Go 嵌入 Vite 构建产物，提供静态文件服务，支持 SPA 客户端路由回退。
**When to use:** 任何 Go+前端单体部署的项目。
**Example:**
```go
// main.go
//go:embed frontend/dist/*
var frontendDist embed.FS

func main() {
    defer codepoint.Close()
    defer codepoint.CloseCollector()

    mux := http.NewServeMux()

    // Collector endpoint — 必须在 SPA fallback 之前注册
    mux.Handle("/__codepoint__", codepoint.CollectorHandler())

    // API routes
    mux.Handle("/api/", apiHandler)

    // SPA fallback: serve embedded frontend
    frontend, _ := fs.Sub(frontendDist, "frontend/dist")
    fileServer := http.FileServer(http.FS(frontend))

    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        // Try static file first, fallback to index.html for SPA routing
        path := filepath.Clean(r.URL.Path)
        if f, err := frontend.Open(path[1:]); err == nil {
            f.Close()
            fileServer.ServeHTTP(w, r)
            return
        }
        // SPA fallback — serve index.html
        http.ServeFileFS(w, r, frontend, "index.html")
    })

    http.ListenAndServe(":8080", mux)
}
```
**Source:** [VERIFIED: golang.md §6 — Integration with Go Server example] + Go 标准库 `embed.FS` 模式

### Pattern 2: Flow ID 跨语言关联
**What:** 前端发起 API 请求前通过 `pointWithMeta` 设置 flow_id，Go 后端在同一请求的 context 中传播相同 flow_id。cp-go 和 cp-ts 日志中出现相同 flow_id 即确认跨语言调用链。
**When to use:** 全栈项目需要关联前后端探针数据时。
**Example:**
```typescript
// frontend/src/components/Calculator.tsx
import { pointWithMeta } from '../lib/codepoint';

async function handleCalculate(expr: string) {
    pointWithMeta('cp-fe-calc-submit', {
        point_id: 'cp-fe-calc-submit',
        flow_id: 'flow-api-calculate',
        expr,
    });

    const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: expr }),
    });

    pointWithMeta('cp-fe-calc-response', {
        point_id: 'cp-fe-calc-response',
        flow_id: 'flow-api-calculate',
    });
    // ...
}
```
**Source:** [VERIFIED: frontend.md §React Patterns + V2 Probe Templates]

### Pattern 3: Go Backend Context 传播 Flow ID
**What:** API handler 从 context 提取/设置 flow_id，传递给 calculator.Evaluate()。
**When to use:** 与单语言 go-calculator 完全相同的模式。
**Example:**
```go
// internal/api/server.go
func (s *Server) HandleCalculate(w http.ResponseWriter, r *http.Request) {
    ctx := context.WithValue(r.Context(), calculator.FlowIDKey{}, "flow-api-calculate")
    // ... calculator.Evaluate(ctx, expr) propagates flow_id to all probes
}
```
**Source:** [VERIFIED: go-calculator internal/api/server.go lines 73-77]

### Anti-Patterns to Avoid
- **直接修改 go-calculator 项目添加前端代码:** D-01 明确要求创建独立项目 gojs-calculator。go-calculator 是单语言参考，不应混合。
- **前端探针使用 `point()` 而非 `pointWithMeta()`:** `point()` 不发送 `meta`（包括 `flow_id`），导致 collector 无法路由到 flow-specific 文件。
- **在 `go:embed` 路径中使用开发模式输出:** Vite dev server 不生成 `dist/`，必须先 `npm run build` 再 `go build`。
- **collector 端点注册在 SPA fallback 之后:** `/__codepoint__` 会被 SPA fallback 拦截返回 `index.html`。必须在 fallback 之前注册。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 前端探针库 | 手写 Error().stack 解析 | frontend.md 中的 codepoint.ts 模板 | 已处理 browser/node 双模式，包含 zero-cost disabled 逻辑 |
| Go 探针库 | 手写 runtime.Stack 采集 | golang.md 中的 codepoint.go 模板 | 已包含 toggle 检查、flow file 路由、Frame 解析 |
| Collector handler | 手写 HTTP handler + 文件写入 | golang.md 中的 collector.go 模板 | 已处理 toggle 控制、404 fallback、JSON 解码 |
| SPA 静态文件服务 | 手写文件服务逻辑 | Go embed.FS + http.FileServer | 标准库模式，经过充分验证 |
| 前端构建 | 手写 webpack config | Vite + @vitejs/plugin-react | 零配置 React 支持，快速构建 |
| 核心计算逻辑 | 重新实现 | 复用 go-calculator 的 calculator.go | 已验证的 Parse→Validate→Compute→Format 流水线 |

**Key insight:** 本项目主要工作是集成和组装，而非从零编写。核心逻辑和探针库都有现成模板。最大的技术挑战是确保跨语言 flow_id 关联的 collector 能正确工作。

## Common Pitfalls

### Pitfall 1: Collector 丢弃 flow_id 导致无法按 flow 分文件输出
**What goes wrong:** 前端 `pointWithMeta` 发送 `meta: { flow_id: "flow-api-calculate" }`，但 collector.go 模板第 692 行只写 `[CODEPOINT] name\nstack\n`，完全忽略 `entry.Meta`。
**Why it happens:** golang.md collector 模板在 V2 per-flow 文件路由功能之前编写，未同步更新。
**How to avoid:** 增强 collector.go，检查 `entry.Meta["flow_id"]`，如果存在则路由到 flow-specific 文件（`cp-ts-flow-{id}-*.log`），类似于 Go 端 `PointWithMeta` 的行为。需要添加 `tsFlowFiles map[string]*os.File` 到 collector 的 session state。
**Warning signs:** cp-ts-*.log 文件只有一个（没有 per-flow 文件），且内容是纯文本而非 JSON。

### Pitfall 2: go:embed 在开发时找不到 dist/ 目录
**What goes wrong:** `go build` 失败，报错 `frontend/dist: no matching files found`。
**Why it happens:** Vite 尚未构建，`frontend/dist/` 目录不存在。`go:embed` 在编译时检查路径。
**How to avoid:** 建立正确的构建流程：先 `cd frontend && npm run build`，再 `go build`。开发阶段可以在 go:embed 指令中使用 `all:` 后缀或保持 `dist/` 目录存在。
**Warning signs:** `go build` 报错 "no matching files found"。

### Pitfall 3: 前端 fetch 的 base URL 与 go:embed 服务路径不匹配
**What goes wrong:** 前端 `fetch('/api/calculate')` 在开发时请求 `http://localhost:5173/api/calculate`（Vite dev server），但 API 在 `http://localhost:8080`。
**Why it happens:** Vite dev server 和 Go server 运行在不同端口。
**How to avoid:** 两种策略：(1) 始终通过 `go:embed` 构建后测试（推荐，与 D-06 一致），不需要 dev server；(2) 配置 Vite proxy 代理 `/api` 到 Go server。
**Warning signs:** 前端请求返回 404 或 CORS 错误。

### Pitfall 4: SPA fallback 拦截 collector 端点
**What goes wrong:** POST `/__codepoint__` 返回 `index.html` 而非被 collector handler 处理。
**Why it happens:** Go 1.22+ 的 `http.ServeMux` 按注册顺序匹配，如果 SPA fallback 的 `"/"` handler 先注册，会拦截所有请求。
**How to avoid:** 确保 `/__codepoint__` 和 `/api/` 路由在 SPA fallback 之前注册。
**Warning signs:** 前端探针 POST 返回 200 但响应体是 HTML 而非 204。

### Pitfall 5: codepoint toggle 文件作用域问题
**What goes wrong:** 前端探针 POST 到 `/__codepoint__` 但 collector 返回 404。
**Why it happens:** `~/.codepoint/.codepoint-ts` toggle 文件不存在。collector.go 的 `initCollector()` 检查此文件，不存在则 `tsEnabled = false`。
**How to avoid:** 在启动 Go server 前确保两个 toggle 文件都存在。参考 go-calculator 的 `ensureCodepointToggle()` 模式。
**Warning signs:** collector handler 返回 404，前端 `_endpointAlive` 被设为 false。

## Code Examples

### Collector 增强（支持 flow_id 路由）

```go
// codepoint/collector.go — enhanced version with flow file routing
// CRITICAL: This is an ENHANCEMENT over the golang.md template to support FULL-03/FULL-04

var (
    tsEnabled   bool
    tsOutFile   *os.File
    tsCloseFn   func()
    tsOutDir    string
    tsTimestamp string
    tsMillis    int
    tsProject   string
    tsFlowFiles map[string]*os.File
    tsMu        sync.Mutex
)

// CollectorHandler returns an http.HandlerFunc that receives frontend code points.
// Enhanced: routes entries with flow_id to flow-specific files.
func CollectorHandler() http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if !tsEnabled || tsOutFile == nil {
            http.NotFound(w, r)
            return
        }
        var entry FrontendEntry
        if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
            http.Error(w, "bad request", http.StatusBadRequest)
            return
        }

        // Extract flow_id from meta
        flowID := ""
        if entry.Meta != nil {
            if v, ok := entry.Meta["flow_id"]; ok {
                if s, ok := v.(string); ok && s != "" {
                    flowID = s
                }
            }
        }

        tsMu.Lock()
        defer tsMu.Unlock()

        if flowID != "" {
            // Route to flow-specific file (matching Go side behavior)
            w := getOrCreateTsFlowFile(flowID)
            // Write structured JSON (not raw text) for parseable output
            data, _ := json.Marshal(map[string]any{
                "name":      entry.Name,
                "timestamp": entry.Timestamp,
                "meta":      entry.Meta,
                "stack":     entry.Stack,
            })
            fmt.Fprintf(w, "%s\n", data)
        } else {
            // No flow_id -> general file
            fmt.Fprintf(tsOutFile, "[CODEPOINT] %s\n%s\n", entry.Name, entry.Stack)
        }

        w.WriteHeader(http.StatusNoContent)
    }
}
```
**Source:** Based on golang.md collector.go template + data-model.md per-flow routing spec

### Vite 配置（适配 go:embed）

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',        // Go server serves at root
  build: {
    outDir: 'dist', // go:embed frontend/dist/*
    emptyOutDir: true,
  },
})
```
**Source:** [CITED: vite.dev/config/build-options]

### 构建与运行脚本

```bash
# 完整构建流程
cd tmp/gojs-calculator/frontend && npm install && npm run build
cd tmp/gojs-calculator && go build -o gojs-calculator.exe .

# 确保 toggle 文件
touch ~/.codepoint/.codepoint-go
touch ~/.codepoint/.codepoint-ts

# 运行
./gojs-calculator.exe
# 监听 :8080，API + 嵌入前端 + collector
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 单独部署前端和后端 | go:embed 单 binary 部署 | Go 1.16+ | 简化部署，本项目的核心模式 |
| 前端探针写 console.error | Browser mode POST 到 collector | V2 设计 | 全栈项目统一日志输出 |
| 所有探针写一个日志文件 | Per-flow 文件路由 | V2 设计 | 按业务流分析堆栈差异 |
| 手动设置 flow_id 常量 | context.Context 自动传播 | Go calculator | 同一请求中所有探针自动获取 flow_id |

**Deprecated/outdated:**
- CRA (Create React App): 社区已迁移到 Vite [ASSUMED]
- Go < 1.22 的 ServeMux: 不支持 `POST /path` 方法路由 [VERIFIED: golang.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | React 18.x 和 Vite 6.x 可用且兼容 Node.js 22 | Standard Stack | 需要调整版本，但不影响架构 |
| A2 | Vite `base: '/'` 配置在 go:embed 模式下工作正常 | Architecture Patterns | 可能需要调整 asset 引用路径 |
| A3 | go:embed 的 `//go:embed frontend/dist/*` 可以递归嵌入子目录 | Pattern 1 | Go embed 需要 `all:` 后缀才能嵌入以 `.` 或 `_` 开头的文件 |
| A4 | collector.go 的增强不会影响 golang.md 模板的向后兼容性 | Common Pitfalls 1 | 如果增强改了签名，下游用户代码可能不兼容 |
| A5 | codepoint scan 技能可以同时检测 Go+JS 双语言项目 | FULL-02 | 可能需要前端和后端分别 scan |

## Open Questions

1. **Collector 增强 vs 单文件输出？**
   - What we know: golang.md collector 模板不支持 flow_id 路由。Go 端 `PointWithMeta` 支持。
   - What's unclear: 是否应该在 Phase 35 中增强 collector 并同步更新 golang.md 模板？还是保持 collector 简单，仅使用单文件输出？
   - Recommendation: 增强 collector 支持 flow_id 路由。原因：(1) FULL-04 要求验证"完整调用链堆栈信息"，per-flow 文件是已有的设计模式；(2) 单文件输出导致 flow 关联需要手动解析；(3) 增强 collector 的改动量小，复用 `getOrCreateFlowFile` 模式即可。但需注意这属于对模板的修改，可能需要在 FIX2 阶段记录。

2. **codepoint scan 对双语言项目的支持程度？**
   - What we know: scan 技能检测 `go.mod` 和 `package.json` 来识别项目类型。
   - What's unclear: scan 是否支持同时识别两个语言并生成跨语言的 collection/flow？
   - Recommendation: 如果 scan 不直接支持，可以分别对 frontend/ 和后端 Go 代码进行两次 scan，然后手动在 index.json 中关联。

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Go | 后端编译和运行 | Yes | 1.24.11 | -- |
| Node.js | 前端构建 (Vite) | Yes | v22.14.0 | -- |
| npm | 前端依赖安装 | Yes | 10.9.2 | -- |
| ~/.codepoint/.codepoint-go | Go 探针 toggle | Yes | -- | -- |
| ~/.codepoint/.codepoint-ts | 前端探针 toggle | Yes | -- | -- |
| Go module cache | 编译依赖 | Yes | -- | -- |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

> config.json 未设置 `workflow.nyquist_validation`，但默认值为 enabled。

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Go testing + Go vet (后端), Vitest (前端) |
| Config file | Go: 无需额外配置; 前端: vitest.config.ts (Wave 0) |
| Quick run command | `go test ./... -v -run TestCalc` |
| Full suite command | `go test ./... -v && cd frontend && npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FULL-01 | 项目构建成功 | smoke | `cd tmp/gojs-calculator && go build ./...` | No — Wave 0 |
| FULL-01 | 前端构建成功 | smoke | `cd tmp/gojs-calculator/frontend && npm run build` | No — Wave 0 |
| FULL-01 | API 端点返回正确结果 | integration | `curl -X POST localhost:8080/api/calculate -d '{"expression":"2+3"}'` | No — Wave 0 |
| FULL-02 | scan 识别到前后端业务流 | manual | `/codepoint:scan` in project directory | No — Wave 0 |
| FULL-03 | collector 收到前端探针数据 | integration | 检查 `~/.codepoint/gojs-calculator/cp-ts-*.log` 文件存在且非空 | No — Wave 0 |
| FULL-04 | 同一 flow_id 出现在 cp-go 和 cp-ts 日志中 | manual | `grep "flow-api-calculate" ~/.codepoint/gojs-calculator/*.log` | No — Wave 0 |
| FULL-04 | 不同流程的共享代码点输出不同堆栈 | manual | 对比 cp-go-flow-api-calculate vs cp-go-flow-history-query 中的 cp-calc-compute 堆栈 | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `go build ./...` + `go vet ./...`
- **Per wave merge:** `go test ./... -v`
- **Phase gate:** 全栈启动 + 三个业务流执行 + 日志文件检查

### Wave 0 Gaps
- [ ] `tmp/gojs-calculator/codepoint/codepoint.go` — 复用自 go-calculator
- [ ] `tmp/gojs-calculator/codepoint/collector.go` — 从 golang.md 模板（需增强）
- [ ] `tmp/gojs-calculator/internal/calculator/calculator.go` — 复用自 go-calculator
- [ ] `tmp/gojs-calculator/internal/calculator/calculator_test.go` — 复用测试
- [ ] `tmp/gojs-calculator/internal/api/server_test.go` — API 端点测试
- [ ] `tmp/gojs-calculator/frontend/` — Vite+React 项目脚手架
- [ ] `tmp/gojs-calculator/frontend/src/lib/codepoint.ts` — 前端探针库
- [ ] `tmp/gojs-calculator/frontend/vitest.config.ts` — 前端测试配置
- [ ] Go module init: `go mod init gojs-calculator` in project root
- [ ] npm init: `npm create vite@latest frontend -- --template react-ts`

## Security Domain

> 基础设施：全栈探针收集系统，非面向终端用户的 Web 应用。

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | 测试项目，无需认证 |
| V3 Session Management | No | 无会话管理 |
| V4 Access Control | No | 本地测试项目 |
| V5 Input Validation | Yes | Go 后端对 API 输入有基本验证（calculator.Validate），前端输入通过 JSON schema |
| V6 Cryptography | No | 无加密需求 |

### Known Threat Patterns for Go+embed stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Collector 端点无认证 | Tampering | 测试项目可接受，生产环境需添加认证或限制为 localhost |
| go:embed 暴露源码 | Information Disclosure | 只 embed dist/ 构建产物，不 embed 源码 |
| 路径遍历 (embed.FS) | Information Disclosure | embed.FS 天然安全——无法访问 embed 范围外的文件 |

## Sources

### Primary (HIGH confidence)
- golang.md (Phase 34 已修复版本) — Go 探针模板、collector 实现、go:embed 集成
- frontend.md — JS/TS 探针基础库、browser mode、V2 probe 模板
- data-model.md — 三层数据模型、per-flow 文件输出规范
- tmp/go-calculator/ — 已验证的 Go 单语言项目架构（所有 .go 文件已读取）
- go version output — Go 1.24.11 [VERIFIED]
- node/npm version output — Node.js v22.14.0, npm 10.9.2 [VERIFIED]

### Secondary (MEDIUM confidence)
- Vite build-options docs — outDir 和 base 配置 [CITED: vite.dev/config/build-options]
- go:embed pattern — 社区标准模式 [ASSUMED, Go 1.16+ feature]

### Tertiary (LOW confidence)
- React 18.x / Vite 6.x 版本兼容性 [ASSUMED — 未通过 npm view 验证]
- codepoint scan 技能对双语言项目的支持 [ASSUMED — 需实际运行验证]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Go/Node 已安装并验证版本
- Architecture: HIGH — go:embed + collector + React 模式都有明确参考文档
- Pitfalls: HIGH — collector flow_id 丢弃问题已通过代码分析确认

**Research date:** 2026-04-18
**Valid until:** 30 天（Go 1.24 和 Vite 6.x 为稳定版本，不易过时）
