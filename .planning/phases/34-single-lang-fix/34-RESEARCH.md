# Phase 34: 单语言问题修复 - Research

**Researched:** 2026-04-18
**Domain:** 缺陷修复、探针模板验证、技能 E2E 测试
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Phase 32 的全部 4 个偏差记录为缺陷并全部修复（包括技能模板缺陷和测试项目 bug）。Phase 33 无缺陷，不纳入修复范围。
  - DEV-01: golang.md 模板中 parseGoStack 返回匿名 struct 与 Frame 类型不兼容（技能模板缺陷）
  - DEV-02: history/store.go 未使用的 fmt import（测试项目 bug）
  - DEV-03: 测试期望值 (2+3)*4-10/2 计算错误（测试项目 bug）
  - DEV-04: History 测试绕过 mux PathValue 提取（测试设计问题）
- **D-02:** 在现有 go-calculator 和 python-calculator 项目中验证修复后的模板代码。同时在 golang.md 和 python.md 参考文档中添加编译检查说明（go vet / python -c import）。
- **D-03:** 在现有 go-calculator 和/或 python-calculator 项目上实际运行 /codepoint:scan、/codepoint:plan、/codepoint:implement 技能，验证技能工作流的完整性和正确性。
- **D-04:** 创建结构化 YAML/JSON 文件记录缺陷（如 34-DEFECTS.yaml），每个缺陷一个条目，包含 id、description、steps_to_reproduce、expected、actual、status 字段，便于机器读取和自动化验证。

### Claude's Discretion
- 缺陷修复的具体实施顺序（先修模板还是先修测试项目）
- 结构化缺陷文件中每个缺陷的详细复现步骤编写

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FIX1-01 | 记录单语言 E2E 测试中发现的所有技能缺陷（探针模板、scan 识别、plan 规划、implement 生成的问题） | 4 个已知缺陷已确认（DEV-01~04），均在代码中已修复但未正式记录 |
| FIX1-02 | 修复发现的问题，在对应测试项目中重新验证通过 | 全部 4 个缺陷已在 Phase 32 执行过程中修复并验证；go build + go test 全绿，Python 57 test 全绿 |
| FIX1-03 | 确认探针模板（Go/Python）在实际项目中生成的代码可编译/运行且堆栈信息格式正确 | golang.md 模板独立编译通过；python.md 模板独立 import 通过；两个测试项目全部测试通过 |
</phase_requirements>

## Summary

Phase 34 是一个缺陷记录和验证确认阶段，而非新功能开发阶段。Phase 32 (Go) 和 Phase 33 (Python) 的 E2E 测试已发现并修复了 4 个缺陷（DEV-01~04），但尚未进行正式的缺陷文档记录、模板编译验证、以及技能自动化 E2E 验证（运行 /codepoint:scan、/codepoint:plan、/codepoint:implement）。

**关键发现：所有 4 个缺陷已在代码中修复，但修复成果未回溯到正式文档和验证流程。** 具体而言：(1) DEV-01 的 golang.md Frame 类型提升已在 commit `088f086` 中完成；(2) DEV-02~04 的测试项目修复已在 go-calculator 中完成并通过测试。Phase 34 的核心工作是**正式化**这些修复：创建结构化缺陷文件、验证模板可独立编译、运行技能自动化 E2E、添加编译检查说明到模板文档。

**Primary recommendation:** 先创建 34-DEFECTS.yaml 记录所有已知缺陷（含已修复状态），然后按 D-02 添加编译检查说明，最后执行 D-03 的技能自动化验证。修复顺序不影响结果，因为所有代码修复已完成。

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 缺陷记录与文档 | 本地文件系统 | — | 34-DEFECTS.yaml 纯文档操作，无运行时依赖 |
| 模板编译验证 | 开发环境 (CLI) | — | go build / python -c import 是本地编译器操作 |
| 编译检查说明 | 文档 (golang.md/python.md) | — | 在参考文档中添加用户指导 |
| 技能 E2E 验证 | AI 技能 (Claude Code) | 测试项目 (go/python-calculator) | /codepoint:scan/plan/implement 是 AI 驱动的技能，作用于测试项目 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Go compiler | 1.22+ | 编译验证 golang.md 模板 | 模板使用 `go 1.22` 特性（如 http.NewServeMux 路由模式） |
| Python | 3.11+ | 验证 python.md 模板 import | 模板使用 `dict[str, Any]` 等 3.10+ 语法 |
| pytest | 9.0.2 | Python 测试项目验证 | [VERIFIED: 本地环境] 已安装并可用 |
| go test | 内置 | Go 测试项目验证 | [VERIFIED: 本地环境] 5 个包全部通过 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gsd-sdk | 项目内 | 创建缺陷 YAML、提交文档 | 所有 gsd 工作流操作 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| YAML (34-DEFECTS.yaml) | JSON (34-DEFECTS.json) | YAML 更易人类阅读和手写编辑；JSON 更易程序解析。两者在 Claude Code 环境中均可。 |

**Installation:**
无需安装额外依赖 — 所有工具已在本地验证可用。

**Version verification:**
```bash
go version        # go version go1.22.6 windows/amd64
python --version  # Python 3.11.9
pytest --version  # pytest 9.0.2
```
[VERIFIED: 本地命令输出]

## Architecture Patterns

### 缺陷修复工作流

```
Phase 32/33 已修复代码
        |
        v
[Task 1] 创建 34-DEFECTS.yaml ──> 正式化所有已知缺陷
        |
        v
[Task 2] 模板编译验证 ──> golang.md / python.md 模板独立编译/导入测试
        |                         |
        v                         v
[Task 3] 添加编译检查说明 ──> golang.md + python.md 文档更新
        |
        v
[Task 4] 技能 E2E 验证 ──> 在测试项目上运行 /codepoint:scan/plan/implement
        |
        v
[Task 5] 最终验证 ──> go test / pytest 全绿 + 缺陷文件完整性检查
```

### Recommended Project Structure (本阶段产出)

```
.planning/phases/34-single-lang-fix/
├── 34-DEFECTS.yaml          # 结构化缺陷记录（D-04 产出）
├── 34-RESEARCH.md            # 本文件
├── 34-01-SUMMARY.md          # 缺陷记录+模板验证
├── 34-02-SUMMARY.md          # 技能 E2E 验证
└── 34-03-SUMMARY.md          # 最终验证

plugins/codepoint/references/
├── golang.md                 # 修改：添加编译检查说明（D-02）
└── python.md                 # 修改：添加编译检查说明（D-02）
```

### Pattern 1: 结构化缺陷文件 (YAML)

**What:** 使用 YAML 格式记录每个缺陷，便于机器读取和自动化验证
**When to use:** 所有需要正式记录的缺陷
**Example:**
```yaml
defects:
  - id: DEV-01
    category: template
    description: "golang.md 模板中 parseGoStack 返回匿名 struct，与 PointJSON 内部 Frame 类型不兼容"
    template: golang.md
    steps_to_reproduce: |
      1. 从 golang.md 复制 Base Library 代码到新项目
      2. 尝试 go build ./...
      3. 编译失败：Frame 类型未定义
    expected: "Frame 为 package-level 类型，parseGoStack 返回 []Frame"
    actual: "Frame 定义在 PointJSON 函数内部，parseGoStack 返回匿名 struct"
    status: fixed
    fixed_in: "commit 088f086"
    verification: "golang.md 模板独立编译通过"
```

### Anti-Patterns to Avoid
- **不要修改测试项目中的业务逻辑来修复模板缺陷:** DEV-01 是模板缺陷，应在 golang.md 中修复（已修复），而非在测试项目中绕过
- **不要跳过模板独立编译验证:** 修复模板后必须验证从 markdown 中提取的代码可以独立编译，不能只验证测试项目中的代码

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 缺陷文件格式 | 自定义 XML/自定义文本 | YAML/JSON | D-04 已明确要求 YAML/JSON，标准化格式便于自动化 |
| 模板编译验证 | 复制粘贴到手动创建的文件 | 从 markdown 中提取代码块 + 自动编译 | 确保模板文档中的代码实际可编译 |

**Key insight:** 本阶段不需要构建新工具。核心工作是文档记录和已有技能的验证运行。

## Common Pitfalls

### Pitfall 1: 模板文档中的代码与实际项目代码不同步
**What goes wrong:** 修复了 golang.md 模板，但忘记验证模板中的代码块是否仍然可以独立编译
**Why it happens:** Markdown 代码块没有编译时检查，修改后容易引入语法错误
**How to avoid:** 修复模板后，必须从 markdown 中提取代码块并独立编译（已验证当前版本可编译）
**Warning signs:** 模板修改后未运行 `go build` 或 `python -c import`

### Pitfall 2: 技能 E2E 验证覆盖不全
**What goes wrong:** 只验证了 /codepoint:scan，未验证 /codepoint:plan 和 /codepoint:implement 的完整链路
**Why it happens:** scan 是第一个技能，容易只执行它就认为验证完成
**How to avoid:** 按 CONTEXT.md D-03 要求，验证三个技能的完整链路
**Warning signs:** 验证结果中只有 scan 的输出，缺少 plan 和 implement 的验证

### Pitfall 3: 缺陷文件中的 status 字段不更新
**What goes wrong:** 创建 34-DEFECTS.yaml 时将所有缺陷标记为 fixed，但未提供验证证据
**Why it happens:** 缺陷在 Phase 32 中已修复，但修复证据散落在多个 SUMMARY.md 中
**How to avoid:** 每个缺陷记录需包含 `fixed_in`（commit hash）和 `verification`（验证命令和结果）
**Warning signs:** status 为 fixed 但 fixed_in 和 verification 字段为空

## Code Examples

### 从 markdown 提取模板代码并编译验证 (Go)

```bash
# 提取 golang.md 中的 Base Library 代码块
# 使用 python 脚本提取第一个大型 go 代码块
python -c "
import re
content = open('plugins/codepoint/references/golang.md', 'r', encoding='utf-8').read()
blocks = re.findall(r'\`\`\`go\n(.*?)\`\`\`', content, re.DOTALL)
for b in blocks:
    if 'package codepoint' in b and 'func init()' in b:
        open('tmp/template-test/go/codepoint/codepoint.go', 'w').write(b.strip())
        break
"

# 编译验证
cd tmp/template-test/go && echo 'module template-test' > go.mod && go build ./...
# 预期: 零错误
# [VERIFIED: 2026-04-18 编译通过]
```

### 从 markdown 提取模板代码并导入验证 (Python)

```bash
# 提取 python.md 中的 Base Library 代码块
python -c "
import re
content = open('plugins/codepoint/references/python.md', 'r', encoding='utf-8').read()
blocks = re.findall(r'\`\`\`python\n(.*?)\`\`\`', content, re.DOTALL)
for b in blocks:
    if 'Code Point' in b and len(b.strip().split(chr(10))) > 50:
        open('tmp/template-test/python/codepoint/__init__.py', 'w').write(b.strip())
        break
"

# 导入验证
cd tmp/template-test/python && python -c "import codepoint; print('OK')"
# 预期: OK
# [VERIFIED: 2026-04-18 import 通过]
```

### 编译检查说明（添加到模板文档中）

Go (添加到 golang.md):
```markdown
## Quick Compile Check

After copying the base library to your project, verify it compiles:
\`\`\`bash
cd your-project
go build ./codepoint/...
go vet ./codepoint/...
\`\`\`
Expected: zero errors.
```

Python (添加到 python.md):
```markdown
## Quick Import Check

After copying the base library to your project, verify it imports:
\`\`\`bash
cd your-project
python -c "import codepoint; print('OK')"
\`\`\`
Expected: OK
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Frame 类型定义在 PointJSON 内部 | Frame 提升为 package-level 类型 | commit 088f086 (Phase 32) | 模板中的代码可独立编译，不再依赖函数内部类型 |
| parseGoStack 返回匿名 struct | parseGoStack 返回 []Frame | commit 088f086 (Phase 32) | 类型兼容性修复，支持跨函数使用 Frame |
| 无编译检查说明 | 添加 Quick Compile/Import Check 段落 | Phase 34 (本阶段) | 用户复制模板后可自行验证编译 |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 所有 4 个缺陷已在代码中修复（golang.md 和 go-calculator 均已修复） | Summary, Code Examples | 如果修复不完整，Phase 34 需要额外修复代码，而不仅是文档工作 |
| A2 | 技能 /codepoint:scan/plan/implement 可以在现有测试项目上直接运行 | Architecture Patterns | 如果技能需要特定前置条件（如已删除的 .codepoints/ 目录），可能需要重建 |
| A3 | Phase 33 Python 0 缺陷的结论正确 | User Constraints (D-01) | 如果 Python 模板存在未发现的缺陷，本阶段范围可能需要扩展 |

## Open Questions

1. **技能 E2E 验证的 .codepoints/ 目录状态**
   - What we know: go-calculator 和 python-calculator 的 .codepoints/ 目录已在 Phase 32/33 创建
   - What's unclear: 运行 /codepoint:scan 是否应该在已存在的 .codepoints/ 目录上重新扫描，还是需要先清理
   - Recommendation: 保留现有 .codepoints/ 目录，让技能在其基础上运行（更贴近真实使用场景）

2. **编译检查说明的放置位置**
   - What we know: 需要添加到 golang.md 和 python.md
   - What's unclear: 放在文档顶部（紧跟 Toggle & Output Convention）还是底部（在 AI Integration 之后）
   - Recommendation: 放在 Base Library 代码块之后、Placement Patterns 之前，因为用户复制代码后应立即验证

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Go compiler | 模板编译验证 + 测试项目测试 | Yes | go1.22.6 | -- |
| Python | 模板导入验证 + pytest | Yes | 3.11.9 | -- |
| pytest | Python 测试项目验证 | Yes | 9.0.2 | python -m unittest |
| /codepoint:scan 技能 | 技能 E2E 验证 | Yes | -- | 手动模拟 |
| /codepoint:plan 技能 | 技能 E2E 验证 | Yes | -- | 手动模拟 |
| /codepoint:implement 技能 | 技能 E2E 验证 | Yes | -- | 手动模拟 |

**Missing dependencies with no fallback:**
None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework (Go) | go test (内置) |
| Framework (Python) | pytest 9.0.2 |
| Config file (Python) | pytest.ini (work-skills 根目录) |
| Quick run command (Go) | `cd tmp/go-calculator && go test ./... -count=1` |
| Quick run command (Python) | `cd tmp/python-calculator && python -m pytest tests/ -q` |
| Full suite command | 同时运行 Go + Python（见上） |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FIX1-01 | 缺陷文件 34-DEFECTS.yaml 包含 4 个缺陷条目 | 文档检查 | `python -c "import yaml; yaml.safe_load(open('34-DEFECTS.yaml'))"` | No - Wave 0 |
| FIX1-02 | go-calculator 全部测试通过 | 回归测试 | `cd tmp/go-calculator && go test ./... -count=1` | Yes |
| FIX1-02 | python-calculator 全部测试通过 | 回归测试 | `cd tmp/python-calculator && python -m pytest tests/ -q` | Yes |
| FIX1-03 | golang.md 模板独立编译通过 | 编译测试 | `cd tmp/template-test/go && go build ./...` | No - Wave 0 |
| FIX1-03 | python.md 模板独立导入通过 | 导入测试 | `cd tmp/template-test/python && python -c "import codepoint"` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** Go `go test ./... -count=1` + Python `pytest tests/ -q`
- **Per wave merge:** 两者均运行
- **Phase gate:** Go + Python 全绿 + 34-DEFECTS.yaml 结构验证 + 模板编译验证

### Wave 0 Gaps
- [ ] `tmp/template-test/go/` — golang.md 模板独立编译测试环境（已在 research 中验证可创建）
- [ ] `tmp/template-test/python/` — python.md 模板独立导入测试环境（已在 research 中验证可创建）
- [ ] 缺陷文件结构验证脚本 — 用于检查 34-DEFECTS.yaml 的完整性和格式

## Security Domain

> 本阶段为纯文档记录和验证阶段，不涉及安全敏感操作。
>
> - 不修改网络配置、认证逻辑或数据存储
> - 不引入新依赖或外部服务
> - 不处理用户输入或敏感数据
>
> 安全域分析: security_enforcement 可视为 N/A（本阶段无安全敏感变更）。

## Sources

### Primary (HIGH confidence)
- [VERIFIED: 本地环境] golang.md 模板独立编译通过（2026-04-18）
- [VERIFIED: 本地环境] python.md 模板独立导入通过（2026-04-18）
- [VERIFIED: 本地环境] go-calculator go build + go test 全绿（5 个包，含 31+ 测试）
- [VERIFIED: 本地环境] python-calculator pytest 57 test 全绿
- [VERIFIED: git log] commit 088f086 修复了 golang.md 的 Frame 类型定义和 parseGoStack 返回类型
- [VERIFIED: 代码审查] go-calculator/internal/history/store.go 已移除未使用的 fmt import
- [VERIFIED: 代码审查] go-calculator 测试期望值 (2+3)*4-10/2 = 15.0 已修正
- [VERIFIED: 代码审查] go-calculator/api/server_test.go 使用 srv.ServeHTTP() 路由测试

### Secondary (MEDIUM confidence)
- Phase 32 五个 SUMMARY.md — 缺陷原始记录和修复过程
- Phase 33 三个 SUMMARY.md — 确认 Python 0 缺陷
- 34-CONTEXT.md — 用户决策和约束

### Tertiary (LOW confidence)
- 无

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 所有依赖在本地验证可用，版本已确认
- Architecture: HIGH - 本阶段工作流简单明确，无复杂架构决策
- Pitfalls: HIGH - 基于实际代码验证和 Phase 32/33 经验总结

**Research date:** 2026-04-18
**Valid until:** 90 天 — 本阶段涉及的是静态文档和已修复代码，不依赖快速变化的外部依赖
