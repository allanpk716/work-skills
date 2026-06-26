# Work Skills - Claude Code 个人技能集

## What This Is

Work Skills 是一个聚焦于 Claude Code 任务完成通知的单一技能项目,采用 Agent Skills 开放标准分发。核心技能 claude-notify 在 Claude Code 任务完成或等待输入时发送 Pushover 移动推送与 Windows Toast 桌面通知。用户通过 `npx skills add allanpk716/work-skills/claude-notify` 安装。通知标志文件支持向上查找和 `~/.claude/` 全局控制。

> v3.0 重构 (shipped 2026-06-26):本项目已从多技能集合 (claude-notify + windows-git-commit + codepoint) 瘦身回归为单一通知技能项目。windows-git-commit 与 codepoint 已移除 (Phase 53),安装器已裁剪为仅服务 claude-notify (Phase 54),发版元数据已更新至 v3.0.0 (Phase 55)。

## Core Value

**为 Windows 开发者提供即开即用的 Claude Code 任务完成通知,让开发者不必盯着终端也能即时获知任务状态。**

## Current Milestone: v3.0 聚焦 claude-notify 重构 (SHIPPED 2026-06-26)

**Status:** Complete ✓ — 3 phases, 13/13 requirements satisfied, claude-notify 回归 105 测试全绿,版本 3.0.0 + tag v3.0。

**Delivered:**
- 移除 windows-git-commit + codepoint 技能目录及其文档 (Phase 53)
- 裁剪 installer 为仅服务 claude-notify:删 marketplace/、git/ssh detectors+configurators,迁移 paths.js,裁剪 uninstall,收窄 i18n/welcome (Phase 54,经 3 轮 codex+opencode 跨 AI 复核)
- 更新根 README/CHANGELOG/package.json 为单一技能项目,版本 1.9.0 → 3.0.0,git tag v3.0 (Phase 55)

**Next milestone goals:** 未定义 (待用户决定)。候选:claude-notify 自身 __pycache__ git 清理、installer 预存测试失败修复、claude-notify 通知 hook 行为调查 (7 个 deferred debug sessions)。

## Requirements

### Active

<!-- v3.0 已完成 — Active 清空,等待下一里程碑定义。 -->

(None — v3.0 shipped, next milestone not yet defined)

### Validated

**v3.0 - 聚焦 claude-notify 重构 (shipped 2026-06-26):**
- ✓ 移除 windows-git-commit + codepoint 技能目录及其文档 — Phase 53
- ✓ 裁剪 installer 仅服务 claude-notify (剥离 git/marketplace/uninstall 耦合代码,迁移 paths.js) — Phase 54
- ✓ 更新根项目元数据 (README/CHANGELOG/package.json) 为单一技能项目 — Phase 53/55
- ✓ 版本升至 v3.0.0 并同步 git tag v3.0,claude-notify 回归测试 105 通过 — Phase 55

**v1.0 - Claude Notify 插件 (shipped 2026-02-24):**
- ✓ 将 cc-pushover-hook 重构为全局技能
- ✓ 支持从 CLAUDE_PROJECT_DIR 提取项目名称
- ✓ Pushover 推送通知
- ✓ Windows 系统通知
- ✓ AI 生成任务摘要
- ✓ 环境变量管理 API 密钥
- ✓ 多实例并发运行(PID 隔离)
- ✓ 完整的安装和配置文档

**v1.1 - Git Security Scanning (shipped 2026-02-27):**
- ✓ 敏感信息检测(密钥、密码、私钥、PGP、PEM) - Phase 6, 11
- ✓ 缓存文件检测(Python、Node.js、编译产物、临时文件) - Phase 6
- ✓ 配置文件泄露检测(.env、credentials 等) - Phase 6
- ✓ 内部信息检测(IP、域名、邮箱) - Phase 8
- ✓ 在 git commit 前自动扫描暂存区 - Phase 7
- ✓ 发现敏感信息时阻止提交并显示详细提示 - Phase 7
- ✓ 彩色表格格式的问题报告(按严重性分级) - Phase 7, 10
- ✓ 双语支持(中英文提示) - Phase 10
- ✓ 基于 .gitignore 的自定义规则和白名单 - Phase 7, 8
- ✓ Windows 性能优化(16.77ms 扫描时间,比要求快 116 倍) - Phase 9
- ✓ 紧急跳过扫描选项(带明确风险警告) - Phase 9, 12

**v1.2 - Installer (shipped 2026-03-28):**
- ✓ NPX 安装器 — `npx @allanpk716/work-skills-setup` 一键安装
- ✓ Windows 系统检测与错误提示 - Phase 14
- ✓ 双语支持 (中英文, 自动检测系统语言) - Phase 14
- ✓ 欢迎横幅和功能介绍 (boxen 美化) - Phase 14
- ✓ CLI 选项 (--help, --version, --lang, --no-color, --verify) - Phase 14, 19
- ✓ 环境依赖检测 (Python, Git, TortoiseGit/PuTTY, pip packages) - Phase 15
- ✓ 交互式 Python 依赖安装 (pip --user, 错误检测) - Phase 16
- ✓ Pushover 凭证配置 (API 验证, setx 持久化) - Phase 17
- ✓ Git SSH 和用户配置引导 - Phase 17
- ✓ Claude Code 技能市场集成 (注册, 发现, 安装插件) - Phase 18
- ✓ 安装后自动验证 (--verify 独立重验) - Phase 19
- ✓ 通知渠道切换命令 (/notify-enable, /notify-disable) - Phase 13

**v1.3 - 智能配置检测 (shipped 2026-03-29):**
- ✓ Pushover 凭证双源检测 — process.env + Windows 注册表回退 - Phase 20
- ✓ Git 用户信息检测 — git config --global 读取 - Phase 20
- ✓ Per-item Confirm 交互 — 4 种场景(双有/仅有 token/仅有 user/均无) - Phase 20
- ✓ 统一安装流程 — 首次安装和重复运行自动适配,零检测开销 - Phase 21
- ✓ 14 个集成测试覆盖全部 UFLOW 场景 - Phase 21

**v1.4 - 修复插件安装检测 (shipped 2026-03-30):**
- ✓ windows-git-commit 插件目录结构扁平化 - Phase 22
- ✓ 安装器 isPluginInstalled() 检测与实际插件结构一致 - Phase 23
- ✓ 重复运行安装器自动跳过已安装插件 - Phase 23

**v1.5 - NPX 卸载功能 (shipped 2026-03-30):**
- ✓ `--uninstall` CLI 入口和 i18n 路由 (18 个 uninstall.* 键) - Phase 24
- ✓ 7 类组件检测 (插件/钩子脚本/钩子注册/命令/市场源/环境变量) - Phase 24
- ✓ ASCII 彩色表格展示检测结果 - Phase 24
- ✓ 双语 i18n 支持 (中英文) - Phase 24
- ✓ 7 步容错卸载执行 (remover.js) - Phase 25
- ✓ 彩色 ASCII 结果报告 (reporter.js) - Phase 25
- ✓ enquirer Confirm 默认 No 安全确认 - Phase 25
- ✓ 完整 detect→confirm→remove→report 编排 - Phase 25

**v1.6 - 通知标志文件向上查找 + 全局控制 (shipped 2026-04-01):**
- ✓ 向上遍历父目录查找 `.no-xxx` 文件 - Phase 26
- ✓ `notify-attention.py` 同步支持向上查找 - Phase 26
- ✓ `~/.claude/.no-xxx` 全局通知控制 - Phase 27
- ✓ 项目级优先于全局级的查找优先级 - Phase 27
- ✓ `notify-enable`/`notify-disable` 支持 `--global` 参数 - Phase 27
- ✓ `notify-status` 显示全局标志状态 - Phase 27
- ✓ 诊断模式显示查找结果和来源标注 - Phase 28
- ✓ 72 个 Python 测试全部通过 - Phase 28

**v1.7 - 通知项目名称智能识别 (shipped 2026-04-04):**
- ✓ 向上查找项目根目录 — find_project_root() 以 `.git` 或 `CLAUDE.md` 为标记 - Phase 29
- ✓ get_project_name() 用向上查找替代 os.getcwd() basename - Phase 29
- ✓ notify.py 和 notify-attention.py 使用 flags.py 的 get_project_name() - Phase 30
- ✓ 复用 flags.py 的向上遍历逻辑，保持 DRY - Phase 29
- ✓ 38 个测试全部通过（9 test_notify + 29 test_flags）- Phase 30

**v1.8 - Worktree 区分 (shipped 2026-04-09):**
- ✓ 通知标题包含 git 分支名 — [project:branch] 格式，多 worktree 并行可区分来源 - Phase 31
- ✓ get_git_branch() robust branch detection with timeout/error handling - Phase 31
- ✓ build_notification_title() shared title formatting for DRY compliance - Phase 31
- ✓ find_project_root() worktree fix (.exists() replaces .is_dir()) - Phase 31
- ✓ Attention 通知包含 session_id 用于会话追溯 - Phase 31
- ✓ 14 new tests (105 total, all passing) - Phase 31

**v1.9.1 - Codepoint V2 E2E 测试 (shipped 2026-04-19):**
- ✓ Go 单语言计算器 E2E — scan/plan/implement 全流程，多业务流堆栈差异验证
- ✓ Python 单语言计算器 E2E — scan/plan/implement 全流程，探针模板双语言验证
- ✓ Go+JS 全栈跨语言集成 — collector 联动验证，20 codepoints，3 flows，SPA fallback 修复
- ✓ Python+TS 全栈跨语言集成 — FastAPI + React TS，Toggle 四组合独立验证
- ✓ 单语言缺陷修复 — 4 个缺陷记录并修复，模板编译验证
- ✓ 全栈缺陷修复 — 8 个缺陷记录并修复，golang.md/python.md 模板更新

**v1.9.2 - Codepoint 测试归档与调研文档整理 (shipped 2026-04-20):**
- ✓ E2E 测试项目迁移到 tests/e2e/codepoint-v2/ — 5 个项目结构完整，tmp/ 清空
- ✓ 调研文档归档到 docs/research/codepoint/ — 主文档 + 6 配图 + 全局思维补充 + workspace 迭代记录
- ✓ Codepoint V2 设计反省 — 5 条偏差 (CP-01~05) + 3 条合理偏离 (RD-01~03)
- ✓ 改进优先级排序 — CP-01 (P0) > CP-05 (P0) > CP-02 (P1) > CP-04 (P1) > CP-03 (P2)

**v2.0 - 前端自动化测试体系 (shipped 2026-04-20):**
- ✓ /codepoint-test-plan 技能 — 6 步测试规划工作流 + 10 个探针代码片段 (D-01~D-10) — M012 S01
- ✓ index.json 数据契约 — 1 collection / 2 flows / 9 codepoints，33 项结构校验 — M012 S02
- ✓ /codepoint-instrument 技能 — 6 步埋点规划，5 级优先级 (P1-P5)，按类型元数据契约 — M012 S03
- ✓ /codepoint-verify 技能 — 7 步验证工作流，4 轮校验 (序列/完整/元数据/覆盖) — M012 S04
- ✓ /codepoint-run 编排技能 — 双入口模式 (现有代码库/新功能)，6 子技能链，制品恢复 — M012 S05
- ✓ /codepoint-validate 技能 — 5 轮渐进式静态制品一致性验证 — M012 S06
- ✓ 83 项结构验证检查全部通过 (S02:33 + S03:12 + S04:13 + S05:12 + S06:13)

**v2.0.1 - Agent Skills 标准迁移 M1 (shipped 2026-04-20):**
- ✓ 11 个技能目录迁移至仓库根级，plugins/ 已移除 — M013 S01
- ✓ skills-ref validate 11/11 全部通过 — M013 S01
- ✓ claude-notify SKILL.md 拆分: 1284 → 234 行 + 5 个 references/ 文件 — M013 S02
- ✓ windows-git-commit SKILL.md 拆分: 891 → 439 行 + 4 个 references/ 文件 — M013 S02
- ✓ pytest.ini 路径更新 + import-mode=importlib + benchmark 优雅降级 — M013 S02
- ✓ 114 个 Python 测试通过 + 3 个跳过 (exit 0) — M013 S02

**v2.1 - Project Cleanup: Final Form (shipped 2026-04-20):**
- ✓ 删除 7 个过时文件/目录 (.claude-plugin/marketplace.json, scripts/, pytest.ini, tests/, INSTALLATION*.md, QUICK-START.md) — M014/S01
- ✓ 8 个 codepoint-* 子技能用 git mv 嵌套到 codepoint/ 下（保留历史） — M014/S01
- ✓ 14 个 SKILL.md 全部通过 skills-ref validate（含 3 个 setup 子技能） — M014/S01+S04
- ✓ docs/ 重组为 4 个技能分类子目录 + README.md 索引 — M014/S02
- ✓ 每个技能独立 README.md（安装/配置/使用），根 README 精简为 40 行导航入口 — M014/S03
- ✓ 3 个配置引导子技能：claude-notify-setup（hook 注册）、windows-git-commit-setup（TortoisePlink）、codepoint-setup（.codepoints/ 初始化） — M014/S04

## Out of Scope

| Feature | Reason |
|---------|--------|
| windows-git-commit 技能 | v3.0 主动移除 — 不再使用,项目聚焦 claude-notify 单一技能 |
| codepoint 技能链 (8 子技能) | v3.0 主动移除 — 不再使用,项目聚焦 claude-notify 单一技能 |
| installer 的 git-ssh/git-user/TortoiseGit 配置 | v3.0 裁剪 — 仅服务于已移除的 windows-git-commit |
| installer 的多技能 marketplace 集成 | v3.0 裁剪 — 仅剩 claude-notify,无需多技能发现/安装 |
| installer 的完整卸载模块 | v3.0 裁剪 — 卸载逻辑与已移除技能耦合 |
| claude-notify 自身功能改造 | 本里程碑仅做删除/裁剪,claude-notify 代码不动(仅回归验证) |
| Linux/macOS 支持 | 项目专注于 Windows 开发环境 |
| 自动下载安装 Python/Git | 超出安装器职责范围,只提供检测和指导 |
| GUI 安装界面 | CLI 交互已足够,GUI 增加复杂度 |
| 自动配置 Pageant 密钥 | 需要用户手动操作,安全考虑 |
| 静默安装模式 (--quiet) | 未来版本考虑 |
| 配置文件导出/导入 | 未来版本考虑 |
| 通知频道级别的细粒度全局配置 | 当前 `.no-xxx` 文件模式已足够 |
| 交互式全局通知开关命令 | 未来版本考虑 |
| Pushover 双向回复 | Pushover API 不支持用户文本回复 |
| 非 git 项目的摘要 | git diff 是摘要的核心上下文来源 |

## Context

**当前状态 (2026-06-26, post-v3.0):**
- 16 个里程碑已交付 (v1.0 - v3.0)
- 仓库回归单一技能形态:根目录仅 claude-notify (含 claude-notify-setup 子技能、hooks/scripts、scripts、references、tests)
- installer/ 已裁剪为仅服务 claude-notify (Windows 检测 + Python/pip 检测 + Pushover 配置 + hooks 注册 + 验证 + 卸载);marketplace/、git/ssh detectors+configurators 已移除
- 技术栈:Python 3.8+ (claude-notify 脚本),Node.js/CJS (installer)
- 13 项 v3.0 需求已验证 (REM-01..04, INS-01..05, REL-01..04)
- claude-notify 回归测试 105 全绿
- 安装方式:`npx skills add allanpk716/work-skills/claude-notify` (Agent Skills 标准) 或 `npx @allanpk716/work-skills-setup` (引导式)
- 已知技术债:installer jest 基线预存 RED (4 failed suites,早于 v3.0,bin.test CRLF / verification python 路径 / pushover+unified-flow process.exit IIFE);7 个 deferred debug sessions (claude-notify 通知 hook 行为调查,多源于 v1.x/v2.x);claude-notify git 跟踪的 __pycache__ 未清理

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v3.0 移除 windows-git-commit + codepoint,回归单技能 | 用户不再使用这两个技能;项目聚焦 claude-notify | ✓ Validated (v3.0) |
| installer 裁剪为仅服务 claude-notify (保留,不删除) | 保留引导式安装/Pushover 配置/uninstall UX;剥离多技能耦合 | ✓ Validated (v3.0 Phase 54) |
| INS-03 uninstall 选 TRIM 不 REMOVE | 保留 claude-notify 卸载能力 (plugin/hooks/commands/Pushover env);仅移除 marketplace 组件 | ✓ Validated (v3.0, codex+opencode endorsed) |
| paths.js 仅导出实际使用的 {getSkillsDir, isPluginInstalled} | 3 个 config helper 在 trim 后零消费者,迁移即死代码 | ✓ Validated (v3.0, convergence cycle 2 root-cause fix) |
| INS-05 验收门重定为"不引入新失败" | installer jest 基线预存 RED (10 failed suites,早于 v3.0);用户确认预存失败 out of scope | ✓ Validated (v3.0, post-trim 4 failed/19 passed 全白名单) |
| 版本 1.9.0 → 3.0.0 (主版本号) | 破坏性变更 (2/3 技能下线) | ✓ Validated (v3.0, tag v3.0) |
| .exists() 替代 .is_dir() 检测 .git | git worktree 中 .git 是文件而非目录 | ✓ Validated (v1.8) |
| build_notification_title() 共享标题构建 | 消除 notify.py 和 notify-attention.py DRY 违规 | ✓ Validated (v1.8) |
| get_git_branch() timeout 1s + stderr suppress | Windows 编码和噪声输出处理 | ✓ Validated (v1.8) |
| NPX 独立安装器 | 用户无需克隆仓库,一键安装 | ✓ Validated (v1.2) |
| TDD 开发流程 (Wave 0 测试骨架) | 测试先行,减少 bug | ✓ Validated (Phase 16, 19) |
| CJS 而非 ESM | chalk/boxen 兼容性 | ✓ Applied (Phase 14) |
| enquirer 交互提示 | 简单 API,维护良好 | ✓ Validated (Phase 16-18) |
| pip --user 标志 | 避免 Windows 权限问题 | ✓ Validated (Phase 16) |
| Pushover API 验证后保存 | 确保凭证有效 | ✓ Validated (Phase 17) |
| Git shallow clone (--depth 1) | 插件安装更快速 | ✓ Validated (Phase 18) |
| 在 git commit 前扫描 | 能捕获已暂存的问题 | ✓ Validated (Phase 7) |
| 阻止提交而非警告 | 强制用户处理安全问题 | ✓ Validated (Phase 7) |
| ASCII 字符替代 Unicode | Windows GBK 编码兼容性 | ✓ Applied (Phase 7) |
| 双语支持 | 提升用户体验 | ✓ Validated (Phase 10, 14) |
| 并行检测 (Promise.all) | 提高环境检测速度 | ✓ Validated (Phase 15) |
| 双源检测 (process.env + registry) | setx 持久化值不在当前 process.env 中 | ✓ Validated (Phase 20) |
| Per-item Confirm 模式 | 每项独立处理,支持部分配置 | ✓ Validated (Phase 20) |
| 统一流程 (无单独 update 命令) | 减少用户认知负担 | ✓ Validated (Phase 21) |
| Detection-level 测试策略 | 避免交互式 prompt mock 复杂度 | ✓ Applied (Phase 21) |
| enquirer Confirm initial: false | 卸载操作安全优先,默认 No | ✓ Validated (Phase 25) |
| removeStep helper pattern | 每步 try/catch,永不抛出异常 | ✓ Validated (Phase 25) |
| Status tri-state (removed/failed/skipped) | 每步独立报告结果,支持部分失败 | ✓ Validated (Phase 25) |
| 模块化卸载 (remover/reporter 分离) | 独立测试,职责分离 | ✓ Validated (Phase 25) |
| 插件根目录布局 (SKILL.md at root) | 匹配 isPluginInstalled() 期望路径 | ✓ Validated (v1.4) |
| 修复结构而非修改安装器 | 最小修改原则,安装器逻辑本身正确 | ✓ Validated (v1.4) |
| git mv 保留历史跟踪 | 目录重构时保留 Git 历史 | ✓ Applied (Phase 22) |
| 共享 flags.py 模块 | 消除通知脚本中的重复代码 | ✓ Validated (v1.6) |
| Per-channel independence | 各通知频道独立查找,互不干扰 | ✓ Validated (v1.6) |
| 项目级优先于全局级 | 项目级 .no-xxx 存在时跳过全局检查 | ✓ Validated (v1.6) |
| 6-key 返回字典 | 分离项目级和全局级路径信息 | ✓ Validated (v1.6) |
| --global 灵活参数解析 | 支持 --global 在任意位置 | ✓ Validated (v1.6) |
| 诊断模式使用 check_notification_flags() | 统一数据源,显示来源标注 | ✓ Validated (v1.6) |
| Dual marker detection (.git + CLAUDE.md) | 向上遍历时同时检测两种标记,覆盖无 Git 的项目 | ✓ Validated (v1.7) |
| flags.py 作为项目名称 single source of truth | 消除通知脚本中的重复实现,DRY 原则 | ✓ Validated (v1.7) |
| Test project methodology: progressive validate → fix cycle | SING → FIX1 → FULL → FIX2 交错模式更高效 | ✓ Validated (v1.9.1) |
| Calculator 3+ business flows sharing core codepoints | 验证探针在不同流程下的堆栈差异 | ✓ Validated (v1.9.1) |
| Enhanced collector with sync.Mutex + flow_id routing | 线程安全 + 每个流程独立文件 | ✓ Validated (v1.9.1) |
| Frontend probes in event handlers only (not useEffect) | 避免 React strict mode double-invocation | ✓ Validated (v1.9.1) |
| Dual-mode codepoint.ts (browser POST + Node.js file) | 浏览器和 Node.js 环境兼容 | ✓ Validated (v1.9.1) |
| TDD RED→GREEN for find_project_root | 先定义测试契约,再实现功能 | ✓ Validated (v1.7) |
| E2E 测试迁移到正式目录 (tests/e2e/) | tmp/ 临时性质不应保留持久性测试资产 | ✓ Validated (v1.9.2) |
| 调研文档按类型归档 (主文档+配图+补充+workspace) | 集中管理方法论参考资料,便于后续查阅 | ✓ Validated (v1.9.2) |
| 设计反省基于方法论对照审查 | 系统性识别偏差,而非主观判断 | ✓ Validated (v1.9.2) |
| 改进建议分级 (P0/P1/P2) | 资源有限时优先处理高影响偏差 | ✓ Validated (v1.9.2) |
| Probe snippets use pointWithMeta() V2 pattern | 与现有 frontend.md 引用约定保持一致 | ✓ Validated (v2.0) |
| Windows PowerShell 验证脚本 (.ps1) | 开发环境 Windows 无 grep，batch ERRORLEVEL 不可靠 | ✓ Validated (v2.0) |
| Static-only validate + dynamic verify 分工 | 两种验证服务不同目的，互补而非替代 | ✓ Validated (v2.0) |
| 缺失下游制品视为信息性缺口 | 允许验证在任意管线阶段运行 | ✓ Validated (v2.0) |
| 5 级探针优先级 (P1 entry → P5 error) | 反映自然测试工作流：先测正常路径再测边界 | ✓ Validated (v2.0) |
| 5 轮渐进式验证模型 | 逐步加深验证深度，早期快速失败 | ✓ Validated (v2.0) |
| 制品恢复的编排技能设计 | Claude Code 会话可能中断，需支持断点续传 | ✓ Validated (v2.0) |
| Root-level skill directories for skills.sh discovery | skills-ref expects skill dirs at repo root with SKILL.md name matching dir name | ✓ Validated (v2.0.1) |
| Shared resources in parent skill (codepoint/) not plugins/ | skills.sh standard requires flat root structure; sub-skills reference ../codepoint/ | ✓ Validated (v2.0.1) |
| Nested sub-skills under codepoint/ with git mv | 8 codepoint-* dirs moved into codepoint/ preserving git history; relative paths fixed | ✓ Validated (M014/S01) |
| git mv for directory migration (history preservation) | Restructuring preserves blame/log trail; had to clear stale .git/index.lock | ✓ Applied (v2.0.1, M014/S01) |
| addopts = --import-mode=importlib (not import_mode key) | pytest 9.0.2 only accepts import_mode as CLI flag, not ini key | ✓ Validated (v2.0.1) |
| No-op benchmark fixture for graceful degradation | pytest-benchmark may not be installed; 3 benchmark tests should skip not fail | ✓ Validated (v2.0.1) |
| references/ subdirectory for SKILL.md content splitting | Extract detailed content into topic-specific .md files, keep core SKILL.md under 500 lines | ✓ Validated (v2.0.1) |
| Setup sub-skills with <objective>/<process> tagged configuration guidance | Each root skill has a xxx-setup sub-skill for environment configuration; consistent pattern across all 3 | ✓ Validated (M014/S04) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-26 — Milestone v3.0 (聚焦 claude-notify 重构) shipped*
