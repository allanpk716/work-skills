# Project Research Summary

**Project:** Work Skills - Windows Git Commit Security Scanning
**Domain:** Git Workflow Security Enhancement
**Researched:** 2026-02-25
**Confidence:** HIGH

## Executive Summary

本项目为 `windows-git-commit` 插件添加**提交前安全扫描功能**,防止敏感信息泄露到版本控制。基于研究,推荐使用 **Python 标准库实现**,在 git commit 前扫描暂存区内容,发现问题时阻止提交并显示详细提示。

专家构建此类工具的方式是:使用多层检测策略(正则模式 + 关键词 + 熵值分析),只扫描暂存文件而非全仓库,复用 .gitignore 规则避免重复配置,提供清晰的错误提示和修复建议。关键风险包括:误报过多导致用户忽略警告、性能瓶颈影响开发体验、破坏现有 Git 工作流。

**推荐方法:** 基于现有 Bash 子代理架构,插入 Python 安全扫描步骤,使用 `git diff --cached` 获取暂存内容,通过模块化检测器(密钥、缓存、配置、内部信息)进行检测,发现 CRITICAL 问题时阻止提交。性能目标 <2 秒,支持 .gitignore 白名单,提供中英文双语错误提示。

## Key Findings

### Recommended Stack

核心使用 Python 标准库实现,无需外部依赖,与现有架构保持一致。

**Core technologies:**
- **Python 3.6+**: 核心开发语言 — Windows 10+ 预装,Claude Code hooks 标准语言
- **re (正则表达式)**: 模式匹配 — 检测 AWS/GitHub/API 密钥等已知格式
- **pathlib**: 路径操作 — 跨平台兼容,优于 os.path
- **subprocess**: Git 命令调用 — 获取暂存文件列表和内容
- **fnmatch**: .gitignore 模式匹配 — 复用现有规则,无需新语法

**Supporting libraries:**
- **json**: 缓存扫描结果(可选)
- **concurrent.futures**: 并行检测(性能优化)

### Expected Features

**Must have (table stakes):**
- **AWS 凭证检测** — 最常见且危害最大,正则: `AKIA[0-9A-Z]{16}`
- **GitHub Token 检测** — 开发者常用平台,前缀: `ghp_`, `gho_`, `ghr_`, `ghs_`
- **.env 文件检测** — 环境配置文件,通常包含密钥
- **SSH/PGP 私钥检测** — 严重安全问题,检测 `-----BEGIN.*PRIVATE KEY-----`
- **阻止提交功能** — 安全扫描核心价值,返回非零退出码
- **清晰错误提示** — 文件路径、行号、问题类型、修复建议
- **.gitignore 支持** — 用户熟悉的排除规则,无需学习新语法
- **彩色输出** — 提高可读性,ANSI 颜色代码(红/黄/绿)

**Should have (competitive):**
- **Windows 原生体验** — 路径处理、PowerShell 兼容、彩色输出
- **Claude Code 集成** — 与现有 windows-git-commit 技能无缝集成
- **中英文双语提示** — 基于系统语言自动选择,默认中文
- **检测结果分级** — 区分严重程度(ERROR 阻止 vs WARNING 提示)
- **扫描速度优化** — 目标 <2 秒,使用文件类型过滤、只扫描暂存区

**Defer (v2+):**
- **自动修复问题** — 可能引入新问题,让用户手动处理
- **独立配置文件** — 复用 .gitignore 足够,不增加学习成本
- **实时文件监控** — 性能开销大,超出 pre-commit hook 范围
- **CI/CD 集成** — 专注本地提交流程
- **AI 智能判断** — 规则引擎足够,增加延迟和成本

### Architecture Approach

在现有 `windows-git-commit` 技能的 Bash 子代理中插入 **Python 安全扫描步骤**,位置在 `git status` 和 `git add` 之间。扫描器使用模块化设计,包含 4 个独立检测器(密钥、缓存、配置、内部信息),通过 Pipeline 模式顺序执行。

**Major components:**
1. **Security Scanner (Python)** — 主入口,编排检测流程,使用 `git diff --cached` 获取暂存文件
2. **Pattern Engine (rules/patterns.py)** — 定义所有正则模式和熵值检测逻辑
3. **Detectors (detectors/)** — 4 个独立模块: secrets.py、cache_files.py、config_files.py、internal_info.py
4. **Report Generator** — 格式化扫描结果,彩色输出,分组显示

**Integration pattern:**
- Bash 子代理 → `git diff --cached --name-only` → Python 扫描器 → 发现问题? → 阻止/继续
- 使用 `subprocess.run()` 调用 Python 脚本,退出码 0=通过,1=阻止
- 复用 .gitignore 规则,通过 `git check-ignore` 命令判断文件是否排除

### Critical Pitfalls

1. **误报过多 (False Positive Overload)** — 使用多层检测(正则+熵值+验证),实现置信度评分,提供 .gitignore 白名单机制,设置熵值阈值 4.5-5.0
2. **性能瓶颈 (Performance Bottleneck)** — 只扫描暂存文件(不扫描全仓库),检测并跳过二进制文件,使用文件类型过滤,目标 <2 秒
3. **破坏现有工作流 (Breaking Workflows)** — 提供 `--no-verify` 绕过选项,处理边界情况(merge/amend/empty commits),测试与现有 hooks 兼容性
4. **二进制文件扫描失败 (Binary Scanning)** — 使用 `file` 命令或魔数检测文件类型,跳过二进制文件的内容检测
5. **.gitignore 解析边界情况** — 使用 `git check-ignore` 命令而非自定义解析,支持所有语法(`!` negation, `#` comments, `/` anchoring)

## Implications for Roadmap

基于研究,建议分为 3 个阶段:

### Phase 1: Core Scanning Infrastructure

**Rationale:** 先构建核心检测能力和规则引擎,这是所有后续功能的基础。根据依赖关系,patterns.py 和 gitignore_parser.py 无依赖,检测模块依赖规则定义。

**Delivers:** 可工作的安全扫描器,能检测密钥、缓存文件、配置文件泄露,支持 .gitignore 规则

**Addresses:**
- Table stakes: AWS/GitHub 凭证检测、.env/私钥检测、阻止提交、错误提示、.gitignore 支持、彩色输出
- Python 缓存检测、Node.js 依赖检测

**Avoids:**
- Pitfall 1 (误报过多): 实现多层检测 + 置信度评分
- Pitfall 2 (性能瓶颈): 只扫描暂存文件 + 二进制检测
- Pitfall 4 (二进制扫描): 文件类型检测
- Pitfall 5 (.gitignore 解析): 使用 `git check-ignore`
- Pitfall 7 (错误提示): 详细提示 + 修复建议

**Uses:** Python 3.6+, re, pathlib, subprocess, fnmatch

**Implements:**
- Component 1: Security Scanner (security_scan.py)
- Component 2: Pattern Engine (rules/patterns.py)
- Component 3: Detectors (secrets.py, cache_files.py, config_files.py)
- Component 4: Report Generator

### Phase 2: Integration & Windows Testing

**Rationale:** 核心功能稳定后,集成到现有 SKILL.md 工作流,并进行 Windows 特定的测试和优化。

**Delivers:** 完整集成的安全扫描功能,与 windows-git-commit 技能无缝协作

**Addresses:**
- Differentiators: Windows 原生体验、Claude Code 集成
- 内部信息检测(内网 IP、内部域名)

**Avoids:**
- Pitfall 3 (破坏工作流): 测试边界情况 + 绕过机制
- Pitfall 6 (Windows 问题): 路径分隔符 + CRLF 处理 + 性能优化

**Uses:** Bash-Python bridge (subprocess), Git commands (diff, check-ignore)

**Implements:**
- Integration: 修改 SKILL.md 工作流
- Detector: internal_info.py
- Testing: Windows 兼容性测试

### Phase 3: UX Polish & Performance Optimization

**Rationale:** 核心功能稳定后,优化用户体验和性能,添加双语支持、结果分级、速度优化。

**Delivers:** 生产就绪的安全扫描功能,优秀的用户体验

**Addresses:**
- Differentiators: 中英文双语提示、检测结果分级、扫描速度优化

**Avoids:**
- Pitfall 2 (性能瓶颈): 文件类型过滤 + 模式预编译
- Pitfall 8 (漏报): 扩展检测模式 + 关键词检测

**Uses:** concurrent.futures (并行检测), os.environ (语言检测)

**Implements:**
- Feature: 中英文双语提示系统
- Feature: 检测结果分级 (ERROR/WARNING)
- Optimization: 并行检测、二进制文件跳过、模式预编译

### Phase Ordering Rationale

- **依赖关系**: Phase 1 构建基础设施(规则+检测器),Phase 2 集成到工作流,Phase 3 优化体验
- **架构模式**: 遵循 Pipeline Detection 模式,检测器独立,可并行开发
- **避免陷阱**: Phase 1 解决 5 个关键陷阱(误报、性能、二进制、.gitignore、错误提示),Phase 2 解决集成和 Windows 问题,Phase 3 进一步优化

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** 检测规则库需要参考专业工具(git-secrets, TruffleHog, GitLeaks)的模式,建议使用 `/gsd:research-phase` 深入研究正则模式的准确性和熵值阈值调优
- **Phase 2:** Windows 特定问题(CRLF、路径分隔符、Python 启动性能)需要在实际 Windows 环境中验证,可能需要性能分析和优化

Phases with standard patterns (skip research-phase):
- **Phase 3:** 性能优化和 UX 改进有成熟的最佳实践,无需额外研究

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | 基于 Python 标准库,无外部依赖,与现有架构一致,已通过 Context7 验证 |
| Features | MEDIUM | 基于 Web 搜索和竞品分析,未使用 Context7 验证,需要实际测试调整 |
| Architecture | HIGH | 基于现有架构模式,集成点清晰,组件职责明确,使用 Context7 验证 |
| Pitfalls | HIGH | 基于专业文献(Springer 2026, GitLab SAST, CSDN 性能优化)和行业经验,可信度高 |

**Overall confidence:** HIGH

### Gaps to Address

- **检测规则准确性**: 正则模式和熵值阈值需要通过实际数据集测试,在 Phase 1 实现时参考专业工具(git-secrets, TruffleHog)的模式库,并根据用户反馈调整
- **Windows 性能基准**: Python 启动开销在 Windows 上可能较慢(3-5x),需要在 Phase 2 实际测试,如果超过 2 秒目标,考虑最小化导入或预编译方案
- **误报率基准**: 需要定义可接受的误报率(建议 <20%),在 Phase 1 测试时测量,根据结果调整熵值阈值和模式严格度

## Sources

### Primary (HIGH confidence)
- `/websites/python_3_15` — Python 标准库文档 (re, pathlib, subprocess, fnmatch)
- [Microsoft Learn - Implement Git Hooks](https://learn.microsoft.com/zh-cn/training/modules/explore-git-hooks/3-implement) — Pre-commit hook 模式和工作流
- [Large-Scale Analysis of Code Security in Public Repositories (Springer, 2026)](https://link.springer.com/article/10.1007/s10207-025-01187-w) — 误报率分析,AI 辅助过滤
- [GitLab SAST False Positive Detection (2026)](https://docs.gitlab.com/ee/user/application_security/vulnerabilities/) — AI 置信度评分
- [lint-staged Performance Optimization (npm)](https://www.npmjs.com/package/lint-staged/v/9.5.0) — 只扫描暂存文件,45x 性能提升

### Secondary (MEDIUM confidence)
- [git-secrets (AWS)](https://github.com/awslabs/git-secrets) — AWS 凭证检测模式
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) — 多源扫描,熵值检测,800+ 规则
- [GitLeaks](https://github.com/gitleaks/gitleaks) — 快速扫描,熵值阈值(4.5-5.0)
- [Secrets Patterns DB](https://gitcode.com/gh_mirrors/se/secrets-patterns-db) — 开源秘密模式库
- [Git Performance Optimization on Windows (CSDN)](https://blog.csdn.net/gitblog_00814/article/details/152069989) — Windows 特定性能问题
- [CSDN - Git User Sensitive Information Check](https://m.blog.csdn.net/xinbuq/article/details/136405597) — 凭证检测模式

### Tertiary (LOW confidence)
- [Pre-commit Security Scanning UX Mistakes (Web Search, 2026)] — UX 最佳实践,需要验证
- [Secret Detection with Large Language Models (arXiv, 2025)](https://arxiv.org) — AI 检测方法,未来研究方向

---
*Research completed: 2026-02-25*
*Ready for roadmap: yes*
