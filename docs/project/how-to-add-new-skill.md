# 如何添加新技能到 work-skills

本指南说明如何向 work-skills 项目添加新的技能。

## 项目结构

```
work-skills/
├── .claude-plugin/
│   └── marketplace.json      # 插件市场配置文件
├── .claude/
│   └── commands/             # 斜杠命令 (可选)
│       └── wgc.md           # /wgc 命令
├── skills/                   # 技能目录
│   ├── windows-git-commit/  # 示例技能
│   │   └── SKILL.md         # 技能实现
│   └── your-new-skill/      # 新技能目录
│       └── SKILL.md         # 技能实现
├── README.md                # 英文说明
├── README.zh.md             # 中文说明
└── CHANGELOG.md             # 版本历史
```

## 添加新技能的步骤

### 1. 创建技能目录

在 `skills/` 目录下创建新技能的目录:

```bash
mkdir skills/your-skill-name
```

**命名规范:**
- 使用小写字母
- 多个单词用连字符分隔 (例如: `my-awesome-skill`)
- 建议使用描述性的名称,清晰表达技能功能

### 2. 创建 SKILL.md 文件

在技能目录中创建 `SKILL.md` 文件:

```bash
touch skills/your-skill-name/SKILL.md
```

**SKILL.md 文件结构:**

```markdown
---
name: your-skill-name
description: A brief description of what this skill does (max 100 chars)
---

# Skill Title

A detailed description of the skill.

## Features

- Feature 1
- Feature 2
- Feature 3

## Usage

```
/your-skill-name [arguments]
```

## Prerequisites

- Requirement 1
- Requirement 2

## Workflow

Step-by-step instructions for how the skill works...

## Implementation Details

Technical details about how the skill is implemented...
```

**Frontmatter 字段:**
- `name`: 技能名称 (必填,与目录名一致)
- `description`: 简短描述 (必填,在插件市场显示)

### 3. 更新 marketplace.json

在 `.claude-plugin/marketplace.json` 中注册新技能:

```json
{
  "plugins": [
    {
      "name": "your-plugin-name",
      "description": "Description of this plugin category",
      "source": "./",
      "strict": false,
      "skills": [
        "./skills/existing-skill",
        "./skills/your-new-skill"  // 添加这一行
      ]
    }
  ]
}
```

**插件分类建议:**
- `git-skills`: Git 工作流相关
- `code-skills`: 代码生成和重构
- `docs-skills`: 文档编写
- `test-skills`: 测试相关
- `utility-skills`: 实用工具
- 或者创建新的分类

### 4. (可选) 创建斜杠命令

如果希望使用简短的斜杠命令调用技能,在 `.claude/commands/` 中创建命令文件:

```bash
mkdir -p .claude/commands
touch .claude/commands/ysn.md  # Your skill abbreviation
```

**斜杠命令文件格式:**

```markdown
---
description: Brief description for command hints
argument-hint: [argument description]
allowed-tools: Skill(your-skill-name), OtherTool
---

Use the your-skill-name skill to do something: $ARGUMENTS
```

### 5. 更新文档

**README.md / README.zh.md:**

在 "Available Skills" 部分添加新技能的文档:

```markdown
#### your-skill-name

Brief description of the skill.

**Features:**
- Feature 1
- Feature 2

**Usage:**

\`\`\`bash
# Basic usage
/your-skill-name

# With arguments
/your-skill-name argument1 argument2
\`\`\`

**Prerequisites:**
- Requirement 1
- Requirement 2
```

**CHANGELOG.md:**

添加新版本记录:

```markdown
## [0.2.0] - 2026-02-XX

### Added
- **your-new-skill** - Description of what it does
  - Feature 1
  - Feature 2
```

### 6. 测试技能

**本地测试:**

1. 在你的项目中测试技能:
```
Use your-new-skill to do something
```

2. 如果创建了斜杠命令,测试它:
```
/your-command
```

**插件安装测试:**

```bash
# 将技能库添加为插件市场
/plugin marketplace add C:/WorkSpace/work-skills

# 安装技能
/plugin install your-plugin-name@work-skills
```

### 7. 提交和推送

```bash
git add .
git commit -m "feat: add your-new-skill"
git push
```

## 技能开发最佳实践

### 1. 前置条件明确

在 SKILL.md 中清晰列出所有前提条件:

```markdown
## Prerequisites

- Tool X must be installed
- Configuration file at ~/.config/tool-x.yaml
- API key in environment variable TOOL_X_API_KEY
```

### 2. 错误处理

在技能中包含详细的错误处理和故障排除:

```markdown
## Troubleshooting

**Error: "Connection failed"**
Solution:
- Check network connection
- Verify API key
- Ensure service is running
```

### 3. 使用示例

提供多个实际使用示例:

```markdown
## Usage Examples

**Example 1: Basic usage**
```
/your-skill-name input.txt
```

**Example 2: With options**
```
/your-skill-name input.txt --output output.txt --format json
```

**Example 3: Advanced usage**
```
/your-skill-name --recursive ./src --exclude "*.test.js"
```
```

### 4. 进度反馈

对于长时间运行的操作,提供进度反馈:

```markdown
## Workflow

1. **Step 1**: Description
   - What happens
   - What user sees

2. **Step 2**: Description
   - What happens
   - What user sees

3. **Step 3**: Description
   - What happens
   - Final result
```

## 技能模板

复制这个模板来快速开始新技能:

```markdown
---
name: your-skill-name
description: One sentence description (max 100 chars)
---

# Your Skill Title

Detailed description of what this skill does and when to use it.

## Features

- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

## Quick Start

**Basic usage:**

\`\`\`bash
/your-skill-name [input]
\`\`\`

This will:
1. Action 1
2. Action 2
3. Action 3

## Usage

\`\`\`bash
# Basic usage
/your-skill-name

# With arguments
/your-skill-name --option value

# Multiple files
/your-skill-name file1.txt file2.txt
\`\`\`

## Prerequisites

- Prerequisite 1
- Prerequisite 2

One-time setup (if needed):

\`\`\`bash
# Setup command
setup-command --configure
\`\`\`

## Workflow

1. **Step 1**: Description
   - Implementation detail
   - Expected output

2. **Step 2**: Description
   - Implementation detail
   - Expected output

3. **Step 3**: Description
   - Implementation detail
   - Final result

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--option1` | Description | default value |
| `--option2` | Description | default value |

## Examples

**Example 1: Basic**

\`\`\`bash
/your-skill-name input.txt
\`\`\`

Output:
\`\`\`
Expected output
\`\`\`

**Example 2: With options**

\`\`\`bash
/your-skill-name input.txt --option1 value1
\`\`\`

## Troubleshooting

**Error: "Error message"**
Solution:
- Fix step 1
- Fix step 2

**Issue: Something doesn't work**
Solution:
- Check configuration
- Verify prerequisites

## Implementation Notes

Technical details for implementation...
```

## 参考资源

- [baoyu-skills](https://github.com/JimLiu/baoyu-skills) - 优秀的技能库示例
- [Claude Code 文档](https://code.claude.com/docs) - 官方文档
- 本项目中的 `windows-git-commit` 技能作为参考

## 常见问题

### Q: 技能名称应该多长?
A: 保持简短但描述性强。建议 2-4 个单词,用连字符分隔。

### Q: 是否需要创建斜杠命令?
A: 不是必须的,但如果技能名称较长,创建一个简短的斜杠命令会方便使用。

### Q: 如何测试技能?
A: 在本地项目中直接测试技能文件,确认工作正常后再提交到技能库。

### Q: 技能文件可以使用其他格式吗?
A: 技能实现必须使用 Markdown 格式 (`.md` 文件)。

### Q: 可以使用子代理吗?
A: 可以。参考 `windows-git-commit` 技能中使用 Task tool 的方式。

## 需要帮助?

如果遇到问题:
1. 查看现有技能的 SKILL.md 文件作为参考
2. 阅读 Claude Code 官方文档
3. 查看 baoyu-skills 项目中的示例

祝你开发出有用的技能! 🚀
