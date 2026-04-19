# Phase 34: 单语言问题修复 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 34-single-lang-fix
**Areas discussed:** 问题范围界定, 探针模板验证深度, 技能自动化验证, 缺陷文档格式

---

## 问题范围界定

| Option | Description | Selected |
|--------|-------------|----------|
| 仅偏差 #1 算技能缺陷 | 只修复 golang.md 的 Frame 类型问题，其他 3 个偏差是项目 bug 不算技能缺陷 | |
| 全部记录，只修技能缺陷 | 所有 4 个偏差都记录，但只修复偏差 #1（技能模板），其他 3 个标记为测试项目 bug（不修复） | |
| 全部记录并全部修复 | 全部记录并全部修复，包括测试项目中的 3 个 bug（确保测试项目本身完美） | ✓ |

**User's choice:** 全部记录并全部修复
**Notes:** Phase 32 的 4 个偏差全部纳入缺陷列表，包括技能模板缺陷和测试项目 bug。Phase 33 无缺陷。

---

## 探针模板验证深度

| Option | Description | Selected |
|--------|-------------|----------|
| 现有项目重新验证 | 仅在现有 go-calculator 和 python-calculator 中重新验证，确认修复后的模板代码工作正常 | |
| 最小化测试项目 | 创建一个简化的最小项目（仅 base library + 1 个探针），专门验证模板生成的代码可编译/运行 | |
| 现有项目 + 模板代码检查 | 在现有项目中验证修复，同时在模板代码本身中添加编译检查（如 go vet / python -c import） | ✓ |

**User's choice:** 现有项目 + 模板代码检查
**Notes:** 在现有项目中验证修复后，在 golang.md 和 python.md 中添加编译检查说明。

---

## 技能自动化验证

| Option | Description | Selected |
|--------|-------------|----------|
| 不测技能自动化 | Phase 34 只关注修复模板和文档缺陷，技能自动化测试留给后续 milestone | |
| 在现有项目中测试技能 | 在 go-calculator 或 python-calculator 上实际运行 /codepoint:scan、plan、implement | ✓ |
| 新项目中测试技能 | 创建一个干净的项目，实际运行全部三个技能，验证从零开始的完整流程 | |

**User's choice:** 在现有项目中测试技能
**Notes:** 在现有 go-calculator/python-calculator 上实际运行技能验证完整工作流。

---

## 缺陷文档格式

| Option | Description | Selected |
|--------|-------------|----------|
| 34-DEFECTS.md 表格格式 | 在 Phase 34 目录下创建 34-DEFECTS.md，用表格记录每个缺陷的 ID、描述、复现步骤、修复状态 | |
| 结构化 YAML/JSON | 在 Phase 34 目录下创建结构化 YAML/JSON 文件，每个缺陷一个条目 | ✓ |
| 追加到 SUMMARY.md | 在现有 SUMMARY.md 中追加"缺陷记录"章节 | |

**User's choice:** 结构化 YAML/JSON
**Notes:** 使用结构化格式记录缺陷（如 34-DEFECTS.yaml），便于机器读取和自动化验证。

---

## Claude's Discretion

- 缺陷修复的具体实施顺序（先修模板还是先修测试项目）
- 结构化缺陷文件中每个缺陷的详细复现步骤编写

## Deferred Ideas

None — discussion stayed within phase scope
