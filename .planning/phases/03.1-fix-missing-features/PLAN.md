# PLAN: 合并 Phase 2 功能到插件版本

**Phase:** 3.1 - Fix Missing Features
**Plan:** 01
**Depends on:** Phase 2 (Configuration & Diagnostics), Phase 1.1 (Plugin Packaging)
**Created:** 2026-02-25

## Objective

修复里程碑审计发现的 5 个缺失需求,将 Phase 2 实现的功能正确迁移到 Phase 1.1 插件版本。

## Background

### Problem
Phase 1.1 在 2026-02-24T12:54:42Z 完成,但 Phase 2 在 2026-02-24T14:48:22Z 完成。Phase 1.1 复制了 Phase 1 的代码作为插件版本,导致缺少 Phase 2 的所有增强功能。

### Impact
- 5 个 v1 需求未满足 (CONF-02, CONF-03, CONF-04, LOG-03, LOG-04)
- SKILL.md 文档描述了 200+ 行不存在的功能
- verify-installation.py 调用的诊断功能不存在
- 日志文件无限累积

## Requirements to Fix

### CONF-02: 改进的环境变量警告消息
- **Current State:** 插件版本使用简单警告消息
- **Expected:** Phase 2 提交 e9dd22e 的改进警告消息
- **File:** `plugins/claude-notify/hooks/scripts/notify.py`

### CONF-03: 项目级 .no-pushover 文件控制
- **Current State:** 功能不存在
- **Expected:** Phase 2 提交 f983015 的 .no-pushover 检测代码
- **File:** `plugins/claude-notify/hooks/scripts/notify.py`
- **Documentation:** SKILL.md 第 191-260 行

### CONF-04: 项目级 .no-windows 文件控制
- **Current State:** 功能不存在
- **Expected:** Phase 2 提交 f983015 的 .no-windows 检测代码
- **File:** `plugins/claude-notify/hooks/scripts/notify.py`
- **Documentation:** SKILL.md 第 191-260 行

### LOG-03: 自动日志清理
- **Current State:** 功能不存在,日志无限累积
- **Expected:** Phase 2 提交 3c6541f 的 cleanup_old_logs() 函数
- **File:** `plugins/claude-notify/hooks/scripts/notify.py`
- **Documentation:** SKILL.md 第 538-540 行

### LOG-04: 诊断工具
- **Current State:** --diagnose 标志不存在
- **Expected:** Phase 2 提交 495477d 的诊断功能
- **File:** `plugins/claude-notify/hooks/scripts/notify.py`
- **Documentation:** SKILL.md 第 345, 716 行

## Implementation Strategy

### Option A: Git Extraction (Recommended)

从 git 历史提取 Phase 2 完整实现:

```bash
# Phase 2 最终提交是 495477d
git show 495477d:.claude/hooks/notify.py > plugins/claude-notify/hooks/scripts/notify.py
```

**Pros:**
- 快速,一条命令
- 保证完整性
- 包含所有测试过的代码

**Cons:**
- 可能包含不需要的调试代码
- 需要验证路径和环境变量

### Option B: 手动合并

从 Phase 2 代码提取特定功能并手动合并:

1. 提取 cleanup_old_logs() 函数
2. 提取 .no-pushover / .no-windows 检测代码
3. 提取 argparse 和 --diagnose 标志
4. 提取改进的环境变量错误消息

**Pros:**
- 精确控制合并内容
- 可以清理和优化代码

**Cons:**
- 耗时
- 可能遗漏细节
- 需要额外测试

## Tasks

### Task 1: Extract Phase 2 Complete Implementation
- 从 git 提交 495477d 提取完整的 notify.py
- 替换插件版本的 notify.py
- 验证文件路径和导入正确

### Task 2: Update Path References
- 检查 LOG_DIR 路径是否需要调整
- 验证 APPDATA 环境变量处理
- 确保项目根目录检测正确 (PROJECT_ROOT)

### Task 3: Test All Fixed Features
- 测试 .no-pushover 文件检测
- 测试 .no-windows 文件检测
- 测试 notify.py --diagnose 命令
- 测试日志清理功能
- 验证环境变量警告消息

### Task 4: Update Documentation Status
- 验证 SKILL.md 所有功能示例可执行
- 添加功能状态标记 (✓ Available)
- 更新 README 如果需要

## Files to Modify

1. `plugins/claude-notify/hooks/scripts/notify.py` - 主要修复文件
2. `plugins/claude-notify/skills/claude-notify/SKILL.md` - 验证文档一致性
3. `README.md` - 如果有功能状态需要更新

## Verification

### Success Criteria

1. ✅ cleanup_old_logs() 函数存在并可调用
2. ✅ .no-pushover 文件检测正常工作
3. ✅ .no-windows 文件检测正常工作
4. ✅ notify.py --diagnose 命令输出诊断信息
5. ✅ 环境变量缺失时显示改进的警告消息
6. ✅ 所有 SKILL.md 示例可以执行
7. ✅ verify-installation.py 可以完成验证流程

### Test Commands

```bash
# 测试诊断模式
python plugins/claude-notify/hooks/scripts/notify.py --diagnose

# 测试项目级控制
cd plugins/claude-notify
echo "" > .no-pushover
# 验证 Pushover 通知被跳过

echo "" > .no-windows
# 验证 Windows 通知被跳过

# 测试日志清理
# 检查日志目录中只保留最近 5 天的日志
```

## Risks

1. **Path Compatibility:** Git 提取的代码可能使用 Phase 2 的路径结构
   - **Mitigation:** 验证所有路径引用,调整 PROJECT_ROOT 检测

2. **Environment Variables:** 插件版本可能使用不同的环境变量命名
   - **Mitigation:** 对比 Phase 1.1 和 Phase 2 的环境变量使用

3. **Documentation Mismatch:** SKILL.md 可能描述了更多功能
   - **Mitigation:** 逐行验证文档示例,标记不可用功能

## Estimated Duration

- Task 1 (提取代码): 5 分钟
- Task 2 (更新路径): 5 分钟
- Task 3 (测试功能): 10 分钟
- Task 4 (验证文档): 5 分钟
- **Total:** 25 分钟

## Next Steps

1. 确认使用 Option A (Git 提取) 还是 Option B (手动合并)
2. 执行 Task 1-4
3. 运行完整测试套件
4. 创建 VERIFICATION.md 确认所有需求满足
5. 更新 Phase 1.1 SUMMARY.md 记录问题和修复

---

**Plan Created:** 2026-02-25
**Author:** Claude Code
**Status:** Ready for execution
