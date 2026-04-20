# Windows Git Commit 技能修复 - Bash 代理错误

## 修复日期
2026-03-01

## 问题描述
使用 `/windows-git-commit` 斜杠命令时出现错误:
```
Error: Agent type 'Bash' not found.
```

虽然 Git 提交仍然成功,但错误提示影响用户体验。

## 根本原因
技能文件 `SKILL.md` 中错误地将 `Bash` 用作 Task 工具的 `subagent_type` 参数。Bash 是一个独立的工具,不是有效的子代理类型。

### 错误位置
1. 第 489 行: `<subagent_type>Bash</subagent_type>`
2. 第 603-607 行: instructions 部分中的 Task 工具调用说明

## 解决方案
将 Task 工具调用改为直接使用 Bash 工具,利用其原生的 `run_in_background: true` 参数。

## 修改内容

### 1. 更新 description (第 3 行)
```yaml
# 修改前
description: ...executes operations in a subagent to preserve context...

# 修改后
description: ...executes operations in background to preserve context...
```

### 2. 更新 objective (第 7 行)
```yaml
# 修改前
...executes all Git operations in a subagent context...

# 修改后
...executes all Git operations in the background...
```

### 3. 更新 context 部分 (第 101-113 行)
```yaml
# 修改前
- Running in a subagent to preserve main conversation context
**Subagent Benefits:**

# 修改后
- Running in the background to preserve main conversation context
**Background Execution Benefits:**
```

### 4. 重写 workflow 部分 (第 115-134 行)
```yaml
# 修改前
This skill uses the Task tool to launch a Bash agent...
1. **Launch Subagent**: Start a bash agent with run_in_background=true
**Why subagent?**

# 修改后
This skill uses the Bash tool directly to execute all Git operations...
1. **Execute Git Workflow**: Run bash commands with run_in_background=true
**Why background execution?**
```

### 5. 重写 bash_workflow 部分 (原 agent_configuration,第 485-492 行)
```yaml
# 修改前
<agent_configuration>
**Launch the agent with these parameters:**
```xml
<subagent_type>Bash</subagent_type>
...

# 修改后
<bash_workflow>
**Execute the following Git workflow using the Bash tool with run_in_background=true:**
```

### 6. 移除 XML 配置结尾 (第 589-596 行)
```yaml
# 移除
</prompt>
<run_in_background>true</run_in_background>
</agent_configuration>
```

**Access results using TaskOutput tool.**

# 修改后
</bash_workflow>
```

### 7. 重写 instructions 部分 (第 598-609 行)
```yaml
# 修改前
2. **Launch the subagent** using Task tool with:
   - subagent_type: "Bash"
   - description: "..."
   - prompt: The full workflow instructions
   - run_in_background: true
3. **Get the task_id** from the Task result
4. **Wait for completion** using TaskOutput with:
   - task_id: from step 3
   - block: true
   - timeout: 120000

# 修改后
2. **Execute the Git workflow** using Bash tool with:
   - command: The full bash script from the <bash_workflow> section
   - description: "Configure SSH and execute Git commit/push"
   - run_in_background: true
   - timeout: 120000
3. **Get the output_file path** from the Bash tool result
4. **Wait for completion** by reading the output file or using tail command
```

### 8. 更新 implementation_notes (第 825-852 行)
```yaml
# 修改前
2. Construct the prompt for the Bash subagent with:
3. Launch Task tool with run_in_background=true
4. Use TaskOutput to get results

# 修改后
2. Construct the bash command with:
3. Execute Bash tool with run_in_background=true
4. Read the output file to get results
```

### 9. 更新 success_criteria (第 810-822 行)
```yaml
# 修改前
- Subagent returns without errors

# 修改后
- Bash command returns without errors
```

## 功能验证

### 预期结果
修复后,技能应该:
- ✅ 不再出现 "Agent type 'Bash' not found" 错误
- ✅ 在后台执行所有 Git 操作
- ✅ 自动配置 SSH 环境(TortoisePlink + Pageant)
- ✅ 执行安全扫描(如果启用)
- ✅ 返回简洁的中文摘要
- ✅ 保持主对话上下文清洁

### 测试步骤
1. 使用 `/windows-git-commit` 命令
2. 验证不再出现代理类型错误
3. 验证 Git 提交和推送正常工作
4. 验证后台执行和结果返回正常
5. 验证中文摘要输出正确

## 技术细节

### Bash 工具后台执行
```yaml
Bash:
  command: |
    # 完整的 bash 脚本
  description: "Git commit and push"
  run_in_background: true
  timeout: 120000
```

### 获取后台任务结果
- Bash 工具返回 `output_file` 路径
- 可以使用 Read 工具读取输出文件
- 或使用 `tail -f` 等待完成

## 影响范围
- 仅影响 `windows-git-commit` 技能
- 不影响其他插件或技能
- 不影响 Git 仓库数据
- 保持所有现有功能不变

## 风险评估
**风险**: 低
- 只是改变调用方式,不改变核心逻辑
- Bash 工具的 `run_in_background` 参数完全支持当前需求
- 如果出现问题,可以轻松回滚

## 相关文档
- [插件版本管理文档](../plugin-version-management.md)
- [原始修复计划](../../.claude/plans/groovy-moseying-sketch.md)
