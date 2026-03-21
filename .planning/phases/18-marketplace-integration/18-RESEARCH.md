# Phase 18: Marketplace Integration - Research

**Gathered:** 2026-03-21
**Phase:** 18-marketplace-integration
**Status:** Research complete

---

## Domain Overview

Claude Code 技能市场集成涉及三个核心操作：
1. **注册市场源** - 将 GitHub 仓库添加为技能市场源
2. **发现插件** - 从 marketplace.json 读取插件清单
3. **安装插件** - 将插件文件复制到本地技能目录

这是一个相对简单的功能,主要涉及配置管理和文件操作。

---

## Technical Research

### 1. Claude Code 配置系统

**配置文件位置:**
- 全局: `~/.claude/config.json`
- 项目级: `.claude/config.json`

**市场源配置结构:**
```json
{
  "marketplaceSources": {
    "source-name": {
      "type": "github",
      "url": "https://github.com/owner/repo",
      "branch": "main"
    }
  }
}
```

**实现方式:**
- Claude Code 没有公开的配置 API
- 需要直接读取和写入 config.json 文件
- 使用 Node.js fs 模块进行文件操作

**配置验证:**
- JSON 格式验证
- 必需字段检查: type, url, branch
- URL 格式验证

### 2. Marketplace.json 结构

**现有结构 (项目已定义):**
```json
{
  "name": "work-skills",
  "owner": { "name": "...", "email": "..." },
  "metadata": { "description": "...", "version": "..." },
  "plugins": [
    {
      "name": "claude-notify",
      "description": "...",
      "source": "./plugins/claude-notify",
      "category": "productivity",
      "version": "1.0.2",
      "author": { "name": "...", "email": "..." }
    }
  ]
}
```

**字段说明:**
- `name` - 市场名称
- `plugins[]` - 插件数组
- `plugins[].name` - 插件标识符
- `plugins[].description` - 插件描述
- `plugins[].source` - 插件源路径（相对路径）
- `plugins[].version` - 插件版本

**获取方式:**
- 使用 GitHub Raw Content URL: `https://raw.githubusercontent.com/allanpk716/work-skills/main/.claude-plugin/marketplace.json`
- 使用 Node.js https 或 fetch API
- 缓存响应以避免重复请求

### 3. 插件安装机制

**目标目录:**
- 全局技能: `~/.claude/skills/{plugin-name}/`
- 包含 SKILL.md 和相关脚本文件

**复制策略:**
```javascript
const fs = require('fs');
const path = require('path');

// 选项 1: 从本地仓库复制（如果存在）
// 选项 2: 使用 git clone 到临时目录
// 选项 3: 下载 ZIP 并解压

// 推荐: git clone 到临时目录
const { execa } = require('execa');
await execa('git', ['clone', '--depth', '1', repoUrl, tempDir]);
await fs.cp(path.join(tempDir, pluginSource), targetDir, { recursive: true });
await fs.rm(tempDir, { recursive: true });
```

**已安装检测:**
```javascript
const isInstalled = fs.existsSync(path.join(skillsDir, pluginName, 'SKILL.md'));
```

**权限处理:**
- Windows: 通常无权限问题
- 检查目标目录是否存在,不存在则创建

### 4. GitHub API vs Raw Content

**GitHub API (api.github.com):**
- 优点: 结构化数据,速率限制信息
- 缺点: 需要认证,速率限制 (60 req/hour 无认证)
- 不推荐: 对于简单的文件读取

**Raw Content (raw.githubusercontent.com):**
- 优点: 简单直接,无需认证
- 缺点: 无速率限制信息
- 推荐: 用于读取 marketplace.json

**实现示例:**
```javascript
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

const marketplace = await fetchJson(
  'https://raw.githubusercontent.com/allanpk716/work-skills/main/.claude-plugin/marketplace.json'
);
```

---

## Integration Points

### 与现有安装器集成

**主入口 (installer/src/index.js):**
```javascript
async function main() {
  // Step 1-6: 环境检测、依赖安装、配置引导
  // Step 7 (新增): 市场集成
  await integrateMarketplace();
}
```

**i18n 集成:**
- 添加 `marketplace.*` 翻译键到 en.json 和 zh.json
- 复用现有 t() 函数

**enquirer 集成:**
- 使用 Checkbox 提示多选插件
- 复用 Phase 17 的交互模式

---

## Risk Analysis

### 技术风险

| 风险 | 影响 | 缓解策略 |
|------|------|----------|
| GitHub 访问失败 | 高 | 添加重试逻辑,显示清晰错误消息 |
| 配置文件损坏 | 中 | 备份现有配置,验证 JSON 格式 |
| 网络超时 | 中 | 设置合理超时(10s),提供离线选项 |
| 权限问题 | 低 | Windows 通常无问题,添加错误处理 |

### 用户体验风险

| 风险 | 影响 | 缓解策略 |
|------|------|----------|
| 插件列表为空 | 低 | 显示友好消息,建议稍后重试 |
| 用户跳过所有插件 | 无 | 允许用户稍后手动安装 |
| 安装失败 | 中 | 显示详细错误,提供解决建议 |

---

## Implementation Approach

### 推荐架构

```
installer/src/
├── marketplace/
│   ├── config-manager.js    # 配置文件读写
│   ├── plugin-discovery.js  # 从 GitHub 获取插件列表
│   ├── plugin-installer.js  # 插件安装逻辑
│   └── index.js             # 主入口,协调各模块
└── index.js                 # 集成到主流程
```

### 关键决策

**1. 配置写入方式**
- 直接读写 config.json (推荐)
- 优点: 简单直接,无依赖
- 不使用外部配置管理库

**2. 插件获取方式**
- git clone 到临时目录 (推荐)
- 优点: 完整文件结构,包含 .git 忽略的文件
- 备选: 下载 ZIP (如果 git 不可用)

**3. 错误处理策略**
- Fail-fast: 任何步骤失败立即停止
- 显示详细错误和解决建议
- 不尝试部分安装

**4. 用户交互**
- 显示插件列表和描述
- 多选要安装的插件
- 显示安装进度和结果摘要

---

## Testing Strategy

### 单元测试

**配置管理:**
- 读取空配置文件
- 写入新配置
- 更新现有配置
- JSON 格式错误处理

**插件发现:**
- 成功获取 marketplace.json
- 网络错误处理
- JSON 解析错误处理

**插件安装:**
- 检测已安装插件
- 复制文件成功
- 处理权限错误

### 集成测试

- 完整流程: 注册 → 发现 → 安装
- 边缘情况: 无网络、已安装、权限不足

---

## Dependencies

### 现有依赖 (无需新增)

- `fs` - 文件操作
- `path` - 路径处理
- `https` - HTTP 请求
- `execa` - 已安装,用于 git clone

### 外部服务

- GitHub Raw Content API - 无需认证

---

## Open Questions

**Q1: 是否支持卸载插件?**
- 答: 不在 Phase 18 范围内,留作未来功能

**Q2: 是否检查插件版本更新?**
- 答: 不在 Phase 18 范围内,留作未来功能

**Q3: 如果用户已安装插件,是否覆盖?**
- 答: 跳过,不覆盖,提示用户手动删除后重新安装

---

## Validation Architecture

### Must-Have Requirements

**M1: 市场源注册成功**
- 验证: config.json 包含 work-skills 市场源
- 检查: `~/.claude/config.json` 中有 `marketplaceSources.work-skills`

**M2: 插件列表显示**
- 验证: 显示至少 2 个插件
- 检查: 输出包含 claude-notify 和 windows-git-commit

**M3: 插件安装成功**
- 验证: 选中的插件文件复制到本地
- 检查: `~/.claude/skills/{plugin-name}/SKILL.md` 存在

### Observable Truths

| Truth | Verification |
|-------|--------------|
| 用户看到市场源注册成功消息 | 输出包含 "Marketplace source 'work-skills' added" |
| 用户看到插件列表 | 输出包含插件名称和描述的表格 |
| 用户可以选择插件 | enquirer Checkbox 提示正常工作 |
| 选中的插件被安装 | 目标目录存在 SKILL.md 文件 |

---

## References

**Claude Code 配置:**
- 无官方文档 - 通过代码观察和社区讨论了解

**Node.js 文件操作:**
- Node.js fs 文档: https://nodejs.org/api/fs.html
- fs.cp (Node 16.7+): 递归复制目录

**GitHub Raw Content:**
- 格式: `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`

---

*Research completed: 2026-03-21*
