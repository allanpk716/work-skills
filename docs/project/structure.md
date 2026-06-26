# Work-Skills 项目结构说明

本文档详细说明 work-skills 项目在 v3.0 之后的结构设计和组织方式。
v3.0 是一次破坏性变更:下线了若干 deprecated 旧技能,项目回归为**仅 claude-notify 一个技能**的形态。

## 项目概览

**work-skills** 是一个个人技能库项目,目前只包含一个 Claude Code 技能 `claude-notify`(任务完成通知:Pushover 移动推送 + Windows 桌面 Toast)。

- **GitHub 仓库**: https://github.com/allanpk716/work-skills
- **本地路径**: C:\WorkSpace\agent\work-skills
- **当前版本**: 3.0.0(单技能形态)
- **分发方式**: Agent Skills 标准,通过 `npx skills add` 安装(**不再使用** `marketplace.json` 插件市场机制)

## 目录结构(v3.0 实际布局)

```
work-skills/
├── claude-notify/                  # 唯一的技能目录(根级别扁平结构)
│   ├── SKILL.md                    # 技能主入口(必需)
│   ├── README.md                   # 技能说明文档
│   ├── test.bat                    # Windows 测试入口脚本
│   ├── claude-notify-setup/        # 安装/配置子技能
│   │   └── SKILL.md
│   ├── hooks/                      # Claude Code Hook 注册
│   │   ├── hooks.json
│   │   └── scripts/                # Hook 触发的 Python 脚本
│   ├── scripts/                    # 斜杠命令对应的 Python 脚本
│   │   ├── notify-disable.py
│   │   ├── notify-enable.py
│   │   ├── notify-status.py
│   │   └── verify-installation.py
│   ├── references/                 # 渐进式披露的参考文档
│   │   ├── changelog.md
│   │   ├── commands.md
│   │   ├── faq.md
│   │   ├── setup.md
│   │   └── technical.md
│   └── tests/                      # 技能自测(Pytest)
│       └── test_*.py
├── installer/                      # NPX 安装器(@allanpk716/work-skills-setup)
│   ├── bin/                        # CLI 入口
│   ├── src/                        # 安装器实现(仅服务 claude-notify)
│   ├── tests/                      # 安装器自测(Jest)
│   ├── package.json
│   └── jest.config.js
├── docs/                           # 项目文档
│   ├── README.md                   # 文档索引
│   ├── claude-notify/              # claude-notify 专属文档(计划等)
│   └── project/                    # 跨技能的项目级开发文档
│       ├── structure.md            # 本文件
│       ├── how-to-add-new-skill.md
│       ├── plugin-development-best-practices.md
│       ├── plugin-quick-reference.md
│       ├── plugin-version-management.md
│       ├── bugs/
│       ├── fixes/
│       ├── plans/
│       └── verification/
├── .gitignore
├── CHANGELOG.md                    # 版本变更记录
├── CLAUDE.md                       # 项目级 Claude Code 指南
├── LICENSE                         # MIT 许可证
├── README.md                       # 英文说明
├── README.zh.md                    # 中文说明
└── package.json                    # npm 包元数据(指向 installer)
```

> **注意:** 项目根目录**没有** `.claude-plugin/marketplace.json`。
> v3.0 起安装走 Agent Skills 标准(`npx skills add`),不再走插件市场配置。

## 核心组件详解

### 1. `claude-notify/SKILL.md`(技能主入口)

**作用**: 技能的核心实现文件,定义技能的行为、工作流程和使用说明。Claude Code 通过 Agent Skills 标准发现根级别目录下的 `SKILL.md`。

**Frontmatter(必填字段)**:
```markdown
---
name: claude-notify                  # 技能名称(与目录名一致)
description: 简短描述(触发与功能说明)
---
```

**正文结构建议**:
```markdown
# Skill Title

## Objective
技能的目标和用途

## Quick Start
快速开始指南

## Context
为什么需要这个技能

## Workflow
详细的工作流程

## One-time Setup
一次性配置说明

## Instructions
执行指令

## Error Handling
错误处理

## Success Criteria
成功标准
```

**设计原则**:
1. **Frontmatter**: 必须包含 `name` 和 `description`
2. **渐进式披露**: 从简单到复杂,逐步展开信息;细节放进 `references/` 子目录
3. **明确的前置条件**: 列出所有必需的配置和依赖
4. **详细的工作流程**: 步骤化的执行说明
5. **故障排除**: 常见问题和解决方案(可放 `references/faq.md`)

### 2. `claude-notify/scripts/`(斜杠命令脚本)

**作用**: 存放斜杠命令背后执行的 Python 脚本。每个脚本对应一个用户可调用的斜杠命令。

**claude-notify 实际提供的斜杠命令**:
- `/check-notify-env` — 检查通知环境配置(Pushover token / Windows Toast)
- `/notify-enable` — 启用某个通知通道(pushover 或 windows)
- `/notify-disable` — 禁用某个通知通道
- `/notify-status` — 查看所有通知通道的当前状态

这些命令通过 `claude-notify/` 下的命令定义(详见 `references/commands.md`)与 `scripts/` 中的 `.py` 文件绑定。

### 3. `claude-notify/hooks/`(Hook 注册)

**作用**: 注册 Claude Code 生命周期 Hook(例如任务完成时触发通知)。

**结构**:
```
hooks/
├── hooks.json          # Hook 配置(事件 → 脚本映射)
└── scripts/            # Hook 实际执行的脚本
```

`hooks.json` 中通过 `${CLAUDE_PLUGIN_ROOT}` 引用本技能根路径,保证安装到任意位置都能正确解析。

### 4. `claude-notify/references/`(渐进式披露参考)

**作用**: 把详细文档从主 `SKILL.md` 拆出来,降低主入口的认知负担,Claude 按需读取。

**典型文件**:
- `setup.md` — 一次性配置详解
- `commands.md` — 斜杠命令完整说明
- `technical.md` — 技术实现细节
- `faq.md` — 常见问题
- `changelog.md` — 技能内部变更

### 5. `claude-notify/tests/`(技能自测)

**作用**: 为技能脚本提供自动化测试,确保通知逻辑、环境检测、通道开关等行为正确。

claude-notify 使用 **Pytest**,根级 `test.bat` 是 Windows 下的测试入口。

### 6. `installer/`(NPX 安装器)

**作用**: 提供 `npx @allanpk716/work-skills-setup` 一键安装体验。v3.0 起 installer 已**收窄为仅服务 claude-notify**(移除了旧版 git/ssh 检测器、marketplace 集成、多技能配置)。

**结构**:
```
installer/
├── bin/               # CLI 入口(work-skills-setup)
├── src/               # 安装/卸载/检测逻辑
└── tests/             # Jest 测试
```

### 7. `README.md` / `README.zh.md`

**作用**: 项目的主要文档,提供安装和使用说明。v3.0 版本仅宣传 claude-notify 一个技能。

**包含内容**:
1. 项目简介
2. 一键安装(`npx skills add allanpk716/work-skills/claude-notify`)
3. 技能列表(仅 claude-notify)
4. 项目结构
5. License / Credits

### 8. `CHANGELOG.md`

**作用**: 记录项目的版本变更历史。格式基于 [Keep a Changelog](https://keepachangelog.com/)。

```markdown
## [3.0.0] - 2026-06-26

### Removed
- 移除多个 deprecated 旧技能(详见根 CHANGELOG.md)

### Changed
- 项目回归单一通知技能形态
- installer 收窄为仅服务 claude-notify
```

## 技能开发工作流

### 添加新技能的步骤(参考,当前项目仅 claude-notify)

1. **创建技能目录**(根级别扁平结构)
   ```bash
   mkdir your-new-skill
   ```

2. **编写 `your-new-skill/SKILL.md`**
   - 参考 [how-to-add-new-skill.md](./how-to-add-new-skill.md) 中的模板

3. **(可选)组织子目录**
   - `scripts/` — 命令脚本
   - `hooks/` — Hook 注册
   - `references/` — 详细文档
   - `tests/` — 自测

4. **更新文档**
   - 根 `README.md` / `README.zh.md`(技能列表)
   - `CHANGELOG.md`(版本记录)

5. **测试**
   - 本地测试技能触发与命令行为
   - 运行 `tests/` 中的自动化测试

6. **提交和推送**
   ```bash
   git add your-new-skill
   git commit -m "feat: add your-new-skill"
   git push
   ```

## 安装和使用

### 用户安装(v3.0 推荐:Agent Skills 标准)

```bash
npx skills add allanpk716/work-skills/claude-notify
```

该命令基于 Agent Skills 标准,直接把 `claude-notify/` 目录安装到本地 Claude Code skills 目录。**不涉及** `marketplace.json` 或 `/plugin install`。

### 通过 NPX 安装器

```bash
npx @allanpk716/work-skills-setup
```

installer 会引导完成 claude-notify 的安装与配置(Pushover 凭据、Windows Toast 等)。

### 使用技能

安装后,Claude Code 会根据 `description` 自动触发 claude-notify,也可显式调用斜杠命令:

```
/check-notify-env
/notify-status
/notify-enable pushover
/notify-disable windows
```

## 历史演进

| 版本 | 形态 | 说明 |
| --- | --- | --- |
| 0.x – 1.x | 多技能 + marketplace.json | 曾经包含多个技能,通过 `.claude-plugin/marketplace.json` 插件市场分发 |
| **3.0.0** | **单技能(claude-notify)** | **破坏性变更:下线全部 deprecated 旧技能,回归单技能形态;安装改为 Agent Skills 标准(`npx skills add`),移除 marketplace.json** |

> v3.0 之前的多技能 / marketplace.json / `/plugin install` 流程**已不再适用**,仅保留在历史记录中作为背景说明。具体下线了哪些技能,请查阅根目录的 `CHANGELOG.md`。

## 参考资源

### 官方文档
- [Claude Code 官方文档](https://code.claude.com/docs)
- [Claude Skills 完全指南](https://resources.anthrop.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)

### 社区资源
- [baoyu-skills](https://github.com/JimLiu/baoyu-skills) - 主要参考项目

### 技术文章
- [Claude Code Skills Structure and Usage Guide](https://gist.github.com/mellanon/50816550ecb5f3b239aa77eef7b8ed8d)
- [CLAUDE.md, Slash Commands, Skills, and Subagents](https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/)

## 最佳实践

### 1. 技能命名
- 使用小写字母
- 多个单词用连字符分隔
- 名称要描述性强
- 保持简短(2-4 个单词)

### 2. 目录结构
- 每个技能在根目录拥有独立目录(扁平结构)
- **单一加载源**: 技能只从一个位置加载,避免重复
- **生命周期分离**: 开发阶段和发布阶段使用不同的加载方式
- **定期清理**: 插件结构变化时清理缓存

### 3. 文档质量
- 主 `SKILL.md` 保持精简,细节放 `references/`
- 提供清晰的使用示例
- 包含故障排除指南
- 说明所有前提条件

### 4. 版本管理
- 遵循语义化版本
- 每次更新都记录在 `CHANGELOG.md`
- 重大变更(如 v3.0 下线技能)要升级主版本号并清晰标注

### 5. 测试
- 为每个技能脚本提供自动化测试
- 在真实项目中验证
- 检查错误处理

## 维护指南

### 定期维护
- 检查技能是否在最新版 Claude Code 下正常工作
- 及时修复 bug
- 更新依赖和配置

### 版本发布
- 遵循语义化版本
- 更新 `CHANGELOG.md`
- 同步 `package.json` 与 `installer/package.json` 的版本号
- 创建 Git tag
- 发布 release notes

## 联系方式

- **GitHub**: [@allanpk716](https://github.com/allanpk716)
- **Email**: allanpk716@gmail.com

## 致谢

特别感谢 [Jim Liu (宝玉)](https://github.com/JimLiu) 的 [baoyu-skills](https://github.com/JimLiu/baoyu-skills) 项目,为这个项目提供了优秀的参考实现。

---

**最后更新**: 2026-06-26
**项目版本**: 3.0.0
