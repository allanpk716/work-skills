# Codebase Structure

**Analysis Date:** 2026-02-24

## Directory Layout

```
work-skills/
├── .claude/                      # Claude Code specific files
│   └── commands/                 # Slash command definitions
│       └── wgc.md               # /wgc command alias
├── .claude-plugin/               # Plugin marketplace configuration
│   └── marketplace.json         # Plugin registration and metadata
├── .planning/                    # Project planning documents (generated)
│   └── codebase/                 # Codebase analysis documents
├── docs/                         # Project documentation
│   ├── HOW_TO_ADD_NEW_SKILL.md  # Skill development guide
│   └── PROJECT_STRUCTURE.md      # Architecture overview
├── skills/                       # Skill implementations
│   └── windows-git-commit/       # Git automation skill
│       └── SKILL.md             # Skill definition and implementation
├── CHANGELOG.md                 # Version history
├── LICENSE                       # MIT License
├── README.md                    # English documentation
└── README.zh.md                 # Chinese documentation
```

## Directory Purposes

**`.claude/commands/`:**
- Purpose: Define slash command aliases for quick skill access
- Contains: Markdown files with command metadata
- Key files: `[wgc.md]` - Windows Git commit shortcut

**`.claude-plugin/`:**
- Purpose: Configure Claude Code plugin marketplace integration
- Contains: JSON configuration file
- Key files: `[marketplace.json]` - Plugin registration and skill definitions

**`docs/`:**
- Purpose: Project documentation and development guides
- Contains: Markdown files with setup instructions and architecture docs
- Key files: `[HOW_TO_ADD_NEW_SKILL.md]`, `[PROJECT_STRUCTURE.md]`

**`skills/`:**
- Purpose: Individual skill implementations
- Contains: Directories with SKILL.md files
- Key files: `[windows-git-commit/SKILL.md]` - Core skill implementation

## Key File Locations

**Entry Points:**
- `[skills/windows-git-commit/SKILL.md]`: Main Git automation skill
- `[.claude/commands/wgc.md]`: Quick command alias
- `[README.md]`: Project overview and installation

**Configuration:**
- `[.claude-plugin/marketplace.json]`: Plugin marketplace configuration
- `[docs/HOW_TO_ADD_NEW_SKILL.md]`: Development guidelines

**Documentation:**
- `[docs/PROJECT_STRUCTURE.md]`: Architecture documentation
- `[README.zh.md]`: Chinese documentation

## Naming Conventions

**Files:**
- Skills: `lowercase-with-hyphens/SKILL.md`
- Commands: `lowercase-shortcuts.md`
- Documentation: `UPPERCASE_WITH_UNDERSCORES.md`

**Directories:**
- Skills: `lowercase-with-hyphens/`
- Plugins: `.claude-plugin/`
- Commands: `.claude/commands/`

## Where to Add New Code

**New Skill:**
- Primary code: `skills/new-skill/SKILL.md`
- Tests: Not applicable (skills are tested in real usage)
- Documentation: Update `docs/HOW_TO_ADD_NEW_SKILL.md`, `README.md`, `README.zh.md`

**New Command Alias:**
- Implementation: `.claude/commands/short-name.md`
- Must reference existing skill in `allowed-tools`

**New Plugin Category:**
- Update: `.claude-plugin/marketplace.json`
- Add new plugin object with skills array

## Special Directories

**`.claude/`:**
- Purpose: Claude Code runtime files
- Generated: No (committed)
- Committed: Yes

**`.claude-plugin/`:**
- Purpose: Plugin marketplace configuration
- Generated: No (committed)
- Committed: Yes

**`.planning/codebase/`:**
- Purpose: Generated architecture and structure analysis
- Generated: Yes (by GSD tools)
- Committed: Yes (for team reference)

**`skills/`:**
- Purpose: Skill implementations
- Generated: No (committed)
- Committed: Yes

---

*Structure analysis: 2026-02-24*