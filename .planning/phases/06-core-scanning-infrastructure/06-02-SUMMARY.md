# Phase 06 - Plan 02: 缓存文件和配置文件检测规则

## 完成状态

**状态:** 已完成
**提交数:** 1
**文件数:** 3 个新建,2 个修改

## 实现内容

### 1. 文件路径匹配工具 (file_utils.py)

#### `match_path_pattern(file_path, patterns)`
- 检查文件路径是否匹配任意模式
- 支持 `*.ext` 扩展名匹配
- 支持 `path/segment` 路径包含匹配
- 路径规范化为正斜杠,确保 Windows 兼容性

**示例:**
```python
match_path_pattern(Path('src/__pycache__/module.pyc'), ['__pycache__', '*.pyc'])
# → True

match_path_pattern(Path('node_modules/package/index.js'), ['node_modules'])
# → True
```

### 2. 缓存文件检测规则 (4 个规则)

#### CACHE-01: Python 缓存文件
- `PYTHON_CACHE_RULE`: 检测 `__pycache__/`, `*.pyc`, `*.pyo`, `*.pyd`, `.Python`
- 标签: python, cache, bytecode

#### CACHE-02: Node.js 依赖
- `NODEJS_CACHE_RULE`: 检测 `node_modules/`, `.npm/`, `.yarn/`, `yarn.lock`, `package-lock.json`
- 标签: nodejs, npm, yarn, dependencies

#### CACHE-03: 编译产物
- `COMPILED_CACHE_RULE`: 检测 `*.class`, `target/`, `build/`, `dist/`, `out/`, `*.o`, `*.so`, `*.exe`
- 标签: compiled, build, artifacts

#### CACHE-04: 系统临时文件
- `SYSTEM_CACHE_RULE`: 检测 `*.log`, `*.tmp`, `.DS_Store`, `Thumbs.db`, `desktop.ini`
- 标签: system, temp, logs

#### 工具函数
- `is_cache_file(file_path)`: 检测文件是否为缓存文件

### 3. 配置文件检测规则 (3 个规则)

#### CONF-01: 环境配置文件
- `ENV_FILE_RULE`: 检测 `.env`, `.env.local`, `.env.*.local`
- 标签: env, config, secrets
- 仅检测文件名,不扫描内容

#### CONF-02: 凭证文件
- `CREDENTIALS_FILE_RULE`: 检测 `credentials.json`, `secrets.yaml`, `secrets.yml`, `secrets.xml`
- 标签: credentials, secrets, config
- 仅检测文件名,不扫描内容

#### CONF-03: 包含敏感字段的配置文件
- `SENSITIVE_FIELD_RULE`: 检测配置文件中的敏感字段
- 扫描所有文件内容,不限制文件名
- 正则表达式: `(password|api_key|secret|token)\s*[=:]\s*['"]?([^'"}\s]+)`
- 标签: sensitive, config, secrets

#### 工具函数
- `is_config_file(file_path)`: 检测文件是否为配置文件 (基于文件名)
  - 返回: `(is_config: bool, rule_id: str)` 元组
- `scan_config_content(content)`: 扫描配置文件内容,检测敏感字段
  - 返回: `List[Tuple[field_name, masked_value, line_number]]`
  - 脱敏显示: 前 4 字符 + `***` + 后 4 字符

### 4. 规则导出更新

更新 `scanner/rules/__init__.py` 和 `scanner/utils/__init__.py`,导出所有规则:

```python
# 缓存文件规则
from scanner.rules import (
    PYTHON_CACHE_RULE,
    NODEJS_CACHE_RULE,
    COMPILED_CACHE_RULE,
    SYSTEM_CACHE_RULE,
    CACHE_FILE_RULES,
    is_cache_file,
)

# 配置文件规则
from scanner.rules import (
    ENV_FILE_RULE,
    CREDENTIALS_FILE_RULE,
    SENSITIVE_FIELD_RULE,
    CONFIG_FILE_RULES,
    is_config_file,
    scan_config_content,
)

# 工具函数
from scanner.utils import match_path_pattern
```

## 技术决策

### 路径匹配策略
- **问题:** Windows 路径使用反斜杠,Linux/macOS 使用正斜杠
- **解决方案:** 统一规范化为正斜杠,避免平台差异
- **实现:** `path_str = str(file_path).replace('\\', '/')`

### 配置文件检测的双重策略
- **文件名检测:** 快速识别已知配置文件 (.env, credentials.json)
- **内容扫描:** 检测任意文件中的敏感字段 (password, api_key)
- **优势:** 高检测率,同时避免过多误报

### 敏感字段脱敏
- **目的:** 在报告和日志中保护敏感信息
- **实现:**
  - 长字符串 (>12 字符): `value[:4] + '***' + value[-4:]`
  - 短字符串 (≤12 字符): `value[:2] + '***' + value[-2:]`
- **示例:** `sk-1234567890abcdef` → `sk-1***cdef`

## 验证结果

### 自动化验证
- ✓ 所有 4 个缓存文件规则可以导入
- ✓ 所有 3 个配置文件规则可以导入
- ✓ `is_cache_file()` 测试通过 (5 个测试用例)
- ✓ `is_config_file()` 测试通过 (6 个测试用例)
- ✓ `scan_config_content()` 测试通过 (检测到 ≥2 个敏感字段)
- ✓ 规则数量验证通过 (4 个缓存规则,3 个配置规则)

### 手动验证
- 代码审查通过
- 路径匹配逻辑正确
- 正则表达式模式正确
- 类型注解完整

## 文件清单

### 新建文件 (3 个)
1. `scanner/rules/cache_files.py` - 缓存文件检测规则 (105 行)
2. `scanner/rules/config_files.py` - 配置文件检测规则 (128 行)
3. `scanner/utils/file_utils.py` - 文件路径匹配工具 (44 行)

### 修改文件 (2 个)
1. `scanner/rules/__init__.py` - 添加缓存和配置规则导出
2. `scanner/utils/__init__.py` - 添加 file_utils 导出

### 导出接口
```python
from scanner.rules import (
    # 基类
    CacheFileRule,
    ConfigFileRule,

    # 缓存文件规则
    PYTHON_CACHE_RULE,
    NODEJS_CACHE_RULE,
    COMPILED_CACHE_RULE,
    SYSTEM_CACHE_RULE,
    CACHE_FILE_RULES,
    is_cache_file,

    # 配置文件规则
    ENV_FILE_RULE,
    CREDENTIALS_FILE_RULE,
    SENSITIVE_FIELD_RULE,
    CONFIG_FILE_RULES,
    is_config_file,
    scan_config_content,
)

from scanner.utils import match_path_pattern
```

## 与 Plan 01 的集成

Plan 02 在 Plan 01 的基础上扩展:
- **共享基类模式:** 使用 dataclass 定义规则,保持代码一致性
- **共享工具:** 使用 file_utils.py 的路径匹配功能
- **统一导出:** 在 `scanner/rules/__init__.py` 中集中导出所有规则

## 下一步

Phase 6 完成后,Phase 7 将添加:
- 扫描器核心逻辑 (扫描暂存区文件,应用所有规则)
- 检测结果聚合和报告生成
- 熵值分析 (用于减少误报)

## 提交记录

```
commit e4a1d90
Author: Allan <allan@allan.com>
Date:   Wed Feb 25 2026

    feat(06-02): implement cache and config file detection rules

    - Add CacheFileRule and ConfigFileRule base classes
    - Implement 4 cache file detection rules
    - Implement 3 config file detection rules
    - Add file path pattern matching utility
    - Add content scanning utility (scan_config_content with masking)
```
