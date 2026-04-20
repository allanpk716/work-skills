# S01: Worktree

**Goal:** 为 flags.
**Demo:** 为 flags.

## Must-Haves


## Tasks

- [x] **T01: 31-worktree 01** `est:7min`
  - 为 flags.py 新增 git 分支检测函数 get_git_branch()、共享标题构建函数 build_notification_title(),并修复 find_project_root() 在 git worktree 场景下的兼容性问题。

Purpose: WTREE-01 要求通知标题包含 git 分支名,需要可靠的分支检测函数和统一的标题构建逻辑。将标题构建集中在 flags.py 中 (而非分散在 notify.py 和 notify-attention.py 中) 消除 DRY 违反 (review concern HIGH)。同时修复 find_project_root() 的 pre-existing bug (worktree 中 .git 是文件导致检测失败),确保分支检测和项目名识别在 worktree 场景下都正确。

Output: flags.py 新增 get_git_branch()、build_notification_title() 并修复 find_project_root(); test_flags.py 新增完整测试覆盖。
- [x] **T02: 31-worktree 02** `est:6min`
  - 修改 notify.py 和 notify-attention.py 的通知标题格式,使用 flags.py 中共享的 build_notification_title() 函数添加 git 分支名以支持 worktree 场景区分;确认 notify-attention.py 的 session_id 展示满足 WTREE-02。

Purpose: 用户在多个 worktree 并行工作时,从通知标题即可区分来源项目和分支。两个脚本共用 flags.py 的 build_notification_title() 消除 DRY 违反 (review HIGH concern)。Attention 通知中的 session_id 帮助用户定位需要关注的具体会话。

Output: 两个通知脚本的标题格式从 [project] 升级为 [project:branch];两个脚本都 import 共享的 build_notification_title() 而不是各自维护标题构建逻辑;新增测试覆盖标题格式和 session_id。

## Files Likely Touched

- `plugins/claude-notify/hooks/scripts/flags.py`
- `plugins/claude-notify/tests/test_flags.py`
- `plugins/claude-notify/hooks/scripts/notify.py`
- `plugins/claude-notify/hooks/scripts/notify-attention.py`
- `plugins/claude-notify/tests/test_notify.py`
