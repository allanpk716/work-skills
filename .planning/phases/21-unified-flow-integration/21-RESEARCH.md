# Phase 21: Unified Flow Integration - Research

**Researched:** 2026-03-29
**Domain:** Installer configurator orchestration, flow unification
**Confidence:** HIGH

## Summary

Phase 21 的目标是让安装器的配置步骤在首次安装和重复运行时都能自动适配，用户无需关心安装模式。经过详细代码分析，Phase 20 已经为每个配置器（pushover.js、git-user.js）实现了逐项检测和 Confirm 交互。Phase 21 的核心工作不是添加新检测逻辑，而是验证端到端流程的正确性，并可能需要对 `configurators/index.js` 的编排层做微调。

当前状态分析：
- **pushover.js**: 4 种情况完整覆盖（both/only token/only user/neither），每种情况有独立的 Confirm + Input 交互
- **git-user.js**: 4 种情况完整覆盖（both/only name/only email/neither），有 Confirm + unified save
- **git-ssh.js**: 已配置时直接返回，未配置时显示 guidance + skip 确认
- **configurators/index.js**: `runAllConfigurators()` 按顺序串联三个配置器，收集 results 显示 summary

**Primary recommendation:** Phase 21 是一个验证+集成测试阶段。主要工作是（1）编写端到端集成测试覆盖三种场景（全新安装/重复运行全部跳过/部分配置），（2）如果集成测试发现问题则修复。不需要新增检测逻辑或新的交互模式。

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UFLOW-01 | Fresh install (no existing config) proceeds with full configuration prompts, no detection overhead | 当前代码已支持：pushover.js Case D 直接走 Input 流程；git-user.js Case D 直接走 name+email Input 流程；git-ssh.js 显示 guidance + skip 确认。集成测试需验证无 Confirm 跳过提示出现在全新安装路径中 |
| UFLOW-02 | Re-run (existing config detected) checks each item and asks user skip/update per item, adapting automatically | Phase 20 已实现逐项 Confirm：pushover.js Cases A/B/C，git-user.js Cases A/B/C。集成测试需验证端到端流程正确处理全部已配置/部分配置场景 |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| execa | ^5.1.1 | 执行外部命令（reg query, git config, setx） | 项目统一使用 execa，Phase 20 已验证 reg query 和 git config 调用 |
| enquirer | ^2.4.1 | Confirm/Input 交互提示 | 项目统一使用 enquirer，Phase 20 Confirm 交互已验证 |
| chalk | ^4.1.2 | 彩色终端输出 | 项目统一使用 |
| jest | ^30.3.0 | 测试框架 | 项目测试框架，配置器测试使用 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js assert | built-in | 现有配置器测试使用 | 现有测试文件使用 assert + 自执行函数模式，非 Jest describe/it |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 自执行测试脚本 | Jest describe/it | Jest 格式更标准，但现有 pushover.test.js 和 git-user.test.js 使用自执行模式。Phase 21 测试应遵循现有格式保持一致 |

**Installation:**
```bash
# 无需安装新依赖 -- 所有需要的库已安装
```

**Version verification:** 所有库版本来自 installer/package.json，已确认安装。

## Architecture Patterns

### Current Code Structure
```
installer/src/configurators/
  index.js              # 编排层：runAllConfigurators() 串联三个配置器
  pushover.js           # Pushover 配置器：detectPushoverFull() + configurePushover() 4-case
  git-user.js           # Git 用户配置器：detectGitUser() + configureGitUser() 4-case
  git-ssh.js            # Git SSH 配置器：detectGitSSH() + configureGitSSH()
installer/src/
  index.js              # 主入口：8 步流程（platform -> args -> welcome -> detect -> install -> config -> marketplace -> verify）
  cli.js                # 命令行参数解析（--verify, --lang, --no-color）
installer/tests/configurators/
  pushover.test.js      # 9 个测试，自执行脚本模式
  git-user.test.js      # 8 个测试，自执行脚本模式
  git-ssh.test.js       # Git SSH 测试
```

### Pattern 1: 逐项配置器自适应流程
**What:** 每个配置器内部根据检测结果自动选择路径：全部已有 -> Confirm 全部保留 -> 全部缺失 -> 直接输入 -> 部分有 -> 逐项 Confirm/Input
**When to use:** 这是 Phase 20 建立的核心模式，Phase 21 需验证端到端正确性
**Example:**
```javascript
// pushover.js configurePushover() 的 4-case 逻辑：
// Case A: token && user -> Confirm "keep?" -> Y: return configured / N: fall through to input
// Case B: token && !user -> Confirm "keep token?" + Input user
// Case C: !token && user -> Confirm "keep user?" + Input token
// Case D: !token && !user -> Confirm "configure?" + Input both + validate + save

// git-user.js configureGitUser() 的 4-case 逻辑：
// Case A: name && email -> Confirm "keep?" -> Y: return configured / N: fall through to input
// Case B: name && !email -> Confirm "keep name?" + Input email
// Case C: !name && email -> Confirm "keep email?" + Input name
// Case D: !name && !email -> direct Input both + unified save
```

### Pattern 2: 编排层串联 (configurators/index.js)
**What:** `runAllConfigurators()` 按顺序调用每个配置器，收集结果，显示 summary 表格
**When to use:** 这是配置器的入口，Phase 21 需验证此层不需要额外逻辑
**Example:**
```javascript
// configurators/index.js runAllConfigurators()
// Step 1: Pushover (optional) -> configurePushover()
// Step 2: Git SSH (optional) -> configureGitSSH()
// Step 3: Git user (required) -> configureGitUser()
// Step 4: displayConfigSummary(results)
```

### Pattern 3: 检测优先的设计
**What:** 每个配置器的 configure*() 函数在开始时先调用 detect*()，根据检测结果决定后续路径。不需要外部传入"是否首次安装"的状态。
**When to use:** 这是 Phase 20 建立的自适应模式。配置器自己检测环境，自己决定交互流程。

### Anti-Patterns to Avoid
- **不要在编排层添加"安装模式"判断**: configurators/index.js 不应该判断"首次安装"还是"重新运行"。每个配置器自己通过 detect*() 函数做检测，自己决定交互路径。在编排层添加模式判断会引入状态管理复杂度且无必要。
- **不要添加全局"全部跳过"提示**: 当所有配置都存在时，不需要在 runAllConfigurators() 层面添加一个"全部已配置，跳过所有？"的 Confirm。每个配置器自己的 Confirm 已经足够，且更灵活（用户可以保留 Pushover 但更新 Git user）。
- **不要改变现有配置器的检测逻辑**: Phase 20 已验证的 4-case 逻辑不需要修改。Phase 21 的任何修改应限于编排层和测试。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 配置检测 | 新的检测函数 | 现有 detectPushoverFull() / detectGitUser() | Phase 20 已实现双源检测和 git config 检测 |
| Confirm 交互 | 新的跳过/更新提示 | 现有 Confirm + initial: true | Phase 20 已实现逐项 Confirm 模式 |
| 配置持久化 | 新的保存逻辑 | 现有 setEnvVariable() / execa git config | 已有错误处理和 process.env 更新 |

**Key insight:** Phase 21 是集成和验证阶段，不是功能开发阶段。所有检测和交互逻辑已在 Phase 20 完成。Phase 21 的价值在于确保端到端流程在各种场景下正确工作。

## Common Pitfalls

### Pitfall 1: 过度设计 -- 在编排层添加"安装模式"
**What goes wrong:** 在 runAllConfigurators() 中添加 firstRun/reRun 判断逻辑，增加不必要的状态管理
**Why it happens:** 认为"统一流程"需要一个显式的模式切换
**How to avoid:** 当前设计已经统一 -- 每个配置器内部自适应。不需要编排层的模式判断。配置器的 detect*() 就是"自动适配"的实现。
**Warning signs:** runAllConfigurators() 开始添加 isFreshInstall 参数

### Pitfall 2: 端到端测试不覆盖"全部跳过"场景
**What goes wrong:** 只测试了全新安装场景，忘记测试"所有配置都存在且用户全部选择跳过"的场景
**Why it happens:** 开发环境通常有部分配置存在，全新安装场景容易想到，全部已配置+全部跳过的场景容易被忽略
**How to avoid:** 集成测试必须覆盖三个核心场景：(1) 全新安装 -- 全部走输入流程，(2) 重复运行全部跳过 -- 所有配置已存在，用户全部按 Y，(3) 部分配置 -- 混合场景
**Warning signs:** 集成测试只验证了"至少一个配置器需要输入"的情况

### Pitfall 3: 忽略 git-ssh.js 的非对称行为
**What goes wrong:** git-ssh.js 检测到已配置时直接返回，没有 Confirm 提示（和 pushover/git-user 不同），可能遗漏测试
**Why it happens:** git-ssh.js 的"已配置"路径不使用 enquirer，容易被忽略
**How to avoid:** git-ssh.js configureGitSSH() 在已配置时直接 return { status: 'configured' }，这是正确行为 -- SSH 配置不是通过安装器设置的，不需要跳过/更新交互。测试应覆盖此路径。
**Warning signs:** 集成测试假设所有配置器在"已配置"时都弹 Confirm

### Pitfall 4: 测试中直接调用 configure*() 导致交互挂起
**What goes wrong:** 集成测试直接调用 configurePushover() 或 configureGitUser()，因为 enquirer 需要终端输入导致测试挂起
**Why it happens:** Phase 20 的 git-user.test.js 就有这个问题（Tests 4-5 挂起），后来改为验证函数签名而非直接调用
**How to avoid:** 集成测试应 mock enquirer 的 Confirm 和 Input，或者测试编排层逻辑而非交互式配置器内部逻辑。也可以通过验证 runAllConfigurators() 的 results 数组来判断行为正确性，而不直接触发交互。
**Warning signs:** 测试运行时 hang 住，没有输出

### Pitfall 5: 误判 Phase 21 需要大量新代码
**What goes wrong:** 认为 Phase 21 需要重写编排层或添加新的流程控制逻辑
**Why it happens:** 需求描述"统一流程"听起来像需要新的架构
**How to avoid:** 仔细阅读成功标准后会发现，Phase 20 已经为每个配置器实现了统一的自适应流程。Phase 21 的工作是验证集成正确性，不是添加新功能。计划应以测试为主，以可能的小修复为辅。

## Code Examples

### 当前 runAllConfigurators() 编排逻辑
```javascript
// Source: installer/src/configurators/index.js
async function runAllConfigurators() {
  const results = [];

  // 1. Pushover (optional)
  console.log(chalk.bold('\n' + t('config.section.pushover')));
  const pushoverResult = await configurePushover();
  results.push({ name: 'Pushover', status: pushoverResult.status, details: pushoverResult.details });

  // 2. Git SSH (optional)
  console.log(chalk.bold('\n' + t('config.section.gitSSH')));
  const sshResult = await configureGitSSH();
  results.push({ name: 'Git SSH', status: sshResult.status, details: sshResult.details });

  // 3. Git user.info (required)
  console.log(chalk.bold('\n' + t('config.section.gitUser')));
  const userResult = await configureGitUser();
  results.push(
    { name: 'Git user.name', status: userResult.status, details: userResult.name },
    { name: 'Git user.email', status: userResult.status, details: userResult.email }
  );

  // Display summary
  displayConfigSummary(results);
}
```

### 检测函数的返回格式
```javascript
// Pushover 检测
const pushover = await detectPushoverFull();
// => { token: string|null, user: string|null }

// Git user 检测
const gitUser = await detectGitUser();
// => { name: string|null, email: string|null }

// Git SSH 检测
const gitSSH = await detectGitSSH();
// => { configured: boolean, command: string|null }
```

### 配置器返回格式
```javascript
// 所有配置器返回统一格式
{ status: 'configured' | 'skipped' | 'failed', details: string }

// git-user.js 额外返回 name 和 email
{ status: 'configured', name: string, email: string }
```

### 集成测试场景矩阵
```javascript
// 场景 1: 全新安装 (UFLOW-01)
// 前提: process.env 无 PUSHOVER_*, 注册表无 PUSHOVER_*, git config 无 user.*
// 预期:
//   pushover -> Case D: "Configure Pushover?" prompt -> Input token + user
//   git-ssh  -> guidance + skip prompt
//   git-user -> Case D: direct Input name + email
//   无 "Keep current config?" / "skip/update" 提示

// 场景 2: 全部已配置 (UFLOW-02 全部跳过)
// 前提: PUSHOVER_TOKEN + PUSHOVER_USER 已 setx, git config user.name + user.email 已设, core.sshCommand 已设
// 预期:
//   pushover -> Case A: "Keep current Pushover config?" -> Y -> instant return
//   git-ssh  -> instant return (no prompt)
//   git-user -> Case A: "Keep current Git user config?" -> Y -> instant return
//   全部 Y 后配置步骤瞬间完成

// 场景 3: 部分配置 (UFLOW-02 自适应)
// 前提: PUSHOVER_TOKEN 有但 PUSHOVER_USER 无, git config 有 name 无 email
// 预期:
//   pushover -> Case B: "Keep token?" -> Y -> Input user -> validate -> save
//   git-user -> Case B: "Keep name?" -> Y -> Input email -> save
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 无检测，每次运行都重新配置 | 每个配置器内部检测+自适应交互 | Phase 20 | 安装器自动适配首次/重复运行 |

**Deprecated/outdated:**
- Phase 17 的 pushover.js `promptReconfigure` 模式：Phase 20 重写为 4-case 逐项处理，旧的单一 Confirm 已被替换
- Phase 17 的 git-user.js 直接返回模式：Phase 20 添加了 Confirm 交互

## Open Questions

1. **Phase 21 是否需要修改任何源代码**
   - What we know: Phase 20 已实现逐项检测和 Confirm 交互。configurators/index.js 编排层不需要模式判断。三种成功场景在当前代码中理论上是正确的。
   - What's unclear: 端到端集成测试是否会发现边缘问题
   - Recommendation: 先编写集成测试验证三种场景。如果测试全部通过，Phase 21 可能只需要测试代码和文档更新。

2. **集成测试的策略**
   - What we know: 现有测试使用自执行脚本 + assert 模式。直接调用 configure*() 会导致 enquirer 交互挂起。
   - What's unclear: 是否需要引入 mock/stub 机制来测试编排层
   - Recommendation: 集成测试可以通过 mock enquirer 的 Confirm.run() 和 Input.run() 来测试完整流程，或者通过验证 detect*() 函数 + 模拟 results 数组来间接验证编排逻辑。

3. **成功标准 #1 "零检测开销" 的严格程度**
   - What we know: 全新安装时 pushover.js 仍会调用 detectPushoverFull() 执行 2 次 reg query（找到 nothing，快速失败）。这增加约 100-200ms 延迟。
   - What's unclear: "零检测开销"是否意味着不应有任何检测调用，还是指不应有不必要的用户提示
   - Recommendation: "零检测开销"应理解为"不应有不必要的跳过/更新提示出现在全新安装路径中"。检测调用本身是必要的（用于判断是首次还是重复运行），不应被移除。

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified beyond existing project tooling)

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | 运行时 | Yes | 22.14.0 | -- |
| reg.exe (Windows) | 注册表读取 | Yes | Windows built-in | -- |
| git.exe | git config | Yes | -- | -- |
| Jest | 测试框架 | Yes | 30.3.0 | -- |

**Missing dependencies with no fallback:**
- None

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 (现有自执行测试脚本) |
| Config file | installer/jest.config.js |
| Quick run command | `cd installer && node tests/configurators/pushover.test.js && node tests/configurators/git-user.test.js` |
| Full suite command | `cd installer && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UFLOW-01 | 全新安装走完整配置流程，无 skip/update 提示 | integration | `cd installer && node tests/configurators/unified-flow.test.js` | Wave 0 (需创建) |
| UFLOW-02 | 重复运行逐项检测并提供 skip/update | integration | `cd installer && node tests/configurators/unified-flow.test.js` | Wave 0 (需创建) |

### Sampling Rate
- **Per task commit:** `cd installer && node tests/configurators/pushover.test.js && node tests/configurators/git-user.test.js`
- **Per wave merge:** `cd installer && npm test`
- **Phase gate:** Full suite green + unified-flow integration tests pass

### Wave 0 Gaps
- [ ] `installer/tests/configurators/unified-flow.test.js` -- 集成测试：验证三种场景（全新安装/全部跳过/部分配置）的端到端流程
- [ ] 可能需要 mock 机制来避免 enquirer 交互挂起

*(注：现有 pushover.test.js 和 git-user.test.js 覆盖了单元级别的检测和交互逻辑，Phase 21 新增的是编排层集成测试)*

## Sources

### Primary (HIGH confidence)
- 实际代码审查：`installer/src/configurators/pushover.js`（363行）、`git-user.js`（137行）、`index.js`（78行）、`git-ssh.js`（84行）
- Phase 20 验证报告：`20-VERIFICATION.md`（9/9 truths verified, PASSED）
- Phase 20 Summary：`20-01-SUMMARY.md`、`20-02-SUMMARY.md`
- 实际环境测试：在当前系统运行 detect*() 函数验证返回值

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` -- UFLOW-01/UFLOW-02 需求定义
- `.planning/ROADMAP.md` -- Phase 21 成功标准
- `.planning/phases/20-config-detection-smart-interaction/20-RESEARCH.md` -- Phase 20 研究参考

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- 所有库已安装，Phase 20 已验证
- Architecture: HIGH -- 代码结构清晰，4-case 逻辑已在 Phase 20 实现和验证
- Pitfalls: HIGH -- 基于 Phase 20 实际遇到的问题（test 4-5 挂起）和代码分析
- Integration completeness: HIGH -- 端到端流程分析确认现有代码已覆盖 UFLOW-01 和 UFLOW-02 的核心行为

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable -- 无外部依赖变化风险)
