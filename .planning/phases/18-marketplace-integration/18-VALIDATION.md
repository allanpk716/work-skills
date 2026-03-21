---
phase: "18"
phase_slug: "marketplace-integration"
created: "2026-03-21"
---

# Phase 18: Marketplace Integration - Validation Strategy

## Overview

此文档定义 Phase 18 的验证策略,确保市场集成功能满足所有业务目标和技术要求。

---

## Validation Dimensions

### Dimension 1: 市场源注册

**验证目标:** Claude Code 配置成功添加 work-skills 市场源

**验证方法:**
```javascript
// 自动化验证
const config = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude', 'config.json')));
const hasSource = config.marketplaceSources?.['work-skills'] !== undefined;
const hasRequiredFields = hasSource &&
  config.marketplaceSources['work-skills'].type === 'github' &&
  config.marketplaceSources['work-skills'].url !== undefined;

// 预期结果: hasSource === true && hasRequiredFields === true
```

**验证点:**
- ✓ config.json 存在且格式正确
- ✓ marketplaceSources 对象存在
- ✓ work-skills 条目存在
- ✓ type 字段为 "github"
- ✓ url 字段为有效 URL
- ✓ branch 字段存在 (默认 "main")

### Dimension 2: 插件发现

**验证目标:** 成功从 GitHub 获取并显示插件列表

**验证方法:**
```javascript
// 自动化验证
const marketplaceUrl = 'https://raw.githubusercontent.com/allanpk716/work-skills/main/.claude-plugin/marketplace.json';
const response = await fetch(marketplaceUrl);
const data = await response.json();

// 预期结果:
// - response.status === 200
// - data.plugins 是数组
// - data.plugins.length >= 2
// - 每个插件有 name, description, version, source 字段
```

**验证点:**
- ✓ marketplace.json 可访问 (HTTP 200)
- ✓ JSON 解析成功
- ✓ plugins 数组非空
- ✓ 至少 2 个插件 (claude-notify, windows-git-commit)
- ✓ 每个插件包含必需字段

### Dimension 3: 用户交互

**验证目标:** 用户可以通过 enquirer 选择要安装的插件

**验证方法:**
- 手动验证: 运行安装器,观察插件列表显示
- 自动化验证: 检查 enquirer Checkbox 配置正确

**验证点:**
- ✓ 插件列表以表格形式显示
- ✓ 每个插件显示名称、版本、描述
- ✓ 用户可以多选插件
- ✓ 默认所有插件未选中

### Dimension 4: 插件安装

**验证目标:** 选中的插件成功复制到本地技能目录

**验证方法:**
```javascript
// 自动化验证
const skillsDir = path.join(os.homedir(), '.claude', 'skills');
const installedPlugins = ['claude-notify', 'windows-git-commit']; // 示例

for (const plugin of installedPlugins) {
  const skillFile = path.join(skillsDir, plugin, 'SKILL.md');
  const exists = fs.existsSync(skillFile);
  // 预期: exists === true
}
```

**验证点:**
- ✓ 目标目录 `~/.claude/skills/` 存在
- ✓ 每个插件目录包含 SKILL.md
- ✓ SKILL.md 内容与源文件一致
- ✓ 相关脚本文件也被复制

### Dimension 5: 已安装检测

**验证目标:** 正确识别已安装的插件并跳过

**验证方法:**
```javascript
// 模拟已安装场景
const pluginName = 'claude-notify';
const skillsDir = path.join(os.homedir(), '.claude', 'skills');
const skillPath = path.join(skillsDir, pluginName, 'SKILL.md');

// 创建已安装状态
fs.mkdirSync(path.dirname(skillPath), { recursive: true });
fs.writeFileSync(skillPath, 'test');

// 运行安装器,验证跳过逻辑
// 预期: 输出包含 "claude-notify already installed, skipping"
```

**验证点:**
- ✓ 检测逻辑正确 (检查 SKILL.md 存在性)
- ✓ 已安装插件显示在跳过列表
- ✓ 不重复复制文件

### Dimension 6: 错误处理

**验证目标:** 网络错误、权限错误、JSON 错误都有清晰提示

**验证方法:**
- 模拟网络失败: 断网或使用无效 URL
- 模拟权限错误: 锁定目标目录
- 模拟 JSON 错误: 返回无效 JSON

**验证点:**
- ✓ 网络错误显示友好消息和重试建议
- ✓ 权限错误显示解决步骤
- ✓ JSON 解析错误显示详细信息
- ✓ 不崩溃,优雅退出

### Dimension 7: 国际化

**验证目标:** 所有用户可见文本支持中英文

**验证方法:**
```javascript
// 验证 i18n 键存在
const i18n = require('./src/i18n');
const keys = [
  'marketplace.title',
  'marketplace.fetching',
  'marketplace.select_plugins',
  'marketplace.installing',
  'marketplace.success',
  'marketplace.error'
];

for (const key of keys) {
  const en = i18n.t(key, 'en');
  const zh = i18n.t(key, 'zh');
  // 预期: en !== undefined && zh !== undefined
}
```

**验证点:**
- ✓ en.json 包含所有 marketplace.* 键
- ✓ zh.json 包含所有 marketplace.* 键
- ✓ 翻译准确自然

### Dimension 8: 集成流程

**验证目标:** 市场集成正确集成到主安装流程

**验证方法:**
```bash
# 端到端测试
npx @allanpk716/work-skills-setup
# 观察 Step 7: Marketplace Integration 执行
```

**验证点:**
- ✓ 市场集成作为 Step 7 执行
- ✓ 在配置引导 (Step 6) 之后
- ✓ 错误不影响前面步骤的成果
- ✓ 完成后显示安装摘要

---

## Test Cases

### TC-01: 首次安装流程

**前置条件:** 全新系统,未安装任何插件

**步骤:**
1. 运行 `npx @allanpk716/work-skills-setup`
2. 完成环境检测和依赖安装
3. 配置 Pushover (或跳过)
4. 配置 Git (或跳过)
5. 在插件列表中选择 claude-notify 和 windows-git-commit

**预期结果:**
- 市场源注册成功
- 2 个插件安装到 `~/.claude/skills/`
- 显示安装成功摘要

### TC-02: 部分安装

**前置条件:** claude-notify 已安装

**步骤:**
1. 运行安装器
2. 选择 windows-git-commit (不选 claude-notify)

**预期结果:**
- claude-notify 显示"已安装,跳过"
- windows-git-commit 安装成功
- 摘要显示: 1 安装, 1 跳过

### TC-03: 网络错误

**前置条件:** 无网络连接

**步骤:**
1. 断开网络
2. 运行安装器

**预期结果:**
- 显示"无法连接到 GitHub"错误
- 提供解决建议: 检查网络连接
- 安装器优雅退出 (exit code 1)

### TC-04: 全部跳过

**前置条件:** 无

**步骤:**
1. 运行安装器
2. 在插件选择时,不选任何插件

**预期结果:**
- 市场源仍注册成功
- 无插件安装
- 显示"未选择任何插件"提示
- 安装器正常完成 (exit code 0)

---

## Validation Checklist

执行验证时,逐项检查:

### 自动化检查 (可脚本化)
- [ ] config.json 包含 work-skills 市场源
- [ ] marketplace.json 可从 GitHub 访问
- [ ] 选中插件的 SKILL.md 文件存在
- [ ] i18n 键完整 (en.json + zh.json)

### 手动检查 (需要人工观察)
- [ ] 插件列表以清晰表格显示
- [ ] enquirer 多选提示正常工作
- [ ] 错误消息友好易懂
- [ ] 中英文切换正常

### 集成检查 (端到端)
- [ ] 完整安装流程无阻塞
- [ ] 错误不影响前置步骤
- [ ] 安装摘要准确

---

## Success Criteria

**Phase 18 验证通过条件:**

1. **必须满足 (Must-Haves):**
   - 市场源成功注册到 config.json
   - 插件列表正确显示
   - 选中的插件成功安装
   - 已安装插件正确跳过
   - 错误有清晰提示

2. **应该满足 (Should-Haves):**
   - 中英文双语支持完整
   - 安装摘要清晰
   - 性能良好 (插件列表获取 < 3秒)

3. **可以满足 (Nice-to-Haves):**
   - 提供离线模式 (使用缓存)
   - 显示插件详细信息

---

## Validation Report Template

```markdown
# Phase 18 Validation Report

**Date:** [date]
**Validator:** [agent/human]
**Status:** [PASSED | FAILED | PARTIAL]

## Summary

[Brief summary of validation results]

## Must-Haves

| Requirement | Status | Evidence |
|-------------|--------|----------|
| 市场源注册 | ✓ PASS | config.json contains work-skills source |
| 插件列表显示 | ✓ PASS | Output shows claude-notify and windows-git-commit |
| 插件安装 | ✓ PASS | ~/.claude/skills/claude-notify/SKILL.md exists |
| 已安装跳过 | ✓ PASS | Re-run shows "already installed, skipping" |
| 错误处理 | ✓ PASS | Network error shows friendly message |

## Issues Found

[List any issues, or "None"]

## Recommendation

[PASS / FAIL with conditions]
```

---

*Validation strategy defined: 2026-03-21*
