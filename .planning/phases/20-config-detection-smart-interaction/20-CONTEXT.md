# Phase 20: Config Detection & Smart Interaction - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

增强安装器已有的配置器模块（pushover.js、git-user.js），使其能可靠检测通过 setx 持久化的 Pushover 凭证和通过 git config --global 配置的 Git 用户信息。检测到已有配置时显示当前值并让用户选择跳过或重新输入。不支持新的配置类型，不改变配置持久化方式。

</domain>

<decisions>
## Implementation Decisions

### Pushover 凭证检测

- **D-01:** 双源检测 — 同时检查 `process.env`（当前会话）和注册表 `HKCU\Environment`（setx 持久化的值）。任一来源有值都算"已配置"。这解决了用户上次通过安装器配置了 Pushover 但当前终端未重启导致 process.env 为空的情况。
- **D-04:** 保持现有显示格式 — 检测到已有凭证时显示 Token 前 8 位 + "..."，User 前 8 位 + "..."。
- 环境变量名以代码为准：`PUSHOVER_TOKEN` 和 `PUSHOVER_USER`（注意：REQUIREMENTS.md 中写的 PUSHOVER_API_KEY/PUSHOVER_USER_KEY 与实际代码不一致，以代码为准）。

### 部分配置处理

- **D-02:** 逐项处理 — 当部分配置项存在时，已有项询问跳过/更新，缺失项直接提示输入。例如：只有 PUSHOVER_TOKEN 没有 PUSHOVER_USER 时，询问 TOKEN 是否保留，然后直接提示输入 USER。Git user 同理：只有 name 没有 email 时，询问 name 是否保留，然后提示输入 email。

### 跳过/更新交互模式

- **D-03:** 使用 enquirer Confirm 提示 — 默认 Y = 跳过（保留现有配置），N = 重新输入。统一 Pushover 和 Git user 的交互模式。与当前 pushover.js 已有的 `promptReconfigure` 模式一致。
- **需要修改 git-user.js** — 当前 git-user.js 检测到已有配置时直接返回（无询问），需要添加 Confirm 跳过/更新选择。

### Claude's Discretion

- 注册表读取的具体实现方式（reg query 命令或 Node.js 方案）
- Confirm 提示的具体消息文本
- 部分配置检测的代码组织方式

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — Phase 20 需求定义（CFGD-01, CFGD-02, INTX-01, INTX-02, INTX-03）
- `.planning/ROADMAP.md` — Phase 20 目标和成功标准

### Prior Phase Patterns
- `.planning/phases/17-interactive-configuration/17-CONTEXT.md` — 配置器模块设计决策，enquirer 交互模式，setx 持久化方式，i18n 集成
- `.planning/phases/19-installation-verification/19-CONTEXT.md` — i18n 翻译键模式，表格输出格式

### Existing Code (MODIFY, don't create new)
- `installer/src/configurators/pushover.js` — 已有 detectPushoverEnv() 和 configurePushover()，需要增强检测逻辑
- `installer/src/configurators/git-user.js` — 已有 detectGitUser() 和 configureGitUser()，需要添加跳过/更新交互
- `installer/src/configurators/index.js` — 串联配置器的入口，可能需要调整

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `installer/src/configurators/pushover.js` — 已有 `detectPushoverEnv()`（检查 process.env）、`setEnvVariable()`（setx 持久化）、`validatePushoverCredentials()`（API 验证）、`configurePushover()`（完整配置流程含检测+询问+输入+验证+保存）
- `installer/src/configurators/git-user.js` — 已有 `detectGitUser()`（git config --global）、`configureGitUser()`（检测+输入+设置）
- `installer/src/i18n/` — i18n 系统，已有 pushover.* 和 gitUser.* 翻译键
- `enquirer` — 已安装，Confirm 和 Input prompt 可用

### Established Patterns
- **模块化配置器**：每个配置器导出 detect + configure 函数
- **enquirer 交互**：Input 用于文本输入，Confirm 用于确认选择
- **setx 持久化**：通过 execa 调用 setx 命令，设置后更新 process.env
- **i18n 集成**：所有用户可见文本使用 t('key') 翻译

### Integration Points
- `installer/src/configurators/pushover.js` — 主要修改目标：增强 detectPushoverEnv() 添加注册表检测，添加逐项处理逻辑
- `installer/src/configurators/git-user.js` — 主要修改目标：在已配置时添加 Confirm 跳过/更新交互
- `installer/src/i18n/en.json` 和 `zh.json` — 可能需要添加新的翻译键（如部分配置的提示语）

</code_context>

<specifics>
## Specific Ideas

- 注册表检测命令示例：`reg query "HKCU\Environment" /v PUSHOVER_TOKEN`，解析 stdout 提取值
- Pushover 检测流程：先检查 process.env，如果没有则查询注册表，合并结果
- git-user.js 当前行为（需修改）：检测到已配置时直接 `return { status: 'configured' }` 无询问
- 环境变量名映射（代码实际值）：PUSHOVER_TOKEN, PUSHOVER_USER（不是 REQUIREMENTS.md 中写的 PUSHOVER_API_KEY, PUSHOVER_USER_KEY）

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 20-config-detection-smart-interaction*
*Context gathered: 2026-03-29*
