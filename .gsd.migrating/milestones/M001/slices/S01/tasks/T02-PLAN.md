# T02: 38-e2e-test-migration 02

**Slice:** S01 — **Milestone:** M001

## Description

验证 tests/e2e/codepoint-v2/ 项目功能正常后清理 tmp/ 目录，全面搜索并更新所有活跃文档中对 tmp/ 路径的引用，标记 R1/R3 需求为完成。

Purpose: 迁移完成后需要验证项目完整性，然后清理源目录并更新文档，使项目状态与实际文件结构一致。归档文档（.planning/milestones/）不更新（保持历史准确性）。

Output: tmp/ 目录中测试项目已删除（tmp/ 保留为空目录），tests/e2e/ 项目重新验证构建成功，PROJECT.md / STATE.md / REQUIREMENTS.md / ROADMAP.md 更新完成，新路径引用已验证。

## Must-Haves

- [ ] "tmp/ 目录中 5 个测试项目已删除，tmp/ 目录保留为空（含 .gitkeep）"
- [ ] "tests/e2e/codepoint-v2/ 项目在删除后仍可正常构建"
- [ ] ".planning/PROJECT.md 中 R1 状态更新为已完成"
- [ ] ".planning/STATE.md 中 tmp/ 目录迁移条目更新"
- [ ] ".planning/REQUIREMENTS.md 中 R1 checklist items 已勾选"
- [ ] ".planning/ROADMAP.md Phase 38 已更新 plan 数量和状态"
- [ ] "活跃 .planning/ 文档中无过时 tmp/ 引用（排除 milestones/）"
- [ ] "活跃 .planning/ 文档中包含 tests/e2e/codepoint-v2/ 新路径引用"

## Files

- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
