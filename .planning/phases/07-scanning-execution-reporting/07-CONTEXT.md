# Phase 7: Scanning Execution & Reporting - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

在 git commit 前自动扫描暂存区内容,发现敏感信息时阻止提交并显示详细的问题报告。用户可以通过 .gitignore 自定义排除规则。扫描规则引擎在 Phase 6 中已实现,本阶段专注于执行流程、报告生成和用户交互。

</domain>

<decisions>
## Implementation Decisions

### 错误处理流程
- **阻止策略:** 发现敏感信息时直接阻止 git commit 执行,不提供继续选项(严格安全保障)
- **紧急跳过:** 不允许跳过扫描功能,防止用户绕过安全检查
- **多问题处理:** 汇总显示所有发现的问题,一次性呈现完整列表(而非逐个显示)
- **错误后操作:** 扫描失败后提供建议命令,引导用户下一步操作(如 "git reset HEAD <file>")

### 输出呈现
- **结果格式:** 使用表格格式显示扫描结果,结构化呈现问题信息
- **彩色输出:** 使用彩色输出区分问题类型(红色=敏感信息,黄色=警告等),提高可读性
- **详细程度:** 默认简洁输出,通过 flag 控制详细程度(如 --verbose 显示完整信息)
- **输出顺序:** 按严重程度排序问题,最严重的问题优先显示

### 报告内容深度
- **敏感信息处理:** 完全脱敏显示,隐藏敏感部分只显示上下文(最大化安全性)
- **修复建议:** 提供详细的修复建议和可执行的命令示例(如 "git reset HEAD <file>" 或 "添加到 .gitignore")
- **规则标识:** 显示规则 ID 和名称(如 SENS-01: AWS Access Key),便于查找文档和了解规则详情
- **上下文信息:** 显示问题代码片段(前后几行代码),帮助用户理解问题上下文

### Claude's Discretion
- 表格列的具体布局和宽度
- 彩色输出的具体颜色方案
- 代码片段显示的行数(前后各几行)
- 简洁/详细模式的具体内容差异

</decisions>

<specifics>
## Specific Ideas

- 用户应能快速理解问题严重性和位置,无需额外查找文档
- 修复建议应具有可操作性,用户可以直接复制粘贴命令
- 输出格式应对开发者友好,符合 CLI 工具的常见模式
- 需要考虑 Windows 终端的兼容性(彩色输出、表格渲染)

</specifics>

<deferred>
## Deferred Ideas

None — 讨论保持在阶段范围内

</deferred>

---

*Phase: 07-scanning-execution-reporting*
*Context gathered: 2026-02-25*
