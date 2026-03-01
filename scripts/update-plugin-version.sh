#!/bin/bash
# 自动更新插件版本号
# 策略：总是递增 PATCH 版本号

set -e

# 获取项目根目录
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# 检测哪些插件被修改
CHANGED_PLUGINS=$(git diff --cached --name-only | grep "^plugins/" | cut -d'/' -f2 | sort -u)

if [ -z "$CHANGED_PLUGINS" ]; then
  echo "No plugin changes detected."
  exit 0
fi

for plugin in $CHANGED_PLUGINS; do
  # 读取当前版本号
  CURRENT_VERSION=$(jq -r ".plugins[] | select(.name == \"$plugin\") | .version" .claude-plugin/marketplace.json 2>/dev/null)

  if [ -z "$CURRENT_VERSION" ] || [ "$CURRENT_VERSION" = "null" ]; then
    echo "⚠ Plugin $plugin not found in marketplace.json, skipping..."
    continue
  fi

  # 解析版本号
  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

  # 增加 patch 版本号
  NEW_PATCH=$((PATCH + 1))
  NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

  # 更新 marketplace.json
  jq "(.plugins[] | select(.name == \"$plugin\") | .version) |= \"$NEW_VERSION\"" \
    .claude-plugin/marketplace.json > .claude-plugin/marketplace.json.tmp && \
    mv .claude-plugin/marketplace.json.tmp .claude-plugin/marketplace.json

  echo "✓ Updated $plugin: $CURRENT_VERSION → $NEW_VERSION"
done

# 将 marketplace.json 添加到当前 commit
git add .claude-plugin/marketplace.json

echo "✓ All plugin versions updated and staged"
