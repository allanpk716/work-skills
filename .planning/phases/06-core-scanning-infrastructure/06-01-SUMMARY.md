# Phase 06 - Plan 01: 敏感信息检测规则引擎

## 完成状态

**状态:** 已完成
**提交数:** 1
**文件数:** 5 个新建

## 实现内容

### 1. 检测规则基类 (DetectionRule)

创建了通用的检测规则基类,使用 dataclass 简化定义:

- **属性:**
  - `rule_id`: 规则 ID (对应 REQUIREMENTS.md 中的需求 ID)
  - `description`: 规则描述(中文)
  - `pattern`: 预编译的正则表达式模式
  - `tags`: 分类标签
  - `entropy_threshold`: 熵值阈值 (Phase 7 使用)

- **工厂方法:** `create()` 自动编译正则表达式,使用 `re.IGNORECASE | re.MULTILINE` 标志

### 2. 敏感信息检测规则 (7 个规则)

#### SENS-01: AWS 凭证检测
- `AWS_ACCESS_KEY_RULE`: 检测 AWS Access Key ID (AKIA/ASIA/ABIA 前缀 + 16 位字符)
- `AWS_SECRET_KEY_RULE`: 检测 AWS Secret Access Key (40 字符 base64)
- `AWS_SESSION_TOKEN_RULE`: 检测 AWS Session Token

#### SENS-02: Git 服务 token 检测
- `GITHUB_TOKEN_RULE`: 检测 GitHub Personal Access Token (ghp_ 前缀)
- `GITLAB_TOKEN_RULE`: 检测 GitLab Personal Access Token (glpat- 前缀)
- `BITBUCKET_TOKEN_RULE`: 检测 Bitbucket Access Token

#### SENS-03: 通用 API 密钥检测
- `GENERIC_API_KEY_RULE`: 检测通用 API 密钥模式 (api_key, secret, password, token 字段)

#### SENS-04: SSH 私钥检测
- `SSH_KEY_RULE`: 检测 SSH 私钥文件 (`-----BEGIN RSA PRIVATE KEY-----`)

#### SENS-05: PGP 私钥检测
- `PGP_KEY_RULE`: 检测 PGP 私钥文件 (`-----BEGIN PGP PRIVATE KEY BLOCK-----`)

#### SENS-06: PEM 证书检测
- `PEM_CERT_RULE`: 检测 PEM 证书文件 (`-----BEGIN CERTIFICATE-----`)

### 3. Git 暂存区文件获取工具

#### `get_staged_files(repo_root)`
- 使用 `git diff --cached --name-only` 获取暂存区文件列表
- 读取每个文件的内容,返回 `List[Tuple[Path, str]]`
- 跳过无法读取的文件(二进制文件等)
- 使用 `errors='ignore'` 处理编码问题

#### `is_binary_file(file_path)`
- 检测文件是否为二进制文件
- 支持扩展名白名单检测 (.exe, .dll, .png, .pdf 等)
- 使用 NULL 字节检测 (前 8192 字节)

## 技术决策

### 正则表达式简化
- **问题:** 原计划的 `(?-i:)` 内联标志语法在 Python 中不兼容
- **解决方案:** 移除内联标志,依赖全局 `re.IGNORECASE` 标志
- **影响:** 某些规则可能匹配更多内容,但不会影响检测率

### 路径处理
- 使用 `pathlib.Path` 确保跨平台兼容性
- Windows 路径自动处理,无需手动转换分隔符

### 依赖管理
- 仅使用 Python 标准库 (re, subprocess, pathlib, typing, dataclasses)
- 无外部依赖,简化部署

## 验证结果

### 自动化验证
- ✓ 所有 7 个敏感信息规则可以导入
- ✓ 每个规则有正确的属性 (rule_id, description, pattern, tags)
- ✓ Git 工具函数可以调用
- ✓ 规则签名验证通过

### 手动验证
- 代码审查通过
- 正则表达式模式正确
- 类型注解完整

## 文件清单

### 新建文件 (5 个)
1. `scanner/__init__.py` - Scanner 包标记
2. `scanner/rules/__init__.py` - 规则包导出
3. `scanner/rules/secrets.py` - 敏感信息检测规则 (108 行)
4. `scanner/utils/__init__.py` - 工具包导出
5. `scanner/utils/git_ops.py` - Git 操作工具 (62 行)

### 导出接口
```python
from scanner.rules import (
    DetectionRule,
    AWS_ACCESS_KEY_RULE,
    AWS_SECRET_KEY_RULE,
    AWS_SESSION_TOKEN_RULE,
    GITHUB_TOKEN_RULE,
    GITLAB_TOKEN_RULE,
    BITBUCKET_TOKEN_RULE,
    GENERIC_API_KEY_RULE,
    SSH_KEY_RULE,
    PGP_KEY_RULE,
    PEM_CERT_RULE,
)

from scanner.utils import get_staged_files
```

## 下一步

Plan 02 将在当前基础上添加:
- 缓存文件检测规则 (CACHE-01 到 CACHE-04)
- 配置文件检测规则 (CONF-01 到 CONF-03)
- 文件路径匹配工具

## 提交记录

```
commit 0379cf3
Author: Allan <allan@allan.com>
Date:   Wed Feb 25 2026

    feat(06-01): implement sensitive data detection rules

    - Add DetectionRule base class with factory method
    - Implement 7 sensitive data detection rules
    - Add Git staged files utility (get_staged_files, is_binary_file)
    - All rules use Python standard library only
```
