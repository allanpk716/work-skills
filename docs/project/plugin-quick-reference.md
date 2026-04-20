# 技能开发快速参考

## 🎯 核心原则

**单一加载源**: 技能只从一个位置加载,避免重复

## 📁 目录结构

### ✅ 推荐结构
```
<skill-name>/
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
❌ <skill-name>/commands/               # 技能内命令目录(与 skills 重复)
❌ 同时存在本地 + marketplace           # 多个加载源
```

## 🔄 生命周期

### 开发阶段
```bash
# 1. 在根目录创建技能目录
mkdir -p <skill-name>/skills/<skill-name>

# 2. ❌ 不要添加到 marketplace.json
# 3. ✅ 使用本地加载
```

### 发布阶段
```bash
# 1. 从本地目录移除
rm -rf <skill-name>

# 2. 添加到 marketplace.json
# 3. 清理缓存并重启
```

## 🚨 命令重复问题

### 症状
输入 `/` 看到多个相同命令:
- `/skill-name`
- `/skill-name:alias`
- `/alias`

### 根本原因
技能从多个位置加载:
1. `<skill-name>/` (本地)
2. `~/.claude/plugins/cache/<project>/<skill-name>/` (缓存)
3. `~/.claude/plugins/marketplaces/<project>/plugins/<skill-name>/` (marketplace)

### 解决方案

```bash
# 1. 清理缓存
rm -rf ~/.claude/plugins/cache/<project>/<skill-name>
rm -rf ~/.claude/plugins/marketplaces/<project>/plugins/<skill-name>

# 2. 选择单一加载源
#    - 开发: 本地目录 + 不在 marketplace.json
#    - 发布: marketplace.json + 不在本地目录

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

### 开发新技能
- [ ] 在根目录创建 `<skill-name>/`
- [ ] 只使用 `skills/` 定义
- [ ] 不添加到 marketplace.json
- [ ] 删除旧的 `skills/` 根目录

### 发布技能
- [ ] 从本地目录移除
- [ ] 添加到 marketplace.json
- [ ] 清理所有缓存
- [ ] 重启验证

### 排查问题
- [ ] 检查所有加载位置
- [ ] 清理缓存和工作区
- [ ] 确认 marketplace.json
- [ ] 删除旧目录结构

## 📚 详细文档

- [技能开发最佳实践](./plugin-development-best-practices.md)
- [问题排查案例](../.planning/debug/slash-command-conflict.md)
- [修复记录](./fixes/windows-git-commit-duplicate-commands-fix.md)
