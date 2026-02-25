import subprocess
from pathlib import Path
from typing import List, Tuple, Optional


def get_staged_files(repo_root: Path) -> List[Tuple[Path, str]]:
    """
    获取暂存区文件列表和内容

    Args:
        repo_root: Git 仓库根目录

    Returns:
        List of (file_path, content) tuples

    Raises:
        subprocess.CalledProcessError: Git 命令执行失败
    """
    # 获取暂存区文件列表
    result = subprocess.run(
        ['git', 'diff', '--cached', '--name-only'],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=True
    )

    file_paths = [repo_root / p for p in result.stdout.strip().split('\n') if p]

    # 获取每个文件的内容
    files_with_content = []
    for file_path in file_paths:
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            files_with_content.append((file_path, content))
        except Exception:
            # 跳过无法读取的文件(二进制文件等)
            continue

    return files_with_content


def is_binary_file(file_path: Path) -> bool:
    """
    检测文件是否为二进制文件

    Args:
        file_path: 文件路径

    Returns:
        True 如果是二进制文件, False 如果是文本文件
    """
    binary_extensions = {
        '.exe', '.dll', '.so', '.dylib', '.png', '.jpg', '.jpeg', '.gif',
        '.pdf', '.zip', '.tar', '.gz', '.class', '.jar', '.war'
    }

    if file_path.suffix.lower() in binary_extensions:
        return True

    # 检查文件内容的前 8192 字节
    try:
        with open(file_path, 'rb') as f:
            chunk = f.read(8192)
            return b'\x00' in chunk  # NULL 字节表示二进制文件
    except Exception:
        return True  # 无法读取,保守处理为二进制文件
