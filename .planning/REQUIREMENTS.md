# Requirements: Work Skills — v1.8 通知智能摘要与 Worktree 区分

**Defined:** 2026-04-08
**Core Value:** 为 Windows 开发者提供即开即用的 Claude Code 技能,自动化重复性工作,让开发者专注于创造性任务

## v1 Requirements

Requirements for milestone v1.8. Each maps to roadmap phases.

### Worktree 区分 (WTREE)

- [ ] **WTREE-01**: 通知标题包含 git 分支名，格式如 `[project:branch]`，多 worktree 并行时可区分来源
- [ ] **WTREE-02**: Attention 通知内容包含 session_id，便于追溯是哪个会话需要关注

### LLM 智能摘要 (SUMM)

- [ ] **SUMM-01**: Stop hook 触发时，从 git diff 获取变更内容，调用 OpenAI 兼容 API 生成人类可读的任务完成摘要
- [ ] **SUMM-02**: 三级降级链：LLM API 摘要 → claude --print 摘要 → 静态 fallback 消息，确保任何情况都有通知
- [ ] **SUMM-03**: 新增环境变量 `LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL` 控制摘要行为，无配置时自动降级
- [ ] **SUMM-04**: 安装器交互式配置 LLM API（API key、base URL、model），支持跳过（保持现有行为）
- [ ] **SUMM-05**: LLM API 调用超时控制在 5s 内，确保 Stop hook 整体在 10s 内完成

## v2 Requirements

Deferred to future milestone.

### 增强通知

- **NOTIF-01**: Notification hook（attention）也支持 LLM 增强的上下文摘要
- **NOTIF-02**: 通知内容包含 git diff 统计信息（文件变更数量、增删行数）
- **NOTIF-03**: 用户可自定义 LLM 摘要的 prompt 模板

## Out of Scope

| Feature | Reason |
|---------|--------|
| Pushover 双向回复 | Pushover API 不支持用户文本回复，仅支持确认回执 |
| 非 git 项目的摘要 | git diff 是摘要的核心上下文来源，无 git 时降级到 claude --print |
| 自定义 LLM provider 适配器 | OpenAI 兼容 API 已覆盖主流 provider（OpenAI、DeepSeek、Ollama 等） |
| 摘要结果缓存 | 通知是一次性的，无需缓存 |
| Attention hook 的 LLM 摘要 | 当前 milestone 只增强 Stop hook，Attention hook 后续考虑 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WTREE-01 | — | Pending |
| WTREE-02 | — | Pending |
| SUMM-01 | — | Pending |
| SUMM-02 | — | Pending |
| SUMM-03 | — | Pending |
| SUMM-04 | — | Pending |
| SUMM-05 | — | Pending |

**Coverage:**
- v1 requirements: 7 total
- Mapped to phases: 0
- Unmapped: 7 ⚠️

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after initial definition*
