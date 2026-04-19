# Phase 36: Python+TS 全栈跨语言集成 - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

创建 Python+TS 全栈计算器项目，验证跨语言探针联动和 Toggle 机制。前端 React TS 调用后端 FastAPI Python API，前端探针数据通过 collector 端点被后端收集。运行完整 codepoint scan/plan/implement 流程，验证同一跨语言代码点在不同业务流程下输出完整的调用链堆栈信息。Toggle 机制通过文件 toggle 可独立启用/禁用前端和后端探针。

</domain>

<decisions>
## Implementation Decisions

### Python 后端框架
- **D-01:** 使用 FastAPI 作为 Python 后端框架。python.md 模板中已有完整的 FastAPI collector 集成示例代码。
- **D-02:** 后端复刻 Go 计算器的三业务流共享核心计算架构（API 计算、历史查询、批量处理），核心管道：Parse → Validate → Compute → Format。

### 前端构建集成
- **D-03:** 前端使用 React + TypeScript + Vite（与 Phase 35 gojs-calculator 一致）。
- **D-04:** 前端构建产物通过 FastAPI StaticFiles mount 提供静态文件服务。前端构建到 `frontend/dist/`，FastAPI 启动时 mount。

### Toggle 验证深度
- **D-05:** 完整四组合验证 Toggle 独立控制：前端开/关 × 后端开/关。每种组合验证对应的日志输出是否存在。切换后重新运行立即生效。
  - `.codepoint-python` 控制 Python 后端探针（cp-python-*.log）
  - `.codepoint-ts` 控制 TS 前端探针（cp-ts-*.log）
  - 两个 toggle 文件天然独立，验证确认互不干扰

### 项目结构和命名
- **D-06:** 项目位于 `tmp/pyts-calculator/`。后端 Python 代码在根目录，前端在 `frontend/` 子目录。与 gojs-calculator 结构一致。

### Claude's Discretion
- FastAPI API 路由的具体设计（是否完全复制 gojs-calculator 的路由结构）
- 前端 React 组件的具体实现（UI 细节、状态管理方式）
- 批量计算的前端交互方式（文件上传还是文本输入）
- 测试用例的具体编写方式
- Toggle 验证的具体测试脚本设计

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 技能参考文档（包含 collector 实现和探针模板）
- `plugins/codepoint/references/python.md` §7 — Python Frontend Collector 实现代码（collector.py, FastAPI/Flask 集成示例）
- `plugins/codepoint/references/python.md` §2 — FastAPI Middleware Chain 探针模式
- `plugins/codepoint/references/frontend.md` — JS/TS 探针实现指南（base library, browser mode with backend collector）
- `plugins/codepoint/references/data-model.md` — 数据模型定义（CodePoint, Flow, Collection）

### 现有测试项目（架构参考）
- `tmp/gojs-calculator/` — Go+JS 全栈计算器（Phase 35 完成，跨语言探针联动的成功参考）
- `tmp/gojs-calculator/frontend/` — React + Vite 前端结构（codepoint.ts、组件模式可参考）
- `tmp/gojs-calculator/internal/` — Go 后端架构（三业务流设计可参考）
- `tmp/python-calculator/` — Python 单语言计算器（Python 探针基础库可复用）
- `tmp/go-calculator/` — Go 单语言计算器（多流程共享核心计算架构原始设计）

### Phase 35 结果（跨语言集成上下文）
- `.planning/phases/35-gojs-fullstack-calc/35-CONTEXT.md` — Go+JS 全栈集成决策和验证模式
- `.planning/phases/35-gojs-fullstack-calc/35-04-SUMMARY.md` — collector 联动和多流程验证结果

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tmp/python-calculator/codepoint/__init__.py`: Python 探针基础库（已验证可用）
- `tmp/gojs-calculator/frontend/src/lib/codepoint.ts`: TS 前端探针基础库（可直接复制）
- `tmp/gojs-calculator/frontend/src/`: React 组件（Calculator、History、Batch）可作为前端参考
- `tmp/gojs-calculator/internal/calculator/calculator.go`: 核心计算逻辑参考（需翻译为 Python）
- `tmp/gojs-calculator/internal/history/store.go`: 历史存储参考

### Established Patterns
- Python 探针: PointWithMeta + point_id + flow_id，显式参数传播（不同于 Go 的 context.Context）
- TS 前端探针: point() / pointWithMeta()，browser mode POST 到 /__codepoint__
- Collector: toggle 文件控制启停，404 时前端停止发送（零开销）
- 输出文件: cp-python-*.log（Python 后端）+ cp-ts-*.log（前端通过 collector）
- Python collector.py: 线程安全写入，与 FastAPI async 集成

### Integration Points
- 前端 React 构建产物 → frontend/dist/ → FastAPI StaticFiles mount
- 前端探针 → POST /__codepoint__ → Python collector → cp-ts-*.log
- 前端 fetch → FastAPI API 端点 → 共享计算路径 → Python 探针 → cp-python-*.log
- flow_id 关联: 前端设置 flow_id → API 请求携带 → 后端读取 → 日志中可关联

</code_context>

<specifics>
## Specific Ideas

- Python 后端使用 FastAPI 的 async 支持，与 Go 版本的同步风格形成对比，验证 codepoint 技能在不同并发模型下的正确性
- Toggle 独立控制验证：删除 .codepoint-ts 只保留 .codepoint-python，确认只有 cp-python 日志无 cp-ts 日志；反之亦然；两者都删除时无输出
- 前端探针在发起 API 调用前设置 flow_id，后端在同一请求中携带相同 flow_id——跨语言调用链通过 flow_id 关联

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 36-pyts-fullstack-calc*
*Context gathered: 2026-04-19*
