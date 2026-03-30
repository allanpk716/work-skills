# Phase 23: Detection & Regression Verification - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

验证 Phase 22 插件结构修复后，安装器 `isPluginInstalled()` 能正确检测已安装的 windows-git-commit 插件（DETECT-01），重复运行时显示 [installed] 标记且不提示重装（DETECT-02），且 claude-notify 检测不受影响（DETECT-03）。不修改安装器核心代码，不做旧安装清理，不添加新自动化测试。

</domain>

<decisions>
## Implementation Decisions

### Verification Approach

- **D-01:** 手动运行实际安装器验证 — 运行 `npx @allanpk716/work-skills-setup`，实际检查三个成功标准是否满足。不编写新的自动化测试。
- **D-02:** 最小验证范围 — 只确认三个成功标准（DETECT-01/02/03），不做额外边界测试。

### Old Install Cleanup

- **D-03:** 不需要清理逻辑 — 安装器使用 `cpSync` 覆盖整个目录，旧结构会被新结构自动覆盖。重新安装即修复。

### Test Coverage

- **D-04:** 不添加新测试 — 手动验证足以确认修复有效。现有测试（`plugin-installer.test.js`）已覆盖 `isPluginInstalled()` 基本逻辑。

### Claude's Discretion

- 手动验证的具体步骤和操作顺序
- 验证结果的记录方式

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — Phase 23 需求定义（DETECT-01, DETECT-02, DETECT-03）
- `.planning/ROADMAP.md` — Phase 23 目标和成功标准

### Prior Phase Context
- `.planning/phases/20-config-detection-smart-interaction/20-CONTEXT.md` — 配置检测模式，安装器架构

### Existing Code (VERIFY, not modify)
- `installer/src/marketplace/plugin-installer.js` — isPluginInstalled(), installPlugin(), installPlugins()
- `installer/src/marketplace/index.js` — Marketplace 流程，调用 isPluginInstalled 进行显示和跳过
- `plugins/windows-git-commit/SKILL.md` — Phase 22 修复后的插件结构（SKILL.md 在根目录）
- `plugins/claude-notify/SKILL.md` — 参考插件结构
- `.claude-plugin/marketplace.json` — 插件注册表
- `installer/tests/marketplace/plugin-installer.test.js` — 现有测试

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `isPluginInstalled()` in `plugin-installer.js:26-29` — 检测逻辑 `~/.claude/skills/<name>/SKILL.md`
- `getSkillsDir()` in `plugin-installer.js:17-19` — 返回 `~/.claude/skills` 路径
- `installPlugin()` in `plugin-installer.js:37-92` — git clone + cpSync 安装流程
- `displayPluginTable()` in `index.js:29` — [installed] 标记显示逻辑

### Established Patterns
- **Detection pattern:** `fs.existsSync(path.join(skillsDir, pluginName, 'SKILL.md'))`
- **Install pattern:** `git clone --depth 1` → `fs.cpSync(sourcePath, targetPath, { recursive: true })`
- **Skip pattern:** `isPluginInstalled()` 返回 true 时跳过安装，推入 `result.skipped`

### Integration Points
- `installer/src/marketplace/index.js:29` — 显示 [installed] 标记
- `installer/src/marketplace/index.js:105` — MultiSelect disabled 逻辑
- `installer/src/marketplace/plugin-installer.js:109` — 安装时跳过已安装插件

</code_context>

<specifics>
## Specific Ideas

- 验证步骤：先清理旧的 ~/.claude/skills/windows-git-commit/（如有），运行安装器，确认安装后 SKILL.md 存在于正确位置
- 回归验证：确认 claude-notify 的 isPluginInstalled() 在修改前后行为一致
- 无代码修改预期 — 此阶段是验证性的，只有当验证发现问题时才需要代码修改

</specifics>

<deferred>
## Deferred Ideas

### Reviewed Todos (not folded)
- "Add slash commands to toggle notification channels" — 已在 Phase 13 完成（shipped），关键词误匹配，不属于 Phase 23

None — discussion stayed within phase scope

</deferred>

---

*Phase: 23-detection-regression-verification*
*Context gathered: 2026-03-29*
