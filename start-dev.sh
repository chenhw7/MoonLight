#!/bin/bash
#
# MoonLight 开发环境启动脚本 (WSL 版本)
#
# 使用方式: 
#   cd /path/to/project
#   ./start-dev.sh
#

set -e  # 遇到错误立即退出

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}======================================${NC}"
echo -e "${CYAN}  MoonLight 开发环境启动 (WSL)${NC}"
echo -e "${CYAN}======================================${NC}"
echo ""

# ============================================================================
# 第 1 步：获取 WSL IP
# ============================================================================
echo -e "${YELLOW}[1/5] 获取 WSL IP 地址...${NC}"
WSL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$WSL_IP" ]; then
    echo -e "${RED}❌ 无法获取 WSL IP${NC}"
    exit 1
fi
echo -e "${GREEN}   WSL IP: $WSL_IP${NC}"

# ============================================================================
# 第 2 步：启动 Docker 容器
# ============================================================================
echo -e "${YELLOW}[2/5] 检查并启动 Docker 容器...${NC}"
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
# 第 3 步：更新前端环境变量
# ============================================================================
echo -e "${YELLOW}[3/5] 更新前端配置...${NC}"

# 更新 .env.local
cat > "$FRONTEND_DIR/.env.local" <<EOF
# === 由 start-dev.sh 自动生成，请勿手动修改 ===
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')
# WSL IP: $WSL_IP

# 前端 API 路径（通过 Vite 代理转发，浏览器无需知道后端真实 IP）
VITE_API_URL=/api/v1

# 后端实际地址（Vite 代理目标，仅开发服务器使用，不暴露给浏览器）
BACKEND_URL=http://${WSL_IP}:8000
EOF

# 启用文件监听轮询（解决 WSL 访问 Windows 文件系统时的热更新问题）
echo -e "${GREEN}   ✅ 已更新 .env.local (启用了文件轮询)${NC}"

# ============================================================================
# 第 4 步：启动后端（后台进程）
# ============================================================================
echo -e "${YELLOW}[4/5] 启动后端服务 (后台)...${NC}"

# 检查端口是否已被占用
if ss -tlnp 2>/dev/null | grep -q ":8000"; then
    echo -e "${YELLOW}   ⚠️  端口 8000 已被占用，跳过后端启动${NC}"
else
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    # 在后台启动，日志输出到文件
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload \
        > "$PROJECT_ROOT/backend.log" 2>&1 &
    
    BACKEND_PID=$!
    echo -e "${GREEN}   ✅ 后端已启动 (PID: $BACKEND_PID)${NC}"
    echo -e "   📄 日志文件: $PROJECT_ROOT/backend.log"
    
    # 等待后端就绪
    echo -e "${YELLOW}   ⏳ 等待后端就绪...${NC}"
    for i in {1..10}; do
        sleep 2
        if curl -s "http://localhost:8000/health" > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ 后端已就绪 (http://localhost:8000)${NC}"
            break
        fi
        echo -e "   ⏳ 重试 $i/10 ..."
    done
fi

# ============================================================================
# 第 5 步：启动前端（Windows 侧）
# ============================================================================
echo -e "${YELLOW}[5/5] 启动前端开发服务器...${NC}"
echo ""
echo -e "${CYAN}======================================${NC}"
echo -e "${CYAN}  前端: http://localhost:3000${NC}"
echo -e "${CYAN}  后端: http://${WSL_IP}:8000${NC}"
echo -e "${CYAN}  API 文档: http://${WSL_IP}:8000/docs${NC}"
echo -e "${CYAN}======================================${NC}"
echo ""
echo -e "${YELLOW}提示: 按 Ctrl+C 可停止前端服务${NC}"
echo -e "${YELLOW}后端日志: tail -f $PROJECT_ROOT/backend.log${NC}"
echo ""

# 启动前端 (使用 WSL 优化配置)
cd "$FRONTEND_DIR"

# 检查是否存在 WSL 专用配置
if [ -f "vite.config.wsl.ts" ]; then
    echo -e "${GREEN}✅ 使用 WSL 优化配置（文件轮询已启用）${NC}"
    npx vite --config vite.config.wsl.ts
else
    echo -e "${YELLOW}⚠️  使用默认配置（热更新可能不稳定）${NC}"
    npm run dev
fi
