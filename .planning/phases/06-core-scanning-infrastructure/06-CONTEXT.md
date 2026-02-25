# Phase 6: Core Scanning Infrastructure - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

构建规则引擎和核心检测器，用于扫描密钥、缓存文件和配置文件，防止敏感信息泄露到版本控制。扫描器作为 windows-git-commit 技能的子代理运行，在提交前检测暂存区内容。扫描执行、报告生成、自定义规则和高级检测器在后续阶段实现。

</domain>

<decisions>
## Implementation Decisions

### 扫描执行方式
- 作为子代理运行（集成到 windows-git-commit 技能），而非独立的 Git Hook
- 仅扫描 git add 后的暂存区文件（staged files）
- 发现任何敏感信息立即阻止提交，返回非零退出码
- 扫描失败时提供清晰的错误信息和修复建议

### 规则定义和加载
- Python 代码内置所有规则，单文件组织（scanner_rules.py 或类似）
- 使用 Python 类/函数结构定义每条规则，包含检测逻辑、描述、匹配模式
- 基于正则表达式进行模式匹配（暂不使用熵值分析等高级方法）
- 所有问题统一为 ERROR 级别（单一严重性，简化逻辑）

### 检测严格度
- 高容忍误报：优先提高检测率，宁可多报一些边界情况
- 限制扫描文件大小为 1MB，跳过超大文件避免性能问题
- 使用扩展名白名单过滤文件类型，跳过二进制文件（.exe, .dll, .png, .jpg 等）
- 默认排除常见目录：node_modules, .git, __pycache__, venv, .venv 等

### 输出格式
- 彩色结构化输出（使用 colorama 或类似库）
- 分组显示问题：按文件或规则类型分组，提高可读性
- 显示完整信息：文件路径、行号、问题描述、脱敏内容片段
- 部分脱敏敏感内容：显示部分内容（如 `AWS***KEY`），便于用户确认但保护安全
- 仅中文输出（暂不实现双语支持）

### Claude's Discretion
- 具体正则表达式的编写和优化
- 彩色输出的配色方案
- 脱敏算法的具体实现（显示多少字符）
- 文件大小限制的具体阈值（1MB 是否合适）
- 扩展名白名单的完整列表

</decisions>

<specifics>
## Specific Ideas

- "作为子代理运行，集成到 windows-git-commit 技能中，用户无需额外配置"
- "高容忍误报，宁可多报一些，让用户自己判断，也不要漏掉真正的泄露"
- "输出要清晰易读，用颜色和分组让用户快速定位问题"

</specifics>

<deferred>
## Deferred Ideas

- 熵值分析等高级检测方法 — Phase 7 或后续阶段
- JSON 输出格式支持 — Phase 7（报告生成）
- 双语支持（中英文切换）— Phase 10（UX 优化）
- 严重性分级（ERROR/WARNING）— Phase 10（结果分级）
- 自定义规则配置文件 — Phase 7（自定义规则）

</deferred>

---

*Phase: 06-core-scanning-infrastructure*
*Context gathered: 2026-02-25*
