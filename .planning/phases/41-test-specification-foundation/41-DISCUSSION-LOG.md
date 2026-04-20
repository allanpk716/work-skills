# Phase 41: Test Specification Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 41-test-specification-foundation
**Areas discussed:** 技能形态与交付形式, 测试计划模板结构, 探针代码片段范围, 存储位置与关联方式

---

## 技能形态与交付形式

| Option | Description | Selected |
|--------|-------------|----------|
| Codepoint 子技能 | 在 plugins/codepoint/skills/ 下新建 test-plan/SKILL.md，复用 references/ 和数据模型 | ✓ |
| 独立插件 | 新建 plugins/test-plan/ 独立插件 | |
| 扩展现有 plan | 扩展 plan/SKILL.md，通过 /codepoint-plan --test 触发 | |

**User's choice:** Codepoint 子技能
**Notes:** 复用现有 codepoint 插件的数据模型和 references，入口 /codepoint-test-plan

| Option | Description | Selected |
|--------|-------------|----------|
| 交互式生成 | 开发者描述功能或提供 spec → 技能读取 .codepoints/index.json → 输出测试计划 | ✓ |
| 模板填充+校验 | 开发者填完模板后提交 → 技能校验格式、关联 codepoints | |
| 双模式 | 两种模式都支持 | |

**User's choice:** 交互式生成
**Notes:** 以 .codepoints/index.json 为数据源，交互式输出结构化测试计划文档

---

## 测试计划模板结构

| Option | Description | Selected |
|--------|-------------|----------|
| Flow 为单位 | 每个测试计划对应一个 Flow，紧凑实用 | ✓ |
| Collection 为单位 | 每个测试计划对应一个 Collection，更全局但文件较大 | |
| Feature 为单位 | 每个测试计划对应一个功能特性，跨越多个 Flow | |

**User's choice:** Flow 为单位
**Notes:** 与 .codepoints/ 数据模型的 Flow 直接对齐

| Option | Description | Selected |
|--------|-------------|----------|
| 三段式 Action→Response→Verify | 固定三段：Action → Expected Response → Verify | ✓ |
| Gherkin Given→When→Then | 四段式 Given→When→Then，更正式但更重 | |
| 自由步骤列表 | 不固定段数，每步自由定义类型 | |

**User's choice:** 三段式 Action→Response→Verify
**Notes:** 与 TSPEC-02 的 click→response→verify 要求直接对齐

| Option | Description | Selected |
|--------|-------------|----------|
| 6 段式 | 标题、Flow ID、前置条件、测试用例列表、Codepoint 映射表、探针片段引用 | ✓ |
| 5 段精简式 | 标题、Flow ID、前置条件、测试用例列表、Codepoint 映射 | |
| 8 段完整式 | 标题、描述、前置条件、测试用例列表、Codepoint 映射、探针片段引用、环境要求、备注 | |

**User's choice:** 6 段式
**Notes:** 完整但不臃肿，探针片段引用作为独立段落方便开发者查找

---

## 探针代码片段范围

| Option | Description | Selected |
|--------|-------------|----------|
| 新建测试专用片段文件 | plugins/codepoint/references/test-probes.md | ✓ |
| 内嵌在 SKILL.md 中 | 直接在 SKILL.md 里写片段 | |
| 扩展 frontend.md | 在现有 frontend.md 增加测试章节 | |

**User's choice:** 新建测试专用片段文件
**Notes:** 与 frontend.md 的通用探针模式分开，职责清晰

| Option | Description | Selected |
|--------|-------------|----------|
| 4 类基础模式 | 按钮点击、表单提交、API 调用、状态变更 | ✓ |
| 8 类完整模式 | 加上路由转换、异步加载、错误边界、表单校验 | |
| 2 类最小集 | 只做按钮点击和 API 调用 | |

**User's choice:** 4 类基础模式
**Notes:** 与 TSPEC-03 精确对齐

| Option | Description | Selected |
|--------|-------------|----------|
| 框架无关 | 纯 JS/TS 片段，不依赖特定框架 API | ✓ |
| React 专用 | 针对 React 写，包含 useEffect/useState 等 | |
| React + Vue | 双框架支持 | |

**User's choice:** 框架无关
**Notes:** 适用性最广，E2E 测试项目虽用 React 但模板不锁定

---

## 存储位置与关联方式

| Option | Description | Selected |
|--------|-------------|----------|
| .codepoints/test-plans/ | 与 flows/、points/、verification/ 并列 | ✓ |
| 嵌入 flows/ 目录 | 测试计划文件与 flow 定义文件并列 | |
| docs/test-plans/ | 与 .codepoints/ 分开，放在 docs/ 下 | |

**User's choice:** .codepoints/test-plans/
**Notes:** 保持测试计划在 .codepoints/ 体系内，通过 flow_id 关联

| Option | Description | Selected |
|--------|-------------|----------|
| 显式映射表 | 测试计划内置映射表，列出每个 TC 触发的 codepoint sequence | ✓ |
| 隐式推导 | 映射关系从 flow_id 自动推导，不单独列表 | |

**User's choice:** 显式映射表
**Notes:** 映射表作为 6 段式第 5 段，明确 Test Case ID → Codepoint Sequence → Expected Firing Order

---

## Claude's Discretion

- SKILL.md 的具体步骤编排和措辞
- 测试计划模板的具体 markdown 格式细节
- 探针片段的代码示例编写风格

## Deferred Ideas

None — discussion stayed within phase scope
