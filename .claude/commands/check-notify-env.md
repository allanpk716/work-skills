---
name: check-notify-env
description: 检查 claude-notify 插件的运行环境是否满足要求
---

<objective>
系统性地检查 claude-notify 插件的运行环境配置，包括 Python 环境、依赖包、环境变量和 hooks 配置。

这帮助用户在新机器上快速验证通知功能是否能正常工作，避免因环境问题导致通知失败。
</objective>

<process>
1. **检查 Python 环境**
   - 验证 Python 是否已安装
   - 检查 Python 版本

2. **检查 Python 依赖包**
   - 验证 `requests` 包是否已安装
   - 验证 `win10toast` 包是否已安装
   - 如果包缺失，给出安装命令

3. **检查环境变量**
   - 验证 `PUSHOVER_TOKEN` 是否已配置
   - 验证 `PUSHOVER_USER` 是否已配置
   - 如果缺失，提示用户配置方法

4. **检查 Hooks 配置**
   - 读取 `~/.claude/settings.json`
   - 验证 Stop hook 是否已配置
   - 验证 Notification hook 是否已配置
   - 如果缺失，给出配置说明

5. **生成诊断报告**
   - 列出所有检查项的状态（✅ 通过 / ❌ 失败）
   - 对于失败项，提供具体的修复步骤
   - 给出总体评估：环境是否就绪
</process>

<success_criteria>
- 所有检查项都已执行并报告状态
- 对于每个问题项，提供了清晰的修复指导
- 生成了一份完整的诊断报告
- 用户能根据报告快速定位和解决环境问题
</success_criteria>
