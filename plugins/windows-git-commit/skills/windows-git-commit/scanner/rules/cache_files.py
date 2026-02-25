from pathlib import Path
from typing import List
from dataclasses import dataclass
from ..utils.file_utils import match_path_pattern


@dataclass
class CacheFileRule:
    """缓存文件检测规则"""
    rule_id: str                    # 规则 ID (如 CACHE-01)
    description: str                # 规则描述(中文)
    patterns: List[str]             # 匹配模式列表
    tags: List[str]                 # 分类标签


# CACHE-01: Python 缓存文件
PYTHON_CACHE_RULE = CacheFileRule(
    rule_id="CACHE-01",
    description="检测 Python 缓存文件",
    patterns=[
        '__pycache__',
        '*.pyc',
        '*.pyo',
        '*.pyd',
        '.Python',
    ],
    tags=["python", "cache", "bytecode"]
)

# CACHE-02: Node.js 依赖
NODEJS_CACHE_RULE = CacheFileRule(
    rule_id="CACHE-02",
    description="检测 Node.js 依赖和缓存",
    patterns=[
        'node_modules',
        '.npm',
        '.yarn',
        'yarn.lock',
        'package-lock.json',
    ],
    tags=["nodejs", "npm", "yarn", "dependencies"]
)

# CACHE-03: 编译产物
COMPILED_CACHE_RULE = CacheFileRule(
    rule_id="CACHE-03",
    description="检测编译产物和构建文件",
    patterns=[
        '*.class',
        'target',
        'build',
        'dist',
        'out',
        '*.o',
        '*.so',
        '*.exe',
    ],
    tags=["compiled", "build", "artifacts"]
)

# CACHE-04: 系统临时文件
SYSTEM_CACHE_RULE = CacheFileRule(
    rule_id="CACHE-04",
    description="检测系统临时文件和日志",
    patterns=[
        '*.log',
        '*.tmp',
        '.DS_Store',
        'Thumbs.db',
        'desktop.ini',
    ],
    tags=["system", "temp", "logs"]
)

# 所有缓存文件规则
CACHE_FILE_RULES = [
    PYTHON_CACHE_RULE,
    NODEJS_CACHE_RULE,
    COMPILED_CACHE_RULE,
    SYSTEM_CACHE_RULE,
]


def is_cache_file(file_path: Path) -> bool:
    """
    检测文件是否为缓存文件

    Args:
        file_path: 文件路径

    Returns:
        True 如果是缓存文件, False 如果不是
    """
    for rule in CACHE_FILE_RULES:
        if match_path_pattern(file_path, rule.patterns):
            return True
    return False
