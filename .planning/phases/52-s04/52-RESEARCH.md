# S04: 配置引导子技能 — Research

**Date:** 2026-04-20

## Summary

S04 需要为 3 个技能各创建一个 `xxx-setup` 配置引导子技能目录和 SKILL.md 文件。每个 setup 子技能是一个独立的 Claude Code 技能，用户安装主技能后按需调用，引导完成环境配置。这属于已知模式的轻量级工作——创建 3 个 SKILL.md 文件，遵循已建立的子技能 frontmatter 模式，引用已有的 `references/setup.md` 详细配置指南。

核心风险在 claude-notify-setup：它需要引导用户在 `~/.claude/settings.json` 中注册 Stop 和 Notification hooks。installer 中已有完整的 hook 注册逻辑（`installer/src/hooks/hooks-installer.js`），setup 子技能应参考该逻辑提供手动步骤引导，而非自动执行（避免修改用户配置文件的风险）。

## Recommendation

创建 3 个 setup 子技能目录和 SKILL.md 文件，每个文件包含：
1. 标准 frontmatter（name 必须匹配目录名，如 `claude-notify-setup`）
2. `<objective>` 描述 setup 的目的
3. `<process>` 分步引导配置流程
4. 引用已有的 `references/setup.md` 获取详细配置信息

所有 3 个文件结构一致，内容独立，可并行创建。

## Implementation Landscape

### Key Files

- `claude-notify/claude-notify-setup/SKILL.md` — **新建**。引导 Pushover token 环境变量配置 + hooks 注册到 `~/.claude/settings.json`（Stop + Notification hooks）。参考 `claude-notify/references/setup.md`（详细 Pushover 配置）和 `installer/src/hooks/hooks-installer.js`（hook 注册结构）。
- `windows-git-commit/windows-git-commit-setup/SKILL.md` — **新建**。引导 TortoisePlink.exe 检测 + git sshcommand 配置 + Pageant 自动启动。参考 `windows-git-commit/references/setup.md`（完整配置步骤）。
- `codepoint/codepoint-setup/SKILL.md` — **新建**。引导 `.codepoints/` 目录初始化 + 语言 toggle 设置（`.codepoint-go`/`.codepoint-ts`/`.codepoint-python`）。参考 `codepoint/SKILL.md` 中的 Toggle Mechanism 章节和 Storage Structure 章节。

### SKILL.md Frontmatter Pattern

子技能的 frontmatter 遵循 codepoint 子技能的模式：
```yaml
---
name: <directory-name>  # 必须匹配父目录名
description: >
  简短描述。可多行。
  Triggers on: "setup", "配置" 等。
---
```

### Hook Registration Structure（claude-notify-setup 关键参考）

`~/.claude/settings.json` 中 hooks 的正确结构：
```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "python \"~/.claude/hooks/notify-stop.py\"",
        "async": true,
        "timeout": 10
      }]
    }],
    "Notification": [{
      "matcher": "permission_prompt|idle_prompt|elicitation_dialog",
      "hooks": [{
        "type": "command",
        "command": "python \"~/.claude/hooks/notify-attention.py\"",
        "async": true,
        "timeout": 5
      }]
    }]
  }
}
```

### Build Order

1. **先创建 claude-notify-setup**（R008 的核心，有 hook 注册这个最复杂的逻辑）
2. **并行创建 windows-git-commit-setup 和 codepoint-setup**（两者独立，结构更简单）

### Verification Approach

1. `npx skills-ref validate` 对 3 个新 SKILL.md 文件通过
2. 目录结构检查：`claude-notify/claude-notify-setup/SKILL.md`、`windows-git-commit/windows-git-commit-setup/SKILL.md`、`codepoint/codepoint-setup/SKILL.md` 都存在
3. frontmatter name 字段匹配目录名
4. 每个 SKILL.md 包含配置引导内容（`<objective>` 或 `<process>` 标签）

## Constraints

- SKILL.md frontmatter `name` 必须精确匹配父目录名（agentskills.io 规范）
- claude-notify-setup 不能自动修改 `~/.claude/settings.json`，只能引导用户手动操作或确认后执行
- Windows 开发环境：路径示例和命令使用 Windows 格式
- SKILL.md 内容使用英文（与现有技能一致），但配置步骤说明可用中文

## Common Pitfalls

- **不要在 setup 子技能中复制 references/setup.md 的完整内容**——引用即可，避免维护两份
- **hook 注册时要检查现有配置**——`~/.claude/settings.json` 可能已有其他 hooks，需要合并而非覆盖
- **子技能目录需要在父技能目录下创建**——即 `claude-notify/claude-notify-setup/`，不是根级目录
