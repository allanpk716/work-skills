# Phase 39: 调研文档归档与整理 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 39-research-docs-archive
**Areas discussed:** 归档内容范围, 文档组织结构, 图片处理策略

---

## 归档内容范围

| Option | Description | Selected |
|--------|-------------|----------|
| 全部归档 | 调研文档 + 图片 + workspace，完整保留所有素材 | ✓ |
| 仅调研文档 + 图片 | 跳过 workspace 开发记录 | |
| 仅主文档 | 只归档 markdown 调研文档 | |

**User's choice:** 全部归档
**Notes:** codepoint-test 已在 Phase 38 迁移，不重复处理

---

## 文档组织结构

| Option | Description | Selected |
|--------|-------------|----------|
| 按日期命名多文件 | 2026-04-17-methodology.md 等格式，便于追加 | ✓ |
| 按主题命名多文件 | methodology.md 等格式 | |
| 单文件合并 | 一个大文件包含所有内容 | |

**User's choice:** 按日期命名多文件
**Notes:** 符合 REQUIREMENTS.md "以日期命名追加文档" 的要求

---

## 图片处理策略

| Option | Description | Selected |
|--------|-------------|----------|
| 重命名为描述性名称 | 如 01-methodology-overview.jpg，放入 images/ | ✓ |
| 保留原文件名 | 保留微信原始 URL 文件名 | |
| 仅引用不复制 | 在 markdown 中引用外部路径 | |

**User's choice:** 重命名为描述性名称
**Notes:** 需要查看图片内容来确定描述性名称；选择质量更好的版本归档

---

## Claude's Discretion

- 图片的具体命名（根据内容确定）
- workspace 目录的整理方式
- 是否创建 README.md 索引文件

## Deferred Ideas

None
