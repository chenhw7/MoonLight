#!/bin/bash
#
# MoonLight 仅启动后端脚本 (WSL 版本)
# 前端已通过 npm run build 构建，由后端直接托管静态文件
#
# 使用方式:
#   ./start-backend.sh                # 默认端口 8000（修改代码不会重启）
#   ./start-backend.sh -p 9000        # 指定端口 9000
#   ./start-backend.sh --port 9000    # 指定端口 9000
#   ./start-backend.sh --reload       # 热重载（修改代码自动重启后端）
#
# 启动后请在 Windows 浏览器访问: http://localhost:<端口>/
#

set -e  # 遇到错误立即退出

# 解析参数
BACKEND_PORT=8000
RELOAD=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        --reload)
            RELOAD=true
            shift
            ;;
        *)
            echo "未知参数: $1"
            echo "用法: $0 [-p|--port 端口号] [--reload]"
            exit 1
            ;;
    esac
done

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIST="$PROJECT_ROOT/frontend/dist"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}======================================${NC}"
echo -e "${CYAN}  MoonLight 后端启动 (WSL)${NC}"
echo -e "${CYAN}======================================${NC}"
echo ""

# ============================================================================
# 第 1 步：检查前端构建产物
# ============================================================================
echo -e "${YELLOW}[1/3] 检查前端构建产物...${NC}"

if [ ! -d "$FRONTEND_DIST" ] || [ ! -f "$FRONTEND_DIST/index.html" ]; then
    echo -e "${RED}❌ 未检测到前端构建产物: $FRONTEND_DIST${NC}"
    echo -e "${YELLOW}   请先运行: cd frontend && npm run build${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ 前端构建产物已就绪${NC}"

# ============================================================================
# 第 2 步：启动 Docker 容器
# ============================================================================
echo -e "${YELLOW}[2/3] 检查并启动 Docker 容器...${NC}"
cd "$PROJECT_ROOT"

if docker ps | grep -q "postgres"; then
    echo -e "${GREEN}   ✅ PostgreSQL 容器已运行${NC}"
else
    echo -e "${YELLOW}   ⚠️  启动 PostgreSQL 和 Redis...${NC}"
    docker-compose up -d postgres redis
    sleep 3
    echo -e "${GREEN}   ✅ 容器已启动${NC}"
fi

# ============================================================================
# 第 3 步：启动后端（前台运行，方便查看日志和 Ctrl+C 停止）
# ============================================================================
echo -e "${YELLOW}[3/3] 启动后端服务...${NC}"

# 检查端口是否已被占用
if ss -tlnp 2>/dev/null | grep -q ":${BACKEND_PORT}"; then
    echo -e "${RED}❌ 端口 ${BACKEND_PORT} 已被占用，请先停止占用端口的进程${NC}"
    exit 1
fi

cd "$BACKEND_DIR"
source venv/bin/activate

echo ""
echo -e "${CYAN}======================================${NC}"
echo -e "${CYAN}  应用地址: http://localhost:${BACKEND_PORT}${NC}"
echo -e "${CYAN}  API 文档: http://localhost:${BACKEND_PORT}/docs${NC}"
if [ "$RELOAD" = true ]; then
    echo -e "${GREEN}  模式: 开发模式（修改代码自动重启）${NC}"
else
    echo -e "${YELLOW}  模式: 生产模式（修改代码不会重启）${NC}"
fi
echo -e "${CYAN}======================================${NC}"
echo ""
echo -e "${YELLOW}提示: 按 Ctrl+C 停止后端服务${NC}"
echo ""

# 根据模式决定是否热重载
UVICORN_ARGS="app.main:app --host 0.0.0.0 --port $BACKEND_PORT"
if [ "$RELOAD" = true ]; then
    UVICORN_ARGS="$UVICORN_ARGS --reload"
fi

exec uvicorn $UVICORN_ARGS
