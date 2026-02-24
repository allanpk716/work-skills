# Architecture Research

**Domain:** Claude Code Global Skills System
**Researched:** 2026-02-24
**Confidence:** HIGH (基于官方文档、现有实现和社区资源)

## Standard Architecture

### System Overview

Claude Code 使用**插件生态系统架构**,支持多种扩展机制:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Claude Code Runtime                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   CLAUDE.md  │  │   Commands   │  │    Skills    │          │
│  │  (项目配置)   │  │  (快捷命令)   │  │   (技能)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     MCP      │  │    Hooks     │  │  Subagents   │          │
│  │ (模型上下文)  │  │  (事件钩子)   │  │  (子代理)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐                                               │
│  │   Plugins    │ ← Plugin Marketplace                          │
│  │    (插件)     │                                               │
│  └──────────────┘                                               │
├─────────────────────────────────────────────────────────────────┤
│                    Storage & Configuration                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              ~/.claude/ (Global Config)                   │   │
│  │  ├── settings.json         (全局设置)                      │   │
│  │  ├── hooks/                (全局 Hooks)                    │   │
│  │  ├── skills/               (全局 Skills)                   │   │
│  │  ├── agents/               (自定义 Agents)                 │   │
│  │  ├── commands/             (全局 Commands)                 │   │
│  │  ├── plugins/              (已安装插件)                     │   │
│  │  └── cache/                (缓存目录)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| 组件 | 职责 | 典型实现 |
|------|------|---------|
| **CLAUDE.md** | 项目级配置和指令,提供项目上下文 | Markdown 文件,包含项目规范、约定和指南 |
| **Commands** | 提供快速访问的斜杠命令 (`/cmd`) | `.claude/commands/*.md` 文件,定义参数和工具限制 |
| **Skills** | 封装领域知识和工作流程 | `skills/*/SKILL.md` + 支持文件 (脚本、模板、资源) |
| **Hooks** | 响应 Claude Code 生命周期事件 | Python/Node.js 脚本,在特定事件触发时执行 |
| **Plugins** | 将 Skills 打包为可分发的插件包 | `marketplace.json` + `skills/` 目录结构 |
| **Subagents** | 在后台执行独立任务,保护主上下文 | Task 工具 + Bash/Write 子代理 |
| **MCP** | 提供外部数据源和工具集成 | Model Context Protocol 服务器配置 |

## Recommended Project Structure

```
work-skills/
├── .claude-plugin/              # 插件市场配置
│   └── marketplace.json         # 插件注册和分类
├── .claude/                     # Claude Code 配置
│   └── commands/                # 全局斜杠命令
│       └── wgc.md              # 快捷命令定义
├── skills/                      # 技能实现目录
│   └── skill-name/             # 技能目录
│       ├── SKILL.md            # [必需] 技能定义
│       ├── README.md           # [可选] 详细文档
│       ├── scripts/            # [推荐] 可执行脚本
│       ├── templates/          # [推荐] 输出模板
│       └── resources/          # [可选] 静态资源
├── docs/                        # 项目文档
│   ├── HOW_TO_ADD_NEW_SKILL.md
│   └── PROJECT_STRUCTURE.md
├── README.md                    # 主要文档
└── CHANGELOG.md                # 版本历史
```

### Structure Rationale

- **`.claude-plugin/`**: 插件市场配置,让 Claude Code 识别和加载技能库
- **`skills/`**: 每个技能独立目录,支持渐进式加载
- **`.claude/commands/`**: 简短命令别名,便于快速访问

## Architectural Patterns

### Pattern 1: Progressive Disclosure (渐进式披露)

**What:** Skills 采用分层加载架构,按需加载内容以节省上下文

**When to use:** 所有 Skills 默认使用此模式

**Trade-offs:**
- 优点: 节省 70%+ Token 消耗,快速启动
- 缺点: 需要多次读取文件,略有延迟

**加载层级:**

| Layer | 类型 | 加载时机 | 内容大小 |
|-------|------|---------|---------|
| **Layer 1** | Metadata Layer | Claude Code 启动时 | ~100 tokens/Skill (name + description) |
| **Layer 2** | Instruction Layer | 任务相关时 | SKILL.md 完整内容 |
| **Layer 3** | Resource Layer | 需要引用时 | 脚本、模板、参考文档 |
| **Layer 4** | Execution Layer | 直接执行时 | 可执行文件 (无需加载到上下文) |

**Example:**
```markdown
---
name: windows-git-commit
description: Automate Git commit and push with PPK authentication
---

<objective>
Automate Git operations on Windows using plink + Pageant...
</objective>

<quick_start>
**Automatic commit (recommended):**
Use windows-git-commit to commit and push changes
</quick_start>

<!-- 详细工作流程按需加载 -->
<workflow>
...
</workflow>
```

### Pattern 2: Subagent Isolation (子代理隔离)

**What:** 长时间或复杂操作在独立子代理中执行,保护主对话上下文

**When to use:**
- 执行长时间运行的命令 (Git 操作、测试)
- 产生大量输出的操作
- 需要错误隔离的场景

**Trade-offs:**
- 优点: 主上下文保持简洁,易于追踪
- 缺点: 子代理无法直接访问主对话历史

**Example (来自 windows-git-commit):**
```xml
<subagent_type>Bash</subagent_type>
<description>Execute Git commit and push operations</description>
<prompt>
Execute Git workflow with PPK authentication:
1. Configure SSH client
2. Analyze changes
3. Generate commit message
4. Stage, commit, push
</prompt>
<run_in_background>true</run_in_background>
```

### Pattern 3: Hook-based Event System (Hook 事件系统)

**What:** 通过 Hooks 在 Claude Code 生命周期事件中注入自定义逻辑

**When to use:**
- 任务完成通知
- 自动格式化代码
- 权限请求处理
- 日志记录和监控

**支持的事件类型:**

| 事件 | 触发时机 | 可阻止? | 典型用途 |
|------|---------|---------|---------|
| **SessionStart** | 会话开始/恢复 | No | 初始化检查 |
| **UserPromptSubmit** | 用户提交消息前 | Yes | 消息预处理 |
| **PreToolUse** | 工具执行前 | Yes | 验证、日志 |
| **PermissionRequest** | 权限对话框出现 | Yes | 自动审批 |
| **PostToolUse** | 工具成功执行后 | No | 格式化、日志 |
| **Stop** | Claude 完成响应时 | Yes | 任务通知 |
| **Notification** | 发送通知时 | No | 自定义通知 |

**Example (来自 cc-pushover-hook):**
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "py \"%CLAUDE_PROJECT_DIR%\\.claude\\hooks\\pushover-hook\\pushover-notify.py\"",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### Pattern 4: Global vs Project Scope (全局 vs 项目作用域)

**What:** 配置和 Skills 可在全局或项目级别安装

**When to use:**
- **Global**: 通用工具、个人偏好、所有项目共享
- **Project**: 项目特定工作流、团队共享配置

**安装方式:**

| 方式 | 命令 | 位置 | 作用域 |
|------|------|------|--------|
| Global Skills | `npx openskills install --global` | `~/.claude/skills/` | 所有项目 |
| Project Skills | `npx openskills install` | `.claude/skills/` | 当前项目 |
| Plugin | `/plugin install name@marketplace` | `~/.claude/plugins/` | 全局启用 |

**Example:**
```bash
# 全局安装 (所有项目可用)
npx openskills install anthropics/skills --global

# 项目级安装 (仅当前项目)
npx openskills install your-org/your-skills

# 从本地路径安装
npx openskills install .
```

## Data Flow

### Skill Invocation Flow

```
[User Input] "/wgc or Use windows-git-commit"
    ↓
[Command Resolution] Claude Code 查找命令映射
    ↓
[Metadata Extraction] 解析 SKILL.md frontmatter
    ↓
[Skill Loading] 加载完整 SKILL.md 内容 (Layer 2)
    ↓
[Agent Configuration] 配置子代理参数
    ↓
[Subagent Execution] Task tool 启动 Bash 子代理
    ↓
[Git Operations] 在子代理中执行 Git 命令
    ↓
[Result Processing] 处理输出并生成摘要
    ↓
[User Response] 返回简洁结果
```

### Hook Event Flow

```
[Claude Code Event] (Stop, UserPromptSubmit, etc.)
    ↓
[Hook Configuration] 读取 settings.json hooks 配置
    ↓
[Matcher Check] 检查事件是否匹配 (如 "permission_prompt|idle_prompt")
    ↓
[Command Execution] 执行配置的脚本/命令
    ↓
[Timeout Handling] 默认 5 秒超时
    ↓
[Result Processing] 处理脚本输出 (可选)
    ↓
[Continue/Block] 根据 hook 类型决定是否阻止原操作
```

### Plugin Installation Flow

```
[User Command] /plugin marketplace add owner/repo
    ↓
[Marketplace Fetch] 从 GitHub 获取 marketplace.json
    ↓
[Plugin Discovery] 列出可用插件和技能
    ↓
[User Selection] /plugin install plugin-name@marketplace
    ↓
[Download & Install] 复制 skills 到 ~/.claude/plugins/
    ↓
[Settings Update] 在 settings.json 中启用插件
    ↓
[Skill Registration] 注册插件的 Skills 到 Claude Code
```

### Key Data Flows

1. **Skill Data Flow**: SKILL.md → Metadata → Instructions → Scripts/Resources
2. **Hook Data Flow**: Event → stdin JSON → Hook Script → stdout/exit code
3. **Config Data Flow**: settings.json → Hooks/Plugins → Runtime Behavior

## Scaling Considerations

| 规模 | 架构调整 |
|------|---------|
| **个人使用 (1-10 项目)** | 全局 Skills + 项目级 CLAUDE.md,简单直接 |
| **小团队 (10-50 项目)** | 创建共享 Skills 仓库,使用 Plugin Marketplace 分发 |
| **大型组织 (50+ 项目)** | 企业级 Plugin Marketplace,版本管理,权限控制 |

### Scaling Priorities

1. **First bottleneck**: Skills 数量过多导致启动变慢
   - 解决: 使用 Plugin 分类,按需安装
2. **Second bottleneck**: Hooks 执行超时影响响应速度
   - 解决: 优化 Hook 脚本,使用异步执行,增加 timeout

## Anti-Patterns

### Anti-Pattern 1: Overly Complex SKILL.md

**What people do:** 在单个 SKILL.md 中包含所有细节,导致文件过大

**Why it's wrong:**
- 违反渐进式披露原则
- 浪费上下文 Token
- 难以维护和更新

**Do this instead:**
- 使用分层文档结构
- 引用外部资源文件
- 只在 SKILL.md 保留核心指令

**Bad Example:**
```markdown
<!-- 不要这样做: 包含完整实现细节 -->
<workflow>
Step 1: Run this 500-line Python script...
```python
# 完整的 Python 代码
...
```
Step 2: Parse output...
</workflow>
```

**Good Example:**
```markdown
<!-- 这样做: 引用外部脚本 -->
<workflow>
Step 1: Execute data processing script
```bash
python scripts/process_data.py --input $INPUT_FILE
```
See `scripts/process_data.py` for implementation details.
</workflow>
```

### Anti-Pattern 2: Hook Script Blocking Operations

**What people do:** Hook 脚本执行长时间操作 (网络请求、大量计算)

**Why it's wrong:**
- 默认 timeout=5 秒会超时
- 阻塞 Claude Code 主流程
- 用户体验差

**Do this instead:**
- 使用异步执行 (后台任务)
- 增加 timeout 配置
- 快速失败,返回错误信息

**Bad Example:**
```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "python slow_notification.py"  // 可能超时
      }]
    }]
  }
}
```

**Good Example:**
```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "python fast_notify.py",
        "timeout": 10  // 明确设置超时
      }]
    }]
  }
}
```

### Anti-Pattern 3: Mixing Global and Project Hooks

**What people do:** 在全局 settings.json 中配置项目特定的 Hooks

**Why it's wrong:**
- 全局配置影响所有项目
- 难以调试和维护
- 可能导致意外行为

**Do this instead:**
- 全局 Hooks: 通用功能 (通知、日志)
- 项目 Hooks: 放在项目的 `.claude/settings.json`
- 使用环境变量控制行为

**Bad Example:**
```json
// ~/.claude/settings.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "python /specific/project/format.py"  // 仅适用于某项目
      }]
    }]
  }
}
```

**Good Example:**
```json
// ~/.claude/settings.json (全局)
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "python ~/.claude/hooks/notify.py"  // 通用通知
      }]
    }]
  }
}

// /path/to/project/.claude/settings.json (项目级)
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "npx prettier --write \"$FILE_PATH\""  // 项目特定
      }]
    }]
  }
}
```

## Integration Points

### External Services

| 服务 | 集成方式 | 注意事项 |
|------|---------|---------|
| **Pushover API** | Hook 脚本调用 REST API | 需配置 PUSHOVER_TOKEN/USER 环境变量 |
| **Git** | Bash 子代理执行命令 | Windows 需配置 plink SSH 客户端 |
| **Claude CLI** | Hook 调用 `claude -p` 生成摘要 | 可选功能,失败时降级 |
| **Windows Notifications** | PowerShell 调用 BurntToast | 优先级: BurntToast > WinRT > .NET |

### Internal Boundaries

| 边界 | 通信方式 | 注意事项 |
|------|---------|---------|
| **Skill ↔ Subagent** | Task tool + prompt | 子代理无法访问主上下文 |
| **Hook ↔ Claude Code** | stdin JSON → stdout | 5 秒默认超时,需快速执行 |
| **Plugin ↔ Skills** | 文件系统引用 | 相对路径解析基于 marketplace.json |
| **Global ↔ Project Config** | 合并策略 | 项目配置覆盖全局配置 |

## Sources

### 官方文档
- [Milvus Blog - Claude Code Local Storage](https://milvus.io/blog/why-claude-code-feels-so-stable-a-developers-deep-dive-into-its-local-storage-design.md) - 本地存储设计
- [掘金 - Claude Code Skills全面解读](https://juejin.cn/post/7592540388298375231) - Skills 组件详解
- [CSDN - Claude Skills技术原理和技术架构](https://m.blog.csdn.net/starzhou/article/details/157359729) - 架构分析

### 现有实现
- `C:\WorkSpace\work-skills\.planning\codebase\ARCHITECTURE.md` - 现有项目架构
- `C:\WorkSpace\work-skills\skills\windows-git-commit\SKILL.md` - Skill 实现示例
- `C:\WorkSpace\cc-pushover-hook\hooks\pushover-notify.py` - Hook 实现示例
- `C:\WorkSpace\cc-pushover-hook\.claude\settings.json` - Hook 配置示例

### 社区资源
- [baoyu-skills](https://github.com/JimLiu/baoyu-skills) - 优秀 Skills 库参考
- [Claude Code 官方文档](https://code.claude.com/docs) - 官方指南

---

*Architecture research for: Claude Code Global Skills System*
*Researched: 2026-02-24*
