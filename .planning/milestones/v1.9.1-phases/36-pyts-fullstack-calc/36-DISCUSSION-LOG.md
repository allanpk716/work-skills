# Phase 36: Python+TS 全栈跨语言集成 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 36-Python+TS 全栈跨语言集成
**Areas discussed:** Python 后端框架, 前端构建集成, Toggle 验证深度, 项目结构和命名

---

## Python 后端框架

| Option | Description | Selected |
|--------|-------------|----------|
| FastAPI | 原生 async、类型提示、python.md 有完整 collector 示例 | ✓ |
| Flask | 简单同步风格、python.md 有 collector 示例 | |
| Django | 全功能框架，对计算器 API 可能过重 | |

**User's choice:** FastAPI
**Notes:** 推荐 choice — modern, good python.md support. Backend architecture matches Go calculator (3 business flows sharing core compute pipeline).

## 前端构建集成

| Option | Description | Selected |
|--------|-------------|----------|
| FastAPI StaticFiles | 前端构建到 frontend/dist/，StaticFiles mount。简单直接 | ✓ |
| StaticFiles + 构建脚本 | 额外自动化一步构建体验 | |
| 开发时分离 + 部署时合并 | Vite dev server 代理 API，部署时 StaticFiles | |

**User's choice:** FastAPI StaticFiles
**Notes:** 前端框架确认 React + TypeScript + Vite（与 Phase 35 gojs-calculator 一致）

## Toggle 验证深度

| Option | Description | Selected |
|--------|-------------|----------|
| 完整四组合验证 | 前端开/关 × 后端开/关，每种组合验证日志输出 | ✓ |
| 基础验证 | 只验证"都开"和"都关" | |

**User's choice:** 完整四组合验证
**Notes:** FULL-07 是 Phase 35 没专门验证的新需求。Toggle 文件天然独立（.codepoint-python / .codepoint-ts），四组合确认互不干扰。

## 项目结构和命名

| Option | Description | Selected |
|--------|-------------|----------|
| tmp/pyts-calculator/ | 与 gojs-calculator 命名风格一致 | ✓ |
| tmp/python-ts-calculator/ | 更明确表示 Python 后端 | |
| tmp/pyts-fullstack/ | 与 Go+JS 项目命名对称 | |

**User's choice:** tmp/pyts-calculator/，根目录（Python）+ frontend/ 子目录
**Notes:** 内部结构与 gojs-calculator 一致

## Claude's Discretion

- FastAPI API 路由的具体设计
- 前端 React 组件的具体实现
- 批量计算的前端交互方式
- 测试用例的具体编写方式
- Toggle 验证的具体测试脚本设计

## Deferred Ideas

None — discussion stayed within phase scope
