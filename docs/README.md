# 文档索引

本目录包含 work-skills 项目的所有文档。

## 📚 核心文档

### 插件开发
- **[插件开发最佳实践](./plugin-development-best-practices.md)** - 完整的插件开发指南,包括生命周期管理、常见问题解决
- **[快速参考卡片](./plugin-quick-reference.md)** - 插件开发的快速参考,包含核心原则和检查清单
- **[如何添加新技能](./HOW_TO_ADD_NEW_SKILL.md)** - 添加新技能的步骤指南

### 项目管理
- **[项目结构](./PROJECT_STRUCTURE.md)** - 项目目录结构说明

## 📂 目录说明

### plans/
项目的计划文件,包含阶段性开发计划

### bugs/
项目自测发现的 bug 记录

### verification/
功能验证文档,记录重要功能的验证过程

### fixes/
问题修复记录,包含根本原因分析和解决方案

## 🚀 快速开始

### 新手入门
1. 阅读 [项目结构](./PROJECT_STRUCTURE.md) 了解项目布局
2. 阅读 [如何添加新技能](./HOW_TO_ADD_NEW_SKILL.md) 学习基本操作
3. 参考 [快速参考卡片](./plugin-quick-reference.md) 掌握核心原则

### 遇到问题时
1. 查看 [插件开发最佳实践](./plugin-development-best-practices.md) 中的常见问题章节
2. 查看 [fixes/](./fixes/) 目录中的修复案例
3. 查看 `.planning/debug/` 目录中的调试记录

## 📖 详细文档

### 插件开发相关
| 文档 | 用途 | 何时阅读 |
|------|------|----------|
| [插件开发最佳实践](./plugin-development-best-practices.md) | 完整开发指南 | 开发新插件前 |
| [快速参考卡片](./plugin-quick-reference.md) | 快速查询 | 日常开发中 |
| [如何添加新技能](./HOW_TO_ADD_NEW_SKILL.md) | 基本操作指南 | 第一次添加技能时 |

### 修复案例
| 文档 | 问题描述 | 学到的经验 |
|------|----------|-----------|
| [windows-git-commit 命令重复修复](./fixes/windows-git-commit-duplicate-commands-fix.md) | 斜杠命令重复显示 | 插件只应从一个位置加载 |

## 🔍 按场景查找

### 开发新插件
1. [插件开发最佳实践 - 开发阶段](./plugin-development-best-practices.md#开发阶段)
2. [快速参考卡片 - 检查清单](./plugin-quick-reference.md#✅-检查清单)

### 发布插件
1. [插件开发最佳实践 - 发布阶段](./plugin-development-best-practices.md#发布阶段)
2. [快速参考卡片 - 生命周期](./plugin-quick-reference.md#🔄-生命周期)

### 命令重复问题
1. [快速参考卡片 - 命令重复问题](./plugin-quick-reference.md#🚨-命令重复问题)
2. [插件开发最佳实践 - 常见问题](./plugin-development-best-practices.md#常见问题及解决方案)
3. [修复案例 - windows-git-commit](./fixes/windows-git-commit-duplicate-commands-fix.md)

### 清理缓存
1. [快速参考卡片 - 定期维护](./plugin-quick-reference.md#🛠️-定期维护)
2. [插件开发最佳实践 - 定期维护](./plugin-development-best-practices.md#定期维护)

## 💡 最佳实践

### 黄金法则
1. **单一加载源**: 插件只从一个位置加载
2. **生命周期分离**: 开发和发布使用不同策略
3. **定期清理**: 结构变化时清理缓存
4. **使用新结构**: 采用 `plugins/` 目录结构

### 常见错误
❌ 同时在本地和 marketplace 中保留插件
❌ 同时使用 `commands/` 和 `skills/` 定义
❌ 保留旧的 `skills/` 根目录
❌ 开发阶段添加到 marketplace.json

## 📝 文档贡献

创建新文档时:
1. 将文档放在合适的子目录中
2. 更新本索引文件
3. 在 CLAUDE.md 中添加引用(如果重要)

文档命名规范:
- 使用小写字母和连字符: `plugin-development-guide.md`
- 描述性名称: `how-to-add-new-skill.md`
- 避免缩写: 使用 `best-practices` 而非 `bp`

---

**最后更新**: 2026-02-25
**维护者**: allanpk716
