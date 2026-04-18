# Phase 34: 单语言问题修复 - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

记录并修复 Phase 32 (Go) 和 Phase 33 (Python) 单语言 E2E 测试中发现的所有技能缺陷，确认探针模板在实际项目中生成的代码可编译运行。

本阶段不涉及技能自动化验证（/codepoint:scan、plan、implement 的实际调用测试）。

</domain>

<decisions>
## Implementation Decisions

### 问题范围界定
- **D-01:** Phase 32 的全部 4 个偏差记录为缺陷并全部修复（包括技能模板缺陷和测试项目 bug）。Phase 33 无缺陷，不纳入修复范围。
  - DEV-01: golang.md 模板中 parseGoStack 返回匿名 struct 与 Frame 类型不兼容（技能模板缺陷）
  - DEV-02: history/store.go 未使用的 fmt import（测试项目 bug）
  - DEV-03: 测试期望值 (2+3)*4-10/2 计算错误（测试项目 bug）
  - DEV-04: History 测试绕过 mux PathValue 提取（测试设计问题）

### 探针模板验证深度
- **D-02:** 在现有 go-calculator 和 python-calculator 项目中验证修复后的模板代码。同时在 golang.md 和 python.md 参考文档中添加编译检查说明（go vet / python -c import）。

### 技能自动化验证
- **D-03:** 不在本阶段测试技能自动化流程。/codepoint:scan、plan、implement 的实际调用测试留给后续 milestone。

### 缺陷文档格式
- **D-04:** 创建 `34-DEFECTS.md` 文件，使用 Markdown 表格格式记录每个缺陷的 ID、描述、复现步骤、预期行为、修复状态。

### Claude's Discretion
- 缺陷修复的具体实施顺序（先修模板还是先修测试项目）
- 34-DEFECTS.md 中每个缺陷的详细复现步骤编写

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 技能参考文档（包含需修复的模板代码）
- `plugins/codepoint/references/golang.md` — Go 探针模板（DEV-01: parseGoStack Frame 类型需修复）
- `plugins/codepoint/references/python.md` — Python 探针模板（添加编译检查说明）

### 测试项目（缺陷来源）
- `tmp/go-calculator/` — Go 计算器测试项目（DEV-02, DEV-03, DEV-04 来源）
- `tmp/python-calculator/` — Python 计算器测试项目（无缺陷，用于验证）

### Phase 32/33 结果（缺陷上下文）
- `.planning/phases/32-go-single-lang-calc/32-01-SUMMARY.md` — DEV-01~04 原始记录
- `.planning/phases/33-python-single-lang-calc/33-03-SUMMARY.md` — 确认 Python 无缺陷

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tmp/go-calculator/codepoint/codepoint.go`: Go 基础库（Frame 类型已提升为 package-level，但 golang.md 模板中仍是旧版）
- `tmp/python-calculator/codepoint/__init__.py`: Python 基础库（已验证无问题）
- `tmp/go-calculator/internal/calculator/calculator.go`: 包含 FlowIDKey + GetFlowID 的 context 传播模式
- `tmp/go-calculator/internal/api/server.go`: 包含已插入的探针代码
- `tmp/go-calculator/internal/history/store.go`: 需修复未使用的 fmt import

### Established Patterns
- 探针代码使用 PointWithMeta + point_id + flow_id 的 V2 模式
- Go 使用 context.Context 传播 flow_id，Python 使用显式参数
- 测试使用 TestMain toggle 管理 + t.TempDir() 隔离

### Integration Points
- golang.md 模板 → 用户项目中的 codepoint.go（模板修复直接影响所有新用户）
- python.md 模板 → 用户项目中的 codepoint/__init__.py（添加编译检查说明）

</code_context>

<specifics>
## Specific Ideas

- golang.md 的 parseGoStack 函数需将 Frame 提升为 package-level 类型（已在 go-calculator 中修复，但模板文档仍是旧版）
- 验证修复后的 golang.md 模板代码可以直接复制到新项目中编译通过

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 34-single-lang-fix*
*Context gathered: 2026-04-18*
