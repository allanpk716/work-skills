# Architecture

**Analysis Date:** 2026-02-24

## Pattern Overview

**Overall:** Plugin-based skills collection

**Key Characteristics:**
- Claude Code plugin marketplace system
- Markdown-based skill definitions
- Organized by functional categories
- Frontmatter metadata for skill configuration
- Cross-platform Windows optimization

## Layers

**Plugin Layer:**
- Purpose: Defines plugin marketplace configuration and categorization
- Location: `[.claude-plugin/marketplace.json]`
- Contains: Plugin metadata, skill definitions, ownership information
- Depends on: Claude Code runtime
- Used by: Claude Code plugin system

**Skill Definition Layer:**
- Purpose: Individual skill implementations with structured metadata
- Location: `[skills/windows-git-commit/SKILL.md]`
- Contains: Frontmatter metadata, objective, workflow, agent configuration
- Depends on: Task tool, Bash agent execution
- Used by: Claude Code skill invocation

**Command Alias Layer:**
- Purpose: Provides short slash commands for quick skill access
- Location: `[.claude/commands/wgc.md]`
- Contains: Command description, argument hints, allowed tools
- Depends on: Underlying skill implementation
- Used by: User command input

**Documentation Layer:**
- Purpose: User guides, project structure, and development documentation
- Location: `[docs/PROJECT_STRUCTURE.md]`, `[docs/HOW_TO_ADD_NEW_SKILL.md]`
- Contains: Setup instructions, usage examples, development guidelines
- Depends on: None
- Used by: Developers and end users

## Data Flow

**Skill Invocation Flow:**

1. **User Input**: User invokes skill via slash command or direct skill name
2. **Command Resolution**: Claude Code resolves command to skill definition
3. **Metadata Extraction**: Frontmatter is parsed from SKILL.md
4. **Agent Configuration**: Bash agent is configured with workflow instructions
5. **Subagent Execution**: Task tool launches background bash agent
6. **Git Operations**: Environment detection, SSH config, commit/push workflow
7. **Result Processing**: Output is summarized and returned to user
8. **Context Preservation**: Main conversation context remains clean

**State Management:**
- No persistent state between skill invocations
- Configuration stored in git global settings
- Environment state detected at runtime
- Subagent execution is stateless

## Key Abstractions

**Skill Abstraction:**
- Purpose: Represents a reusable automation capability
- Examples: `[skills/windows-git-commit/SKILL.md]`
- Pattern: Markdown with frontmatter metadata

**Plugin Abstraction:**
- Purpose: Groups related skills into categories
- Examples: `[.claude-plugin/marketplace.json]`
- Pattern: JSON configuration with skill arrays

**Command Abstraction:**
- Purpose: Provides user-friendly command aliases
- Examples: `[.claude/commands/wgc.md]`
- Pattern: Markdown with tool restrictions and argument hints

## Entry Points

**Primary Entry Point:**
- Location: `[skills/windows-git-commit/SKILL.md]`
- Triggers: `/windows-git-commit` skill invocation
- Responsibilities: Git workflow automation with SSH configuration

**Command Entry Point:**
- Location: `[.claude/commands/wgc.md]`
- Triggers: `/wgc` command invocation
- Responsibilities: Delegates to windows-git-commit skill

**Documentation Entry Point:**
- Location: `[README.md]`, `[README.zh.md]`
- Triggers: User discovery and installation
- Responsibilities: Project overview and setup instructions

## Error Handling

**Strategy:** Comprehensive error handling with clear user feedback

**Patterns:**
- Environment validation checks SSH client and Pageant status
- Git operation error handling with suggested fixes
- Path format validation for Windows compatibility
- Timeout handling for long-running operations
- Subagent isolation prevents main context contamination

## Cross-Cutting Concerns

**Logging:** Command execution output is summarized in subagent
**Validation:** Environment prerequisites checked before execution
**Authentication:** SSH key management via Pageant and plink configuration
**Platform:** Windows-specific path handling and Git Bash compatibility

---

*Architecture analysis: 2026-02-24*