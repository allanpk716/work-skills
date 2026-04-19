# Phase 32: Go 单语言计算器验证 - Research

**Researched:** 2026-04-18
**Domain:** Go 测试项目构建 + Codepoint V2 技能端到端验证
**Confidence:** HIGH

## Summary

Phase 32 需要在 `tmp/` 目录下创建一个 Go 计算器项目，该项目包含至少 3 个业务流程（REST API、批量处理、历史查询），这些流程共享核心计算代码路径（parse -> validate -> compute -> format）。然后在项目上依次运行 `/codepoint:scan`、`/codepoint:plan`、`/codepoint:implement`，验证 Codepoint V2 技能的完整流程正确性，最终确认同一代码点的探针在不同业务流程下输出不同的堆栈信息。

Codepoint V2 采用三层数据模型：CodePoint（独立探针）-> Flow（有序组合）-> Collection（流分组）。Go 探针通过 `PointWithMeta()` 函数输出 JSON 格式的堆栈信息到 `~/.codepoint/<project>/cp-go-*.log`，通过文件 toggle (`~/.codepoint/.codepoint-go`) 控制启用/禁用。Go 1.24.11 已在环境中就绪，curl 可用，无需额外外部依赖。

**Primary recommendation:** 按照 success criteria 的顺序，先构建 Go 计算器项目（SING-01），再依次执行 scan（SING-02）-> plan（SING-03）-> implement（SING-04）-> 多流程堆栈验证（SING-05），每步验证通过后再进入下一步。

<user_constraints>
## User Constraints (from CONTEXT.md)

CONTEXT.md 不存在 -- 本阶段无用户锁定决策。以下来自 STATE.md 已记录的决策：

### Locked Decisions (from STATE.md)

1. **测试项目方法论**: 渐进式验证 -> 修复 -> 深度验证 -> 修复（SING -> FIX1 -> FULL -> FIX2 交替模式）
2. **计算器测试项目要求**: 必须包含 3+ 个业务流程共享核心计算代码点（parse -> validate -> compute -> format），以验证探针能捕获不同流程经过同一关键路径时的堆栈差异
3. **测试项目位置**: 位于 work-skills 项目的 `tmp/` 目录内

### Claude's Discretion

以下方面由研究者/规划者自主决定：
- Go 计算器的具体包结构、HTTP 框架选择（标准库 net/http vs gin）
- 计算器的业务场景设计（选择什么样的运算和表达式）
- 批量处理的具体实现方式（文件读取 vs 命令行参数 vs 标准输入）
- 历史查询的存储方式（内存 vs 文件 vs SQLite）
- 探针的具体数量和位置（由 scan 技能决定，但需验证其合理性）

### Deferred Ideas (OUT OF SCOPE)

- Rust/Java 等其他语言支持（当前技能只支持 Go/Python/TS/JS）
- 性能基准测试（本次验证功能正确性，不做性能测试）
- CI/CD 集成测试（超出技能验证范围）
- 真实生产项目测试（先在计算器示例上验证，再考虑真实项目）
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SING-01 | 创建 Go 计算器项目，包含至少 3 个业务流程共享核心计算代码（parse -> validate -> compute -> format），具备多流程复用代码点的架构 | 见 Architecture Patterns / Go Calculator Project Design |
| SING-02 | 在 Go 计算器上运行 `/codepoint:scan`，正确识别共享代码点上的多个业务流（如 API 调用流、批量处理流、历史查询流） | 见 Code Examples / Expected Scan Output |
| SING-03 | 在 Go 计算器上运行 `/codepoint:plan`，为新功能规划代码点，规划的探针位于关键路径而非随意选择 | 见 Code Examples / Expected Plan Output |
| SING-04 | 在 Go 计算器上运行 `/codepoint:implement`，探针代码编译通过，TDD 验证循环正常 | 见 Code Examples / Go Probe Template |
| SING-05 | 运行多个业务流程，验证同一代码点在不同流程下输出不同的堆栈信息和调试数据，确认探针复用有效 | 见 Common Pitfalls / Stack Trace Differentiation |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 核心计算逻辑 (parse/validate/compute/format) | Application (Go service layer) | -- | 纯业务逻辑，无外部依赖，探针主要放置于此 |
| REST API 业务流 | API Layer (net/http handler) | Application | HTTP 入口层调用服务层，探针在 handler 入口和服务边界 |
| 批量处理业务流 | CLI/Batch Layer (main/cmd) | Application | 命令行入口调用服务层，探针在 cmd 入口和服务边界 |
| 历史查询业务流 | API Layer (net/http handler) | Storage Layer | HTTP 入口层，查询历史记录，探针在 handler 和查询边界 |
| 探针输出管理 | Base Library (codepoint package) | File System | base library 通过 toggle 和 init() 管理输出 |
| 堆栈捕获与分析 | Runtime (runtime.Stack) | Base Library | Go runtime 原生能力，base library 封装调用 |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Go | 1.24.11 [VERIFIED: `go version`] | 运行时环境 | 环境已安装 |
| net/http | Go 1.24 标准库 [VERIFIED: Go docs] | HTTP 服务 | 计算器 REST API 使用标准库即可，无需第三方框架 |
| encoding/json | Go 1.24 标准库 [VERIFIED: Go docs] | JSON 序列化 | 探针输出和历史记录存储 |
| runtime | Go 1.24 标准库 [VERIFIED: Go docs] | 堆栈捕获 | `runtime.Stack()` 是探针的核心依赖 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| codepoint base library | V2 (见 references/golang.md) | 探针基础库 | 直接复制 references/golang.md 中的 codepoint.go 到测试项目 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| net/http 标准库 | gin/echo/fiber | gin 更简洁但引入第三方依赖，测试项目应尽量简单 |
| 内存存储历史 | SQLite | SQLite 更真实但增加复杂度，内存存储足够验证探针功能 |
| 文件 toggle | 环境变量 toggle | 文件 toggle 是 codepoint V2 的标准机制，不应替代 |

**Installation:**

无需安装额外依赖。Go 标准库已包含所有需要的包。codepoint base library 直接从 `plugins/codepoint/references/golang.md` 复制代码到测试项目的 `codepoint/` 包中。

**Version verification:**
```bash
go version  # go version go1.24.11 windows/amd64
```

## Architecture Patterns

### System Architecture Diagram

```
                    +------------------+
                    |   Business Flows |
                    +--------+---------+
                             |
           +-----------------+-----------------+
           |                 |                 |
     +-----v-----+    +-----v-----+    +------v------+
     | REST API  |    |  Batch    |    |  History    |
     | Handler   |    | Processor |    |  Query      |
     | (POST /api|    | (CLI cmd) |    | (GET /api/  |
     | /calc)    |    |           |    |  history)   |
     +-----+-----+    +-----+-----+    +------+------+
           |                 |                 |
           +-----------------+-----------------+
                             |
                    +--------v---------+
                    |  Core Calculator |
                    |  Service Layer   |
                    +--------+---------+
                             |
           +--------+--------+--------+--------+
           |        |        |        |        |
        +--v--+ +--v---+ +--v--+ +--v--+ +--v--+
        |Parse| |Valid-| |Comp-| |Form-| |Round|
        |     | |ate   | |ute  | |at   | |     |
        +-----+ +------+ +-----+ +-----+ +-----+
                             |
                    +--------v---------+
                    | Codepoint Base   |
                    | Library (toggle  |
                    | + output log)    |
                    +--------+---------+
                             |
                    +--------v---------+
                    | ~/.codepoint/    |
                    | <project>/       |
                    | cp-go-*.log      |
                    +------------------+
```

数据流：
1. 三个业务流入口（REST API handler、Batch processor、History query handler）均调用核心计算服务层
2. 核心服务层按 parse -> validate -> compute -> format 流水线处理
3. 探针通过 codepoint base library 输出 JSON 到日志文件
4. 同一代码点（如 compute 阶段）在不同业务流中调用时，堆栈信息因调用链不同而不同

### Recommended Project Structure

```
tmp/go-calculator/
├── go.mod                    # Go module: go-calculator
├── main.go                   # CLI entry point (batch processing flow)
├── codepoint/
│   └── codepoint.go          # Base library (from references/golang.md)
├── internal/
│   ├── calculator/
│   │   ├── calculator.go     # Core: Parse, Validate, Compute, Format
│   │   └── calculator_test.go  # Unit tests for core logic
│   ├── api/
│   │   └── server.go         # REST API handlers (REST API flow)
│   ├── batch/
│   │   └── processor.go      # Batch processing logic
│   └── history/
│       └── store.go          # In-memory history storage + query
├── .codepoints/              # Created by /codepoint:scan
│   ├── index.json
│   ├── collections/
│   ├── flows/
│   └── points/
└── tests/
    └── integration_test.go   # Integration tests (TDD verification)
```

### Pattern 1: Three-Layer Data Model (Codepoint V2)

**What:** CodePoint（独立探针）-> Flow（有序组合）-> Collection（流分组）的三层数据结构。
**When to use:** 所有 codepoint V2 项目都必须遵循此模型。
**Example:**

```
Collection: col-calculator (Calculator)
  Flow: flow-api-calculate (REST API Calculation)
    Sequence: [cp-api-calc-entry, cp-calc-parse, cp-calc-validate, cp-calc-compute, cp-calc-format, cp-api-calc-done]
    Trigger: POST /api/calculate
  Flow: flow-batch-process (Batch Processing)
    Sequence: [cp-batch-entry, cp-calc-parse, cp-calc-validate, cp-calc-compute, cp-calc-format, cp-batch-done]
    Trigger: go run main.go --batch expressions.txt
  Flow: flow-history-query (History Query)
    Sequence: [cp-history-query-entry, cp-calc-parse, cp-calc-validate, cp-calc-compute, cp-calc-format, cp-history-query-done]
    Trigger: GET /api/history/:id
```

关键：`cp-calc-parse`、`cp-calc-validate`、`cp-calc-compute`、`cp-calc-format` 这四个代码点是三个流共享的。当它们在不同流中被触发时，堆栈信息应该不同（因为调用链不同）。

### Pattern 2: Go Probe with PointWithMeta (V2 Template)

**What:** 使用 `PointWithMeta()` 函数插入探针，携带 point_id 和 flow_id。
**When to use:** 所有 Go 探针都应使用 V2 模板格式。
**Example:**

```go
// Source: [VERIFIED: plugins/codepoint/references/golang.md V2 Probe Templates section]
func (c *Calculator) Compute(ctx context.Context, expr string) (string, error) {
    codepoint.PointWithMeta("cp-calc-compute", map[string]any{
        "point_id": "cp-calc-compute",
        "flow_id":  flowID,  // 由调用者传入，标识当前业务流
        "expr":     expr,
    })
    // ... computation logic ...
}
```

**注意:** flow_id 需要在业务流入口处确定，并通过参数传递到共享代码点。这是实现堆栈区分的关键。

### Pattern 3: Toggle-Based Enable/Disable

**What:** 通过文件 `~/.codepoint/.codepoint-go` 存在与否控制探针启用/禁用。
**When to use:** 测试时启用，正常使用时禁用（零开销）。
**Example:**

```bash
# 启用 Go 探针
mkdir -p ~/.codepoint && touch ~/.codepoint/.codepoint-go

# 禁用 Go 探针
rm ~/.codepoint/.codepoint-go
```

### Pattern 4: File-Based Output Convention

**What:** 探针输出写入 `~/.codepoint/<project-dir-name>/cp-go-YYYY-MM-DD_HH-MM-SS_mmm.log`。
**When to use:** 所有 Go 探针输出。
**Example:**

```go
// Source: [VERIFIED: plugins/codepoint/references/golang.md]
// Output path format:
// ~/.codepoint/go-calculator/cp-go-2026-04-18_14-30-45_123.log
```

### Anti-Patterns to Avoid

- **探针修改业务逻辑**: 探针必须是纯增量的（additive only），不修改任何现有代码行为 [VERIFIED: SKILL.md implement section]
- **探针放在随意位置**: 探针必须放在关键路径（entry/boundary/state-change/error）上，密度需在 20-60% overlap [VERIFIED: SKILL.md scan section]
- **探针缺少 flow_id**: V2 探针必须包含 point_id 和 flow_id，否则无法区分业务流来源 [VERIFIED: references/golang.md V2 section]
- **Go 测试项目使用第三方 HTTP 框架**: 应使用标准库 net/http，保持项目简洁，避免引入不必要的复杂度
- **探针输出到 stderr**: V2 base library 通过 init() 自动创建日志文件，不需要 stderr 重定向 [VERIFIED: references/golang.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 堆栈捕获 | 自行解析堆栈字符串 | `runtime.Stack()` + base library 封装 | Go 原生 API，base library 已处理格式化 |
| Toggle 控制 | 环境变量 / 命令行参数 | 文件 toggle (`~/.codepoint/.codepoint-go`) | 这是 codepoint V2 的标准机制，与 scan/implement 技能集成 |
| 探针输出 | 自定义日志格式 | base library 的 JSON 输出格式 | 技能期望的输出格式，便于 AI 分析 |
| HTTP 服务 | 自定义路由匹配 | `net/http.NewServeMux()` | Go 1.22+ 支持方法路由，标准库足够 |
| 密度验证 | 手动对比堆栈 | `codepoint.AnalyzeOverlap()` | base library 已提供密度计算函数 |

**Key insight:** 整个 codepoint 基础设施（base library、toggle 机制、输出格式、密度验证）都已设计完成并记录在 references 中。Go 计算器测试项目只需复制 base library 代码并使用标准 API，不需要自建任何基础设施。

## Common Pitfalls

### Pitfall 1: flow_id 未传递到共享代码点
**What goes wrong:** 共享的核心计算函数（如 Compute）被三个业务流调用，但探针只记录了 point_id 而没有 flow_id，导致无法区分调用来源。
**Why it happens:** 核心函数不知道自己被哪个业务流调用。需要在函数签名中添加 flowID 参数，或在上下文（context）中传递。
**How to avoid:** 在核心计算函数的参数中显式添加 flowID string 参数，从业务流入口处一路传递下去。
**Warning signs:** 日志中同一个 point_id 的所有条目的 meta.flow_id 都相同或为空。

### Pitfall 2: Windows 路径问题
**What goes wrong:** codepoint base library 在 Windows 上运行时，`os.UserHomeDir()` 和 `filepath.Join` 可能有路径问题。
**Why it happens:** Go 的 `filepath.Join` 在 Windows 上使用反斜杠，但日志中的路径可能混合使用正斜杠和反斜杠。
**How to avoid:** base library 使用 `filepath.Join` 而非手动拼接，通常能正确处理。验证时检查 OutputPath() 返回的路径是否有效。
**Warning signs:** 日志文件未创建，或 OutputPath() 返回空字符串。

### Pitfall 3: 探针在测试中的 Toggle 管理
**What goes wrong:** 运行 `go test` 时 toggle 文件可能不存在，导致探针全部静默跳过，测试误报通过。
**Why it happens:** 测试环境和开发环境可能共享同一个 home 目录，toggle 文件可能被意外删除。
**How to avoid:** 在 `TestMain` 中创建 toggle 文件，测试结束后清理。参考 references/golang.md 的 Density Validation 部分。
**Warning signs:** 所有测试都通过但日志文件为空。

### Pitfall 4: goroutine 中的堆栈捕获
**What goes wrong:** 如果批量处理使用 goroutine 并发，`runtime.Stack(buf, false)` 只捕获当前 goroutine 的堆栈，不同 goroutine 的堆栈可能丢失。
**Why it happens:** `runtime.Stack(buf, false)` 的 `false` 参数表示不捕获所有 goroutine。
**How to avoid:** 每个探针调用都在自己的 goroutine 中执行（在 goroutine 内部调用 PointWithMeta），所以不需要 `true`。但如果需要完整的并发视图，需要额外处理。
**Warning signs:** 日志中只有主 goroutine 的堆栈。

### Pitfall 5: Scan 未能识别共享代码点
**What goes wrong:** `/codepoint:scan` 将三个业务流视为独立模块，没有识别出它们共享的核心计算路径。
**Why it happens:** scan 技能依赖代码结构分析，如果共享代码的组织方式不够清晰（如 inline 代码），可能无法正确识别。
**How to avoid:** 将核心计算逻辑放在独立的 `internal/calculator/` 包中，三个业务流通过调用该包的函数来使用核心逻辑。清晰的包边界有助于 scan 识别。
**Warning signs:** scan 输出的 collections/flows 中没有跨流的共享代码点。

### Pitfall 6: 实现的探针编译失败
**What goes wrong:** `/codepoint:implement` 生成的探针代码引用了未导入的包，导致 `go build` 失败。
**Why it happens:** implement 技能可能在插入探针代码时没有正确添加 `"codepoint"` 包的 import 语句。
**How to avoid:** 实现后手动运行 `go build ./...` 验证编译。如果失败，添加缺失的 import 语句。
**Warning signs:** `go build` 报错 "undefined: codepoint" 或 "imported and not used"。

## Code Examples

### Go Calculator Core (Shared Code Path)

```go
// internal/calculator/calculator.go
package calculator

import (
    "fmt"
    "strings"
    "errors"
)

// Parse splits expression into tokens
func Parse(expr string) ([]string, error) {
    // ... parse logic ...
}

// Validate checks if tokens form a valid expression
func Validate(tokens []string) error {
    // ... validation logic ...
}

// Compute evaluates the expression
func Compute(tokens []string) (float64, error) {
    // ... computation logic ...
}

// Format formats the result for output
func Format(result float64) string {
    return fmt.Sprintf("%.4f", result)
}
```

### REST API Flow Entry

```go
// internal/api/server.go
package api

func (s *Server) HandleCalculate(w http.ResponseWriter, r *http.Request) {
    codepoint.PointWithMeta("cp-api-calc-entry", map[string]any{
        "point_id": "cp-api-calc-entry",
        "flow_id":  "flow-api-calculate",
    })

    expr := r.FormValue("expr")
    tokens, err := calculator.Parse(expr)
    // ... continues through shared path ...
}
```

### Batch Processing Flow Entry

```go
// internal/batch/processor.go
package batch

func ProcessFile(ctx context.Context, filePath string) error {
    codepoint.PointWithMeta("cp-batch-entry", map[string]any{
        "point_id": "cp-batch-entry",
        "flow_id":  "flow-batch-process",
    })

    lines := readFile(filePath)
    for _, line := range lines {
        tokens, err := calculator.Parse(line)
        // ... continues through shared path ...
    }
}
```

### Expected Scan Output Structure

```
## Discovered Collections

### col-calculator (Calculator)
- flow-api-calculate: POST /api/calculate -> Parse -> Validate -> Compute -> Format -> JSON response
- flow-batch-process: CLI --batch file.txt -> ReadFile -> Parse -> Validate -> Compute -> Format -> WriteOutput
- flow-history-query: GET /api/history/:id -> Store.Lookup -> Parse -> Validate -> Compute -> Format -> HistoryResponse

## Shared Code Points (across all 3 flows)
- cp-calc-parse: internal/calculator/calculator.go:XX (parse entry)
- cp-calc-validate: internal/calculator/calculator.go:XX (validate entry)
- cp-calc-compute: internal/calculator/calculator.go:XX (compute entry)
- cp-calc-format: internal/calculator/calculator.go:XX (format entry)
```

### Expected Plan Output Structure

```
## Code Point Plan: Calculator V2 Enhancement

### Collection: col-calculator

### Flow: flow-api-calculate
> Trigger: POST /api/calculate
> Sequence: [cp-api-calc-entry, cp-calc-parse, cp-calc-validate, cp-calc-compute, cp-calc-format, cp-api-calc-done]

#### Code Points

| ID | Type | Location | Description |
|----|------|----------|-------------|
| cp-api-calc-entry | entry | internal/api/server.go:XX | REST API handler entry |
| cp-calc-parse | boundary | internal/calculator/calculator.go:XX | Parse entry (shared) |
| cp-calc-validate | boundary | internal/calculator/calculator.go:XX | Validate entry (shared) |
| cp-calc-compute | state-change | internal/calculator/calculator.go:XX | Compute entry (shared) |
| cp-calc-format | boundary | internal/calculator/calculator.go:XX | Format entry (shared) |
| cp-api-calc-done | entry | internal/api/server.go:XX | REST API handler done |
```

### Expected Probe Output (Stack Differentiation)

```json
// Flow 1: REST API 调用
{"name":"cp-calc-compute","timestamp":"...","meta":{"point_id":"cp-calc-compute","flow_id":"flow-api-calculate","expr":"2+3*4"},"stack":"...\nmain.HandleCalculate\ninternal/api/server.go:42\n..."}

// Flow 2: Batch 处理
{"name":"cp-calc-compute","timestamp":"...","meta":{"point_id":"cp-calc-compute","flow_id":"flow-batch-process","expr":"10/2"},"stack":"...\nbatch.ProcessFile\ninternal/batch/processor.go:28\n..."}

// Flow 3: History 查询
{"name":"cp-calc-compute","timestamp":"...","meta":{"point_id":"cp-calc-compute","flow_id":"flow-history-query","expr":"5^2"},"stack":"...\nmain.HandleHistory\ninternal/api/server.go:78\n..."}
```

关键差异：
1. `meta.flow_id` 不同 -- 标识来源流
2. `stack` 中的调用链不同 -- API 调用 vs batch 调用 vs history 查询的堆栈帧不同

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `codepoint.Point(name)` 无 metadata | `codepoint.PointWithMeta(name, meta{point_id, flow_id})` | V2 (current) | 探针可被 collection 查询和过滤 |
| stderr 输出 | 文件输出 (`~/.codepoint/<project>/cp-go-*.log`) | V2 (current) | 输出结构化，AI 可直接读取分析 |
| 单一探针列表 | 三层数据模型 (Point -> Flow -> Collection) | V2 (current) | 支持业务流级别的调试和过滤 |
| 手动密度验证 | `AnalyzeOverlap()` 自动计算 | V2 (current) | 量化探针密度，目标 20-60% overlap |

**Deprecated/outdated:**
- 无 -- Codepoint V2 是当前版本，所有参考文档都是 V2 格式。

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Go 1.24.11 的 `net/http.NewServeMux()` 支持 HTTP 方法路由 (Go 1.22+ 特性) | Standard Stack | 如果版本不够需要手动路由分发 |
| A2 | Windows 上 `touch` 命令可用 (Git Bash 提供) | Toggle Mechanism | 如果不可用需用 `echo. >` 或 Go 代码创建 toggle 文件 |
| A3 | `runtime.Stack()` 在 Windows Go 1.24.11 上输出可用的堆栈信息 | Code Examples | 如果输出格式不同，堆栈解析可能需要调整 |
| A4 | `/codepoint:scan` 技能能正确分析 Go 标准库 net/http 的路由结构 | Common Pitfalls | 如果不能，可能需要调整项目结构或手动辅助 scan |

**If this table is empty:** All claims in this research were verified or cited -- no user confirmation needed.

## Open Questions

1. **共享代码点是否需要 flow_id 参数传递？**
   - What we know: V2 探针模板要求 `flow_id` 在 meta 中。核心计算函数被多个流调用，需要知道当前流。
   - What's unclear: 核心函数的签名需要修改来接受 flowID，这可能影响测试项目的"自然度"。
   - Recommendation: 修改核心函数签名，添加 `flowID string` 参数。这是合理的 -- 生产项目中通过 context 传递流标识是常见做法。

2. **TDD 验证循环的具体实现方式？**
   - What we know: implement SKILL.md 定义了 Red -> Green -> Verify 三阶段。
   - What's unclear: 具体的测试文件由 implement 技能自动生成还是手动编写。
   - Recommendation: 按照 implement SKILL.md 的流程，测试文件应由 implement 技能生成。如果技能不支持自动生成，则手动编写。

3. **探针的 Toggle 在 `go test` 中的处理？**
   - What we know: Toggle 通过文件存在与否控制。测试时需要 toggle 存在。
   - What's unclear: implement 的 Verify 阶段是否自动创建 toggle 文件。
   - Recommendation: 在 TestMain 中创建 toggle 文件，确保测试时探针启用。

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Go | Go 计算器项目编译和运行 | Yes | 1.24.11 | -- |
| curl | 测试 REST API 端点 | Yes | (Git Bash) | -- |
| touch | 创建 toggle 文件 | Yes | (Git Bash) | 使用 Go 代码创建文件 |
| net/http | HTTP 服务 | Yes | Go 1.24 标准库 | -- |
| runtime | 堆栈捕获 | Yes | Go 1.24 标准库 | -- |
| ~/.codepoint/ | 探针输出目录 | 需要创建 | -- | base library init() 自动创建 |

**Missing dependencies with no fallback:**
- 无

**Missing dependencies with fallback:**
- 无

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Go testing (标准库) |
| Config file | none -- 使用 Go 标准 `*_test.go` 约定 |
| Quick run command | `cd tmp/go-calculator && go test ./internal/calculator/ -v -run TestCore -count=1` |
| Full suite command | `cd tmp/go-calculator && go test ./... -v -count=1` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SING-01 | Go 项目存在且包含 3 个业务流共享核心代码 | integration | `cd tmp/go-calculator && go build ./... && go test ./... -v` | Wave 0 |
| SING-02 | scan 识别共享代码点和多业务流 | manual + file check | `cat .codepoints/index.json` (验证结构) | Wave 0 |
| SING-03 | plan 探针位于关键路径 | manual + file check | `cat .codepoints/flows/*.md` (验证位置) | Wave 0 |
| SING-04 | 探针代码编译通过 | unit | `cd tmp/go-calculator && go build ./...` | Wave 0 |
| SING-04 | TDD 验证循环正常 | integration | `cd tmp/go-calculator && go test ./... -v` (带 toggle) | Wave 0 |
| SING-05 | 不同流输出不同堆栈 | integration + log analysis | `cd tmp/go-calculator && go test ./tests/ -v -run TestMultiFlowStack` | Wave 0 |

### Sampling Rate

- **Per task commit:** `cd tmp/go-calculator && go build ./... && go test ./... -v -count=1`
- **Per wave merge:** `cd tmp/go-calculator && go test ./... -v -count=1`
- **Phase gate:** Full suite green + 手动验证 scan/plan/implement 输出 + 堆栈差异分析

### Wave 0 Gaps

- [ ] `tmp/go-calculator/internal/calculator/calculator_test.go` -- covers SING-01 core logic tests
- [ ] `tmp/go-calculator/internal/api/server_test.go` -- covers SING-01 REST API flow tests
- [ ] `tmp/go-calculator/internal/batch/processor_test.go` -- covers SING-01 batch flow tests
- [ ] `tmp/go-calculator/internal/history/store_test.go` -- covers SING-01 history flow tests
- [ ] `tmp/go-calculator/tests/integration_test.go` -- covers SING-05 multi-flow stack differentiation
- [ ] `tmp/go-calculator/codepoint/codepoint.go` -- base library (copy from references)
- [ ] Framework install: 无需 -- Go 标准库已包含

## Security Domain

本阶段为测试项目验证，不涉及安全敏感操作。codepoint 探针的 toggle 机制通过文件系统控制，不存在远程攻击面。

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A (测试项目无认证) |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | Yes | Go 标准库对计算器输入进行验证 |
| V6 Cryptography | No | N/A |

探针输出文件权限为默认 0644，写入用户 home 目录下的 `.codepoint/` 子目录。这是预期的行为 -- 日志仅供开发者本地调试使用。

## Sources

### Primary (HIGH confidence)
- [VERIFIED: plugins/codepoint/references/golang.md] -- Go base library 完整代码、V2 探针模板、Toggle 机制、输出格式
- [VERIFIED: plugins/codepoint/references/data-model.md] -- 三层数据模型规范、代码点类型定义、密度验证标准
- [VERIFIED: plugins/codepoint/skills/codepoint/SKILL.md] -- Codepoint V2 总览、命令列表、存储结构
- [VERIFIED: plugins/codepoint/skills/scan/SKILL.md] -- Scan 两阶段流程、代码点命名约定、密度验证
- [VERIFIED: plugins/codepoint/skills/plan/SKILL.md] -- Plan 流程、代码点类型选择标准
- [VERIFIED: plugins/codepoint/skills/implement/SKILL.md] -- Implement 三阶段 TDD 循环、验证报告格式
- [VERIFIED: `go version`] -- Go 1.24.11 windows/amd64 已安装
- [VERIFIED: .planning/REQUIREMENTS.md] -- SING-01 ~ SING-05 需求定义
- [VERIFIED: .planning/STATE.md] -- 已记录的决策（测试项目位置、方法论、3+ 业务流要求）

### Secondary (MEDIUM confidence)
- [VERIFIED: CLAUDE.md] -- 项目约束（tmp/ 目录、中文交流、Windows 开发环境）

### Tertiary (LOW confidence)
- 无 -- 所有关键信息都来自项目内部文件或环境验证

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Go 环境已验证，所有依赖为标准库
- Architecture: HIGH - 基于 codepoint V2 技能定义文档，结构清晰
- Pitfalls: MEDIUM - 部分陷阱基于代码分析推断，需实际运行验证（特别是 scan 对 Go 项目的识别能力）

**Research date:** 2026-04-18
**Valid until:** 30 days (codepoint V2 技能定义和 Go 标准库都是稳定的)
