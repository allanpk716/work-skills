# S01: E2e Test Migration

**Goal:** 将 tmp/ 下 5 个 E2E 测试项目迁移到 tests/e2e/codepoint-v2/，使用正确的 git 策略（tracked 用 git mv，untracked 用 cp + git add），排除构建产物，添加 .
**Demo:** 将 tmp/ 下 5 个 E2E 测试项目迁移到 tests/e2e/codepoint-v2/，使用正确的 git 策略（tracked 用 git mv，untracked 用 cp + git add），排除构建产物，添加 .

## Must-Haves


## Tasks

- [x] **T01: 38-e2e-test-migration 01**
  - 将 tmp/ 下 5 个 E2E 测试项目迁移到 tests/e2e/codepoint-v2/，使用正确的 git 策略（tracked 用 git mv，untracked 用 cp + git add），排除构建产物，添加 .gitignore 防止未来构建产物被提交。

Purpose: tmp/ 是临时目录，不应保留持久性测试资产。E2E 测试项目是 Codepoint V2 的验证资产，需要长期存档用于回归测试和后续改进。

Output: tests/e2e/codepoint-v2/ 目录包含 5 个完整的测试项目、一个 .gitignore 文件，无构建产物，git 跟踪状态正确。
- [x] **T02: 38-e2e-test-migration 02**
  - 验证 tests/e2e/codepoint-v2/ 项目功能正常后清理 tmp/ 目录，全面搜索并更新所有活跃文档中对 tmp/ 路径的引用，标记 R1/R3 需求为完成。

Purpose: 迁移完成后需要验证项目完整性，然后清理源目录并更新文档，使项目状态与实际文件结构一致。归档文档（.planning/milestones/）不更新（保持历史准确性）。

Output: tmp/ 目录中测试项目已删除（tmp/ 保留为空目录），tests/e2e/ 项目重新验证构建成功，PROJECT.md / STATE.md / REQUIREMENTS.md / ROADMAP.md 更新完成，新路径引用已验证。

## Files Likely Touched

- `tests/e2e/codepoint-v2/go-calculator/`
- `tests/e2e/codepoint-v2/python-calculator/`
- `tests/e2e/codepoint-v2/gojs-calculator/`
- `tests/e2e/codepoint-v2/pyts-calculator/`
- `tests/e2e/codepoint-v2/template-test/`
- `tests/e2e/codepoint-v2/.gitignore`
- `tests/e2e/.gitkeep`
- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
