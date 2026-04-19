# Phase 36: Python+TS 全栈跨语言集成 - Research

**Researched:** 2026-04-19
**Domain:** Python FastAPI + React TypeScript 全栈项目，跨语言探针联动与 Toggle 机制
**Confidence:** HIGH

## Summary

Phase 36 创建 Python+TS 全栈计算器项目，是 Phase 35 (Go+JS) 的姊妹验证。核心目标有三个：(1) 用 FastAPI 替代 Go 后端，验证 codepoint 技能在不同后端框架下的正确性；(2) 实现前端 TS 探针通过 `/__codepoint__` collector 端点被 Python 后端收集的跨语言联动；(3) 验证 Toggle 机制的四组合独立控制。

项目结构直接复用 Phase 35 gojs-calculator 的架构模式：三业务流共享核心计算管道（Parse -> Validate -> Compute -> Format），Python 后端已有可完整复用的计算核心（`tmp/python-calculator/`），前端 React 组件可直接从 gojs-calculator 复制并改标题。Python collector 模板已在 `python.md` 第 7 节完整定义。

**Primary recommendation:** 直接复用现有 Python calculator 核心代码和 gojs-calculator 前端模板，重点在 FastAPI 集成、collector 端点、flow_id 跨语言关联和 Toggle 四组合验证。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 使用 FastAPI 作为 Python 后端框架。python.md 模板中已有完整的 FastAPI collector 集成示例代码。
- **D-02:** 后端复刻 Go 计算器的三业务流共享核心计算架构（API 计算、历史查询、批量处理），核心管道：Parse -> Validate -> Compute -> Format。
- **D-03:** 前端使用 React + TypeScript + Vite（与 Phase 35 gojs-calculator 一致）。
- **D-04:** 前端构建产物通过 FastAPI StaticFiles mount 提供静态文件服务。前端构建到 `frontend/dist/`，FastAPI 启动时 mount。
- **D-05:** 完整四组合验证 Toggle 独立控制：前端开/关 x 后端开/关。每种组合验证对应的日志输出是否存在。切换后重新运行立即生效。
  - `.codepoint-python` 控制 Python 后端探针（cp-python-*.log）
  - `.codepoint-ts` 控制 TS 前端探针（cp-ts-*.log）
  - 两个 toggle 文件天然独立，验证确认互不干扰
- **D-06:** 项目位于 `tmp/pyts-calculator/`。后端 Python 代码在根目录，前端在 `frontend/` 子目录。与 gojs-calculator 结构一致。

### Claude's Discretion
- FastAPI API 路由的具体设计（是否完全复制 gojs-calculator 的路由结构）
- 前端 React 组件的具体实现（UI 细节、状态管理方式）
- 批量计算的前端交互方式（文件上传还是文本输入）
- 测试用例的具体编写方式
- Toggle 验证的具体测试脚本设计

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FULL-05 | 创建 Python+TS 全栈计算器项目，同样具备跨语言共享代码点的架构 | 现有 Python calculator 核心代码（calculator/core.py）可直接复用；前端从 gojs-calculator 复制；FastAPI StaticFiles mount 方案已验证（python.md 第 7 节） |
| FULL-06 | 在 Python+TS 项目上完成 scan/跨语言联动/多流程堆栈验证全流程 | collector 端点模板在 python.md 第 7 节；flow_id 跨语言关联模式在 gojs-calculator 已验证成功；三业务流（API/History/Batch）共享核心管道的架构已建立 |
| FULL-07 | Toggle 机制在全栈项目中正常工作（文件 toggle 启用/禁用探针，前后端独立控制） | .codepoint-python 和 .codepoint-ts 两个 toggle 文件天然独立；四组合验证方案在 CONTEXT.md D-05 明确定义；Phase 35 已验证 Go+TS toggle 独立控制 |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 核心计算管道 (Parse/Validate/Compute/Format) | API / Backend | -- | Python calculator.core 模块，被三业务流共享调用 |
| API 端点 (/api/calculate, /api/history, /api/batch) | API / Backend | -- | FastAPI 路由处理 HTTP 请求 |
| 探针 Collector 端点 (/__codepoint__) | API / Backend | -- | FastAPI 接收前端 POST，写入 cp-ts-*.log |
| 静态文件服务 (frontend/dist/) | API / Backend | -- | FastAPI StaticFiles mount 提供前端构建产物 |
| React UI 组件 (Calculator/History/BatchCalc) | Browser / Client | -- | 浏览器运行，用户交互触发 API 调用和前端探针 |
| 前端探针数据采集 | Browser / Client | API / Backend | 浏览器 POST 到 /__codepoint__，后端 collector 写入日志 |
| Toggle 控制 | OS / Filesystem | -- | 文件存在性检测，两个独立文件分别控制前后端 |
| flow_id 跨语言关联 | Browser + Backend | -- | 前端设置 flow_id -> API 请求携带 -> 后端读取 -> 日志关联 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | 0.136.0 [VERIFIED: pip index] | Python 后端框架 | CONTEXT.md D-01 锁定；python.md 有完整 collector 集成模板 |
| uvicorn | 0.37.0 [VERIFIED: installed] | ASGI 服务器 | 已安装；FastAPI 标准搭配 |
| React | 19.2.5 [VERIFIED: npm view] | 前端 UI 框架 | CONTEXT.md D-03 锁定；与 gojs-calculator 一致 |
| TypeScript | 6.0.3 [VERIFIED: npm view] | 类型安全 | 与 gojs-calculator 一致 |
| Vite | 8.0.8 [VERIFIED: npm view] | 前端构建工具 | CONTEXT.md D-03 锁定；StaticFiles mount 方案 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitejs/plugin-react | ^6.0.1 | Vite React 插件 | 前端构建配置 |
| pydantic | (FastAPI 自带) | 请求/响应模型 | FastAPI 路由参数验证 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| FastAPI StaticFiles | Flask + send_from_directory | FastAPI 已锁定，且 StaticFiles 更简洁 |
| http.server (python-calculator 现有) | FastAPI | python-calculator 用 http.server，但全栈项目需要 StaticFiles 和 async 支持，FastAPI 更合适 |

**Installation:**
```bash
# Backend (在 tmp/pyts-calculator/ 目录)
python -m pip install fastapi uvicorn

# Frontend (在 tmp/pyts-calculator/frontend/ 目录)
npm install react react-dom
npm install -D typescript @types/react @types/react-dom @vitejs/plugin-react vite
```

**Version verification:**
- FastAPI: 0.136.0 (latest as of 2026-04-19, via `pip index versions fastapi`)
- uvicorn: 0.37.0 (installed in system Python)
- React: 19.2.5 (latest as of 2026-04-19, via `npm view react version`)
- Vite: 8.0.8 (latest as of 2026-04-19, via `npm view vite version`)
- TypeScript: 6.0.3 (latest as of 2026-04-19, via `npm view typescript version`)
- Python: 3.11.9 (installed)

## Architecture Patterns

### System Architecture Diagram

```
Browser (React TS)                    Python Backend (FastAPI)
========================              ========================

User Click                            uvicorn (ASGI)
   |                                     |
   v                                     |
+------------------+                     |
| Calculator.tsx   |--pointWithMeta()--> POST /__codepoint__
| History.tsx      |    (browser mode)   ---> collector.py
| BatchCalc.tsx    |                         |-> cp-ts-*.log
+------------------+                     |
   |                                     |
   | fetch /api/calculate                |
   | (with flow_id in request)           v
   |                             +---------------+
   +---------------------------->| FastAPI Route |
                                 |  server.py    |
                                 +-------+-------+
                                         |
                                         v
                                 +---------------+
                                 | calculator/   |
                                 | core.py       |
                                 | (Parse->Val-> |
                                 |  Compute->Fmt)|
                                 +-------+-------+
                                         |
                                         | point_json()
                                         v
                                    cp-python-*.log

Static Files:  frontend/dist/ --> FastAPI StaticFiles mount at /
```

### Recommended Project Structure

```
tmp/pyts-calculator/
├── codepoint/                  # Python 探针基础库 (从 python-calculator 复制)
│   ├── __init__.py             # point, point_json, point_with_meta 等
│   └── collector.py            # 前端 collector (从 python.md 第 7 节复制)
├── calculator/                 # 核心计算模块 (从 python-calculator 复制)
│   ├── __init__.py
│   └── core.py                 # parse/validate/compute/format/evaluate
├── history/                    # 历史存储
│   ├── __init__.py
│   └── store.py                # HistoryStore (从 python-calculator 复制)
├── batch/                      # 批量处理
│   ├── __init__.py
│   └── processor.py            # process_expressions (从 python-calculator 复制)
├── api/                        # FastAPI 路由
│   ├── __init__.py
│   └── server.py               # FastAPI app + routes + StaticFiles mount
├── main.py                     # 启动入口 (uvicorn)
├── tests/                      # 测试
│   ├── test_calculator.py
│   ├── test_api.py
│   └── test_integration.py
├── frontend/                   # React TS 前端
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx             # 三 tab 布局
│       ├── index.css
│       ├── vite-env.d.ts
│       ├── lib/
│       │   └── codepoint.ts    # TS 探针 (从 gojs-calculator 复制)
│       ├── api/
│       │   └── client.ts       # API 客户端 (从 gojs-calculator 复制)
│       └── components/
│           ├── Calculator.tsx
│           ├── History.tsx
│           └── BatchCalc.tsx
└── (无 requirements.txt 或 pyproject.toml -- 系统级安装即可)
```

### Pattern 1: FastAPI Server with StaticFiles + Collector

**What:** FastAPI 应用同时提供 API 端点、collector 端点和静态文件服务
**When to use:** Python+Frontend 全栈项目的主入口

```python
# Source: plugins/codepoint/references/python.md 第 7 节
from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from codepoint.collector import receive, is_ts_enabled
from history.store import HistoryStore

app = FastAPI()
store = HistoryStore()

# Collector 端点 -- 必须在 StaticFiles mount 之前注册
@app.post("/__codepoint__")
async def codepoint_collector(request: Request):
    if not is_ts_enabled():
        return Response(status_code=404)
    entry = await request.json()
    receive(entry)
    return Response(status_code=204)

# API 路由
@app.post("/api/calculate")
async def calculate(request: Request):
    ...

# StaticFiles mount -- 必须最后，否则会拦截所有路由
from pathlib import Path
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")
```

### Pattern 2: Flow ID 跨语言关联

**What:** 前端设置 flow_id，通过 API 请求传递到后端，两端日志通过 flow_id 关联
**When to use:** 所有跨语言业务流

```typescript
// 前端: Calculator.tsx
pointWithMeta('cp-fe-calc-submit', {
  point_id: 'cp-fe-calc-submit',
  flow_id: 'flow-api-calculate',
  expr: expression,
});
const resp = await calculate(expression);
// flow_id 隐式通过 API 调用传递 -- 后端在路由中硬编码对应的 flow_id
```

```python
# 后端: api/server.py
@app.post("/api/calculate")
async def handle_calculate(request: Request):
    flow_id = "flow-api-calculate"  # 与前端一致
    point_json("cp-api-calc-entry", {
        "point_id": "cp-api-calc-entry",
        "flow_id": flow_id,
    })
    result, err = evaluate(expr, flow_id=flow_id)
    ...
```

### Pattern 3: Toggle 独立控制

**What:** `.codepoint-python` 控制 Python 后端探针，`.codepoint-ts` 控制 TS 前端探针
**When to use:** Toggle 四组合验证

```
验证矩阵:
1. 两个 toggle 都存在: cp-python-*.log + cp-ts-*.log 都有输出
2. 只有 .codepoint-python: 只有 cp-python-*.log，无 cp-ts-*.log
3. 只有 .codepoint-ts: 只有 cp-ts-*.log，无 cp-python-*.log
4. 两个都不存在: 无任何日志输出
```

### Pattern 4: 三业务流共享核心管道

**What:** API 计算、历史查询（重算）、批量处理都调用同一 evaluate() 函数
**When to use:** 验证同一代码点在不同流程下的堆栈差异

```python
# 三业务流共享: calculator/core.py evaluate()
def evaluate(expr: str, flow_id: str = "") -> Tuple[str, str]:
    point_json("cp-calc-parse", {"point_id": "cp-calc-parse", "flow_id": flow_id})
    tokens = parse_expression(expr)
    point_json("cp-calc-validate", {"point_id": "cp-calc-validate", "flow_id": flow_id})
    validate_tokens(tokens)
    point_json("cp-calc-compute", {"point_id": "cp-calc-compute", "flow_id": flow_id})
    result = compute(tokens)
    point_json("cp-calc-format", {"point_id": "cp-calc-format", "flow_id": flow_id})
    return format_result(result), ""
```

### Anti-Patterns to Avoid

- **前端探针放在 useEffect 中:** React Strict Mode 会双重调用 useEffect，导致探针重复触发。所有前端探针必须在事件处理器（onClick、onKeyDown 等）中。[VERIFIED: Phase 35 经验 -- STATE.md 记录]
- **StaticFiles mount 在 API 路由之前:** StaticFiles 会拦截所有匹配的路径，API 路由和 collector 端点必须在 `app.mount("/", ...)` 之前注册。[VERIFIED: FastAPI 文档行为]
- **Python collector.py 不使用线程锁:** 多个并发前端请求可能同时写入 cp-ts 日志，必须使用 threading.Lock。[VERIFIED: python.md collector.py 模板包含 threading.Lock]
- **使用 import 后才创建 toggle 文件:** Python 探针库在 import 时检查 toggle，之后不再重新检查。Toggle 测试需要重启 FastAPI 服务。[VERIFIED: python-calculator codepoint/__init__.py -- _enabled 在模块加载时确定]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Python 探针基础库 | 自写 traceback + 文件写入 | `codepoint/__init__.py` 从 python-calculator 复制 | 已验证可用，包含线程安全、JSON 输出、density 分析 |
| 前端 TS 探针库 | 自写 Error.stack + fetch | `codepoint.ts` 从 gojs-calculator 复制 | 已验证 browser mode + collector 联动 |
| Python collector | 自写 HTTP 端点 + 文件写入 | `collector.py` 从 python.md 第 7 节复制 | 模板包含线程安全、toggle 检测、404 降级 |
| 核心计算逻辑 | 重写 parse/validate/compute | `calculator/core.py` 从 python-calculator 复制 | 已验证三业务流共享管道 |
| 历史存储 | 自写内存存储 | `history/store.py` 从 python-calculator 复制 | 包含线程安全的 HistoryStore |
| 批量处理 | 重写多行解析 | `batch/processor.py` 从 python-calculator 复制 | 已验证批量处理流程 |

**Key insight:** 本项目几乎不需要编写新代码，主要是组装现有已验证组件。真正的开发工作量在 FastAPI 集成和 Toggle 验证脚本。

## Common Pitfalls

### Pitfall 1: StaticFiles mount 顺序错误
**What goes wrong:** `app.mount("/", StaticFiles(...))` 放在 API 路由之前，导致所有 `/api/*` 和 `/__codepoint__` 请求被静态文件处理器拦截
**Why it happens:** FastAPI/Starlette 按注册顺序匹配路由，mount "/" 是通配符
**How to avoid:** 先注册所有 API 路由和 collector 端点，最后 `app.mount("/", StaticFiles(...))`
**Warning signs:** API 调用返回 HTML 而不是 JSON

### Pitfall 2: Toggle 切换后不重启服务
**What goes wrong:** 删除 .codepoint-python 后探针仍在输出，或创建后仍不输出
**Why it happens:** Python codepoint 模块在 import 时检查 toggle 文件存在性，之后 `_enabled` 布尔值不再更新
**How to avoid:** 每次切换 toggle 后重启 FastAPI 服务。在验证脚本中明确加入 `uvicorn` 启动/停止步骤
**Warning signs:** Toggle 文件已删除但日志仍在追加

### Pitfall 3: flow_id 在跨语言传递中丢失
**What goes wrong:** 前端设置了 flow_id 但后端没有使用相同的 flow_id，导致跨语言日志无法关联
**Why it happens:** 前端 flow_id 在 pointWithMeta 的 meta 中传递，但 API 请求本身不携带 flow_id
**How to avoid:** 后端在每个路由处理器中硬编码与前端一致的 flow_id（如 "flow-api-calculate"、"flow-history-query"、"flow-batch-process"），不依赖请求参数传递
**Warning signs:** cp-ts 日志有 flow_id 但 cp-python 日志没有，或 flow_id 值不匹配

### Pitfall 4: 前端构建后路径问题
**What goes wrong:** FastAPI StaticFiles 找不到 frontend/dist/ 或其中文件 404
**Why it happens:** Vite 构建输出目录配置错误，或 StaticFiles 目录路径不是绝对路径
**How to avoid:** 使用 `Path(__file__).parent.parent / "frontend" / "dist"` 计算绝对路径，构建前确认 `npm run build` 成功
**Warning signs:** 浏览器访问根路径返回 404

### Pitfall 5: Windows 路径分隔符
**What goes wrong:** 代码中使用 `/` 作为路径分隔符但在 Windows 上不工作
**Why it happens:** Windows 使用 `\` 而 Python pathlib 自动处理，但字符串拼接不会
**How to avoid:** 全部使用 `pathlib.Path` 而非字符串拼接路径。[VERIFIED: Phase 35 Bug #1 -- Windows path separator 问题]
**Warning signs:** 文件操作报 FileNotFoundError 但路径看起来正确

### Pitfall 6: 端口冲突
**What goes wrong:** 默认端口 8080 被其他进程占用
**Why it happens:** Windows 上常见端口占用
**How to avoid:** 使用非常规端口（如 18091），或启动前检测端口可用性。[VERIFIED: Phase 35 -- 端口 8080 被 dirbackup.exe 占用，改用 18090]
**Warning signs:** uvicorn 启动失败，报 "[Errno 10048] error while attempting to bind on address"

## Code Examples

### FastAPI 主入口 (main.py)

```python
# Source: 基于 python.md 第 7 节模板 + gojs-calculator 结构
"""PyTS Calculator - FastAPI entry point."""
import uvicorn
from api.server import create_app

if __name__ == "__main__":
    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=18091)
```

### FastAPI Server with Collector (api/server.py)

```python
# Source: python.md 第 7 节 + python-calculator/api/server.py 的 FastAPI 翻译
from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from calculator.core import evaluate
from history.store import HistoryStore
from batch.processor import process_expressions
from codepoint import point_json
from codepoint.collector import receive, is_ts_enabled, close_ts_collector

store = HistoryStore()
app = FastAPI()

@app.on_event("shutdown")
def shutdown():
    close_ts_collector()

@app.post("/__codepoint__")
async def codepoint_collector(request: Request):
    """Frontend probe collector -- returns 404 when disabled."""
    if not is_ts_enabled():
        return Response(status_code=404)
    entry = await request.json()
    receive(entry)
    return Response(status_code=204)

@app.post("/api/calculate")
async def handle_calculate(request: Request):
    flow_id = "flow-api-calculate"
    body = await request.json()
    expr = body.get("expression", "").strip()
    if not expr:
        return {"error": "empty expression"}

    point_json("cp-api-calc-entry", {
        "point_id": "cp-api-calc-entry",
        "flow_id": flow_id, "expr": expr,
    })

    result, err = evaluate(expr, flow_id=flow_id)
    resp = {"expression": expr}
    if err:
        resp["error"] = err
        store.add(expr, err)
    else:
        resp["result"] = result
        store.add(expr, result)

    point_json("cp-api-calc-done", {
        "point_id": "cp-api-calc-done",
        "flow_id": flow_id,
        "result": resp.get("result", ""),
        "error": resp.get("error", ""),
    })
    return resp

@app.get("/api/history")
async def handle_history_list():
    return store.get_all()

@app.get("/api/history/{record_id}")
async def handle_history_get(record_id: int):
    flow_id = "flow-history-query"
    point_json("cp-history-entry", {
        "point_id": "cp-history-entry", "flow_id": flow_id,
    })

    record = store.get(record_id)
    if record is None:
        return {"error": "not found"}

    point_json("cp-history-lookup", {
        "point_id": "cp-history-lookup",
        "flow_id": flow_id, "expr": record["expression"],
    })

    # Recompute through shared pipeline
    recomputed, calc_err = evaluate(record["expression"], flow_id=flow_id)
    resp = {**record}
    resp["recomputed"] = f"error: {calc_err}" if calc_err else recomputed

    point_json("cp-history-done", {
        "point_id": "cp-history-done",
        "flow_id": flow_id, "recomputed": resp["recomputed"],
    })
    return resp

@app.post("/api/batch")
async def handle_batch(request: Request):
    flow_id = "flow-batch-process"
    body = await request.json()
    expressions = body.get("expressions", [])

    point_json("cp-batch-entry", {
        "point_id": "cp-batch-entry",
        "flow_id": flow_id, "count": len(expressions),
    })

    input_text = "\n".join(expr.strip() for expr in expressions)
    results = process_expressions(input_text, flow_id=flow_id)

    # Store results in history
    for r in results:
        store.add(r["expr"], r.get("error") or r["result"])

    point_json("cp-batch-done", {
        "point_id": "cp-batch-done",
        "flow_id": flow_id, "count": len(results),
    })

    return {"results": [
        {"expression": r["expr"],
         "output": r.get("result", ""),
         "error": r.get("error", "")}
        for r in results
    ]}

# StaticFiles mount MUST be last
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")
```

### Python Collector (codepoint/collector.py)

```python
# Source: python.md 第 7 节 -- 完整 collector 模板
"""Frontend code point collector for Python backend."""

import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Optional, TextIO

_ts_toggle: Path = Path.home() / ".codepoint" / ".codepoint-ts"
_ts_enabled: bool = _ts_toggle.exists()
_ts_out: Optional[TextIO] = None
_ts_lock = threading.Lock()

def _init_ts_collector() -> None:
    global _ts_out
    if not _ts_enabled:
        return
    project_name = Path.cwd().name
    out_dir = Path.home() / ".codepoint" / project_name
    out_dir.mkdir(parents=True, exist_ok=True)
    now = datetime.now()
    ts = now.strftime("%Y-%m-%d_%H-%M-%S")
    ms = f"{now.microsecond // 1000:03d}"
    filename = f"cp-ts-{ts}_{ms}.log"
    _ts_out = open(out_dir / filename, "a", encoding="utf-8")
    _ts_out.write(
        f"# Code Point Log (TypeScript via Python Collector)\n"
        f"# Project: {project_name}\n"
        f"# Started: {now.isoformat()}\n"
        f"# Toggle: {_ts_toggle}\n\n"
    )
    _ts_out.flush()

def is_ts_enabled() -> bool:
    return _ts_enabled

def receive(entry: dict[str, Any]) -> bool:
    """Write a frontend code point entry. Thread-safe."""
    if not _ts_enabled or _ts_out is None:
        return False
    name = entry.get("name", "unknown")
    stack = entry.get("stack", "")
    with _ts_lock:
        _ts_out.write(f"[CODEPOINT] {name}\n{stack}\n")
        _ts_out.flush()
    return True

def close_ts_collector() -> None:
    if _ts_out and not _ts_out.closed:
        _ts_out.flush()
        _ts_out.close()

_init_ts_collector()
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Python http.server (python-calculator) | FastAPI (pyts-calculator) | Phase 36 | 需要 async/await，但 API 结构更清晰 |
| Go embed.FS (gojs-calculator) | FastAPI StaticFiles | Phase 36 | 不需要编译时嵌入，直接 mount 目录即可 |
| Go context.Context 传递 flow_id | Python 显式 flow_id 参数 | Phase 33+ | 更简单直接，但需手动传递 |

**Deprecated/outdated:**
- Python http.server: python-calculator 使用标准库 BaseHTTPRequestHandler，全栈项目改用 FastAPI

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | FastAPI StaticFiles mount "/" 不会拦截在其之前注册的路由 | Architecture Patterns | 如果会拦截，需要改变 mount 策略 |
| A2 | uvicorn 0.37.0 与 FastAPI 0.136.0 兼容 | Standard Stack | 需要降级或升级 uvicorn |
| A3 | Python 3.11.9 支持 FastAPI 0.136.0 的所有特性 | Standard Stack | 可能需要更高 Python 版本 |

## Open Questions

1. **FastAPI 0.136.0 是否需要更高 Python 版本?**
   - What we know: 当前 Python 3.11.9，FastAPI 最新 0.136.0
   - What's unclear: FastAPI 0.136.0 的最低 Python 版本要求
   - Recommendation: 安装时检查；如果需要，固定到兼容版本

2. **BatchResult 接口字段差异**
   - What we know: gojs-calculator 的 BatchResult 有 lineNumber/duration 字段，但 python-calculator 没有
   - What's unclear: 前端是否依赖这些字段
   - Recommendation: 前端 client.ts 从 gojs-calculator 复制时需要调整 BatchResult 类型以匹配 Python 后端输出

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python | Backend runtime | Available | 3.11.9 | -- |
| pip | Package management | Available | 24.0 | -- |
| FastAPI | Backend framework | Not installed | -- | `pip install fastapi` |
| uvicorn | ASGI server | Available | 0.37.0 | -- |
| Node.js | Frontend build | Available | 22.14.0 | -- |
| npm | Package management | Available | 10.9.2 | -- |

**Missing dependencies with no fallback:**
- FastAPI: 必须安装 (`python -m pip install fastapi`)

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest (Python) + curl/bash (integration) |
| Config file | none -- see Wave 0 |
| Quick run command | `python -m pytest tests/ -x -q` |
| Full suite command | `python -m pytest tests/ -v` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FULL-05 | 项目创建成功，前后端启动正常 | smoke | `curl http://localhost:18091/` | Wave 0 |
| FULL-05 | 三业务流 API 端点可用 | integration | `curl -X POST http://localhost:18091/api/calculate -d '{"expression":"2+3"}'` | Wave 0 |
| FULL-05 | 核心计算管道 (parse/validate/compute/format) 正确 | unit | `python -m pytest tests/test_calculator.py -x` | Wave 0 |
| FULL-06 | collector 端点接收前端探针数据 | integration | `curl -X POST http://localhost:18091/__codepoint__ -d '{"name":"test"}'` | Wave 0 |
| FULL-06 | 多流程堆栈验证 (同一代码点不同 flow_id) | integration | Toggle + curl 多个端点 + 检查日志 | Wave 0 |
| FULL-07 | Toggle 四组合独立控制 | manual+script | Toggle 验证脚本 | Wave 0 |

### Sampling Rate
- **Per task commit:** `python -m pytest tests/ -x -q`
- **Per wave merge:** `python -m pytest tests/ -v` + 前端 `npm run build`
- **Phase gate:** Toggle 四组合全部通过 + 多流程堆栈验证

### Wave 0 Gaps
- [ ] `tmp/pyts-calculator/tests/test_calculator.py` -- 从 python-calculator 复制
- [ ] `tmp/pyts-calculator/tests/test_api.py` -- FastAPI 路由测试
- [ ] `tmp/pyts-calculator/tests/test_integration.py` -- 跨语言联动集成测试
- [ ] FastAPI install: `python -m pip install fastapi`

## Security Domain

> 本阶段为测试项目（tmp/ 目录下的计算器示例），不涉及安全敏感操作。security_enforcement 适用但风险极低。

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | 无认证需求 (测试项目) |
| V3 Session Management | no | 无会话管理 |
| V4 Access Control | no | 无访问控制 |
| V5 Input Validation | yes | FastAPI pydantic 自动验证表达式输入 |
| V6 Cryptography | no | 无加密需求 |

### Known Threat Patterns for Python+FastAPI Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Expression injection | Tampering | calculator/core.py 只接受数字+运算符，非法字符直接拒绝 |
| JSON body injection | Tampering | FastAPI 自动 JSON 解析，非 JSON 返回 422 |

## Sources

### Primary (HIGH confidence)
- `plugins/codepoint/references/python.md` -- Python 探针实现指南，collector 模板 (第 7 节)
- `plugins/codepoint/references/frontend.md` -- TS 探针实现指南，browser mode + collector
- `tmp/gojs-calculator/` -- Phase 35 完成的全栈计算器参考项目
- `tmp/python-calculator/` -- Phase 33 完成的 Python 单语言计算器（核心代码复用源）
- `.planning/phases/35-gojs-fullstack-calc/35-04-SUMMARY.md` -- Phase 35 验证结果和 bug 记录

### Secondary (MEDIUM confidence)
- FastAPI version 0.136.0 verified via `pip index versions fastapi`
- React 19.2.5, Vite 8.0.8, TypeScript 6.0.3 verified via `npm view`

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- 所有组件版本已验证，大部分代码已有可复用的已验证实现
- Architecture: HIGH -- 直接复用 gojs-calculator 架构，仅后端框架从 Go 切换为 FastAPI
- Pitfalls: HIGH -- Phase 35 已踩过坑（端口冲突、Windows 路径、mount 顺序），本阶段有明确规避策略

**Research date:** 2026-04-19
**Valid until:** 2026-05-19 (stable stack)
