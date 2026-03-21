---
phase: 18-marketplace-integration
plan: 01
subsystem: marketplace
tags: [marketplace, plugin-installation, claude-code-config, i18n]
requires: [Phase 17 - Interactive Configuration]
provides: [Marketplace integration, Plugin discovery, Plugin installation]
affects: [installer/src/marketplace/*, installer/src/i18n/*, installer/src/index.js]
tech-stack:
  added: [Node.js https module, Git shallow clone, fs.cpSync]
  patterns: [TDD (tasks 1-3), Orchestrator pattern, i18n parameter substitution]
key-files:
  created:
    - path: installer/src/marketplace/config-manager.js
      purpose: Claude Code config.json read/write, marketplace source registration
    - path: installer/src/marketplace/plugin-discovery.js
      purpose: Fetch marketplace.json from GitHub, parse plugin list
    - path: installer/src/marketplace/plugin-installer.js
      purpose: Git clone and plugin installation to ~/.claude/skills/
    - path: installer/src/marketplace/index.js
      purpose: Main orchestrator for marketplace integration flow
    - path: installer/tests/marketplace/config-manager.test.js
      purpose: Test cases for config-manager module
    - path: installer/tests/marketplace/plugin-discovery.test.js
      purpose: Test cases for plugin-discovery module
    - path: installer/tests/marketplace/plugin-installer.test.js
      purpose: Test cases for plugin-installer module
  modified:
    - path: installer/src/i18n/en.json
      changes: Added 20 marketplace.* translation keys
    - path: installer/src/i18n/zh.json
      changes: Added 20 marketplace.* translation keys (Chinese)
    - path: installer/src/index.js
      changes: Added Step 7 marketplace integration call
decisions:
  - id: marketplace-source-registration
    choice: Register work-skills as marketplace source in config.json
    rationale: Enables Claude Code to discover and load plugins from the repository
    made: 2026-03-21
  - id: shallow-git-clone
    choice: Use git clone --depth 1 for plugin installation
    rationale: Faster cloning, less bandwidth, only latest version needed
    made: 2026-03-21
  - id: fs-cpSync-for-copy
    choice: Use fs.cpSync instead of shell commands for copying
    rationale: Cross-platform compatibility, no shell dependency, Node.js native
    made: 2026-03-21
  - id: enquirer-checkbox-multiselect
    choice: Use enquirer Checkbox for plugin selection
    rationale: Consistent with Phase 17 pattern, good UX for multi-select
    made: 2026-03-21
  - id: skip-installed-plugins
    choice: Detect and skip already-installed plugins automatically
    rationale: Avoid re-downloading, preserve user customizations
    made: 2026-03-21
metrics:
  duration: 6 minutes
  tasks: 6
  files: 10 (7 created, 3 modified)
  commits: 6
  started: 2026-03-21T03:06:20Z
  completed: 2026-03-21T03:12:34Z
---

# Phase 18 Plan 01: Marketplace Integration Summary

## One-liner

实现了 Claude Code 市场集成功能,支持注册市场源、获取插件列表、交互式选择和自动安装插件到 ~/.claude/skills/ 目录。

## What Changed

### Core Functionality

**Marketplace Integration Flow (installer/src/marketplace/index.js)**
- 主编排器函数 `runMarketplaceIntegration()` 实现 5 步流程:
  1. 注册 work-skills 市场源到 config.json
  2. 从 GitHub 获取 marketplace.json
  3. 显示插件表格并提示用户选择
  4. 使用 git clone 安装选中插件
  5. 显示安装摘要(已安装/已跳过/失败)

**Config Management (installer/src/marketplace/config-manager.js)**
- `readClaudeConfig()` - 读取 ~/.claude/config.json,文件不存在时返回 {}
- `writeClaudeConfig()` - 写入配置,自动创建目录
- `registerMarketplaceSource()` - 添加 marketplaceSources.work-skills 条目

**Plugin Discovery (installer/src/marketplace/plugin-discovery.js)**
- `fetchMarketplaceJson()` - 从 GitHub Raw Content API 获取 marketplace.json
- `parsePluginList()` - 解析插件列表,返回标准化对象数组
- 网络错误处理和超时控制(默认 10 秒)

**Plugin Installation (installer/src/marketplace/plugin-installer.js)**
- `isPluginInstalled()` - 检查 SKILL.md 是否存在
- `installPlugin()` - Git clone + fs.cpSync 复制到 skills 目录
- `installPlugins()` - 批量安装,自动跳过已安装插件
- 临时目录清理,错误处理

### User Experience

**Interactive Plugin Selection**
- enquirer Checkbox 多选界面
- 已安装插件自动标记为 disabled
- 实时显示安装进度

**Bilingual Support**
- 20 个 marketplace.* 翻译键
- 中英文完整支持
- 参数替换支持(如 `{name}`, `{count}`)

**Visual Feedback**
- 彩色表格显示插件列表
- 安装摘要显示成功/跳过/失败数量
- 网络错误和未知错误的清晰提示

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

### Dependencies Used

- **Node.js https module** - 获取 GitHub Raw Content(无需额外依赖)
- **execa** - Git clone 命令执行(已有依赖)
- **enquirer Checkbox** - 多选交互界面(已有依赖)
- **chalk** - 彩色输出(已有依赖)
- **fs.cpSync** - 递归目录复制(Node.js 16.7+)

### File Structure

```
installer/
├── src/
│   ├── marketplace/
│   │   ├── config-manager.js      (新增)
│   │   ├── plugin-discovery.js    (新增)
│   │   ├── plugin-installer.js    (新增)
│   │   └── index.js                (新增)
│   ├── i18n/
│   │   ├── en.json                 (修改)
│   │   └── zh.json                 (修改)
│   └── index.js                    (修改)
└── tests/
    └── marketplace/
        ├── config-manager.test.js  (新增)
        ├── plugin-discovery.test.js(新增)
        └── plugin-installer.test.js(新增)
```

### Integration Points

**Claude Code Config (config.json)**
```json
{
  "marketplaceSources": {
    "work-skills": {
      "type": "github",
      "url": "https://github.com/allanpk716/work-skills",
      "branch": "main"
    }
  }
}
```

**Plugin Installation Path**
- 目标: `~/.claude/skills/{plugin-name}/SKILL.md`
- 临时: `os.tmpdir()/work-skills-{random}/`

## Testing

### Test Coverage

- **config-manager.test.js** - 5 个测试用例
  - 文件不存在时返回 {}
  - 解析现有配置
  - 写入有效 JSON
  - 注册市场源
  - 返回成功对象

- **plugin-discovery.test.js** - 4 个测试用例
  - 获取 marketplace.json (需要网络)
  - 网络错误处理
  - 解析插件列表
  - 处理缺失插件数组

- **plugin-installer.test.js** - 4 个测试用例
  - 检测已安装插件
  - 检测缺失插件
  - Git clone 和复制 (集成测试)
  - 批量安装返回正确结构

### Manual Testing

验证步骤:
1. `cd installer && npm start`
2. 完成前 6 步(或使用现有配置)
3. 验证 "Plugin Marketplace" 部分出现
4. 验证插件表格显示 claude-notify 和 windows-git-commit
5. 选择插件并验证安装进度
6. 验证摘要显示正确计数
7. 检查 `~/.claude/config.json` 包含 marketplaceSources.work-skills
8. 检查 `~/.claude/skills/{plugin-name}/SKILL.md` 存在

## Success Criteria Met

- [x] 用户看到 "Marketplace source 'work-skills' added successfully" 消息
- [x] 插件列表以表格显示(name, version, description 列)
- [x] 用户可通过 enquirer Checkbox 选择多个插件
- [x] 选中的插件安装到 ~/.claude/skills/{plugin-name}/
- [x] 已安装的插件在 Checkbox 中显示为 disabled
- [x] 安装摘要显示正确的 installed/skipped/failed 计数
- [x] config.json 包含 marketplaceSources.work-skills 条目
- [x] 所有用户可见文本支持 i18n (en/zh)

## Known Issues

None.

## Next Steps

Phase 19 - Installation Verification:
- 验证插件是否正确加载
- 检查 Claude Code 是否识别已安装技能
- 提供安装后验证报告

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 4acc76d | test | Add config-manager module for Claude Code config |
| 8b78f08 | test | Add plugin-discovery module for fetching marketplace |
| 3a8dcdc | test | Add plugin-installer module for installing plugins |
| b26e42e | feat | Add marketplace i18n translations |
| bbe52e3 | feat | Create marketplace orchestrator module |
| 1ad8b03 | feat | Integrate marketplace into main installer flow |

**Total:** 6 commits, 10 files changed, ~800 lines added
