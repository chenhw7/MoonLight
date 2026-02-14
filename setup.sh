#!/bin/bash
#
# MoonLight 环境初始化脚本 (WSL/Linux)
#
# 使用方式: 
#   ./setup.sh
#

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== MoonLight 开发环境初始化 ===${NC}"

# 0. 检查 Python 版本
echo -e "\n${YELLOW}[0/3] 检查系统环境...${NC}"
REQUIRED_MAJOR=3
REQUIRED_MINOR=11
SELECTED_PYTHON=""

# 候选命令列表，优先尝试特定版本（从新到旧）
# 很多 Linux 发行版即使安装了新版 python，默认 python3 可能还是旧的
# 所以我们主动查找特定的版本号
CANDIDATES=("python3.13" "python3.12" "python3.11" "python3")

echo "正在寻找合适的 Python 版本 (>= $REQUIRED_MAJOR.$REQUIRED_MINOR)..."

for cmd in "${CANDIDATES[@]}"; do
    if command -v "$cmd" &> /dev/null; then
        # 获取版本号
        VERSION_OUTPUT=$($cmd -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
        MAJOR=$(echo "$VERSION_OUTPUT" | cut -d. -f1)
        MINOR=$(echo "$VERSION_OUTPUT" | cut -d. -f2)
        
        if [ "$MAJOR" -eq "$REQUIRED_MAJOR" ] && [ "$MINOR" -ge "$REQUIRED_MINOR" ]; then
            SELECTED_PYTHON="$cmd"
            echo -e "${GREEN}✅ 发现可用 Python: $cmd (版本 $VERSION_OUTPUT)${NC}"
            break
        elif [ "$MAJOR" -gt "$REQUIRED_MAJOR" ]; then
             SELECTED_PYTHON="$cmd"
             echo -e "${GREEN}✅ 发现可用 Python: $cmd (版本 $VERSION_OUTPUT)${NC}"
             break
        else
            echo -e "   跳过 $cmd (版本 $VERSION_OUTPUT 低于 $REQUIRED_MAJOR.$REQUIRED_MINOR)"
        fi
    fi
done

if [ -z "$SELECTED_PYTHON" ]; then
    echo -e "${RED}❌ 未找到合适的 Python 版本。${NC}"
    echo -e "${RED}❌ 请在 WSL 中安装 Python $REQUIRED_MAJOR.$REQUIRED_MINOR 或更高版本${NC}"
    echo -e "${YELLOW}   提示: sudo apt update && sudo apt install python3.11 python3.11-venv${NC}"
    exit 1
fi

# 1. 后端环境配置
echo -e "\n${YELLOW}[1/3] 配置后端环境...${NC}"
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo "创建 Python 虚拟环境 (使用 $SELECTED_PYTHON)..."
    $SELECTED_PYTHON -m venv venv
else
    echo "虚拟环境已存在。"
fi

echo "激活虚拟环境并安装依赖..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 2. 前端环境配置
echo -e "\n${YELLOW}[2/3] 配置前端环境...${NC}"
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
else
    echo "前端依赖已存在 (node_modules)。"
fi

# 3. 环境检查完成
echo -e "\n${GREEN}=== 初始化完成 ===${NC}"
echo -e "现在你可以使用以下命令启动开发环境："
echo -e "  ${YELLOW}./start-dev.sh${NC}"
