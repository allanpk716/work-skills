# Phase 17: Interactive Configuration - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

为安装器添加交互式配置引导功能，检测和配置 Pushover 通知凭证、Git SSH 设置和 Git 用户信息。用户可以通过交互式提示输入配置，配置将持久化到系统环境变量或 Git 全局配置中。不包括自动下载安装 SSH 工具、自动生成 SSH 密钥、配置 Pageant 密钥加载等超出安装器职责范围的功能。

</domain>

<decisions>
## Implementation Decisions

### Pushover 配置流程

**环境变量检测：**
- 检测当前会话的环境变量（使用 process.env）
- 不检测注册表，因为 setx 设置的环境变量需要重启终端才能生效

**交互式输入：**
- 使用两个单独的 enquirer 提示分别输入 PUSHOVER_TOKEN 和 PUSHOVER_USER
- 每个提示独立，更清晰易懂

**持久化保存：**
- 使用 setx 命令将凭证写入系统环境变量（用户级）
- 设置后提示用户需要重启终端才能生效

**配置验证：**
- 配置完成后立即调用 Pushover API 验证凭证有效性
- 验证成功：显示成功消息，继续下一步
- 验证失败：显示详细错误（invalid token/user），允许重新输入

**已配置处理：**
- 检测到环境变量已存在时，显示已配置状态
- 询问用户是否重新配置（Yes/No）
- 选择 No 则跳过，选择 Yes 则引导重新输入

**跳过策略：**
- Pushover 是可选功能，允许用户跳过配置
- 跳过时显示提示：可以稍后手动配置环境变量

### Git SSH 检测和引导

**SSH 配置检测：**
- 使用 `git config --get core.sshCommand` 检测 Git SSH 配置
- 检测全局或当前仓库的配置

**未配置处理：**
- 检测到 SSH 未配置时，显示手动配置指导（不自动执行）
- 指导内容：列出关键步骤（如安装 TortoiseGit、配置 Pageant），提供文档链接
- 使用简化指导格式，避免过度详细

**指导内容示例：**
```
Git SSH 未配置。建议配置 SSH 以使用 Git 远程操作。

配置步骤：
1. 安装 TortoiseGit（包含 Pageant）
2. 生成 SSH 密钥（如使用 PuTTYgen）
3. 将公钥添加到远程仓库（GitHub/GitLab）
4. 配置 Git 使用 TortoiseGit 的 SSH：
   git config --global core.sshCommand "C:/Program Files/TortoiseGit/bin/TortoisePlink.exe"

详细文档：
https://work-skills.example.com/docs/git-ssh-setup
```

**跳过策略：**
- SSH 配置是可选的，允许用户跳过（用户可能使用 HTTPS）
- 跳过时不影响后续流程

### Git 用户信息检测

**检测方法：**
- 使用 `git config --get user.name` 和 `git config --get user.email` 检测
- 检测全局配置（--global）

**配置方式：**
- 配置到全局范围（`git config --global`），所有仓库通用

**必填性：**
- Git 提交需要用户信息，属于必需配置
- 不允许跳过（强制配置）

**未配置处理：**
- 检测到未配置时，使用 enquirer 交互式引导输入
- 两个单独提示：先输入 user.name，再输入 user.email
- 使用 `git config --global` 命令设置

**配置示例：**
```javascript
// 使用 enquirer Input prompt
const { Input } = require('enquirer');

const namePrompt = new Input({
  name: 'userName',
  message: '请输入您的 Git 用户名（用于提交记录）:'
});

const emailPrompt = new Input({
  name: 'userEmail',
  message: '请输入您的 Git 邮箱地址:'
});
```

### 配置失败处理和重试策略

**重试次数：**
- 每个配置项失败时最多重试 3 次
- 超过 3 次后显示错误并继续下一步（不停止整个安装）

**错误反馈：**
- 显示详细错误信息，包括错误类型和具体原因
- 例如：权限不足、网络错误、API 验证失败等
- 使用红色（chalk.red）高亮错误信息

**setx 失败处理：**
- 如果 setx 命令执行失败（如权限不足），提示用户手动设置环境变量
- 显示具体的 setx 命令示例，用户可以手动执行
- 继续下一步，不停止安装流程

**配置摘要：**
- 配置流程结束后显示配置摘要表格
- 包含所有配置项的状态：已配置/跳过/失败
- 使用彩色输出区分状态（绿色=成功，黄色=跳过，红色=失败）

**配置摘要示例：**
```
配置摘要：
+----------------+----------+--------+
| 配置项         | 状态     | 详情   |
+----------------+----------+--------+
| Pushover Token | ✓ 成功   | 已验证 |
| Pushover User  | ✓ 成功   | 已验证 |
| Git SSH        | ⊘ 跳过   | 用户跳过 |
| Git user.name  | ✓ 成功   | Alice  |
| Git user.email | ✓ 成功   | a@b.c  |
+----------------+----------+--------+
```

### Claude's Discretion

- enquirer 提示的具体消息文本和格式
- 配置指导文档的链接（如项目有文档站点）
- 错误消息的具体措辞
- 配置摘要的表格样式和颜色方案
- 是否支持批量配置（一次输入多项）vs 逐项配置

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — Phase 17 需求定义（CONF-01 到 CONF-07）
- `.planning/ROADMAP.md` — Phase 17 目标和成功标准

### Prior Phase Patterns
- `.planning/phases/16-python-dependencies/16-RESEARCH.md` — enquirer 库使用模式，交互式提示实现
- `.planning/phases/16-python-dependencies/16-01-SUMMARY.md` — i18n 系统使用，错误处理模式

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `installer/src/detectors/` — 检测器模块模式（python.js, git.js），可参考检测逻辑
- `installer/src/installers/pip-installer.js` — 交互式流程模式，错误处理，i18n 集成
- `installer/src/i18n/` — i18n 系统，支持中英文翻译，需要添加配置相关的翻译键
- `installer/node_modules/enquirer` — 已安装，支持 CommonJS require，提供 Input 和 Confirm prompts

### Established Patterns
- **模块化检测器**：每个检测器独立模块，导出检测函数和结果结构
- **i18n 集成**：所有用户可见文本使用 `t('key')` 翻译，支持参数替换
- **错误处理**：使用 try-catch 捕获错误，解析错误类型，映射到 i18n 错误消息
- **命令执行**：使用 execa 执行外部命令（git, setx），Promise API，自动错误处理

### Integration Points
- `installer/src/index.js` — main() 函数中调用配置流程（在 Phase 16 安装流程之后）
- `installer/src/i18n/en.json` 和 `zh.json` — 添加配置相关的翻译键
- 新增模块：`installer/src/configurators/` — 配置器模块（类似 detectors/ 和 installers/）

</code_context>

<specifics>
## Specific Ideas

- 配置顺序：Pushover（可选）→ Git SSH（可选）→ Git user.name/email（必需）
- 使用 enquirer Input prompt 进行文本输入（用户名、邮箱、token）
- 使用 enquirer Confirm prompt 进行确认（是否重新配置、是否跳过）
- 配置摘要使用彩色表格格式，与 Phase 15 的环境检测报告风格一致
- Git SSH 配置指导使用简化步骤列表，避免教程式详细说明
- 所有配置操作都是幂等的，可以重复执行

</specifics>

<deferred>
## Deferred Ideas

- 自动配置 SSH 密钥和 Pageant — 超出安装器职责，需要用户手动操作
- 检测 SSH 密钥是否已添加到 Pageant — 需要调用 Windows API，复杂度高
- 自动测试 SSH 连接（git@github.com）— 需要网络操作，可能超时
- 配置文件导出/导入 — 属于高级功能（INST-ADV-02），未来版本考虑
- 批量配置模式（一次输入所有信息）— 交互式流程逐项配置已足够
- 配置回滚功能 — 可以作为未来增强，当前版本仅记录配置状态

</deferred>

---

*Phase: 17-interactive-configuration*
*Context gathered: 2026-03-21*
