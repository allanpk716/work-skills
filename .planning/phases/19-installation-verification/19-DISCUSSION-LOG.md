# Phase 19: Installation Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 19-installation-verification
**Areas discussed:** 验证脚本执行方式, 结果展示格式, 失败处理策略, 重新验证命令

---

## 验证脚本执行方式

| Option | Description | Selected |
|--------|-------------|----------|
| 调用现有 verify-installation.py | 直接调用现有 Python 脚本,解析输出。优点:无需重写,验证逻辑已验证。缺点:依赖 Python,输出解析复杂 | ✓ |
| Node.js 重写验证逻辑 | 用 Node.js 重写所有验证逻辑。优点:统一语言,易集成。缺点:工作量大,需要重写 Python 特定检查(如 PowerShell Toast) | |
| 混合方式 | Node.js 负责基础检查(文件存在),Python 脚本负责高级检查(Pushover API)。优点:各取所长。缺点:复杂度增加,需两个验证步骤 | |

**User's choice:** 调用现有 verify-installation.py (推荐)
**Notes:** 复用已验证的 Python 验证逻辑,避免重写工作

---

## 调用参数

| Option | Description | Selected |
|--------|-------------|----------|
| 无参数,执行所有检查 | 直接调用 python verify-installation.py,依赖脚本内置的检查项 | ✓ |
| 支持选择性检查 | 通过参数指定检查项,如 --check-python --check-env。优点:灵活。缺点:需修改 Python 脚本 | |
| JSON 输出格式 | 添加 --json 参数,输出结构化 JSON 数据。优点:易解析。缺点:需修改 Python 脚本 | |

**User's choice:** 无参数,执行所有检查 (推荐)
**Notes:** 不修改 Python 脚本,保持简单

---

## 输出解析

| Option | Description | Selected |
|--------|-------------|----------|
| 解析文本输出 | 解析现有 Python 脚本的文本输出,提取 PASS/FAIL 状态。优点:无需修改 Python 脚本。缺点:解析可能脆弱 | ✓ |
| 修改 Python 脚本输出 JSON | 修改 Python 脚本添加 JSON 输出选项,Node.js 解析 JSON。优点:结构化数据,可靠。缺点:需修改 Python 脚本 | |

**User's choice:** 解析文本输出 (推荐)
**Notes:** 使用正则表达式匹配 [OK]/[X] 标记,避免修改 Python 脚本

---

## 显示格式

| Option | Description | Selected |
|--------|-------------|----------|
| 表格格式 | 与 Phase 15 环境检测报告格式一致,包含状态图标、检查项、结果。例如: ✓ Python Version \| PASS \| 3.9.1 | ✓ |
| 列表格式 | 简单的列表格式,每个检查项一行。例如: [OK] Python Version: PASS | |
| 摘要模式 | 只显示摘要,失败时才显示详细。例如: 7/7 checks passed - Installation verified | |

**User's choice:** 表格格式 (推荐)
**Notes:** 与 Phase 15 环境检测报告风格一致,使用 cli-table3

---

## 双语支持

| Option | Description | Selected |
|--------|-------------|----------|
| 验证脚本输出支持双语 | Python 脚本已支持双语,输出与安装器语言一致。优点:用户体验一致。缺点:需修改 Python 脚本 | |
| 包装层支持双语 | Python 脚本保持英文,Node.js 包装层添加中文标题和说明。优点:不修改 Python 脚本。缺点:检查项名称仍为英文 | ✓ |

**User's choice:** 包装层支持双语 (推荐)
**Notes:** Python 脚本保持英文输出,Node.js 层使用 i18n 添加中文标题和说明

---

## 失败操作

| Option | Description | Selected |
|--------|-------------|----------|
| 显示警告,允许继续 | 验证失败只显示警告和建议,允许安装完成。用户可稍后修复问题。适用于非关键检查项失败 | ✓ |
| 阻止安装完成 | 任何检查项失败都阻止安装完成,强制用户修复。适用于所有检查项都是关键的情况 | |
| 关键项失败才阻止 | 只有关键检查项(如 Python 版本)失败时才阻止,其他项只警告。需要定义哪些检查项是关键的 | |

**User's choice:** 显示警告,允许继续 (推荐)
**Notes:** 不阻止安装完成,用户可稍后修复问题

---

## 失败阈值

| Option | Description | Selected |
|--------|-------------|----------|
| 至少 5/7 通过 | 7 个检查项中有至少 5 个通过即可。允许非关键项(如 Pushover 配置)失败 | ✓ |
| 全部通过 (7/7) | 所有检查项都必须通过。最严格,但可能阻碍安装 | |
| 基础检查通过即可 (3/7) | 只要求基础检查通过(Python 版本、标准库、插件文件),其他可选 | |

**User's choice:** 至少 5/7 通过 (推荐)
**Notes:** 允许非关键项(Pushover 配置、Windows Toast)失败

---

## 重新验证命令

| Option | Description | Selected |
|--------|-------------|----------|
| npx 命令 | 显示 npx @allanpk716/work-skills-setup --verify 命令。用户可在任何位置运行。优点:方便记忆。缺点:需添加 --verify 选项到 CLI | ✓ |
| 直接运行 Python 脚本 | 显示 Python 脚本路径,用户手动执行。例如: python ~/.claude/skills/claude-notify/scripts/verify-installation.py。优点:无需修改安装器。缺点:路径长,难记忆 | |
| 创建 verify.bat 快捷命令 | 在安装目录创建 verify.bat 批处理文件,用户运行 verify 即可。优点:简单。缺点:需添加到 PATH 或告知用户路径 | |

**User's choice:** npx 命令 (推荐)
**Notes:** 添加 --verify 标志到安装器 CLI,用户可随时重新验证

---

## 命令格式

| Option | Description | Selected |
|--------|-------------|----------|
| 复用安装器包名 | 添加 --verify 标志到现有安装器。例如: npx @allanpk716/work-skills-setup --verify。优点:复用现有包名。缺点:需在 bin 入口添加选项 | ✓ |
| 独立验证包 | 创建独立的验证包。例如: npx @allanpk716/work-skills-verify。优点:独立工具,清晰。缺点:需发布另一个 npm 包 | |

**User's choice:** 复用安装器包名 (推荐)
**Notes:** 在 installer/src/cli.js 添加 --verify 选项

---

## Claude's Discretion

List areas where user said "you decide" or deferred to Claude:

- 解析正则的具体实现细节
- 表格的边框样式和颜色方案
- 失败消息的具体措辞
- 超时时间设置(默认 30 秒)
- 是否显示跳过的检查项(如 Pushover API 未配置时)
- i18n 键的命名规范

---

## Deferred Ideas

Ideas mentioned during discussion that were noted for future phases:

- 修改 Python 脚本添加 JSON 输出格式 — 当前文本解析已足够可靠,避免修改已验证的 Python 脚本
- 验证失败的自动修复功能 — 超出安装器职责,只检测和提示,不自动修复
- 创建独立的验证包(@allanpk716/work-skills-verify) — 复用安装器包名更简单,无需发布额外包
- 选择性检查(如 --check-python) — 增加复杂度,执行所有检查更快
- 验证历史记录和日志 — 属于高级功能,当前版本仅显示结果
- 将验证脚本添加到 PATH — 需要修改系统环境变量,复杂度高
