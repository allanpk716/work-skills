# Architecture Research: Git Security Scanning Integration

**Domain:** Git Workflow Security Enhancement
**Project:** work-skills (windows-git-commit plugin)
**Researched:** 2026-02-25
**Confidence:** HIGH

## Executive Summary

本研究专注于如何将**安全扫描功能**集成到现有的 `windows-git-commit` 技能中。核心设计原则是**在 git commit 前扫描暂存区内容**,发现安全问题则阻止提交并显示详细提示。

## Current Architecture (windows-git-commit)

```
+---------------------------------------------------------------+
|                    Claude Code Main Agent                      |
+---------------------------------------------------------------+
                              |
                              | Task tool (subagent launch)
                              v
+---------------------------------------------------------------+
|                  Bash Subagent (Background)                    |
+---------------------------------------------------------------+
|  +-------------+  +-------------+  +-------------+            |
|  | SSH Config  |->| Git Status  |->| Git Diff    |            |
|  +-------------+  +-------------+  +-------------+            |
|                                         |                      |
|                                         v                      |
|  +-------------+  +-------------+  +-------------+            |
|  | Git Add     |->| Git Commit  |->| Git Push    |            |
|  +-------------+  +-------------+  +-------------+            |
+---------------------------------------------------------------+
                              |
                              | Summary Result
                              v
+---------------------------------------------------------------+
|                      User Response                             |
+---------------------------------------------------------------+
```

**现有特点:**
- Bash 子代理执行所有 Git 操作
- 通过 `run_in_background: true` 保护主上下文
- 使用 plink + Pageant 进行 SSH 认证
- 自动生成提交信息

## Enhanced Architecture (with Security Scanning)

```
+---------------------------------------------------------------+
|                    Claude Code Main Agent                      |
+---------------------------------------------------------------+
                              |
                              | Task tool (subagent launch)
                              v
+---------------------------------------------------------------+
|                  Bash Subagent (Background)                    |
+---------------------------------------------------------------+
|  +-------------+  +-------------+  +-------------+            |
|  | SSH Config  |->| Git Status  |->| Git Diff    |            |
|  +-------------+  +-------------+  +-------------+            |
|                                         |                      |
|                                         v                      |
|  +--------------------------------------------------------+   |
|  |              Security Scanner (Python)                  |   |
|  |  +------------------+  +--------------------------+    |   |
|  |  | Staged Files     |->| Detection Engine         |    |   |
|  |  | Collector        |  | - Secret Patterns        |    |   |
|  |  +------------------+  | - Cache File Detection   |    |   |
|  |                        | - Config File Detection  |    |   |
|  |                        | - Internal Info Check    |    |   |
|  |                        +--------------------------+    |   |
|  |                               |                        |   |
|  |                               v                        |   |
|  |                        +-------------+                 |   |
|  |                        | Report Gen  |                 |   |
|  |                        +-------------+                 |   |
|  +--------------------------------------------------------+   |
|                    |                                          |
|          [Issues Found?]                                      |
|           /          \                                        |
|         YES           NO                                      |
|          |            |                                       |
|          v            v                                       |
|  +-------------+  +-------------+  +-------------+            |
|  | Block &     |  | Git Add     |->| Git Commit  |            |
|  | Report      |  +-------------+  +-------------+            |
|  +-------------+                           |                  |
|                                            v                  |
|                                    +-------------+            |
|                                    | Git Push    |            |
|                                    +-------------+            |
+---------------------------------------------------------------+
```

## Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **Bash Subagent** | 编排 Git 工作流 | Bash script in SKILL.md (现有) |
| **Security Scanner** | 执行安全扫描 | Python script (新增) |
| **Pattern Engine** | 匹配敏感信息模式 | Regex + entropy analysis |
| **Rule Loader** | 加载 .gitignore 规则 | Python fnmatch |
| **Report Generator** | 格式化扫描结果 | Python formatted output |

## Recommended Project Structure

```
plugins/windows-git-commit/
+-- skills/
|   +-- windows-git-commit/
|       +-- SKILL.md                    # 主技能定义 (修改)
|       +-- TROUBLESHOOTING.md          # 故障排除指南 (现有)
+-- scripts/                            # 新增: Python 脚本
|   +-- security_scan.py               # 主扫描入口
|   +-- detectors/                      # 检测模块
|       +-- __init__.py
|       +-- secrets.py                  # 密钥检测
|       +-- cache_files.py              # 缓存文件检测
|       +-- config_files.py             # 配置文件泄露检测
|       +-- internal_info.py            # 内部信息检测
|   +-- rules/                          # 规则定义
|       +-- __init__.py
|       +-- patterns.py                 # 正则模式库
|       +-- gitignore_parser.py         # .gitignore 解析器
+-- tests/                              # 新增: 测试套件
|   +-- __init__.py
|   +-- test_secrets.py
|   +-- test_cache_files.py
|   +-- test_config_files.py
+-- .claude-plugin/
    +-- plugin.json                     # 插件元数据 (现有)
```

### Structure Rationale

- **scripts/detectors/**: 模块化检测组件,便于扩展
- **scripts/rules/**: 集中管理检测模式,便于更新
- **tests/**: 每个检测类别的单元测试
- SKILL.md 保持编排层,复杂逻辑委托给 Python

## Architectural Patterns

### Pattern 1: Pipeline Detection

**What:** 顺序检测管道,每个检测器独立运行
**When to use:** 当检测类别相互独立、顺序无关时
**Trade-offs:** 简单实现,但无法在严重问题时提前退出

**Example:**
```python
class SecurityScanner:
    def __init__(self):
        self.detectors = [
            SecretsDetector(),
            CacheFileDetector(),
            ConfigFileDetector(),
            InternalInfoDetector()
        ]

    def scan(self, staged_files: List[str]) -> List[Finding]:
        all_findings = []
        for detector in self.detectors:
            findings = detector.detect(staged_files)
            all_findings.extend(findings)
        return all_findings
```

### Pattern 2: Git Diff Streaming

**What:** 直接从 git diff 流式读取暂存内容,不写临时文件
**When to use:** 最小化磁盘 I/O,避免创建临时文件
**Trade-offs:** 更快,无需清理,但需要仔细处理编码

**Example:**
```python
def get_staged_file_content(file_path: str) -> str:
    """使用 git diff 获取暂存文件内容"""
    result = subprocess.run(
        ['git', 'diff', '--cached', '--', file_path],
        capture_output=True,
        text=True,
        encoding='utf-8',
        errors='replace'
    )
    return result.stdout
```

### Pattern 3: Fail-Fast with Severity

**What:** 发现 CRITICAL 问题时立即停止,较低严重度继续扫描
**When to use:** 平衡彻底性和性能
**Trade-offs:** 更快发现阻塞问题,但可能遗漏其他问题

**Example:**
```python
def scan_with_early_exit(staged_files: List[str]) -> ScanResult:
    critical_findings = []

    for detector in self.detectors:
        findings = detector.detect(staged_files)
        critical = [f for f in findings if f.severity == Severity.CRITICAL]
        if critical:
            critical_findings.extend(critical)
            break  # 发现严重问题立即停止

    return ScanResult(
        blocked=len(critical_findings) > 0,
        findings=critical_findings
    )
```

## Data Flow

### Request Flow

```
[用户: "git commit"]
        |
        v
[Bash 子代理启动]
        |
        v
[git diff --cached --name-only] --> [暂存文件列表]
        |
        v
[Python security_scan.py] --> [检测结果]
        |
        v
[发现问题?]
    /          \
  YES           NO
   |            |
   v            v
[阻止]      [继续]
[报告]     [git commit]
```

### Security Scan Flow

```
[暂存文件列表]
        |
        v
+---------------------------+
| 按 .gitignore 过滤        |
| (尊重现有规则)            |
+---------------------------+
        |
        v
+---------------------------+
| 对每个文件:               |
| 1. 获取内容 (git diff)    |
| 2. 运行所有检测器         |
| 3. 收集发现               |
+---------------------------+
        |
        v
+---------------------------+
| 聚合 & 排序结果           |
| - 按严重度                |
| - 按文件路径              |
+---------------------------+
        |
        v
+---------------------------+
| 生成报告                  |
| - 颜色编码输出            |
| - 修复建议                |
+---------------------------+
```

### Key Data Flows

1. **暂存文件提取**: `git diff --cached --name-only` 提供文件列表
2. **内容流式读取**: `git diff --cached -- <file>` 提供暂存内容
3. **模式匹配**: 逐行应用正则模式,带上下文
4. **结果聚合**: 收集所有发现,按严重度排序,格式化输出

## Integration Points

### Integration with Existing SKILL.md

安全扫描应插入在 **git status 和 git add 之间**:

```bash
# 当前工作流 (在 SKILL.md agent_configuration):
git status -> git diff --stat -> git add -A -> git commit -> git push

# 增强工作流:
git status -> git diff --stat -> [安全扫描] -> git add -A -> git commit -> git push
                                    |
                                    v
                            [发现问题?] -> 阻止 & 报告
```

### Git Command Integration

| 命令 | 目的 | 使用的输出 |
|------|------|-----------|
| `git diff --cached --name-only` | 获取暂存文件列表 | 文件路径 |
| `git diff --cached -- <file>` | 获取暂存内容 | 文件内容 |
| `git check-ignore <file>` | 检查 .gitignore 规则 | 跳过决策 |

### Bash-Python Bridge

```bash
# 在 Bash 子代理中:
STAGED_FILES=$(git diff --cached --name-only)
SCAN_RESULT=$(python3 "$SCRIPT_DIR/scripts/security_scan.py" --files "$STAGED_FILES")

if [ $? -ne 0 ]; then
    echo "$SCAN_RESULT"
    exit 1  # 阻止提交
fi
```

## Detection Categories

### Category 1: Secret Keys (密钥检测)

| 类型 | 模式 | 严重度 |
|------|------|--------|
| AWS Access Key | `AKIA[0-9A-Z]{16}` | CRITICAL |
| AWS Secret Key | `[A-Za-z0-9/+=]{40}` (带上下文) | CRITICAL |
| Google API Key | `AIza[0-9A-Za-z-_]{35}` | CRITICAL |
| OpenAI API Key | `sk-[a-zA-Z0-9_-]{32,}` | CRITICAL |
| Anthropic API Key | `sk-ant-[a-zA-Z0-9_-]{32,}` | CRITICAL |
| Generic Private Key | `-----BEGIN.*PRIVATE KEY-----` | CRITICAL |
| JWT Token | `eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*` | HIGH |

### Category 2: Cache/Compiled Files (缓存/编译文件)

| 模式 | 描述 | 严重度 |
|------|------|--------|
| `__pycache__/` | Python 字节码缓存 | MEDIUM |
| `*.pyc`, `*.pyo` | Python 编译文件 | MEDIUM |
| `node_modules/` | Node.js 依赖 | MEDIUM |
| `.venv/`, `venv/` | Python 虚拟环境 | MEDIUM |
| `*.exe`, `*.dll` | Windows 可执行文件 | HIGH |
| `dist/`, `build/` | 构建输出 | MEDIUM |

### Category 3: Config Files (配置文件)

| 文件模式 | 风险 | 严重度 |
|----------|------|--------|
| `.env` | 环境变量秘密 | CRITICAL |
| `credentials.*` | 凭证文件 | CRITICAL |
| `*.pem`, `*.key` | 私钥文件 | CRITICAL |
| `.htpasswd` | Apache 密码文件 | CRITICAL |
| `*.ppk` | PuTTY 私钥 | CRITICAL |

### Category 4: Internal Information (内部信息)

| 模式 | 描述 | 严重度 |
|------|------|--------|
| `10\.\d{1,3}\.\d{1,3}\.\d{1,3}` | 私有 IP (A类) | LOW |
| `172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}` | 私有 IP (B类) | LOW |
| `192\.168\.\d{1,3}\.\d{1,3}` | 私有 IP (C类) | LOW |
| `@internal\..*` | 内部邮件域名 | MEDIUM |
| `@corp\..*` | 企业邮件域名 | MEDIUM |

## Build Order (Considering Dependencies)

### Phase 1: Core Infrastructure (无依赖)
1. `scripts/rules/patterns.py` - 定义所有正则模式
2. `scripts/rules/gitignore_parser.py` - 解析 .gitignore 规则

### Phase 2: Detection Modules (依赖 Phase 1)
3. `scripts/detectors/secrets.py` - 密钥检测 (使用 patterns)
4. `scripts/detectors/cache_files.py` - 缓存文件检测
5. `scripts/detectors/config_files.py` - 配置文件检测
6. `scripts/detectors/internal_info.py` - 内部信息检测

### Phase 3: Main Scanner (依赖 Phase 2)
7. `scripts/security_scan.py` - 主入口,编排检测器

### Phase 4: Integration (依赖 Phase 3)
8. 修改 `SKILL.md` - 添加安全扫描步骤到工作流
9. 添加 `TROUBLESHOOTING.md` 章节 - 安全扫描错误处理

### Phase 5: Testing (与 Phase 2-4 并行)
10. `tests/test_secrets.py`
11. `tests/test_cache_files.py`
12. `tests/test_config_files.py`

## Anti-Patterns to Avoid

### Anti-Pattern 1: Writing Temporary Files

**错误做法:** 将暂存内容写入临时文件进行扫描
**为什么错:** 安全风险(秘密在临时文件)、清理负担、更慢
**正确做法:** 直接从 `git diff --cached` 流式读取内容

### Anti-Pattern 2: Scanning Entire Repository

**错误做法:** 每次提交扫描整个仓库
**为什么错:** 大仓库慢、与当前更改无关
**正确做法:** 只扫描暂存文件 (`git diff --cached`)

### Anti-Pattern 3: Ignoring .gitignore

**错误做法:** 在扫描器配置中重复定义忽略规则
**为什么错:** git 和扫描器规则可能分歧、用户困惑
**正确做法:** 复用 .gitignore 模式,添加 `.security-ignore` 扩展

### Anti-Pattern 4: No Escape from False Positives

**错误做法:** 硬性阻止所有发现,无覆盖机制
**为什么错:** 阻止合法工作,用户会禁用扫描器
**正确做法:** 支持 `--skip-security` 标志带警告,或 `.security-baseline` 白名单

## Performance Considerations

| 指标 | 目标 | 方法 |
|------|------|------|
| 扫描时间 | < 2 秒 | 只扫描暂存文件,非仓库 |
| 内存 | < 50MB | 流式读取,不加载所有文件 |
| 输出 | 简洁 | 按严重度分组,每文件限制数量 |

### Optimization Strategies

1. **Early Exit**: 发现 CRITICAL 问题后停止
2. **File Type Filter**: 跳过二进制文件、图片
3. **Content Sampling**: 大文件采样前/后 N 行
4. **Pattern Compilation**: 启动时预编译正则模式

## Comparison: Tool Options

| 工具 | 优点 | 缺点 | 适用性 |
|------|------|------|--------|
| **Gitleaks** | 最快,高召回率(86-88%) | Go 编写,外部依赖 | CI/CD 集成 |
| **TruffleHog** | 800+ 类型,验证机制 | 较慢 | 全面审计 |
| **detect-secrets** | 基线管理 | 需要维护基线文件 | 持续监控 |
| **Custom Python** | 零外部依赖,完全控制 | 需要维护模式 | 本项目 |

**推荐:** 使用 Custom Python 实现,因为:
1. 无外部依赖,与现有架构一致
2. 可针对项目需求定制
3. 易于集成到 Bash 子代理

## Sources

- [Microsoft Learn - Implement Git Hooks](https://learn.microsoft.com/zh-cn/training/modules/explore-git-hooks/3-implement) - Pre-commit hook 模式
- [CSDN - Git User Sensitive Information Check](https://m.blog.csdn.net/xinbuq/article/details/136405597) - 凭证检测模式
- [Gitleaks Rule Development Guide](https://blog.csdn.net/gitblog_01007/article/details/151464186) - 自定义检测规则
- [Secrets Patterns DB](https://gitcode.com/gh_mirrors/se/secrets-patterns-db) - 开源秘密模式库
- [TruffleHog Customization](https://blog.csdn.net/gitblog_01113/article/details/151530578) - 检测工具对比
- [GitPython Documentation](https://deepinout.com/git/git-questions/209_git_how_to_get_staged_files_using_gitpython.html) - 暂存文件访问
- [OSV-Scanner Git Hooks](https://m.blog.csdn.net/gitblog_00270/article/details/151305927) - 漏洞扫描集成

---

*Architecture research for: Git Security Scanning Integration*
*Researched: 2026-02-25*
