# 插件开发最佳实践文档维护记录

## 背景
本文档记录"插件/技能开发最佳实践"知识体系的维护经验,沉淀为可复用的文档治理与结构治理经验。
适用于任何 Claude Code 技能(当前项目仅 `claude-notify`,但经验通用)。

## 已沉淀的最佳实践文档

### 1. 核心文档

#### plugin-development-best-practices.md
**位置**: `docs/project/plugin-development-best-practices.md`

**内容**:
- 插件生命周期管理(开发阶段 vs 发布阶段)
- 常见问题及解决方案(命令重复、内部重复、结构冲突)
- 定期维护指南
- 插件结构规范
- 开发工作流
- 调试技巧
- 黄金法则和检查清单

**用途**: 完整的插件开发指南,适合深入阅读

#### plugin-quick-reference.md
**位置**: `docs/project/plugin-quick-reference.md`

**内容**:
- 核心原则(单一加载源)
- 目录结构对比(推荐 vs 避免)
- 生命周期快速指南
- 命令重复问题快速解决
- 定期维护命令
- 检查清单

**用途**: 快速参考卡片,适合日常开发查询

### 2. 索引文档

#### docs/README.md
**位置**: `docs/README.md`

**内容**:
- 核心文档列表
- 目录说明
- 快速开始指南
- 按场景查找文档
- 最佳实践总结
- 文档贡献指南

**用途**: 文档导航中心,帮助快速找到需要的文档

## 关键经验总结

### 问题根源
Claude Code 插件/技能系统可能从多个位置加载:
1. 本地开发目录 (`<skill-name>/`)
2. Claude 缓存 (`~/.claude/plugins/cache/`)
3. Marketplace 工作区 (`~/.claude/plugins/marketplaces/`)

### 核心原则
**单一加载源**: 插件/技能只应从一个位置加载

### 生命周期管理
- **开发阶段**: 在 `<skill-name>/` 目录开发,不添加到 marketplace.json / 不发布
- **发布阶段**: 通过 Agent Skills 标准(`npx skills add`)分发,避免与本地开发副本并存

### 避免的错误
- 同时在本地和发布渠道保留同一技能(命令重复)
- 同时使用 `commands/` 和 `skills/` 定义(命令重复)
- 保留旧的目录结构(与新增结构冲突)
- 开发阶段提前注册到发布渠道

## 文档结构(v3.0)

```
docs/
├── README.md                                    # 文档索引
├── claude-notify/                               # claude-notify 专属文档
└── project/                                     # 跨技能的项目级文档
    ├── plugin-development-best-practices.md     # 完整指南
    ├── plugin-quick-reference.md                # 快速参考
    ├── how-to-add-new-skill.md                  # 基本操作
    ├── structure.md                             # 项目结构
    ├── plugin-version-management.md             # 版本管理
    ├── fixes/                                   # 修复/经验记录
    ├── plans/                                   # 计划模板
    ├── bugs/                                    # Bug 记录
    └── verification/                            # 验证记录
```

## 使用建议

### 新手开发者
1. 从 `docs/README.md` 开始
2. 阅读 `structure.md` 了解项目
3. 参考 `plugin-quick-reference.md` 进行开发

### 遇到问题时
1. 查看 `plugin-development-best-practices.md` 的常见问题章节
2. 参考 `plugin-quick-reference.md` 的快速解决方案
3. 查看 `fixes/` 目录中的历史经验记录

### 日常开发
- 保持 `plugin-quick-reference.md` 打开,随时查询
- 遵循检查清单确保符合最佳实践

## 文档治理经验

### 文档随项目演进
- 项目结构发生破坏性变更时(例如 v3.0 下线旧技能),必须同步审查并更新 `docs/project/` 下的文档,避免残留对已删除文件/技能的引用。
- 文档之间的内部链接指向已删除文件时,属于"文档债",应在本轮维护中一并修复或移除。
- 历史性"修复记录"文档如果仅针对已删除的代码,优先判断其经验是否已沉淀到通用最佳实践文档:已沉淀则精简为经验索引,避免长期保留失效链接。

### 文档维护清单
- 当删除一个文件时,grep 整个 `docs/` 检查是否有指向它的链接
- 当项目下线一个技能时,grep 整个 `docs/` 检查是否还有对该技能名/目录的引用
- 保持文档路径与实际项目结构一致(例如 v3.0 文档已迁移到 `docs/project/`)

## 未来改进

### 可能的补充
- [ ] 技能测试最佳实践
- [ ] 技能性能优化指南
- [ ] 多技能协作开发指南
- [ ] CI/CD 集成指南

### 文档维护
- 当发现新问题时,更新常见问题章节
- 当插件系统更新时,更新最佳实践
- 定期审查和优化文档结构

## 相关文档

- [插件开发最佳实践](../plugin-development-best-practices.md)
- [快速参考卡片](../plugin-quick-reference.md)
- [项目结构](../structure.md)

---

**维护者**: Claude Code
**状态**: 持续维护
**最后更新**: 2026-06-26
