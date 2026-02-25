# Feature Research

**Domain:** Git Security Scanning
**Researched:** 2026-02-25
**Confidence:** MEDIUM (基于 Web 搜索和行业标准,未使用 Context7 验证)

## Feature Landscape

### Table Stakes (Users Expect These)

这些功能是 Git 安全扫描工具的基础配置,缺失会导致产品不完整。

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| AWS 凭证检测 | AWS 是最常用的云服务,凭证泄露风险极高 | MEDIUM | 正则表达式: `AKIA[0-9A-Z]{16}`,需要匹配 Access Key ID 和 Secret Key |
| GitHub Token 检测 | 开发者最常用的 Git 平台,token 泄露会暴露代码仓库 | LOW | 固定前缀模式: `ghp_`, `gho_`, `ghr_`, `ghs_` + 36字符 |
| .env 文件检测 | 环境配置文件通常包含密钥和敏感配置 | LOW | 检测文件名 `.env`, `.env.local`, `.env.*.local` |
| 私钥文件检测 | SSH/PGP 私钥泄露会导致严重安全问题 | LOW | 检测 `-----BEGIN RSA/PGP PRIVATE KEY-----` 标记 |
| 阻止提交功能 | 安全扫描的核心价值 - 防止泄露进入代码库 | LOW | pre-commit hook 返回非零退出码 |
| 清晰的错误提示 | 用户需要快速定位和修复问题 | MEDIUM | 显示文件路径、行号、问题类型、修复建议 |
| 彩色输出 | 提高可读性,快速区分错误和警告 | LOW | ANSI 颜色代码: 红色(错误), 黄色(警告), 绿色(信息) |
| .gitignore 支持 | 用户熟悉的排除规则,无需学习新语法 | MEDIUM | 读取项目级和全局 .gitignore,支持递归模式 |

### Differentiators (Competitive Advantage)

这些功能让产品在同类工具中脱颖而出。

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Windows 原生体验 | 大多数扫描工具专注于 Linux/Mac,Windows 体验欠佳 | MEDIUM | Windows 路径处理、PowerShell 兼容、彩色输出 |
| Claude Code 集成 | 与现有 windows-git-commit 技能无缝集成,无需额外配置 | LOW | 复用现有 SSH 认证、提交消息生成功能 |
| 中英文双语提示 | 国内开发者更易理解中文安全提示 | LOW | 基于系统语言自动选择,默认中文 |
| 内置白名单注释 | 在 .gitignore 中使用注释标记安全例外 | LOW | 例如 `# git-scan:ignore` 标记允许的配置文件 |
| 详细的修复建议 | 不仅检测问题,还提供具体的修复步骤 | MEDIUM | 针对不同类型问题提供定制化建议 |
| 检测结果分级 | 区分严重程度,避免"全阻止"的粗暴方式 | MEDIUM | 敏感信息 = 错误(阻止), 缓存文件 = 警告(可选阻止) |
| 内置常用规则库 | 开箱即用,无需配置即可检测常见问题 | LOW | 参考主流工具(git-secrets, truffleHog, GitLeaks)的规则集 |
| 扫描速度优化 | 提交前的等待时间影响开发体验 | MEDIUM | 目标 <2 秒,使用文件类型过滤、只扫描暂存区 |

### Anti-Features (Commonly Requested, Often Problematic)

这些功能看似有用,但会带来问题,应避免实现。

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| 自动修复所有问题 | 用户希望一键解决,减少手动操作 | 可能引入新问题(如错误删除文件),用户失去控制权 | 提供详细的修复建议,让用户手动处理 |
| 实时文件监控 | 希望在编辑时就发现问题,而不是提交时 | 性能开销大,可能与编辑器冲突,增加复杂度 | 保持提交时扫描,配合编辑器插件实现实时检测 |
| 独立的配置文件格式 | 希望有专门的配置文件,更灵活 | 增加学习成本,用户需要维护两套规则(.gitignore + 新格式) | 复用 .gitignore 格式,添加注释标记扩展功能 |
| 集成 CI/CD | 希望在持续集成中扫描,团队级防护 | 超出个人技能范围,需要服务器配置、团队协作 | 专注于本地 pre-commit hook,CI 集成留给专业工具 |
| AI 智能判断 | 希望用 AI 判断是否真的是敏感信息 | 增加延迟,需要网络连接,成本高,准确率不确定 | 规则引擎足够处理常见场景,用户可自定义规则 |
| 扫描整个历史记录 | 希望发现历史提交中的问题 | 需要重写 Git 历史,风险高,团队协调复杂 | 只扫描新提交,历史问题留给专门的清理工具 |
| 加密存储检测结果 | 希望保留扫描记录用于审计 | 增加复杂度,需要密钥管理,超出扫描工具职责 | 输出到控制台,让用户决定是否记录 |

## Feature Dependencies

```
[Git Commit 流程]
    └──requires──> [Pre-commit Hook 集成]
                       └──requires──> [暂存区文件访问]

[敏感信息检测]
    └──requires──> [正则表达式引擎]
    └──requires──> [文件内容读取]

[.gitignore 支持]
    └──requires──> [文件系统访问]
    └──requires──> [模式匹配引擎]

[彩色输出]
    └──requires──> [ANSI 颜色代码支持]
    └──conflicts──> [非终端环境] (需要检测是否支持颜色)

[阻止提交]
    └──requires──> [Pre-commit Hook 返回码]
    └──conflicts──> [跳过扫描选项] (--no-verify 或环境变量)

[扫描速度优化]
    └──enhances──> [用户体验]
    └──requires──> [二进制文件检测] (跳过二进制)
    └──requires──> [文件类型过滤] (只扫描文本文件)

[中英文双语]
    └──requires──> [语言检测机制]
    └──conflicts──> [硬编码英文] (需要重构消息系统)
```

### Dependency Notes

- **Git Commit 流程 requires Pre-commit Hook 集成:** 必须在 Git 调用提交之前拦截,这是扫描功能的基础
- **敏感信息检测 requires 正则表达式引擎:** Python 的 `re` 模块提供所需功能,无需外部依赖
- **彩色输出 requires ANSI 颜色代码支持:** Windows Terminal 和 Git Bash 支持,传统 CMD 可能需要特殊处理
- **阻止提交 conflicts 跳过扫描选项:** 需要平衡安全性和灵活性,紧急情况下允许绕过(但记录警告)
- **扫描速度优化 enhances 用户体验:** 在暂存区扫描而非全仓库扫描,使用文件类型过滤跳过二进制文件
- **中英文双语 requires 语言检测机制:** 需要检测系统语言或配置文件设置,增加初始化逻辑

## MVP Definition

### Launch With (v1.0)

最小可行产品 - 验证核心价值所需的功能。

- [ ] **AWS 凭证检测** — 最常见且危害最大的凭证泄露场景
- [ ] **GitHub Token 检测** — 开发者最常用的平台,泄露风险高
- [ ] **.env 文件检测** — 标准的环境配置文件,通常包含密钥
- [ ] **SSH/PGP 私钥检测** — 严重安全问题,必须检测
- [ ] **Python 缓存检测** — __pycache__/, *.pyc, 开发者常见疏忽
- [ ] **Node.js 依赖检测** — node_modules/, 不应进入版本控制
- [ ] **阻止提交功能** — 扫描的核心价值,防止泄露进入代码库
- [ ] **清晰错误提示** — 文件路径、行号、问题类型、修复建议
- [ ] **.gitignore 支持** — 用户熟悉的排除规则,降低学习成本
- [ ] **彩色输出** — 提高可读性,区分错误/警告/信息

**Rationale:** 这些功能覆盖了最常见的泄露场景(AWS、GitHub、.env、私钥)和常见的疏忽(缓存文件),提供了基本的用户交互(阻止提交、清晰提示、彩色输出),并复用了用户熟悉的规则系统(.gitignore)。这是验证"Git 提交前安全扫描"这一概念的最小功能集。

### Add After Validation (v1.1)

在核心功能稳定后添加的功能。

- [ ] **通用 API 密钥检测** — 检测 `api_key`, `secret`, `password` 字段
- [ ] **内网 IP 检测** — 10.x.x.x, 172.16-31.x.x, 192.168.x.x
- [ ] **内部域名检测** — *.internal, *.local, *.corp
- [ ] **邮箱地址检测** — 识别可能的内部邮箱泄露
- [ ] **中英文双语提示** — 基于系统语言自动选择
- [ ] **扫描速度优化** — 二进制文件检测、文件类型过滤
- [ ] **检测结果分级** — 区分严重程度(错误/警告)

**Trigger for adding:** 当 v1.0 功能稳定运行,用户反馈积极,且没有严重的误报/漏报问题时,添加这些扩展功能。

### Future Consideration (v2+)

产品市场验证后考虑的功能。

- [ ] **自动修复简单问题** — 如从暂存区移除缓存文件
- [ ] **独立配置文件** — .gitcheck.yaml, 支持更复杂的规则
- [ ] **扫描历史记录** — 趋势分析,识别重复问题
- [ ] **自定义正则表达式** — 用户定义的检测规则
- [ ] **数据库连接字符串检测** — MySQL, PostgreSQL 连接字符串
- [ ] **加密货币钱包私钥检测** — 比特币、以太坊私钥
- [ ] **集成 pre-commit 框架** — 与 Python pre-commit 包集成

**Why defer:** 这些功能需要更复杂的实现(自动修复、配置文件解析)或针对特定场景(加密货币、数据库),在验证通用场景的价值之前,不应增加复杂度。

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| AWS 凭证检测 | HIGH | MEDIUM | P1 |
| GitHub Token 检测 | HIGH | LOW | P1 |
| .env 文件检测 | HIGH | LOW | P1 |
| SSH/PGP 私钥检测 | HIGH | LOW | P1 |
| 阻止提交功能 | HIGH | LOW | P1 |
| 清晰错误提示 | HIGH | MEDIUM | P1 |
| Python 缓存检测 | MEDIUM | LOW | P1 |
| Node.js 依赖检测 | MEDIUM | LOW | P1 |
| .gitignore 支持 | HIGH | MEDIUM | P1 |
| 彩色输出 | MEDIUM | LOW | P1 |
| 通用 API 密钥检测 | HIGH | MEDIUM | P2 |
| 内网 IP 检测 | MEDIUM | MEDIUM | P2 |
| 内部域名检测 | MEDIUM | LOW | P2 |
| 邮箱地址检测 | MEDIUM | LOW | P2 |
| 中英文双语提示 | MEDIUM | MEDIUM | P2 |
| 扫描速度优化 | HIGH | MEDIUM | P2 |
| 检测结果分级 | MEDIUM | MEDIUM | P2 |
| 自动修复问题 | HIGH | HIGH | P3 |
| 独立配置文件 | LOW | HIGH | P3 |
| 扫描历史记录 | LOW | HIGH | P3 |
| 自定义正则表达式 | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (v1.0)
- P2: Should have, add when possible (v1.1)
- P3: Nice to have, future consideration (v2+)

## Competitor Feature Analysis

| Feature | git-secrets (AWS) | TruffleHog | GitLeaks | Our Approach |
|---------|-------------------|------------|----------|--------------|
| **AWS 凭证检测** | YES (重点) | YES | YES | YES (P1) |
| **GitHub Token 检测** | NO | YES | YES | YES (P1) |
| **通用 API 密钥** | NO | YES | YES | YES (P2) |
| **内置规则数量** | 少(AWS 为主) | 多(100+) | 多(100+) | 中等(聚焦常见场景) |
| **自定义规则** | YES (正则) | YES (正则) | YES (配置文件) | YES (.gitignore 扩展) |
| **扫描范围** | Pre-commit | 全历史 + 多源 | Git 历史 | Pre-commit (暂存区) |
| **扫描速度** | 快 | 慢(深度扫描) | 快 | 快 (P2 优化) |
| **阻止提交** | YES | NO (扫描工具) | NO (扫描工具) | YES (P1) |
| **彩色输出** | NO | YES | YES | YES (P1) |
| **Windows 体验** | 一般 | 一般 | 一般 | 优秀 (原生支持) |
| **安装复杂度** | 低 (Hook 脚本) | 中 (二进制) | 低 (二进制) | 低 (Python 脚本) |
| **CI/CD 集成** | NO | YES | YES | NO (专注本地) |
| **历史扫描** | NO | YES | YES | NO (专注新提交) |
| **多语言支持** | NO | NO | NO | YES (中英文 P2) |
| **误报处理** | 用户自行配置 | 验证 + 分类 | 高熵值过滤 | .gitignore 白名单 |

**Our Differentiation Strategy:**
1. **Windows First:** 不再是"能在 Windows 上跑",而是"为 Windows 设计"
2. **Claude Code Native:** 与现有技能无缝集成,无需额外配置
3. **Simpler is Better:** 复用 .gitignore,不发明新配置格式
4. **Chinese Friendly:** 中英文双语,降低国内开发者使用门槛
5. **Focus on Flow:** 专注提交流程,不做历史扫描、CI 集成等复杂功能

## Sources

- [Git Hooks - Official Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks) - Pre-commit hook 机制和工作流程
- [GitLab Security Scanner Integration](https://docs.gitlab.com/development/integrations/secure/) - 错误报告、彩色输出、日志级别最佳实践
- [git-secrets (AWS)](https://github.com/awslabs/git-secrets) - AWS 凭证检测、pre-commit hook 实现
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) - 多源扫描、熵值检测、凭证验证
- [GitLeaks](https://github.com/gitleaks/gitleaks) - 快速扫描、Git 历史扫描、自定义规则
- [Git Ignore Patterns](https://git-scm.com/docs/gitignore) - .gitignore 语法和模式匹配
- [Private IP Address Ranges (RFC 1918)](https://datatracker.ietf.org/doc/html/rfc1918) - 内网 IP 地址范围定义
- [ANSI Escape Codes](https://en.wikipedia.org/wiki/ANSI_escape_code) - 彩色输出的技术实现

**Confidence Assessment:**
- Table Stakes: MEDIUM (基于主流工具的功能对比,未使用 Context7 验证)
- Differentiators: MEDIUM (基于项目定位和竞品分析)
- Anti-Features: MEDIUM (基于常见的过度设计陷阱)
- Competitor Analysis: MEDIUM (基于 Web 搜索,未验证最新版本功能)
- Feature Dependencies: HIGH (基于技术逻辑和 Git 机制)

---
*Feature research for: Git Security Scanning in Windows Environment*
*Researched: 2026-02-25*
