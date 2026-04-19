# Phase 35: Go+JS 全栈跨语言集成 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 35-Go+JS 全栈跨语言集成
**Areas discussed:** 全栈项目架构, 前端业务流设计, 跨语言探针联动验证, 验证策略

---

## 全栈项目架构

| Option | Description | Selected |
|--------|-------------|----------|
| 扩展现有 Go calculator | 在 tmp/go-calculator/ 基础上添加 web/ 目录，go:embed 嵌入，改动最小 | |
| 全新全栈项目 | 在 tmp/ 下创建 gojs-calculator/，从零搭建 | ✓ |
| 扩展 + 前端独立目录 | 在 go-calculator 内创建 frontend/ 子目录 | |

**User's choice:** 全新全栈项目
**Notes:** 用户选择全新项目而非扩展现有，保持测试项目独立性

### 前端服务方式

| Option | Description | Selected |
|--------|-------------|----------|
| go:embed 嵌入 | 构建后嵌入 Go binary，单进程服务 | ✓ |
| 开发服务器分离 | Vite dev server + Go 后端独立运行 | |
| 混合模式 | embed + 可选 dev server | |

**User's choice:** go:embed 嵌入

---

## 前端业务流设计

### 业务流范围

| Option | Description | Selected |
|--------|-------------|----------|
| 计算器 UI + 历史查询 | 两个主要页面/功能 | |
| 三个业务流（计算 + 历史 + 批量） | 对应后端三个 API | |
| 完整复刻后端三个流 | 前端覆盖全部功能，最大化跨语言探针覆盖 | ✓ |

**User's choice:** 完整复刻后端三个流

### 前端技术栈

| Option | Description | Selected |
|--------|-------------|----------|
| 原生 JS + HTML | 代码量少，探针逻辑清晰 | |
| React | 更接近真实项目，但增加构建复杂度 | ✓ |
| 原生 JS + Vite 构建 | 构建后 embed | |

**User's choice:** React

---

## 跨语言探针联动验证

### Collector 实现

| Option | Description | Selected |
|--------|-------------|----------|
| 复用 golang.md collector 模板 | 直接复制已验证的 collector 代码 | ✓ |
| 合并 collector 到 codepoint 包 | 更简洁但需修改已验证代码 | |
| Claude 自行决定 | 灵活实现 | |

**User's choice:** 复用 golang.md collector 模板

### 探针关联方式

| Option | Description | Selected |
|--------|-------------|----------|
| flow_id 关联为主 | 同一 flow_id 出现在前后端日志中 | ✓ |
| 时间戳关联为主 | 简单但不精确 | |
| Claude 自行决定 | | |

**User's choice:** flow_id 关联为主

---

## 验证策略

### 验证流程

| Option | Description | Selected |
|--------|-------------|----------|
| 完整 scan/plan/implement 流程 | 验证完整技能工作流 | ✓ |
| 手动探针 + 联动验证 | 跳过技能流程，更快速 | |

**User's choice:** 完整 scan/plan/implement 流程

### 堆栈验证深度

| Option | Description | Selected |
|--------|-------------|----------|
| 堆栈差异 + 跨语言完整性 | 验证堆栈差异和调用链包含前后端 | ✓ |
| 基础联动验证 | 只验证 collector 收到数据 | |

**User's choice:** 堆栈差异 + 跨语言完整性

---

## Claude's Discretion

- 前端 React 组件的具体实现（UI 细节、状态管理方式）
- 后端 API 路由的具体设计
- 批量计算的前端交互方式
- 测试用例的具体编写方式

## Deferred Ideas

None — discussion stayed within phase scope
