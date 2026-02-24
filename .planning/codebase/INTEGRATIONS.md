# External Integrations

**Analysis Date:** 2026-02-24

## APIs & External Services

**Version Control:**
- Git - Source control management
- GitHub/Other Git repositories - Remote code hosting
  - SSH Authentication via plink + PPK keys
  - No SDK/Client: Uses native Git CLI

**Skill Distribution:**
- NPM registry - Plugin distribution
  - SDK/Client: NPM CLI
  - Auth: NPM authentication tokens (environment)

## Data Storage

**Databases:**
- None detected (stateless plugin system)
- Configuration stored in Markdown files

**File Storage:**
- Local filesystem only - Skill definitions and configuration
- No external file storage

**Caching:**
- None detected
- Stateless plugin execution

## Authentication & Identity

**Auth Provider:**
- PuTTY Pageant - Windows-specific SSH authentication for Git
  - Implementation: PPK keys loaded into Pageant agent
  - Environment: Pageant.exe must be running

**Plugin Auth:**
- NPM authentication for plugin installation
  - Environment variables: NPM_TOKEN, NPM_REGISTRY

## Monitoring & Observability

**Error Tracking:**
- None detected (basic error handling within skills)
- Error reporting integrated in skill implementation

**Logs:**
- Basic command output from Git operations
- No centralized logging system

## CI/CD & Deployment

**Hosting:**
- GitHub - Primary hosting
- NPM - Plugin distribution marketplace

**CI Pipeline:**
- Not detected (manual development and release process)

## Environment Configuration

**Required env vars:**
- NPM_TOKEN (optional) - For authenticated plugin installation
- SSH_AUTH_SOCK (not used) - Pageant handles authentication differently

**Secrets location:**
- User's local Pageant agent (PPK keys)
- NPM tokens in environment variables

## Webhooks & Callbacks

**Incoming:**
- Not detected (no webhook endpoints)

**Outgoing:**
- Git push operations to remote repositories
- NPM package publishing

---

*Integration audit: 2026-02-24*