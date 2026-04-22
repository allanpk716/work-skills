# S02 — Research: 内容拆分与测试兼容性修复

**Date:** 2026-04-20

## Summary

S02 解决两个遗留问题：(1) claude-notify SKILL.md (1284 行) 和 windows-git-commit SKILL.md (891 行) 均超过 500 行目标，需要拆分内容到 `references/` 子目录；(2) pytest.ini testpaths 指向已删除的 `plugins/` 路径，两个测试目录同时运行时存在模块名冲突。

**关键发现:** 所有 105 个 claude-notify 测试和 9 个 windows-git-commit 测试在单独运行时已全部通过。测试路径引用（`sys.path.insert`）没有问题 — 它们使用 `Path(__file__).parent.parent` 相对路径，在目录迁移后仍然正确。唯一真正的测试问题是 pytest.ini 配置和模块导入冲突。性能测试的 3 个错误是预先存在的（缺少 pytest-benchmark 插件），不是迁移问题。

## Recommendation

**三任务方案:** (T01) 拆分 claude-notify SKILL.md → SKILL.md + references/，(T02) 拆分 windows-git-commit SKILL.md → SKILL.md + references/ 并修复内部 plugins/ 引用，(T03) 修复 pytest.ini 并验证全部测试。T01 和 T02 互相独立可并行，T03 依赖两者完成后统一验证。

拆分策略：SKILL.md 保留 agent 执行所需的核心指令（功能描述、工作原理、使用方式、核心配置），将参考性内容移至 `references/`（FAQ、技术参考、版本历史、斜杠命令详情、安全扫描器详情等）。SKILL.md 中添加指向 references/ 的链接，确保 agent 在需要时能找到完整文档。

## Implementation Landscape

### Key Files

**claude-notify/SKILL.md (1284 行) — 需拆分**

当前结构（行号范围）：
- L1-9: frontmatter（保留）
- L10-185: 功能特性 + 工作原理 + 快速开始（保留，~176 行）
- L186-338: 配置指南（153 行）→ 移至 `references/setup.md`
- L339-353: 使用说明（保留，~15 行）
- L354-798: 常见问题 FAQ（445 行）→ 移至 `references/faq.md`
- L799-966: 技术参考（168 行）→ 移至 `references/technical.md`
- L967-1074: 版本历史（108 行）→ 移至 `references/changelog.md`
- L1075-1230: 斜杠命令（156 行）→ 移至 `references/commands.md`
- L1231-1277: 项目级控制开关（47 行）→ 移至 `references/commands.md`（追加到末尾）
- L1278-1284: 支持 + 许可证（保留，~7 行）

预计保留行数：~9 + 176 + 15 + 7 + 10(链接区) ≈ ~217 行。加上简短的 references/ 导航链接，约 230-250 行。

**windows-git-commit/SKILL.md (891 行) — 需拆分**

当前结构（XML tag 边界）：
- L1-5: frontmatter（保留）
- L6-153: `<objective>`, `<quick_start>`, `<context>`, `<workflow>`（保留，~148 行）
- L154-213: `<security_scanning>`（60 行）→ 移至 `references/security-scanner.md`
- L215-268: `<language_support>`（54 行）→ 移至 `references/security-scanner.md`
- L270-314: `<color_output>`（45 行）→ 移至 `references/security-scanner.md`
- L316-349: `<severity_levels>`（34 行）→ 移至 `references/security-scanner.md`
- L350-418: `<emergency_skip>`（69 行）→ 移至 `references/security-scanner.md`
- L419-548: `<one_time_setup>`（130 行）→ 移至 `references/setup.md`
- L549-649: `<bash_workflow>` + `<instructions>`（101 行）→ 保留（核心执行逻辑）
- L650-695: `<commit_message_generation>`（46 行）→ 保留
- L696-736: `<tortoisegit_commands>`（41 行）→ 移至 `references/tortoisegit.md`
- L737-784: `<usage_patterns>`（48 行）→ 保留
- L785-839: `<error_handling>`（55 行）→ 移至 `references/troubleshooting.md`
- L841-891: `<hook_installation>` + `<security_checklist>` + `<success_criteria>` + `<implementation_notes>`（51 行）→ 保留

预计保留行数：~5 + 148 + 101 + 46 + 48 + 51 + 10(链接区) ≈ ~409 行。

**plugins/ 引用修复（windows-git-commit/SKILL.md）：**
- L202: `Open plugins/windows-git-commit/SKILL.md` → `Open windows-git-commit/SKILL.md`
- L851: `cp plugins/windows-git-commit/hooks/pre-commit` → `cp windows-git-commit/hooks/pre-commit`

**pytest.ini（需修复）：**
- 当前 `testpaths = plugins/windows-git-commit/skills/windows-git-commit/tests` — 路径不存在
- 修复为 `testpaths = claude-notify/tests windows-git-commit/tests`
- 添加 `import_mode = importlib` 解决两个 tests/ 目录同时收集时的模块名冲突
- benchmark 相关配置项可选保留或移除（pytest-benchmark 未安装会产生警告）

**需创建的 references/ 目录和文件：**

claude-notify/references/:
- `setup.md` — 配置指南（原 L186-338）
- `faq.md` — 常见问题（原 L354-798）
- `technical.md` — 技术参考（原 L799-966）
- `changelog.md` — 版本历史（原 L967-1074）
- `commands.md` — 斜杠命令 + 项目级控制开关（原 L1075-1277）

windows-git-commit/references/:
- `security-scanner.md` — 扫描器详情 + 语言支持 + 颜色输出 + 严重级别 + 紧急跳过（原 L154-418）
- `setup.md` — 一次性配置步骤（原 L419-548）
- `tortoisegit.md` — TortoiseGitProc 命令参考（原 L696-736）
- `troubleshooting.md` — 错误处理和解决方案（原 L785-839）

### Build Order

1. **T01 + T02 可并行** — 两个技能的拆分互不依赖，各自动创建 references/ 目录和文件
2. **T03 在 T01+T02 后** — 修复 pytest.ini，运行完整测试验证

### Verification Approach

```bash
# 1. 验证行数
wc -l claude-notify/SKILL.md          # 应 < 300
wc -l windows-git-commit/SKILL.md     # 应 < 450

# 2. 验证 references/ 文件存在且非空
ls claude-notify/references/
ls windows-git-commit/references/

# 3. 验证 skills-ref validate 仍然通过
npx skills-ref validate claude-notify
npx skills-ref validate windows-git-commit

# 4. 运行全部测试（从仓库根目录，不带额外参数）
python -m pytest claude-notify/tests/ windows-git-commit/tests/ -q --tb=short
# 预期：114 passed, 3 errors (benchmark), 0 failures

# 5. 验证 plugins/ 引用已修复
grep -rn "plugins/" claude-notify/ windows-git-commit/
# 预期：无结果
```

## Constraints

- **SKILL.md body < 500 行** — 硬性目标，两个文件都超过此限
- **拆分后 skills-ref validate 必须通过** — references/ 子目录不影响验证（工具只检查根级 SKILL.md）
- **测试零回归** — 105 claude-notify + 9 windows-git-commit 测试必须全部通过
- **不改变功能** — 纯内容重组，不修改任何脚本逻辑

## Common Pitfalls

- **SKILL.md 中移动内容后忘记添加 references/ 导航链接** — agent 需要知道去哪里找详细文档，在相关章节末尾添加 `详见 references/xxx.md`
- **references/ 文件中引用了 SKILL.md 的相对路径** — 新建的 references/*.md 是独立文档，不应引用回 SKILL.md 中的内容（避免循环引用）
- **windows-git-commit 的 XML tag 结构** — 移动内容时需要保留外层 XML tag（如 `<security_scanning>`），因为 agent 可能依赖 tag 解析。建议：将 XML tag 保留在 SKILL.md 中作为空 tag 或带引用说明，或者直接在 references/ 中使用 Markdown 格式（因为 XML tag 不是 skills.sh 规范要求）
- **pytest.ini import_mode** — 不添加 `import_mode = importlib`，两个 tests/ 目录会因 `tests.test_xxx` 模块名冲突而收集失败

## Open Risks

- **XML tag 处理方式** — windows-git-commit SKILL.md 大量使用 XML tag（`<objective>`, `<quick_start>`, `<security_scanning>` 等）。移走 tag 内内容后，需要决定：保留空 tag、保留 tag 并放链接、还是完全移除 tag。建议保留 tag 并放简短摘要 + 链接。
- **benchmark 警告** — pytest.ini 中的 benchmark 配置项在 pytest-benchmark 未安装时产生 5 个 warnings。可移除这些配置或忽略。建议移除以保持干净输出。
