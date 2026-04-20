# Claude Code 插件开发最佳实践

## 概述

本文档总结了在 Claude Code 中开发插件的最佳实践,特别是避免命令重复和缓存问题的策略。

## 插件生命周期管理

### 开发阶段

**目标**: 快速迭代和测试

**策略**:
1. 在 `plugins/<plugin-name>/` 目录中开发
2. **不要**添加到 `.claude-plugin/marketplace.json`
3. 使用本地路径直接加载

**目录结构**:
```
plugins/
└── <plugin-name>/
    ├── .claude-plugin/
    │   └── plugin.json          # 插件配置
    └── skills/
        └── <skill-name>/
            └── SKILL.md         # 技能定义
```

**关键原则**:
- ✅ 只保留 `skills/` 目录定义技能
- ❌ 避免使用 `commands/` 目录(会导致命令重复)
- ❌ 不要同时存在旧的 `skills/` 根目录结构

**配置示例**:
```json
// .claude-plugin/plugin.json
{
  "name": "<plugin-name>",
  "version": "1.0.0",
  "description": "插件描述",
  "skills": ["./skills/<skill-name>"]
}
```

### 发布阶段

**目标**: 通过 Marketplace 分发

**策略**:
1. 从 `plugins/` 目录移除插件
2. 添加到 `.claude-plugin/marketplace.json`
3. 让 Claude Code 从 marketplace 加载

**marketplace.json 配置**:
```json
{
  "plugins": [
    {
      "name": "<plugin-name>",
      "description": "插件描述",
      "source": "./plugins/<plugin-name>",
      "category": "productivity",
      "version": "1.0.0",
      "author": {
        "name": "作者名",
        "email": "email@example.com"
      }
    }
  ]
}
```

## 常见问题及解决方案

### 问题 1: 斜杠命令重复

**症状**:
- 输入 `/` 看到多个相同或相似的命令
- 例如: `/windows-git-commit`, `/windows-git-commit:wgc`, `/wgc`

**根本原因**:
插件从多个位置被加载:
1. 本地开发目录: `plugins/<plugin-name>/`
2. Claude 缓存: `~/.claude/plugins/cache/<project>/<plugin-name>/`
3. Marketplace 工作区: `~/.claude/plugins/marketplaces/<project>/plugins/<plugin-name>/`

**解决方案**:

**步骤 1: 清理所有缓存位置**
```bash
# 删除 Claude Code 缓存
rm -rf "C:\Users\<username>\.claude\plugins\cache\<project>\<plugin-name>"

# 删除 Marketplace 工作区
rm -rf "C:\Users\<username>\.claude\plugins\marketplaces\<project>\plugins\<plugin-name>"
rm -f "C:\Users\<username>\.claude\plugins\marketplaces\<project>\.claude\commands\*.md"
```

**步骤 2: 调整 marketplace.json**
- **开发模式**: 从 marketplace.json 中移除插件配置
- **发布模式**: 从 plugins/ 目录移除插件,只保留 marketplace.json 配置

**步骤 3: 重启 Claude Code**
```bash
# 完全关闭 Claude Code,然后重新打开
```

**验证**:
- 输入 `/` 查看命令列表
- 应该只看到一个命令

### 问题 2: 插件内部命令重复

**症状**:
- 同时看到 `/skill-name` 和 `/skill-name:alias`

**根本原因**:
插件内同时存在 `commands/` 和 `skills/` 定义

**解决方案**:
```bash
# 删除 commands/ 目录,只保留 skills/ 定义
rm -rf plugins/<plugin-name>/commands/
```

**最佳实践**:
- ✅ 使用 `skills/<skill-name>/SKILL.md` 定义技能和命令
- ❌ 不要同时使用 `commands/` 目录

### 问题 3: 旧结构和新结构冲突

**症状**:
- 项目中同时存在 `skills/` 和 `plugins/` 目录
- 命令重复显示

**解决方案**:
```bash
# 删除旧的根级别 skills/ 目录
rm -rf skills/

# 删除旧的根级别 .claude/ 目录
rm -rf .claude/commands/
rm -rf .claude/hooks/
```

**最佳实践**:
- ✅ 使用新的 `plugins/<plugin-name>/` 结构
- ❌ 避免保留旧的 `skills/` 根目录

## 定期维护

### 清理缓存

当插件结构发生变化时,定期清理缓存:

```bash
# Windows
rm -rf "C:\Users\<username>\.claude\plugins\cache\<project>"
rm -rf "C:\Users\<username>\.claude\plugins\marketplaces\<project>"

# Linux/macOS
rm -rf ~/.claude/plugins/cache/<project>
rm -rf ~/.claude/plugins/marketplaces/<project>
```

### 验证插件加载

检查插件是否只从一个位置加载:

```bash
# 检查本地开发目录
ls plugins/<plugin-name>/

# 检查缓存(应该不存在)
ls "C:\Users\<username>\.claude\plugins\cache\<project>\<plugin-name>"

# 检查 marketplace(应该不存在或与本地一致)
ls "C:\Users\<username>\.claude\plugins\marketplaces\<project>\plugins\<plugin-name>"
```

## 插件结构规范

### 推荐的插件结构

```
plugins/
└── <plugin-name>/
    ├── .claude-plugin/
    │   └── plugin.json          # 插件元数据
    └── skills/
        └── <skill-name>/
            ├── SKILL.md         # 技能定义(必需)
            ├── templates/       # 模板文件(可选)
            └── scripts/         # 脚本文件(可选)
```

### plugin.json 规范

```json
{
  "name": "<plugin-name>",
  "version": "1.0.0",
  "description": "插件功能描述",
  "author": {
    "name": "作者名",
    "email": "email@example.com"
  },
  "skills": [
    "./skills/<skill-name>"
  ],
  "dependencies": {
    "mcp": ["<mcp-server-name>"]
  }
}
```

### SKILL.md 规范

```markdown
---
name: <skill-name>
description: 技能描述
trigger: 触发条件说明
---

# 技能标题

## 功能说明
[详细描述技能的功能]

## 使用方法
[如何使用这个技能]

## 参数说明
[如果接受参数,说明参数格式]
```

## 开发工作流

### 新插件开发流程

1. **创建插件目录**
```bash
mkdir -p plugins/<plugin-name>/.claude-plugin
mkdir -p plugins/<plugin-name>/skills/<skill-name>
```

2. **创建 plugin.json**
```bash
# 编辑 plugin.json
```

3. **创建 SKILL.md**
```bash
# 编辑 skills/<skill-name>/SKILL.md
```

4. **测试插件**
- 启动 Claude Code
- 验证斜杠命令是否正确显示
- 测试技能功能

5. **不要添加到 marketplace.json**
- 开发阶段保持本地加载

### 插件发布流程

1. **从 plugins/ 目录移除**
```bash
rm -rf plugins/<plugin-name>
```

2. **添加到 marketplace.json**
```json
{
  "plugins": [
    {
      "name": "<plugin-name>",
      "source": "./plugins/<plugin-name>",
      ...
    }
  ]
}
```

3. **清理缓存**
```bash
rm -rf ~/.claude/plugins/cache/<project>/<plugin-name>
rm -rf ~/.claude/plugins/marketplaces/<project>/plugins/<plugin-name>
```

4. **重启 Claude Code**
- 让插件系统从 marketplace 加载

## 调试技巧

### 检查命令来源

如果看到重复命令,检查以下位置:

1. **本地开发目录**
```bash
find plugins/ -name "*.md" -path "*/skills/*" -o -name "*.md" -path "*/commands/*"
```

2. **Claude 缓存**
```bash
ls ~/.claude/plugins/cache/<project>/
```

3. **Marketplace 工作区**
```bash
ls ~/.claude/plugins/marketplaces/<project>/plugins/
```

4. **旧的根级别目录**
```bash
ls skills/
ls .claude/commands/
```

### 验证唯一性

确保每个技能只在以下位置之一存在:
- ✅ `plugins/<plugin-name>/skills/<skill-name>/SKILL.md` (推荐)
- ❌ 不要同时在多个位置存在

## 总结

### 黄金法则

1. **单一加载源**: 插件只从一个位置加载
2. **清晰的生命周期**: 开发阶段和发布阶段分离
3. **定期清理**: 结构变化时清理缓存
4. **使用新结构**: 采用 `plugins/` 目录结构

### 检查清单

**开发新插件时**:
- [ ] 在 `plugins/` 目录创建
- [ ] 只使用 `skills/` 定义,避免 `commands/`
- [ ] 不添加到 marketplace.json
- [ ] 删除旧的 `skills/` 根目录

**发布插件时**:
- [ ] 从 `plugins/` 目录移除
- [ ] 添加到 marketplace.json
- [ ] 清理所有缓存位置
- [ ] 重启 Claude Code 验证

**遇到命令重复时**:
- [ ] 检查所有可能的加载位置
- [ ] 清理 Claude 缓存和 marketplace 工作区
- [ ] 确认 marketplace.json 配置
- [ ] 删除旧的目录结构

## 相关文档

- [Claude Code 官方文档](https://claude.ai/code)
- [插件开发指南](https://github.com/anthropics/claude-code)
- [问题排查案例](../debug/slash-command-conflict.md)
