# ============================================================================
# MoonLight 开发环境启动脚本 (Windows PowerShell 版本)
# ============================================================================
#
# 使用方式: 
#   在 Windows PowerShell 中执行:
#   cd d:\cv_study\MoonLight
#   .\start-dev-windows.ps1
#
# 说明:
#   - 后端在 WSL 中运行（数据库在 Docker）
#   - 前端在 Windows 中运行（解决热更新问题）
#   - 浏览器访问 http://localhost:3000
# ============================================================================

$ErrorActionPreference = "Stop"

$PROJECT_ROOT = "d:\cv_study\MoonLight"
$BACKEND_DIR = "$PROJECT_ROOT\backend"
$FRONTEND_DIR = "$PROJECT_ROOT\frontend"

# 颜色函数
function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

Write-Host ""
Write-ColorText "======================================" "Cyan"
Write-ColorText "  MoonLight 开发环境启动 (Windows)" "Cyan"
Write-ColorText "======================================" "Cyan"
Write-Host ""

# ============================================================================
# 第 1 步：获取 WSL IP
# ============================================================================
Write-ColorText "[1/4] 获取 WSL IP 地址..." "Yellow"

try {
    $WSL_IP = (wsl hostname -I).Trim().Split()[0]
    if ([string]::IsNullOrWhiteSpace($WSL_IP)) {
        throw "无法获取 WSL IP"
    }
    Write-ColorText "   WSL IP: $WSL_IP" "Green"
} catch {
    Write-ColorText "❌ 错误: $_" "Red"
    exit 1
}

# ============================================================================
# 第 2 步：启动 Docker 容器（在 WSL 中）
# ============================================================================
Write-ColorText "[2/4] 检查并启动 Docker 容器..." "Yellow"

$dockerCheck = wsl -e bash -c "docker ps 2>/dev/null | grep -q postgres && echo 'running' || echo 'stopped'"

if ($dockerCheck -eq "running") {
    Write-ColorText "   ✅ PostgreSQL 容器已运行" "Green"
} else {
    Write-ColorText "   ⚠️  启动 PostgreSQL 和 Redis..." "Yellow"
    wsl -e bash -c "cd /mnt/d/cv_study/MoonLight && docker-compose up -d postgres redis"
    Start-Sleep -Seconds 3
    Write-ColorText "   ✅ 容器已启动" "Green"
}

# ============================================================================
# 第 3 步：更新前端环境变量
# ============================================================================
Write-ColorText "[3/4] 更新前端配置..." "Yellow"

$envContent = @"
# === 由 start-dev-windows.ps1 自动生成，请勿手动修改 ===
# 生成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# WSL IP: $WSL_IP

# 前端 API 路径（通过 Vite 代理转发）
VITE_API_URL=/api/v1

# 后端实际地址（Vite 代理目标）
BACKEND_URL=http://${WSL_IP}:8000
"@

$envContent | Out-File -FilePath "$FRONTEND_DIR\.env.local" -Encoding UTF8
Write-ColorText "   ✅ 已更新 .env.local" "Green"

# ============================================================================
# 第 4 步：启动后端（在 WSL 后台）
# ============================================================================
Write-ColorText "[4/4] 启动后端服务..." "Yellow"

$backendCheck = wsl -e bash -c "ss -tlnp 2>/dev/null | grep -q ':8000' && echo 'running' || echo 'stopped'"

if ($backendCheck -eq "running") {
    Write-ColorText "   ⚠️  端口 8000 已被占用，跳过后端启动" "Yellow"
} else {
    # 启动后端
    wsl -e bash -c @"
cd /mnt/d/cv_study/MoonLight/backend && \
source venv/bin/activate && \
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload \
  > /mnt/d/cv_study/MoonLight/backend.log 2>&1 &
"@
    
    Write-ColorText "   ✅ 后端已启动" "Green"
    Write-ColorText "   ⏳ 等待后端就绪..." "Yellow"
    
    # 等待后端就绪
    $retries = 0
    $maxRetries = 10
    $backendReady = $false
    
    while ($retries -lt $maxRetries) {
        Start-Sleep -Seconds 2
        try {
            $response = Invoke-WebRequest -Uri "http://${WSL_IP}:8000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $backendReady = $true
                break
            }
        } catch {
            # 继续重试
        }
        $retries++
        Write-Host "   ⏳ 重试 $retries/$maxRetries ..."
    }
    
    if ($backendReady) {
        Write-ColorText "   ✅ 后端已就绪" "Green"
    } else {
        Write-ColorText "   ⚠️  后端可能未完全启动，请检查日志" "Yellow"
    }
}

# ============================================================================
# 启动前端（在 Windows 侧）
# ============================================================================
Write-Host ""
Write-ColorText "======================================" "Cyan"
Write-ColorText "  开发服务器已启动" "Cyan"
Write-ColorText "======================================" "Cyan"
Write-ColorText "  前端: http://localhost:3000" "Cyan"
Write-ColorText "  后端: http://${WSL_IP}:8000" "Cyan"
Write-ColorText "  API 文档: http://${WSL_IP}:8000/docs" "Cyan"
Write-ColorText "======================================" "Cyan"
Write-Host ""
Write-ColorText "提示: 按 Ctrl+C 可停止前端服务" "Yellow"
Write-ColorText "后端日志: wsl -e tail -f /mnt/d/cv_study/MoonLight/backend.log" "Yellow"
Write-Host ""

# 启动前端
Set-Location $FRONTEND_DIR
npm run dev
