#!/bin/bash

# OpenList 静态资源迁移执行脚本
# 使用方法:
#   ./run-migration.sh dry-run          # 测试运行
#   ./run-migration.sh avatars          # 迁移头像
#   ./run-migration.sh thumbnails       # 迁移缩略图
#   ./run-migration.sh proxied          # 迁移 proxied
#   ./run-migration.sh all              # 迁移全部

set -e

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/../.."

# 加载环境变量
if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
else
  echo "⚠️  警告: 未找到 .env 文件,使用默认配置"
fi

# 设置默认值 (如果环境变量未设置)
export OPENLIST_URL="${OPENLIST_URL:-http://117.72.221.238:5244}"
export OPENLIST_USERNAME="${OPENLIST_USERNAME:-azu}"
export OPENLIST_STORAGE_PATH="${OPENLIST_STORAGE_PATH:-/data/source}"

# 检查密码
if [ -z "$OPENLIST_PASSWORD" ]; then
  echo "❌ 错误: OPENLIST_PASSWORD 环境变量未设置"
  echo ""
  echo "请设置密码:"
  echo "  export OPENLIST_PASSWORD='your_password'"
  echo "或者在 .env 文件中配置"
  exit 1
fi

# 显示配置
echo "=================================="
echo "OpenList 迁移脚本"
echo "=================================="
echo "配置:"
echo "  URL: $OPENLIST_URL"
echo "  用户: $OPENLIST_USERNAME"
echo "  存储路径: $OPENLIST_STORAGE_PATH"
echo "=================================="
echo ""

# 解析命令行参数
MODE=${1:-help}

case "$MODE" in
  dry-run)
    echo "🧪 执行 DRY-RUN 测试 (不实际上传)"
    npx tsx "$SCRIPT_DIR/migrate-to-openlist.ts" --dry-run
    ;;

  avatars)
    echo "📸 迁移头像目录 (124个文件)"
    read -p "确认继续? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
      echo "取消执行"
      exit 0
    fi
    npx tsx "$SCRIPT_DIR/migrate-to-openlist.ts" --dir=avatars
    ;;

  thumbnails)
    echo "🎬 迁移缩略图目录 (1285个文件)"
    read -p "确认继续? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
      echo "取消执行"
      exit 0
    fi
    npx tsx "$SCRIPT_DIR/migrate-to-openlist.ts" --dir=thumbnails
    ;;

  proxied)
    echo "📦 迁移 proxied 目录 (1172个文件)"
    read -p "确认继续? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
      echo "取消执行"
      exit 0
    fi
    npx tsx "$SCRIPT_DIR/migrate-to-openlist.ts" --dir=proxied
    ;;

  all)
    echo "🚀 迁移全部文件 (2587个文件, 164MB)"
    echo "⚠️  预计耗时: 30-60分钟"
    read -p "确认继续? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
      echo "取消执行"
      exit 0
    fi
    npx tsx "$SCRIPT_DIR/migrate-to-openlist.ts"
    ;;

  help|*)
    echo "使用方法:"
    echo "  $0 dry-run          # 测试运行 (推荐先执行)"
    echo "  $0 avatars          # 迁移头像 (124个文件)"
    echo "  $0 thumbnails       # 迁移缩略图 (1285个文件)"
    echo "  $0 proxied          # 迁移 proxied (1172个文件)"
    echo "  $0 all              # 迁移全部 (2587个文件)"
    echo ""
    echo "推荐执行顺序:"
    echo "  1. $0 dry-run       # 先测试"
    echo "  2. $0 avatars       # 小批量验证"
    echo "  3. $0 thumbnails    # 中等批量"
    echo "  4. $0 proxied       # 完成剩余部分"
    ;;
esac
