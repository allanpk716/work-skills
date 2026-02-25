---
created: 2026-02-25T09:52:40.366Z
title: Fix notification hook not triggering during multi-turn interactions
area: tooling
files:
  - plugins/claude-notify/hooks/hooks.json:4-16
  - plugins/claude-notify/hooks/scripts/notify.py
---

## Problem

在使用 Claude Code 进行多轮交互时(例如使用 `/gsd:discuss` 或默认的 plan 功能时),需要用户从选项中选择,这些交互过程不会触发 `Stop` hook,导致通知不会被发送。用户需要等待这些交互完成,但没有通知提醒,可能错过任务完成的时间。

**触发场景:**
1. `/gsd:discuss` - 多轮问答收集需求
2. 默认的 plan 功能 - 需要用户选择方案
3. 其他使用 AskUserQuestion 的交互式命令

**当前行为:**
- Hook 只在 `Stop` 事件时触发
- 多轮交互过程中的中间暂停不会触发 `Stop`
- 用户无法在交互过程中收到通知

**期望行为:**
- 在多轮交互的每个暂停点都发送通知
- 或者在整个交互流程结束时发送通知
- 用户能及时知道需要继续操作或任务已完成

## Solution

需要研究并解决通知在多轮交互中不触发的问题。可能的解决方案包括:

### 方案 1: 使用其他 Hook 事件

**调研:**
- 查看 Claude Code 支持的其他 hook 事件
- 确认是否有 `Pause`、`WaitForInput`、`AskQuestion` 等事件
- 测试这些事件是否能捕获多轮交互的暂停点

**实现:**
如果存在合适的 hook 事件,修改 `hooks.json`:
```json
{
  "hooks": {
    "Stop": [...],
    "AskUserQuestion": [  // 假设存在此事件
      {
        "matcher": "*",
        "hooks": [...]
      }
    ]
  }
}
```

### 方案 2: 在 AskUserQuestion 后手动触发通知

**调研:**
- 研究 AskUserQuestion 的实现机制
- 确认是否可以在提问后注入通知逻辑

**实现:**
在技能/命令中使用 AskUserQuestion 后,显式调用通知脚本。

### 方案 3: 使用 PromptSubmit hook

**调研:**
- 检查 `PromptSubmit` hook 的触发时机
- 确认是否能在 Claude 回复包含 AskUserQuestion 时触发

**实现:**
如果 Claude 的回复中包含选项,则在 `PromptSubmit` 时触发通知。

### 方案 4: 轮询或状态检测

**调研:**
- 研究是否可以通过后台进程检测 Claude Code 的状态
- 确认是否有 API 可以查询当前是否在等待用户输入

**实现:**
创建独立的后台进程,定期检查 Claude Code 状态并发送通知。

### 实施步骤

1. **调研阶段:**
   - 阅读 Claude Code hook 文档,列出所有可用的事件
   - 使用 `claude --debug` 观察多轮交互时的事件序列
   - 确定哪些事件适合作为通知触发点

2. **原型验证:**
   - 选择最有前景的方案
   - 创建最小可行原型(MVP)
   - 在测试项目中验证效果

3. **完整实现:**
   - 实现选定的方案
   - 更新 hooks 配置和脚本
   - 添加配置选项(允许用户控制是否在交互中发送通知)

4. **文档更新:**
   - 在 SKILL.md 中说明多轮交互的通知行为
   - 添加配置示例
   - 更新 FAQ 部分

### 技术约束

- 不能影响多轮交互的性能
- 通知不能阻塞用户操作
- 需要避免重复通知(同一个交互过程只通知一次)
- 考虑用户体验:过多的通知可能造成干扰

### 用户体验考虑

**选项 A: 每次等待输入都通知**
- 优点: 不会错过任何需要操作的时机
- 缺点: 可能过于频繁,造成干扰

**选项 B: 仅在整个交互流程结束时通知**
- 优点: 通知更有意义,不会干扰
- 缺点: 可能错过中间需要操作的时机

**选项 C: 可配置的通知策略**
- 优点: 用户可以根据需求选择
- 缺点: 增加配置复杂度

**推荐:** 先实现选项 B,如果用户反馈需要更细粒度的通知,再考虑选项 C。
