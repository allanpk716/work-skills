# 插件开发快速参考

## 🎯 核心原则

**单一加载源**: 插件只从一个位置加载,避免重复

## 📁 目录结构

### ✅ 推荐结构
```
plugins/
└── <plugin-name>/
    ├── .claude-plugin/
    │   └── plugin.json
    └── skills/
        └── <skill-name>/
            └── SKILL.md
```

### ❌ 避免的结构
```
❌ skills/                              # 旧的根级别目录
❌ .claude/commands/                    # 旧的命令目录
❌ plugins/<name>/commands/             # 插件内命令目录(与 skills 重复)
❌ 同时存在本地 + marketplace           # 多个加载源
```

## 🔄 生命周期

### 开发阶段
```bash
# 1. 在 plugins/ 目录开发
mkdir -p plugins/<name>/skills/<skill>

# 2. ❌ 不要添加到 marketplace.json
# 3. ✅ 使用本地加载
```

### 发布阶段
```bash
# 1. 从 plugins/ 移除
rm -rf plugins/<name>

# 2. 添加到 marketplace.json
# 3. 清理缓存并重启
```

## 🚨 命令重复问题

### 症状
输入 `/` 看到多个相同命令:
- `/plugin-name`
- `/plugin-name:alias`
- `/alias`

### 根本原因
插件从多个位置加载:
1. `plugins/<name>/` (本地)
2. `~/.claude/plugins/cache/<project>/<name>/` (缓存)
3. `~/.claude/plugins/marketplaces/<project>/plugins/<name>/` (marketplace)

### 解决方案

```bash
# 1. 清理缓存
rm -rf ~/.claude/plugins/cache/<project>/<name>
rm -rf ~/.claude/plugins/marketplaces/<project>/plugins/<name>

# 2. 选择单一加载源
#    - 开发: plugins/ + 不在 marketplace.json
#    - 发布: marketplace.json + 不在 plugins/

# 3. 重启 Claude Code
```

## 🛠️ 定期维护

### 清理缓存
```bash
# Windows
rm -rf "C:\Users\<user>\.claude\plugins\cache\<project>"
rm -rf "C:\Users\<user>\.claude\plugins\marketplaces\<project>"

# Linux/macOS
rm -rf ~/.claude/plugins/cache/<project>
rm -rf ~/.claude/plugins/marketplaces/<project>
```

## ✅ 检查清单

### 开发新插件
- [ ] 在 `plugins/` 创建
- [ ] 只使用 `skills/` 定义
- [ ] 不添加到 marketplace.json
- [ ] 删除旧的 `skills/` 根目录

### 发布插件
- [ ] 从 `plugins/` 移除
- [ ] 添加到 marketplace.json
- [ ] 清理所有缓存
- [ ] 重启验证

### 排查问题
- [ ] 检查所有加载位置
- [ ] 清理缓存和工作区
- [ ] 确认 marketplace.json
- [ ] 删除旧目录结构

## 📚 详细文档

- [插件开发最佳实践](./plugin-development-best-practices.md)
- [问题排查案例](../.planning/debug/slash-command-conflict.md)
- [修复记录](./fixes/windows-git-commit-duplicate-commands-fix.md)
