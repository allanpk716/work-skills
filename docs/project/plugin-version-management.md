# 插件版本自动管理系统

## 概述

这个系统通过 Git pre-commit hook 自动管理 Claude Code 插件的版本号，确保每次修改插件代码后，版本号都会自动递增，从而触发 Claude Code 刷新插件缓存。

## 工作原理

### 1. Git Pre-Commit Hook

当你执行 `git commit` 时，pre-commit hook 会自动：

1. 检测 `plugins/` 目录下哪些插件被修改
2. 对于每个被修改的插件：
   - 读取当前版本号（从 `.claude-plugin/marketplace.json`）
   - 自动递增 PATCH 版本号（例如：1.0.2 → 1.0.3）
   - 更新 `marketplace.json` 文件
   - 将更新后的 `marketplace.json` 添加到当前提交

### 2. 版本号递增策略

采用最简单的策略：**总是递增 PATCH 版本号**

- PATCH 版本：自动递增（适合快速迭代）
- MINOR 版本：手动更新（添加新功能时）
- MAJOR 版本：手动更新（重大变更时）

## 使用方法

### 正常工作流程

1. 修改插件代码
   ```bash
   # 编辑 plugins/claude-notify/SKILL.md 或其他文件
   ```

2. 添加到暂存区
   ```bash
   git add plugins/claude-notify/
   ```

3. 提交（版本号会自动递增）
   ```bash
   git commit -m "feat(notify): 添加新功能"
   # 输出示例：
   # ✓ Updated claude-notify: 1.0.2 → 1.0.3
   # ✓ All plugin versions updated and staged
   ```

4. 推送到远程仓库
   ```bash
   git push
   ```

5. 在 Claude Code 中更新插件
   ```
   /plugins update work-skills
   ```

6. 重启 Claude Code 验证更新

### 手动更新 MAJOR 或 MINOR 版本

如果需要发布重要更新，可以手动修改版本号：

```bash
# 编辑 .claude-plugin/marketplace.json
# 将版本从 1.0.5 改为 1.1.0（添加新功能）
# 或从 1.0.5 改为 2.0.0（重大变更）

# 然后正常提交
git add .claude-plugin/marketplace.json
git commit -m "release(notify): version 1.1.0"
```

注意：即使手动修改了版本号，只要 `plugins/` 目录有修改，hook 仍会再次递增 PATCH 版本。

## 系统要求

- Git（已安装）
- jq（JSON 处理工具）
  - Windows: `scoop install jq` 或 `choco install jq`
  - 验证安装: `jq --version`

## 文件说明

### scripts/update-plugin-version.sh

核心脚本，负责：
- 检测修改的插件
- 递增版本号
- 更新 marketplace.json

### .git/hooks/pre-commit

Git pre-commit hook，在每次提交前自动执行 `update-plugin-version.sh`

## 验证系统工作正常

### 测试自动版本递增

```bash
# 1. 修改任意插件文件
echo "# test" >> plugins/claude-notify/README.md

# 2. 添加并提交
git add plugins/claude-notify/README.md
git commit -m "test: 验证自动版本递增"

# 3. 查看版本是否递增
cat .claude-plugin/marketplace.json | grep -A 5 "claude-notify"
# 应该看到版本号从 1.0.X 递增到 1.0.(X+1)

# 4. 撤销测试提交（可选）
git reset --hard HEAD~1
```

### 验证 Claude Code 缓存刷新

1. 在 Claude Code 中运行：
   ```
   /plugins update work-skills
   ```

2. 检查缓存目录是否创建了新版本文件夹：
   ```
   %USERPROFILE%\.claude\plugins\cache\work-skills\claude-notify\
   ```

3. 重启 Claude Code，验证新功能是否生效

## 故障排除

### Hook 没有自动更新版本号

**可能原因 1：没有修改 plugins/ 目录**

Hook 只在 `plugins/` 目录下的文件被修改时才触发。如果只修改了其他文件（如 `docs/`），版本号不会自动更新。

**解决方案**：手动更新版本号
```bash
# 编辑 .claude-plugin/marketplace.json
# 递增版本号

git add .claude-plugin/marketplace.json
git commit --amend --no-edit
```

**可能原因 2：hook 没有执行权限**

```bash
# 检查权限
ls -l .git/hooks/pre-commit

# 添加执行权限
chmod +x .git/hooks/pre-commit
chmod +x scripts/update-plugin-version.sh
```

**可能原因 3：jq 未安装**

```bash
# 验证 jq 安装
jq --version

# 如果未安装，执行：
scoop install jq  # Windows (Scoop)
choco install jq  # Windows (Chocolatey)
```

### 版本号递增了但 Claude Code 没有更新

**解决方案**：

1. 确保推送到远程仓库：
   ```bash
   git push
   ```

2. 在 Claude Code 中更新：
   ```
   /plugins update work-skills
   ```

3. 重启 Claude Code

4. 如果仍然不生效，清理缓存：
   ```bash
   scripts/clear-cache.bat
   ```

### 跳过 Pre-Commit Hook（不推荐）

如果你确定要跳过自动版本更新（例如：修改文档而不涉及插件代码）：

```bash
git commit --no-verify -m "docs: 更新文档"
```

**警告**：跳过 hook 可能导致版本号不同步，请谨慎使用。

## 最佳实践

### ✅ 推荐做法

- ✅ 每次修改插件功能时，正常 commit，让 hook 自动更新版本号
- ✅ 定期推送到远程仓库，确保 Claude Code 可以获取更新
- ✅ 在 Claude Code 中更新插件后，重启验证新功能
- ✅ 如果发布重要版本，手动更新 MINOR 或 MAJOR 版本号

### ❌ 避免的做法

- ❌ 频繁使用 `git commit --no-verify` 跳过 hook
- ❌ 手动编辑 `installed_plugins.json`（由 Claude Code 管理）
- ❌ 忘记在 Claude Code 中运行 `/plugins update` 后重启
- ❌ 修改插件代码但不提交到 git（hook 无法检测）

## 相关文档

- [插件开发最佳实践](../docs/plugin-development-best-practices.md)
- [插件快速参考](../docs/plugin-quick-reference.md)

## 技术细节

### 为什么选择 PATCH 自动递增？

1. **简单实用**：无需判断修改类型，适合快速迭代
2. **避免错误**：减少手动版本管理的遗漏
3. **语义化版本**：PATCH 递增表示向后兼容的 bug 修复或小改进
4. **自动化友好**：不需要复杂的变更类型检测

### 为什么不使用 Git Commit SHA？

虽然可以使用 Git commit SHA 作为版本号，但：
- ❌ 用户看到的是不友好的哈希值（如 `eb395751`）
- ❌ 不符合语义化版本规范
- ❌ 难以判断版本的新旧程度
- ❌ 需要修改 Claude Code 插件系统

### 缓存机制工作原理

Claude Code 插件缓存路径：
```
%USERPROFILE%\.claude\plugins\cache\work-skills\claude-notify\1.0.2\
```

- 版本号变化 → 创建新的缓存目录 → 加载新代码
- 版本号不变 → 使用现有缓存 → 加载旧代码（即使源代码已更新）

这就是为什么版本号更新是触发缓存刷新的关键。

---

**问题反馈**：如果遇到问题，请在项目 issues 中反馈。
