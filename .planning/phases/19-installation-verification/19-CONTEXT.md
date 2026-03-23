# Phase 19: Installation Verification - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

安装完成后自动运行验证脚本,显示通过/失败状态摘要,失败时显示具体问题和解决建议,提供手动重新验证命令。不包括创建新的验证逻辑、修改现有 Python 验证脚本的检查项、实现验证失败的自动修复功能。

</domain>

<decisions>
## Implementation Decisions

### 验证脚本执行方式

**调用策略:**
- 直接调用现有 `plugins/claude-notify/scripts/verify-installation.py`
- 不重写为 Node.js,复用已验证的 Python 验证逻辑
- 依赖 Python 环境(已在前序阶段检测)

**执行参数:**
- 无参数执行,运行所有 7 个检查项
- 不支持选择性检查(如 `--check-python`)
- 不修改 Python 脚本添加 JSON 输出

**调用方式:**
```javascript
// 使用 execa 执行 Python 脚本
const result = await execa('python', [
  path.join(__dirname, '../../plugins/claude-notify/scripts/verify-installation.py')
], {
  timeout: 30000,  // 30 秒超时
  encoding: 'utf-8'
});
```

### 结果展示格式

**输出解析:**
- 解析 Python 脚本的文本输出,提取状态信息
- 使用正则表达式匹配 `[OK]` 和 `[X]` 标记
- 解析检查项名称和结果消息
- 不修改 Python 脚本添加 JSON 输出

**解析正则示例:**
```javascript
// 匹配格式: "  [OK] Python version: PASS"
const pattern = /^\s*\[(OK|X)\]\s*(.+?):\s*(PASS|FAIL)/;
```

**显示格式:**
- 使用表格格式,与 Phase 15 环境检测报告风格一致
- 表头:检查项(Check)、状态(Status)、详情(Details)
- 状态图标:✓(绿色)表示 PASS,✗(红色)表示 FAIL

**表格示例:**
```
安装验证结果:

+---------------------------+--------+--------------------------------+
| 检查项                    | 状态   | 详情                           |
+---------------------------+--------+--------------------------------+
| Python Version            | ✓ PASS | 3.9.1 (>=3.8 required)        |
| Standard Libraries        | ✓ PASS | All libraries available        |
| Environment Variables     | ✗ FAIL | PUSHOVER_TOKEN not set        |
| Pushover API              | ⊘ SKIP | Credentials not configured     |
| Windows Toast             | ✓ PASS | Test notification sent         |
| Plugin Files              | ✓ PASS | All files found                |
| Slash Commands            | ✓ PASS | All commands respond           |
+---------------------------+--------+--------------------------------+

Summary: 5/7 checks passed
```

**双语支持:**
- Python 脚本保持英文输出
- Node.js 包装层添加中文标题和说明
- 使用 i18n 系统翻译表头和摘要消息
- 检查项名称保持英文(与 Python 输出一致)

**i18n 键示例:**
```json
{
  "verification.title": "Installation Verification",
  "verification.summary": "Summary: {passed}/{total} checks passed",
  "verification.column.check": "Check",
  "verification.column.status": "Status",
  "verification.column.details": "Details"
}
```

### 失败处理策略

**失败操作:**
- 验证失败显示警告和建议,允许安装继续
- 不阻止安装完成,用户可稍后修复问题
- 失败信息包含具体问题和解决建议

**失败阈值:**
- 至少 5/7 检查项通过即算验证成功
- 低于 5 项通过显示警告但仍允许完成
- 不强制所有检查项都通过

**检查项分类:**
- **关键项**(必须通过才能正常使用):
  - Python Version (基础依赖)
  - Standard Libraries (基础依赖)
  - Plugin Files (插件完整性)
  - Slash Commands (功能完整性)

- **非关键项**(可选,失败不影响基础功能):
  - Environment Variables (Pushover 可选)
  - Pushover API (Pushover 可选)
  - Windows Toast (通知渠道可选)

**失败反馈:**
- 失败检查项显示红色 ✗ 图标
- 详情列显示具体失败原因
- 摘要后显示"常见解决方案"提示
- 例如:
  ```
  Common solutions:
  - Install missing Python libraries: pip install requests
  - Set environment variables: PUSHOVER_TOKEN, PUSHOVER_USER
  - Check PowerShell execution policy
  ```

### 重新验证命令

**命令格式:**
- 复用安装器包名,添加 `--verify` 标志
- 命令: `npx @allanpk716/work-skills-setup --verify`
- 不创建独立的验证包

**CLI 选项实现:**
- 在 `installer/src/cli.js` 添加 `--verify` 选项
- 选项说明: "Run installation verification only"
- 使用示例: `npx @allanpk716/work-skills-setup --verify`

**执行流程:**
1. 用户运行 `npx @allanpk716/work-skills-setup --verify`
2. CLI 解析 `--verify` 标志
3. 跳过欢迎、环境检测、配置、市场集成步骤
4. 直接执行验证流程(Step 8)
5. 显示验证结果并退出

**显示位置:**
- 验证摘要后显示重新验证命令
- 格式: "To re-run verification: npx @allanpk716/work-skills-setup --verify"
- 使用灰色(chalk.gray)显示,区别于主要信息

**错误场景:**
- Python 未安装:显示错误,"Python is required for verification"
- Python 脚本不存在:显示错误,"Verification script not found"
- 执行超时(30 秒):显示错误,"Verification timeout"

### Claude's Discretion

- 解析正则的具体实现细节
- 表格的边框样式和颜色方案
- 失败消息的具体措辞
- 超时时间设置(默认 30 秒)
- 是否显示跳过的检查项(如 Pushover API 未配置时)
- i18n 键的命名规范

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — Phase 19 需求定义(VER-01 到 VER-04)
- `.planning/ROADMAP.md` — Phase 19 目标和成功标准

### Prior Phase Patterns
- `.planning/phases/15-environment-detection/15-CONTEXT.md` — 表格格式状态报告模式
- `.planning/phases/16-python-dependencies/16-CONTEXT.md` — 错误处理和解决建议模式
- `.planning/phases/17-interactive-configuration/17-CONTEXT.md` — i18n 集成,双语支持

### Existing Code
- `plugins/claude-notify/scripts/verify-installation.py` — 现有验证脚本,7 个检查项实现
- `installer/src/cli.js` — CLI 选项解析,需要添加 --verify 标志
- `installer/src/i18n/` — i18n 系统,需要添加验证相关翻译键

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `installer/src/index.js` — 主入口点,已预留 Step 8 位置(注释"To be implemented in Phase 19")
- `installer/src/cli.js` — CLI 解析器,使用 yargs,支持添加新选项
- `installer/src/i18n/` — i18n 系统,支持中英文翻译和参数替换
- `plugins/claude-notify/scripts/verify-installation.py` — 现有验证脚本,输出格式稳定

### Established Patterns
- **表格格式输出** — 使用 cli-table3 库,彩色状态图标,与 Phase 15 一致
- **命令执行** — 使用 execa 库,Promise API,超时控制,错误捕获
- **i18n 集成** — 所有用户可见文本使用 `t('key')` 翻译,支持参数替换
- **错误处理** — try-catch 捕获错误,友好错误消息,解决建议

### Integration Points
- `installer/src/index.js` — 在 Step 8 调用验证模块
- `installer/src/cli.js` — 添加 `--verify` 选项,设置 `options.verifyOnly` 标志
- `installer/src/i18n/en.json` 和 `zh.json` — 添加 `verification.*` 翻译键
- 新增模块: `installer/src/verification/` — 验证模块目录

</code_context>

<specifics>
## Specific Ideas

- 验证脚本执行顺序:Step 8 在市场集成(Step 7)之后
- Python 脚本路径: `plugins/claude-notify/scripts/verify-installation.py`(相对于项目根目录)
- 验证超时: 30 秒(Python 脚本包含网络请求,需要足够时间)
- 失败阈值: 5/7 检查项通过(允许非关键项如 Pushover 配置失败)
- 表格样式: 与 Phase 15 环境检测报告一致,使用 cli-table3
- 重新验证命令: `npx @allanpk716/work-skills-setup --verify`
- 所有检查项都是幂等的,可以重复执行

</specifics>

<deferred>
## Deferred Ideas

- 修改 Python 脚本添加 JSON 输出格式 — 当前文本解析已足够可靠,避免修改已验证的 Python 脚本
- 验证失败的自动修复功能 — 超出安装器职责,只检测和提示,不自动修复
- 创建独立的验证包(@allanpk716/work-skills-verify) — 复用安装器包名更简单,无需发布额外包
- 选择性检查(如 --check-python) — 增加复杂度,执行所有检查更快
- 验证历史记录和日志 — 属于高级功能,当前版本仅显示结果
- 将验证脚本添加到 PATH — 需要修改系统环境变量,复杂度高

</deferred>

---

*Phase: 19-installation-verification*
*Context gathered: 2026-03-23*
