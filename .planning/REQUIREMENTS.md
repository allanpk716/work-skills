# Requirements: Work Skills v1.1

**Defined:** 2026-02-25
**Core Value:** 为 Windows 开发者提供即开即用的 Claude Code 技能,自动化重复性工作,让开发者专注于创造性任务

## v1 Requirements

本里程碑为 windows-git-commit 技能添加代码安全扫描功能。

### 敏感信息检测

- [x] **SENS-01**: 检测 AWS 凭证 (Access Key ID, Secret Access Key, Session Token)
- [x] **SENS-02**: 检测 Git 服务 token (GitHub, GitLab, Bitbucket Personal Access Token)
- [x] **SENS-03**: 检测通用 API 密钥模式 (api_key, secret, password, token 等字段)
- [x] **SENS-04**: 检测 SSH 私钥文件 (-----BEGIN RSA PRIVATE KEY-----)
- [x] **SENS-05**: 检测 PGP 私钥文件 (-----BEGIN PGP PRIVATE KEY BLOCK-----)
- [x] **SENS-06**: 检测 PEM 格式证书文件 (-----BEGIN CERTIFICATE-----)

### 缓存文件检测

- [ ] **CACHE-01**: 检测 Python 缓存文件 (__pycache__/, *.pyc, *.pyo, *.pyd, .Python)
- [ ] **CACHE-02**: 检测 Node.js 依赖 (node_modules/, .npm/, .yarn/, yarn.lock, package-lock.json)
- [ ] **CACHE-03**: 检测编译产物 (*.class, target/, build/, dist/, out/, *.o, *.so, *.exe)
- [ ] **CACHE-04**: 检测系统和临时文件 (*.log, *.tmp, .DS_Store, Thumbs.db, desktop.ini)

### 配置文件检测

- [ ] **CONF-01**: 检测 .env 文件和类似的环境配置文件 (.env.local, .env.*.local)
- [ ] **CONF-02**: 检测凭证文件 (credentials.json, secrets.yaml, secrets.yml, secrets.xml)
- [ ] **CONF-03**: 检测包含敏感字段的配置文件 (包含 password, api_key, secret, token 的配置)

### 内部信息检测

- [x] **INTL-01**: 检测内网 IP 地址 (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
- [x] **INTL-02**: 检测内部域名 (*.internal, *.local, *.corp, *.intranet)
- [x] **INTL-03**: 检测邮箱地址 (用于识别可能的内部邮箱泄露)

### 扫描执行

- [ ] **EXEC-01**: 在 git commit 之前自动扫描暂存区内容
- [ ] **EXEC-02**: 扫描速度优化,目标 <2 秒完成(中等规模仓库)
- [ ] **EXEC-03**: 支持扫描新文件、修改文件、删除文件的内容
- [ ] **EXEC-04**: 正确处理二进制文件(跳过二进制文件的内容扫描)

### 问题报告

- [ ] **RPT-01**: 发现问题时阻止 git commit 执行
- [ ] **RPT-02**: 显示问题类型(敏感信息/缓存文件/配置文件/内部信息)
- [ ] **RPT-03**: 显示文件路径和行号
- [ ] **RPT-04**: 显示问题内容片段(敏感信息部分脱敏)
- [ ] **RPT-05**: 提供修复建议(如"添加到 .gitignore")

### 自定义规则

- [ ] **CUST-01**: 读取项目 .gitignore 文件作为排除规则
- [ ] **CUST-02**: 支持全局 .gitignore (~/.gitignore)
- [x] **CUST-03**: 支持在 .gitignore 中添加扫描白名单(使用注释标记)
- [ ] **CUST-04**: 内置默认规则 + 用户自定义规则组合

### 用户体验

- [x] **UX-01**: 清晰区分警告和错误级别的问题
- [ ] **UX-02**: 提供跳过扫描的选项(紧急情况使用,需明确提示风险)
- [x] **UX-03**: 扫描结果使用彩色输出提高可读性
- [x] **UX-04**: 支持中文和英文提示信息

## v2 Requirements

未来版本考虑的功能:

### 高级功能

- **ADV-01**: 自动修复简单问题(如从暂存区移除缓存文件)
- **ADV-02**: 支持项目级配置文件(.gitcheck.yaml)
- **ADV-03**: 扫描历史记录和趋势分析
- **ADV-04**: 集成 pre-commit hook 框架

### 扩展检测

- **EXT-01**: 数据库连接字符串检测
- **EXT-02**: 加密货币钱包私钥检测
- **EXT-03**: 社交媒体 API token 检测
- **EXT-04**: 自定义正则表达式规则

## Out of Scope

明确排除的功能:

| Feature | Reason |
|---------|--------|
| 自动修复所有问题 | 可能引入新问题,先专注检测和提示 |
| 独立配置文件格式 | 复用 .gitignore 更简单,用户无需学习新语法 |
| 实时文件监控 | 性能开销大,提交时扫描足够 |
| Linux/macOS 支持 | 项目专注 Windows 开发环境 |
| 集成 CI/CD | 属于团队级工具,超出个人技能范围 |
| 加密存储检测到的密钥 | 不需要持久化存储,只做临时检测 |
| AI 智能判断 | 规则引擎足够,引入 AI 增加复杂度和延迟 |

## Traceability

需求到阶段的映射(2026-02-25 创建路线图):

| Requirement | Phase | Status |
|-------------|-------|--------|
| SENS-01 | Phase 6 | Complete |
| SENS-02 | Phase 6 | Complete |
| SENS-03 | Phase 6 | Complete |
| SENS-04 | Phase 6 | Complete |
| SENS-05 | Phase 6 | Complete |
| SENS-06 | Phase 6 | Complete |
| CACHE-01 | Phase 6 | Pending |
| CACHE-02 | Phase 6 | Pending |
| CACHE-03 | Phase 6 | Pending |
| CACHE-04 | Phase 6 | Pending |
| CONF-01 | Phase 6 | Pending |
| CONF-02 | Phase 6 | Pending |
| CONF-03 | Phase 6 | Pending |
| EXEC-01 | Phase 7 | Pending |
| EXEC-02 | Phase 7 | Pending |
| EXEC-03 | Phase 7 | Pending |
| EXEC-04 | Phase 7 | Pending |
| RPT-01 | Phase 7 | Pending |
| RPT-02 | Phase 7 | Pending |
| RPT-03 | Phase 7 | Pending |
| RPT-04 | Phase 7 | Pending |
| RPT-05 | Phase 7 | Pending |
| CUST-01 | Phase 7 | Pending |
| CUST-02 | Phase 7 | Pending |
| CUST-03 | Phase 7 | Complete |
| CUST-04 | Phase 7 | Pending |
| INTL-01 | Phase 8 | Complete |
| INTL-02 | Phase 8 | Complete |
| INTL-03 | Phase 8 | Complete |
| UX-02 | Phase 9 | Pending |
| UX-01 | Phase 10 | Complete |
| UX-03 | Phase 10 | Complete |
| UX-04 | Phase 10 | Complete |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-25*
*Last updated: 2026-02-25 after v1.1 roadmap creation*
