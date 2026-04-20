# Work Skills

[English](README.md) | 中文

个人技能集合，用于提升 Claude Code 的日常工作效率。提供任务通知、Git 工作流自动化和 AI 辅助代码可观测性。

## 🚀 快速开始

```bash
npx github:allanpk716/work-skills#main
```

简写形式：`npx allanpk716/work-skills`

## 技能列表

| 技能 | 描述 | 详细文档 |
| --- | --- | --- |
| [claude-notify](claude-notify/README.md) | 任务完成通知 — Pushover 移动推送 + Windows Toast 桌面通知 | 安装、配置、斜杠命令 |
| [windows-git-commit](windows-git-commit/README.md) | Windows 自动化 Git 提交与推送，使用 plink + PPK 认证 | 配置、安全扫描、用法 |
| [codepoint](codepoint/README.md) | 基于集合的运行时可观测性 — 扫描、规划、插桩、验证代码探针 | 流水线命令、语言支持 |

## 项目结构

```
work-skills/
├── claude-notify/         # 通知技能
├── windows-git-commit/    # Git 工作流技能
├── codepoint/             # 代码可观测性技能
├── installer/             # NPX 安装器
└── README.md
```

## 许可证

MIT

## 致谢

项目结构和组织方式受到 [baoyu-skills](https://github.com/allanpk716/work-skills)（作者 Jim Liu）的启发。
