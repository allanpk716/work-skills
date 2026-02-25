# Work Skills

[English](README.md) | 中文

个人技能集合,用于提升 Claude Code 的日常工作效率。

## 前提条件

- Windows 开发环境
- 已配置 SSH (PuTTY/Pageant) 的 Git
- 已安装 Node.js 环境 (用于 Claude Code 插件系统)

## 安装

### 快速安装 (推荐)

```bash
npx skills add allanpk716/work-skills
```

### 注册为插件市场

在 Claude Code 中运行以下命令:

```
/plugin marketplace add allanpk716/work-skills
```

### 安装技能

**方式 1: 通过浏览界面**

1. 选择 __Browse and install plugins__
2. 选择 __work-skills__
3. 选择要安装的插件
4. 选择 __Install now__

**方式 2: 直接安装**

```
# 安装 git 技能插件
/plugin install git-skills@work-skills
```

**方式 3: 询问 Agent**

直接告诉 Claude Code:

> Please install Skills from github.com/allanpk716/work-skills

## 可用插件

| 插件 | 描述 | 技能 |
| --- | --- | --- |
| __git-skills__ | Windows Git 工作流自动化 | windows-git-commit |
| __claude-notify__ | 通过 Pushover 和 Windows Toast 发送任务完成通知 | claude-notify |

## 更新技能

更新技能到最新版本:

1. 在 Claude Code 中运行 `/plugin`
2. 切换到 __Marketplaces__ 标签页
3. 选择 __work-skills__
4. 选择 __Update marketplace__

你也可以启用 __自动更新__ 来获取最新版本。

## 可用技能

### Git 技能

为 Windows 开发优化的 Git 工作流自动化技能,支持 PuTTY/Pageant 认证。

#### windows-git-commit

使用命令行 git 和 plink + PPK 认证的自动化 Git 提交和推送。

**特性:**
- 自动分析代码变更
- 生成描述性提交信息
- 使用命令行 git (无 GUI 对话框)
- 自动配置 PuTTY/plink SSH 认证
- 在子代理中运行以保留上下文

**用法:**

```bash
# 自动提交和推送 (推荐)
/windows-git-commit

# 使用自定义提交信息
/windows-git-commit Commit message here

# 仅提交特定文件
/windows-git-commit for changes in src/ and tests/
```

**前提条件:**
- Pageant 必须运行并加载了 PPK 密钥
- 必须安装 TortoiseGit 或 PuTTY
- 首次运行会自动配置 git 使用 TortoisePlink

**一次性配置:**

```bash
# 配置 git 使用 TortoisePlink (64位系统)
git config --global core.sshcommand "\"C:\\Program Files\\TortoiseGit\\bin\\TortoisePlink.exe\""

# 或 32位系统
git config --global core.sshcommand "\"C:\\Program Files (x86)\\TortoiseGit\\bin\\TortoisePlink.exe\""
```

详细故障排除请参阅技能文档。

### Claude Notify

通过 Pushover 和 Windows Toast 发送任务完成通知。

#### claude-notify

当 Claude Code 完成任务时自动发送通知。通过 Pushover 接收移动推送通知,在 Windows 系统上接收桌面 Toast 通知。

**特性:**
- 通过 Pushover 发送移动推送通知
- Windows Toast 桌面通知
- 使用 Claude CLI 生成 AI 驱动的任务摘要
- 并行执行实现即时投递
- 未配置 Pushover 时优雅降级
- 在 5 秒内完成

**用法:**

无需手动调用 - 通知在 Claude Code 任务完成时自动发送。

**前提条件:**
- Python 3.8 或更高版本
- Pushover 账号(可选,用于移动通知)

**安装配置:**

1. **配置 Pushover(可选):**

```cmd
# Windows 命令提示符
setx PUSHOVER_TOKEN "your-pushover-app-token"
setx PUSHOVER_USER "your-pushover-user-key"
```

2. **验证安装:**

```bash
python scripts/verify-installation.py
```

3. **测试:**

在 Claude Code 中完成任何任务,你应该会自动收到通知。

**不使用 Pushover:**

Windows Toast 通知无需任何配置即可工作。只需安装插件即可开始使用。

详细文档请参阅[技能文档](skills/claude-notify/SKILL.md)。

## 项目结构

```
work-skills/
├── .claude-plugin/
│   └── marketplace.json      # 插件市场配置
├── skills/
│   └── windows-git-commit/
│       └── SKILL.md          # 技能实现
├── README.md                 # 英文说明
├── README.zh.md              # 中文说明 (本文件)
└── CHANGELOG.md              # 版本历史
```

## 贡献

这是个人技能集合。欢迎 fork 并根据你的需求进行调整!

## 许可证

MIT

## 致谢

项目结构和组织方式受到 [baoyu-skills](https://github.com/JimLiu/baoyu-skills) (作者 Jim Liu) 的启发。
