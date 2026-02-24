# Phase 2: Configuration & Diagnostics - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

提供配置管理和诊断工具,让用户能够配置通知服务、验证配置正确性、针对特定项目禁用通知,以及管理日志文件。通知功能的发送逻辑已在 Phase 1 实现,本阶段专注于配置、控制和诊断。

</domain>

<decisions>
## Implementation Decisions

### 环境变量配置
- 仅使用系统环境变量配置 Pushover API 凭据(PUSHOVER_TOKEN 和 PUSHOVER_USER)
- 不支持 .env 文件或配置文件,保持简单直接
- 环境变量缺失时记录错误日志但不崩溃,继续执行

### 诊断工具设计
- 在现有 notify.py 中添加 `--diagnose` 参数,而非创建独立脚本
- 诊断输出使用文本格式,简单明了,适合命令行查看
- 诊断功能仅在用户手动运行时执行,不自动触发
- 诊断检查内容:
  - 环境变量检查(显示前4位用于确认)
  - Pushover API 连接测试(发送测试通知)
  - 项目配置文件检测(.no-pushover, .no-windows)
  - 日志文件路径和状态显示
- 测试通知内容: "Test notification from Claude Code"

### 日志管理
- 保持当前方案:每次运行创建独立的日志文件(按日期和PID命名)
- 日志清理策略:保留最近 5 天的日志文件
- 清理触发时机:每次 notify.py 运行时自动执行清理
- 不引入额外的日志库依赖,使用 Python 标准库实现

### 项目级通知控制
- 使用 .no-pushover 和 .no-windows 文件禁用特定项目的通知
- 保持简单明确,不引入额外的配置文件格式
- 不集成到 Claude Code 的 settings.json,保持独立性

### 错误处理和用户体验
- 环境变量缺失时:记录错误日志 + 继续执行(静默失败)
- 日志中提示用户设置环境变量,不显示完整配置步骤
- 不干扰 Claude Code 正常运行,无弹窗或中断

### Claude's Discretion
- 日志清理的具体实现逻辑(如何判断5天前的文件)
- 诊断输出的具体格式和布局
- 测试通知的标题和详细内容
- 错误日志的具体措辞

</decisions>

<specifics>
## Specific Ideas

- "诊断工具应该像医生的体检报告一样,告诉我哪里有问题,怎么修复"
- "日志清理应该是无感知的,自动在后台完成"
- "环境变量缺失不应该打扰我,只要记录日志就行了"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-configuration-diagnostics*
*Context gathered: 2026-02-24*
