# T01: 38-e2e-test-migration 01

**Slice:** S01 — **Milestone:** M001

## Description

将 tmp/ 下 5 个 E2E 测试项目迁移到 tests/e2e/codepoint-v2/，使用正确的 git 策略（tracked 用 git mv，untracked 用 cp + git add），排除构建产物，添加 .gitignore 防止未来构建产物被提交。

Purpose: tmp/ 是临时目录，不应保留持久性测试资产。E2E 测试项目是 Codepoint V2 的验证资产，需要长期存档用于回归测试和后续改进。

Output: tests/e2e/codepoint-v2/ 目录包含 5 个完整的测试项目、一个 .gitignore 文件，无构建产物，git 跟踪状态正确。

## Must-Haves

- [ ] "tests/e2e/codepoint-v2/ 目录存在且包含 5 个测试项目"
- [ ] "gojs-calculator 和 pyts-calculator 的 git 历史通过 git mv 保留"
- [ ] "go-calculator, python-calculator, template-test 已添加到 git"
- [ ] "迁移后的项目不包含 node_modules/, __pycache__/, .exe, .playwright-cli/ 构建产物"
- [ ] "gojs-calculator/frontend/dist/ 目录被保留且非空（Go embed 指令需要）"
- [ ] "Go 项目迁移后 go build ./... 成功（在项目目录内执行）"
- [ ] "tests/e2e/codepoint-v2/.gitignore 阻止未来构建产物被提交"

## Files

- `tests/e2e/codepoint-v2/go-calculator/`
- `tests/e2e/codepoint-v2/python-calculator/`
- `tests/e2e/codepoint-v2/gojs-calculator/`
- `tests/e2e/codepoint-v2/pyts-calculator/`
- `tests/e2e/codepoint-v2/template-test/`
- `tests/e2e/codepoint-v2/.gitignore`
- `tests/e2e/.gitkeep`
