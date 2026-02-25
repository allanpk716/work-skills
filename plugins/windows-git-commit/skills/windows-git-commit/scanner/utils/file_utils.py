from pathlib import Path
from typing import List


def match_path_pattern(file_path: Path, patterns: List[str]) -> bool:
    """
    检查文件路径是否匹配任意模式

    Args:
        file_path: 文件路径
        patterns: 模式列表 (支持通配符和路径匹配)

    Returns:
        True 如果匹配任意模式, False 如果不匹配

    Examples:
        >>> match_path_pattern(Path('src/__pycache__/module.pyc'), ['__pycache__', '*.pyc'])
        True
        >>> match_path_pattern(Path('node_modules/package/index.js'), ['node_modules'])
        True
    """
    # 规范化路径为正斜杠 (跨平台兼容)
    path_str = str(file_path).replace('\\', '/')

    for pattern in patterns:
        if pattern.startswith('*.'):
            # 扩展名匹配
            if path_str.endswith(pattern[1:]):
                return True
        else:
            # 路径包含匹配
            if f'/{pattern}/' in path_str or path_str.endswith(f'/{pattern}') or path_str.startswith(f'{pattern}/'):
                return True

    return False
