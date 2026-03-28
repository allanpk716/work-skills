# Milestones

## v1.3 智能配置检测 (In Progress)

**Phases:** 20-21
**Goal:** 安装器在配置步骤中自动检测已有配置，避免重复输入，提升重复运行体验

**Target features:**
- 检测 Pushover 凭证 (PUSHOVER_API_KEY, PUSHOVER_USER_KEY) 是否已持久化
- 检测 Git 用户信息 (user.name, user.email) 是否已配置
- 检测到已有配置时显示当前值并询问跳过还是重新输入
- 首次安装和更新运行统一流程，自动适配

---

## v1.2 Installer - NPX Installation Experience (Shipped: 2026-03-28)

**Phases completed:** 7 phases, 17 plans, 43 tasks

**Key accomplishments:**

- NPX installer -- `npx @allanpk716/work-skills-setup` one-command installation with Windows detection, bilingual support, CLI options
- Environment detection -- parallel detection of Python/Git/SSH/pip packages with clear status reports and installation guidance
- Python dependency auto-install -- interactive pip install with --user flag, permission/network/pip error detection
- Interactive configuration -- Pushover credential validation, Git SSH configuration, Git user info setup
- Claude Code marketplace integration -- register marketplace source, discover plugins, interactive multi-select installation
- Installation verification -- post-install auto-verification, --verify standalone rerun, pass/fail report

---

## v1.1 Windows Git Commit Security Scanning (Shipped: 2026-02-27)

**Phases completed:** 12 phases, 21 plans, 7 tasks

**Key accomplishments:**

- (none recorded)

---
