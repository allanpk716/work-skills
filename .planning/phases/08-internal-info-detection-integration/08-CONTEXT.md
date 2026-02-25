# Phase 8: Internal Info Detection & Integration - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

添加内部信息检测功能（内网 IP、内部域名、邮箱地址）和白名单功能，并将安全扫描功能完整集成到 windows-git-commit 技能中。这是安全扫描功能的核心完善阶段，不涉及新的检测类型或新的功能模块。

</domain>

<decisions>
## Implementation Decisions

### 白名单配置方式
- 使用特殊注释标记语法（而非独立配置文件或 YAML）
- 支持四种标记类型：
  - 忽略整行：`# gitcheck:ignore-line`
  - 忽略整个文件：`# gitcheck:ignore-file`
  - 忽略特定规则：`# gitcheck:ignore-rule:INTL-01`
  - 忽略某类检测：`# gitcheck:ignore-all-ips`（只忽略 IP 检测）
- 配置位置：
  - .gitignore 文件（项目级和全局级）
  - 代码行内注释（在代码文件中）
  - 文件头部标记（在文档或配置文件开头）
- 冲突处理：标记语法错误时显示警告但继续扫描该文件/行

### 检测严格度
- 检测所有匹配规则的内部信息，包括文档中的示例地址
- 由用户通过白名单控制误报，确保安全优先
- 内网 IP 范围：检测所有私有地址（10.x.x.x, 172.16-31.x.x, 192.168.x.x）
- 内部域名检测范围：
  - 标准内部域名：*.internal, *.local, *.corp, *.intranet
  - 局域网扩展域名：*.lan, *.home, *.private
  - 测试用域名：*.test, *.example, *.invalid
  - 支持自定义域名后缀（用户可配置）
- 上下文判断：严格匹配，不考虑代码上下文（注释、字符串等）

### 技能集成方式
- 自动启用：用户使用 windows-git-commit 技能时自动执行安全扫描，无需额外配置
- 扫描失败处理：如果扫描器本身出错（非检测到问题），显示警告但继续执行 git commit
- SKILL.md 配置项：只暴露启用/禁用开关，其他参数保持简单
- 错误级别：所有内部信息（IP、域名、邮箱）都作为错误级别，必须处理或添加白名单

### 邮箱检测策略
- 检测范围：检测所有邮箱地址格式（xxx@yyy.zzz）
- 排除规则：
  - 支持排除已知公开邮箱（如 noreply@github.com, support@example.com）
  - 支持排除示例邮箱（如 test@example.com, user@domain.com）
  - 也支持无排除规则模式（完全由用户通过白名单控制）
- 上下文场景：检测所有场景中的邮箱
  - 代码注释中的邮箱
  - 字符串字面量中的邮箱（如 `email = "user@example.com"`）
  - URL 中的邮箱（如 `mailto:user@example.com`）
  - JSON/YAML 配置文件中的邮箱字段
- 报告级别：错误级别（与其他内部信息一致）

### Claude's Discretion
- 白名单标记的优先级规则（当同时存在多个标记时的处理）
- 邮箱检测的内置排除列表与用户自定义排除列表的合并策略
- 自定义域名后缀的配置文件位置和格式
- 错误消息的具体文案和示例

</decisions>

<specifics>
## Specific Ideas

- "我希望白名单配置简单直观，就像在 .gitignore 中添加注释一样"
- "扫描器应该严格一点，宁可多检测也不要漏检，用户可以通过白名单控制"
- "集成到 windows-git-commit 后应该是无感的，自动保护我的代码库"
- "邮箱地址也是敏感信息，应该和其他内部信息一样严格处理"

</specifics>

<deferred>
## Deferred Ideas

None — 讨论保持在阶段范围之内

</deferred>

---

*Phase: 08-internal-info-detection-integration*
*Context gathered: 2026-02-25*
