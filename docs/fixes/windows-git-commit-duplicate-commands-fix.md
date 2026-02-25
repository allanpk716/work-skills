# windows-git-commit 插件重复命令修复

## 修复时间
2026-02-25 15:00

## 问题
在 Claude Code 斜杠命令列表中看到重复的命令:
- `/windows-git-commit`
- `/windows-git-commit:wgc`
- `/wgc`

## 根本原因
Claude Code 插件系统从三个位置同时加载了同一个 windows-git-commit 插件:
1. 本地开发目录: `C:\WorkSpace\work-skills\plugins\windows-git-commit\`
2. Claude 缓存: `C:\Users\allan716\.claude\plugins\cache\work-skills\windows-git-commit\`
3. Marketplace 工作区: `C:\Users\allan716\.claude\plugins\marketplaces\work-skills\plugins\windows-git-commit\`

## 已完成的修复步骤

### 1. 清理缓存和工作区
```bash
# 删除 Claude Code 缓存
rm -rf "C:\Users\allan716\.claude\plugins\cache\work-skills\windows-git-commit"

# 删除 Marketplace 工作区
rm -rf "C:\Users\allan716\.claude\plugins\marketplaces\work-skills\plugins\windows-git-commit"
rm -f "C:\Users\allan716\.claude\plugins\marketplaces\work-skills\.claude\commands\wgc.md"
```

### 2. 修改 marketplace.json
从 `.claude-plugin/marketplace.json` 中移除了 windows-git-commit 的配置,避免自动同步。

### 3. 保留开发版本
保留了 `C:\WorkSpace\work-skills\plugins\windows-git-commit\` 作为唯一的插件源。

## 验证结果
- ✓ 缓存目录已删除
- ✓ Marketplace 工作区已删除
- ✓ 本地开发版本完整保留
- ✓ marketplace.json 配置已更新

## 下一步
**需要重启 Claude Code** 以让更改生效。

重启后,应该只看到一个斜杠命令: `/windows-git-commit`

## 长期建议

### 开发阶段
- 在 `plugins/` 目录中开发
- **不要**添加到 marketplace.json
- 使用本地路径加载

### 发布阶段
- 从 `plugins/` 目录移除
- 添加到 marketplace.json
- 让 Claude Code 从 marketplace 加载

### 定期清理
当插件结构变化时:
```bash
rm -rf "C:\Users\allan716\.claude\plugins\cache\work-skills"
rm -rf "C:\Users\allan716\.claude\plugins\marketplaces\work-skills"
```

## 相关文档
详细调试过程: `.planning/debug/slash-command-conflict.md`
