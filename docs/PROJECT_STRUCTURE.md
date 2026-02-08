# Work-Skills 项目结构说明

本文档详细说明 work-skills 项目的结构设计和组织方式,参考了 [baoyu-skills](https://github.com/JimLiu/baoyu-skills) 的实现。

## 项目概览

**work-skills** 是一个个人技能库项目,用于组织和分享 Claude Code 技能。

- **GitHub 仓库**: https://github.com/allanpk716/work-skills
- **本地路径**: C:\WorkSpace\work-skills
- **灵感来源**: baoyu-skills by Jim Liu

## 目录结构

```
work-skills/
├── .claude-plugin/              # Claude Code 插件配置
│   └── marketplace.json         # 插件市场配置文件
├── .claude/                     # Claude Code 特定文件
│   └── commands/                # 斜杠命令 (可选)
│       └── wgc.md              # /wgc 命令 (windows-git-commit 简写)
├── docs/                        # 项目文档
│   └── HOW_TO_ADD_NEW_SKILL.md # 添加新技能的指南
├── skills/                      # 技能实现
│   └── windows-git-commit/     # Windows Git 提交自动化技能
│       └── SKILL.md            # 技能实现文件
├── .gitignore                  # Git 忽略文件
├── CHANGELOG.md                # 版本变更记录
├── LICENSE                     # MIT 许可证
├── README.md                   # 英文说明文档
└── README.zh.md                # 中文说明文档
```

## 核心组件详解

### 1. `.claude-plugin/marketplace.json`

**作用**: 定义插件市场配置,告诉 Claude Code 如何识别和加载技能库。

**结构**:
```json
{
  "name": "work-skills",           // 技能库名称
  "owner": {
    "name": "allanpk716",          // 作者信息
    "email": "allanpk716@gmail.com"
  },
  "metadata": {
    "description": "Personal skills collection...",
    "version": "0.1.0"             // 版本号
  },
  "plugins": [                     // 插件列表
    {
      "name": "git-skills",        // 插件分类名称
      "description": "Git workflow automation...",
      "source": "./",              // 技能相对路径
      "strict": false,             // 是否严格模式
      "skills": [                  // 该插件包含的技能
        "./skills/windows-git-commit"
      ]
    }
  ]
}
```

**插件分类设计**:
- `git-skills`: Git 相关的自动化技能
- 未来可以添加: `code-skills`, `docs-skills`, `test-skills` 等

### 2. `skills/<skill-name>/SKILL.md`

**作用**: 技能的核心实现文件,定义技能的行为、工作流程和使用说明。

**文件结构**:
```markdown
---
name: skill-name                  # 技能名称 (必填)
description: Brief description   # 简短描述 (必填)
---

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

## Agent Configuration
子代理配置 (如果使用)

## Instructions
执行指令

## Error Handling
错误处理

## Success Criteria
成功标准
```

**设计原则**:
1. **Frontmatter**: 必须包含 `name` 和 `description`
2. **渐进式披露**: 从简单到复杂,逐步展开信息
3. **明确的前置条件**: 列出所有必需的配置和依赖
4. **详细的工作流程**: 步骤化的执行说明
5. **故障排除**: 常见问题和解决方案

### 3. `.claude/commands/<command>.md`

**作用**: 创建简短的斜杠命令,方便快速调用技能。

**文件结构**:
```markdown
---
description: Command description   # 命令描述
argument-hint: [optional args]    # 参数提示
allowed-tools: Skill(skill-name)  # 允许使用的工具
---

Use the skill-name skill to do something: $ARGUMENTS
```

**命名建议**:
- 使用简短的缩写 (例如: `wgc` → `windows-git-commit`)
- 2-4 个字符最佳
- 容易记忆和输入

**示例**:
- `/wgc` → 调用 windows-git-commit 技能
- `/gc` → git commit (未来可能添加)
- `/pr` → pull request (未来可能添加)

### 4. `README.md` / `README.zh.md`

**作用**: 项目的主要文档,提供安装和使用说明。

**包含内容**:
1. 项目简介
2. 前提条件
3. 安装方法 (3种方式)
4. 可用插件和技能列表
5. 使用示例
6. 项目结构
7. 更新说明

**设计风格**:
- 清晰的章节划分
- 代码示例使用代码块
- 使用表格展示选项和配置
- 中英文双语

### 5. `CHANGELOG.md`

**作用**: 记录项目的版本变更历史。

**格式**: 基于 [Keep a Changelog](https://keepachangelog.com/)

```markdown
## [0.1.0] - 2026-02-08

### Added
- 新增功能
- 新增技能

### Fixed
- 修复的问题

### Changed
- 改变的功能
```

## 技能开发工作流

### 添加新技能的步骤

1. **创建技能目录**
   ```bash
   mkdir skills/your-new-skill
   ```

2. **编写 SKILL.md**
   ```bash
   # 参考 docs/HOW_TO_ADD_NEW_SKILL.md 中的模板
   ```

3. **更新 marketplace.json**
   ```json
   "skills": [
     "./skills/your-new-skill"
   ]
   ```

4. **(可选) 创建斜杠命令**
   ```bash
   # 在 .claude/commands/ 创建命令文件
   ```

5. **更新文档**
   - README.md / README.zh.md
   - CHANGELOG.md

6. **测试**
   - 本地测试
   - 功能验证

7. **提交和推送**
   ```bash
   git add .
   git commit -m "feat: add your-new-skill"
   git push
   ```

## 安装和使用

### 用户安装步骤

1. **添加插件市场**
   ```
   /plugin marketplace add allanpk716/work-skills
   ```

2. **浏览可用插件**
   ```
   /plugin
   # 切换到 Marketplaces 标签
   # 选择 work-skills
   ```

3. **安装技能**
   ```
   /plugin install git-skills@work-skills
   ```

4. **使用技能**
   ```
   /windows-git-commit
   # 或使用斜杠命令
   /wgc
   ```

## 与 baoyu-skills 的对比

### 相似之处

1. **目录结构**: 使用相同的 `.claude-plugin/` 和 `skills/` 结构
2. **marketplace.json**: 配置格式完全兼容
3. **SKILL.md 格式**: 技能文件结构一致
4. **文档组织**: README 中英文双语,CHANGELOG 格式相同

### 不同之处

1. **规模**: work-skills 是个人技能库,baoyu-skills 是大型共享库
2. **插件分类**: work-skills 按功能分类,baoyu-skills 按使用场景分类
3. **斜杠命令**: work-skills 提供了简短命令别名
4. **文档**: work-skills 添加了详细的开发指南

## 参考资源

### 官方文档
- [Claude Code 官方文档](https://code.claude.com/docs)
- [Claude Skills 完全指南](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)

### 社区资源
- [baoyu-skills](https://github.com/JimLiu/baoyu-skills) - 主要参考项目
- [Claude Code Skills Guide](https://vertu.com/lifestyle/claude-code-skills-the-complete-guide-to-automating-your-development-workflow/)

### 技术文章
- [Claude Code Skills Structure and Usage Guide](https://gist.github.com/mellanon/50816550ecb5f3b239aa77eef7b8ed8d)
- [CLAUDE.md, Slash Commands, Skills, and Subagents](https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/)

## 最佳实践

### 1. 技能命名
- 使用小写字母
- 多个单词用连字符分隔
- 名称要描述性强
- 保持简短 (2-4 个单词)

### 2. 插件分类
- 按功能域分类 (git, code, docs, test)
- 每个插件包含 3-10 个相关技能
- 避免单个插件过大

### 3. 文档质量
- 提供清晰的使用示例
- 包含故障排除指南
- 说明所有前提条件
- 保持中英文同步

### 4. 版本管理
- 遵循语义化版本
- 每次更新都记录在 CHANGELOG
- 重大变更要标注

### 5. 测试
- 在真实项目中测试
- 验证所有功能点
- 检查错误处理

## 未来规划

### 短期目标
- [ ] 添加更多 Git 相关技能
- [ ] 优化现有技能的错误处理
- [ ] 添加技能测试框架

### 中期目标
- [ ] 添加代码生成技能
- [ ] 添加文档编写技能
- [ ] 建立技能模板库

### 长期目标
- [ ] 建立技能生态系统
- [ ] 提供技能开发工具
- [ ] 社区贡献机制

## 维护指南

### 定期维护
- 每月检查技能是否正常工作
- 及时修复 bug
- 更新依赖和配置

### 版本发布
- 遵循语义化版本
- 更新 CHANGELOG
- 创建 Git tag
- 发布 release notes

### 社区互动
- 回复 issues
- 审查 PRs
- 更新文档

## 联系方式

- **GitHub**: [@allanpk716](https://github.com/allanpk716)
- **Email**: allanpk716@gmail.com

## 致谢

特别感谢 [Jim Liu (宝玉)](https://github.com/JimLiu) 的 [baoyu-skills](https://github.com/JimLiu/baoyu-skills) 项目,为这个项目提供了优秀的参考实现。

---

**最后更新**: 2026-02-08
**项目版本**: 0.1.0
