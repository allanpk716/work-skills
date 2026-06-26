# 使用文档对齐 v3.0 现实 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 claude-notify 使用文档与 v3.0 单技能项目现实对齐 — 清理过期 marketplace 措辞、补齐 installer 备选安装方式、修正根 README 项目结构。

**Architecture:** 纯文档编辑,4 个文件改动 + 1 个明确不改 (changelog 历史)。无代码改动。每个任务聚焦一个文件,改完即验证 (grep / 链接核对) 即提交。安装路径叙事:`npx skills add` 为首选 (保持),`npx @allanpk716/work-skills-setup` 为备选 (新增文档)。

**Tech Stack:** Markdown 文档 (中文为主)。验证用 grep + 人工链接核对。

**Spec:** `docs/superpowers/specs/2026-06-26-usage-docs-v3-alignment-design.md`

---

### Task 1: 清理 claude-notify/SKILL.md 的 marketplace 措辞 (Step 1 安装节)

**Files:**
- Modify: `claude-notify/SKILL.md` (Step 1 安装插件 节, 约 line 70-90;含 line 82 的 v2.0.0 marketplace 注释)

- [ ] **Step 1: 读取 SKILL.md 当前 Step 1 安装节,确认 line 82 的 marketplace 注释原文**

Run: `sed -n '70,90p' claude-notify/SKILL.md`
Expected: 看到 line 82 `> **注意:** 从 v2.0.0 开始，通知 hooks 注册在全局 \`~/.claude/settings.json\` 中，不再依赖 marketplace 插件的 hooks 加载机制。`

- [ ] **Step 2: 删除 line 82 的 marketplace 注释行**

用 Edit 工具,将:
```
此命令将:
- 自动注册全局通知 hooks 到 `~/.claude/settings.json`
- 复制通知脚本到 `~/.claude/hooks/`
- 安装 claude-notify 技能

> **注意:** 从 v2.0.0 开始，通知 hooks 注册在全局 `~/.claude/settings.json` 中，不再依赖 marketplace 插件的 hooks 加载机制。

### 步骤 2: 配置环境变量
```
替换为 (去掉 marketplace 对比注释):
```
此命令将:
- 自动注册全局通知 hooks 到 `~/.claude/settings.json`
- 复制通知脚本到 `~/.claude/hooks/`
- 安装 claude-notify 技能

### 步骤 2: 配置环境变量
```

- [ ] **Step 3: 验证 SKILL.md Step 1 节已无 marketplace 对比注释**

Run: `grep -nE "marketplace|不再依赖" claude-notify/SKILL.md | head`
Expected: 仅可能在 line ~176 (Step 4 的另一处注释,Task 2 处理) 命中;line 82 区域无命中。若 line 82 区域仍有命中,Step 2 的 Edit 未生效,重做。

- [ ] **Step 4: Commit**

```bash
git add claude-notify/SKILL.md
git commit -m "docs(claude-notify): remove stale marketplace contrast note from SKILL.md Step 1

v3.0 removed marketplace entirely; the v2.0.0 'no longer relies on marketplace'
note contrasts against something that no longer exists."
```

---

### Task 2: 清理 claude-notify/SKILL.md Step 4 测试节的 marketplace 注释

**Files:**
- Modify: `claude-notify/SKILL.md` (Step 4 测试 节, 约 line 176)

- [ ] **Step 1: 读取 SKILL.md 当前 Step 4 节,确认 line ~176 的 marketplace 注释原文**

Run: `sed -n '172,180p' claude-notify/SKILL.md`
Expected: 看到 `> **注意:** 从 v2.0.0 开始,通知 hooks 通过全局 \`~/.claude/settings.json\` 注册,而非 marketplace 插件机制。这样确保在所有项目中都能正常工作。`

- [ ] **Step 2: 简化该注释 (去掉 marketplace 对比)**

用 Edit 工具,将:
```
> **注意:** 从 v2.0.0 开始,通知 hooks 通过全局 `~/.claude/settings.json` 注册,而非 marketplace 插件机制。这样确保在所有项目中都能正常工作。
```
替换为:
```
> **注意:** 通知 hooks 注册在全局 `~/.claude/settings.json`,确保在所有项目中都能正常工作。
```

- [ ] **Step 3: 验证 SKILL.md 全文已无 marketplace 对比措辞**

Run: `grep -niE "marketplace" claude-notify/SKILL.md`
Expected: 空 (无输出)。若有命中,定位并清理。

- [ ] **Step 4: Commit**

```bash
git add claude-notify/SKILL.md
git commit -m "docs(claude-notify): simplify Step 4 hook note (drop marketplace contrast)"
```

---

### Task 3: 在 SKILL.md Step 1 新增"备选:引导式安装器"子节

**Files:**
- Modify: `claude-notify/SKILL.md` (Step 1 安装插件 节末尾,Task 1 删除注释后的位置)

- [ ] **Step 1: 读取 Task 1/2 修改后的 Step 1 节当前状态**

Run: `sed -n '70,92p' claude-notify/SKILL.md`
Expected: 看到 Step 1 节以"安装 claude-notify 技能"列表 + 空行 + "### 步骤 2: 配置环境变量" 结束 (Task 1 已删 marketplace 注释)。

- [ ] **Step 2: 在 Step 1 节末尾、步骤 2 之前,插入"备选:引导式安装器"子节**

用 Edit 工具,将:
```
此命令将:
- 自动注册全局通知 hooks 到 `~/.claude/settings.json`
- 复制通知脚本到 `~/.claude/hooks/`
- 安装 claude-notify 技能

### 步骤 2: 配置环境变量
```
替换为:
```
此命令将:
- 自动注册全局通知 hooks 到 `~/.claude/settings.json`
- 复制通知脚本到 `~/.claude/hooks/`
- 安装 claude-notify 技能

#### 备选:引导式安装器

若您希望安装器引导完成 Pushover 配置与环境检测,可改用 NPX 安装器:

```bash
npx @allanpk716/work-skills-setup
```

安装器会:检测 Windows/Python/`requests` 依赖、交互式收集并验证 Pushover 凭据、注册通知 hooks、运行安装验证 (`--verify`)。适合不熟悉手动 `setx` 配置的新用户。

> 手动 `setx` 配置 Pushover 的详细步骤见 → [配置指南](references/setup.md) 的"引导式安装"节。

### 步骤 2: 配置环境变量
```

- [ ] **Step 3: 验证安装器已文档化 + 链接目标存在**

Run: `grep -n "@allanpk716/work-skills-setup" claude-notify/SKILL.md`
Expected: 命中 1 行 (新增的备选子节)。

Run: `grep -n "引导式安装" claude-notify/references/setup.md`
Expected: 暂未命中 (Task 4 才在 setup.md 加该节)。这是预期 — Task 4 会补上。本步仅确认 SKILL.md 侧已写入。

- [ ] **Step 4: Commit**

```bash
git add claude-notify/SKILL.md
git commit -m "docs(claude-notify): document guided installer as alternative install path"
```

---

### Task 4: 在 setup.md 新增"引导式安装 (推荐新用户)"节

**Files:**
- Modify: `claude-notify/references/setup.md` (Pushover 配置节之前,文件靠前位置)

- [ ] **Step 1: 读取 setup.md 当前开头,确定插入位置**

Run: `sed -n '1,12p' claude-notify/references/setup.md`
Expected: 看到:
```
# 配置指南

> 返回 [SKILL.md](../SKILL.md) 主文档

## Pushover 详细配置

### 1. 创建 Pushover 账号
```

- [ ] **Step 2: 在"## Pushover 详细配置"之前插入"## 引导式安装 (推荐新用户)"节**

用 Edit 工具,将:
```
> 返回 [SKILL.md](../SKILL.md) 主文档

## Pushover 详细配置
```
替换为:
```
> 返回 [SKILL.md](../SKILL.md) 主文档

## 引导式安装 (推荐新用户)

若您不想手动配置 Pushover 凭据与环境,可使用 NPX 引导式安装器一步完成:

```bash
npx @allanpk716/work-skills-setup
```

安装器会自动完成:

- **环境检测**:Windows 系统、Python 3.8+、`requests` 库 (缺失时提示安装)
- **Pushover 凭据配置**:交互式收集 API Token 与 User Key,验证有效性后保存
- **通知 hooks 注册**:将 Stop/Notification hooks 写入全局 `~/.claude/settings.json`
- **安装验证**:自动运行 `--verify` 检查所有组件就绪

卸载时同样可用:`npx @allanpk716/work-skills-setup --uninstall`。

> 若您偏好手动配置,继续阅读下方"Pushover 详细配置"。

## Pushover 详细配置
```

- [ ] **Step 3: 验证 setup.md 引导式安装节已写入 + SKILL.md 的链接现在可解析**

Run: `grep -n "引导式安装" claude-notify/references/setup.md`
Expected: 命中 (新增的 `## 引导式安装 (推荐新用户)` 节标题)。

确认 SKILL.md Task 3 加的链接 `references/setup.md` 的"引导式安装"节现在存在 → 链接可解析。

- [ ] **Step 4: Commit**

```bash
git add claude-notify/references/setup.md
git commit -m "docs(claude-notify): add guided-installer section to setup.md"
```

---

### Task 5: 修正根 README.md 项目结构 (补 installer/ + docs/)

**Files:**
- Modify: `README.md` (Project Structure 代码块, 约 line 18-24)

- [ ] **Step 1: 读取 README.md 当前 Project Structure 块**

Run: `sed -n '18,24p' README.md`
Expected: 看到:
```
```
work-skills/
├── claude-notify/         # Notification skill
└── README.md
```
```

- [ ] **Step 2: 在项目结构块补 installer/ 与 docs/ 行**

用 Edit 工具,将:
```
work-skills/
├── claude-notify/         # Notification skill
└── README.md
```
替换为:
```
work-skills/
├── claude-notify/         # Notification skill
├── installer/             # NPX guided installer (@allanpk716/work-skills-setup)
├── docs/                  # Project documentation
└── README.md
```

- [ ] **Step 3: 验证项目结构与实际根目录布局一致**

Run: `sed -n '18,26p' README.md`
Expected: 看到 4 个条目 (claude-notify/、installer/、docs/、README.md)。

Run: `ls -d */ | grep -vE "node_modules|tmp|.claude|.bg-shell|.playwright|.pytest_cache|.git"`
Expected: 含 `claude-notify/`、`docs/`、`installer/` (与 README 一致)。

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): include installer/ and docs/ in project structure"
```

---

### Task 6: 修正根 README.zh.md 项目结构 (中文镜像)

**Files:**
- Modify: `README.zh.md` (Project Structure 代码块)

- [ ] **Step 1: 读取 README.zh.md 当前 Project Structure 块**

Run: `grep -n "项目结构\|work-skills/" README.zh.md`
Expected: 定位到项目结构块 (中文章节标题 + 代码块)。

- [ ] **Step 2: 读取该块的精确内容**

Run: `sed -n '<块起始行>,<块结束行>p' README.zh.md` (用 Step 1 定位的行号)
Expected: 看到中文版项目结构代码块,目前只列 claude-notify/。

- [ ] **Step 3: 补 installer/ 与 docs/ 行 (中文注释)**

用 Edit 工具,将 README.zh.md 项目结构块中:
```
work-skills/
├── claude-notify/         # 通知技能
└── README.md
```
(若中文版用中文注释如 `# 通知技能`,按实际原文匹配) 替换为加入 installer/ + docs/ 的版本:
```
work-skills/
├── claude-notify/         # 通知技能
├── installer/             # NPX 引导式安装器 (@allanpk716/work-skills-setup)
├── docs/                  # 项目文档
└── README.md
```
注意:必须先读取 Step 2 的精确原文用于 `old_string`,不可假设内容。

- [ ] **Step 4: 验证中英文 README 项目结构一致**

Run: `grep -A4 "work-skills/" README.md README.zh.md`
Expected: 两文件均含 claude-notify/、installer/、docs/、README.md 4 行。

- [ ] **Step 5: Commit**

```bash
git add README.zh.md
git commit -m "docs(readme-zh): include installer/ and docs/ in project structure"
```

---

### Task 7: 全量验证 + 跨文档链接核对

**Files:**
- 无文件改动 (纯验证任务)

- [ ] **Step 1: 验证 SKILL.md 当前使用说明无 marketplace 对比措辞**

Run: `grep -niE "marketplace" claude-notify/SKILL.md`
Expected: 空 (无输出)。

- [ ] **Step 2: 验证 installer 已在 SKILL.md + setup.md 文档化**

Run: `grep -rn "@allanpk716/work-skills-setup" claude-notify/SKILL.md claude-notify/references/setup.md`
Expected: 至少 2 处命中 (SKILL.md 备选节 + setup.md 引导式安装节)。

- [ ] **Step 3: 验证 changelog.md 未被误改 (历史保留)**

Run: `grep -ciE "marketplace" claude-notify/references/changelog.md`
Expected: 非零 (历史 v2.0.0 条目保留)。这与 SKILL.md 的"无 marketplace"不冲突 — changelog 是历史记录,保留正确。

- [ ] **Step 4: 核对 SKILL.md ↔ references/ 跨文档链接可解析**

逐一核对 SKILL.md 参考文档表中的链接目标存在:
Run: `for f in setup faq technical changelog commands; do test -f "claude-notify/references/$f.md" && echo "OK: $f.md" || echo "MISSING: $f.md"; done`
Expected: 全部 OK。

核对 setup.md 顶部"返回 [SKILL.md](../SKILL.md)"链接:
Run: `test -f claude-notify/SKILL.md && echo "back-link OK"`
Expected: OK。

- [ ] **Step 5: 核对 SKILL.md 新增的 setup.md"引导式安装"链接锚点存在**

Run: `grep -c "引导式安装" claude-notify/references/setup.md`
Expected: ≥1 (Task 4 加的节标题)。

- [ ] **Step 6: 验证无代码改动 (claude-notify 脚本 / installer / package.json 未动)**

Run: `git diff --stat HEAD~7..HEAD -- claude-notify/hooks claude-notify/scripts installer/src installer/package.json package.json 2>/dev/null | tail -1`
Expected: 空 (本计划 7 个 commit 全是 docs/,无代码改动)。若非空,说明有越界代码改动,回滚。

- [ ] **Step 7: 若全部通过,无需额外 commit (本任务为纯验证)**

若有任何步骤失败,定位是哪个 Task 的问题,回到该 Task 修复。

---

## Self-Review

**1. Spec coverage:**
- SKILL.md marketplace 清理 → Task 1 (Step 1) + Task 2 (Step 4) ✓
- installer 备选文档化 (SKILL.md) → Task 3 ✓
- setup.md 引导式安装节 → Task 4 ✓
- 根 README 项目结构 (installer/ + docs/) → Task 5 (EN) + Task 6 (ZH) ✓
- changelog 不改 → Task 7 Step 3 验证未误改 ✓ (无修改任务,即不改)
- 跨文档链接验证 → Task 7 Step 4-5 ✓
- 无代码改动 → Task 7 Step 6 验证 ✓
- 所有 spec 条目覆盖,无 gap。

**2. Placeholder scan:** 无 TBD/TODO。每个 Edit 步骤给出精确 old_string/new_string。Task 6 Step 3 提示"先读取原文再匹配"是因为中文注释可能有变体,这是务实的精度保障而非占位符。✓

**3. Type consistency:** 文件路径一致 (`claude-notify/SKILL.md`、`claude-notify/references/setup.md`、`README.md`、`README.zh.md`)。installer 包名 `@allanpk716/work-skills-setup` 全文一致。链接 `references/setup.md` 的"引导式安装"锚点在 Task 3 引用、Task 4 创建 — 顺序正确 (Task 4 在 Task 3 之后,但链接在两个文件都存在后即解析;Task 7 Step 5 最终验证)。✓
