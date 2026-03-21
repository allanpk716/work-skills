# Phase 18: Marketplace Integration - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

将 work-skills 仓库注册为 Claude Code 技能市场源,显示可用插件列表,并允许用户通过交互式选择安装插件到本地环境。不包括插件卸载、版本更新、依赖管理或远程插件搜索功能。

</domain>

<decisions>
## Implementation Decisions

### 市场源注册方式

**配置位置:**
- 使用 Claude Code 用户配置文件添加市场源
- 配置路径: `~/.claude/config.json` (全局) 或项目级 `.claude/config.json`

**注册内容:**
- 市场名称: "work-skills"
- 市场类型: GitHub 仓库
- 仓库 URL: `https://github.com/allanpk716/work-skills`
- 分支: `main`
- 市场描述: "Personal skills collection for improving daily work efficiency"

**注册方式:**
- 通过配置文件 API 添加市场源条目
- 不需要用户手动编辑配置文件

**示例配置:**
```json
{
  "marketplaceSources": {
    "work-skills": {
      "type": "github",
      "url": "https://github.com/allanpk716/work-skills",
      "branch": "main"
    }
  }
}
```

### 插件发现机制

**数据源:**
- 从 GitHub 仓库根目录读取 `marketplace.json`
- 使用现有 marketplace.json 结构(无需修改)

**显示内容:**
- 插件名称 (name)
- 插件描述 (description)
- 插件版本 (version)
- 插件分类 (category)

**显示格式:**
- 使用表格格式显示插件列表
- 每行一个插件,包含名称、版本、描述
- 示例:
  ```
  Available Plugins:

  | Name | Version | Description |
  |------|---------|-------------|
  | claude-notify | 1.0.2 | Task completion notifications via Pushover and Windows Toast |
  | windows-git-commit | 1.1.1 | Git workflow automation with smart commit messages |
  ```

**获取方式:**
- 使用 GitHub raw content URL 或 git clone 读取文件
- 推荐使用 raw content URL (更快,更轻量)
- URL 格式: `https://raw.githubusercontent.com/allanpk716/work-skills/main/.claude-plugin/marketplace.json`

### 插件安装流程

**选择方式:**
- 使用 enquirer Checkbox 提示多选插件
- 提示消息: "Which plugins would you like to install?"
- 默认: 所有插件都未选中(用户必须主动选择)

**安装步骤:**
1. 用户选择要安装的插件
2. 检查每个插件是否已安装(通过检查本地目录是否存在)
3. 对于每个未安装的插件:
   - 从 GitHub 仓库复制插件文件到本地
   - 目标路径: `~/.claude/skills/{plugin-name}/`
   - 源路径: `plugins/{plugin-name}/` (从仓库根目录)
4. 显示安装结果摘要

**文件复制:**
- 使用 Node.js fs 模块复制目录
- 递归复制整个插件目录
- 保留目录结构

**已安装处理:**
- 检测到插件已安装时,跳过并提示
- 不支持覆盖安装(用户需手动删除后重新安装)

**安装摘要:**
- 显示成功安装的插件列表
- 显示跳过的插件(已安装)
- 显示安装失败(如有)

### Claude's Discretion

- GitHub API 调用错误处理
- 网络失败重试策略
- 本地权限检查
- 安装后验证详细程度
- 进度显示方式

</decisions>

<specifics>
## Specific Ideas

- 用户运行安装器后,自动注册市场源
- 显示"Marketplace source 'work-skills' added successfully"
- 插件列表使用彩色表格格式(与 Phase 7 报告风格一致)
- 安装进度使用简洁指示器(如 "Installing claude-notify...")
- 完成后显示: "2 plugins installed. Run Claude Code to use them."

</specifics>

<canonical_refs>
## Canonical References

### Claude Code 配置系统
- 无外部文档 — 使用 Claude Code 内置配置 API

### 现有项目结构
- `.claude-plugin/marketplace.json` — 插件市场清单
- `plugins/claude-notify/SKILL.md` — claude-notify 技能定义
- `plugins/windows-git-commit/skills/windows-git-commit/SKILL.md` — windows-git-commit 技能定义

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `installer/src/i18n/` — 双语支持系统,可复用于插件列表显示
- `installer/src/index.js` — 主入口点,已集成环境检测、配置引导流程
- `enquirer` — 已安装的交互提示库,可用于多选插件

### Established Patterns
- 交互式引导 — 使用 enquirer Input/Confirm/Checkbox 提示
- 状态报告 — 表格格式,带状态图标
- 错误处理 — 友好错误消息,解决建议
- 双语支持 — 所有用户可见文本支持中英文

### Integration Points
- 主入口 `src/index.js` — 在配置引导后添加市场集成步骤(Step 7)
- i18n 系统 — 添加 `marketplace.*` 翻译键
- 安装流程 — 添加到 Phase 17 之后的步骤

</code_context>

<deferred>
## Deferred Ideas

None — 讨论保持在阶段范围内

</deferred>

---

*Phase: 18-marketplace-integration*
*Context gathered: 2026-03-21*
