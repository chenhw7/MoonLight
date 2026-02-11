# 开发环境启动方案对比

## 问题总结

1. **页面加载慢**：WSL 与 Windows 浏览器之间网络通信延迟
2. **热更新不工作**：WSL 访问 Windows 文件系统（/mnt/d/）时，inotify 文件监听不可靠

---

## 方案一：Windows 侧运行前端（推荐 ⭐）

### 优点
- ✅ 热更新完全可靠（原生文件系统）
- ✅ 页面加载速度快
- ✅ 开发体验最佳
- ✅ 不需要文件轮询，CPU 占用低

### 缺点
- 需要在 Windows 安装 Node.js
- 需要使用 PowerShell

### 使用方法

```powershell
# 在 Windows PowerShell 中执行
cd d:\cv_study\MoonLight
.\start-dev-windows.ps1
```

访问：http://localhost:3000

### 工作原理
- 后端：WSL Docker 容器 + WSL Python (http://WSL_IP:8000)
- 前端：Windows Node.js (http://localhost:3000)
- 浏览器通过 Vite 代理访问后端

---

## 方案二：WSL 运行前端（备用）

### 优点
- ✅ 统一在 WSL 环境
- ✅ 不需要在 Windows 安装 Node.js

### 缺点
- ❌ 需要启用文件轮询（usePolling），CPU 占用较高
- ❌ 热更新有 1 秒延迟（轮询间隔）
- ❌ 网络通信稍慢

### 使用方法

```bash
# 在 WSL 终端中执行
cd /mnt/d/cv_study/MoonLight
./start-dev.sh
```

访问：http://localhost:3000（从 Windows 浏览器）

### 工作原理
- 后端：WSL (http://WSL_IP:8000)
- 前端：WSL (http://0.0.0.0:3000) + 文件轮询
- 使用 `vite.config.wsl.ts` 配置，启用了 `usePolling`

---

## 配置变更说明

### 1. Vite 配置优化 (vite.config.ts)

```typescript
server: {
  host: true,           // 监听所有地址
  hmr: { overlay: true },
  watch: {
    // WSL 中需要取消注释
    // usePolling: true,
    // interval: 1000,
  },
  proxy: {
    '/api': {
      target: backendUrl,
      timeout: 10000,    // 增加超时时间
    },
  },
}
```

### 2. WSL 专用配置 (vite.config.wsl.ts)

专门为 WSL 环境创建，已启用文件轮询：

```typescript
server: {
  host: '0.0.0.0',
  watch: {
    usePolling: true,   // ⚠️ 关键：启用轮询
    interval: 1000,     // 每秒检查一次
  },
}
```

---

## 常见问题

### Q1: 如何查看后端日志？

**Windows PowerShell:**
```powershell
wsl -e tail -f /mnt/d/cv_study/MoonLight/backend.log
```

**WSL:**
```bash
tail -f /mnt/d/cv_study/MoonLight/backend.log
```

### Q2: 如何停止所有服务？

**停止前端**: 在运行的终端按 `Ctrl+C`

**停止后端**:
```bash
# WSL 中执行
pkill -f "uvicorn app.main:app"
```

**停止 Docker**:
```bash
cd /mnt/d/cv_study/MoonLight
docker-compose down
```

### Q3: 端口被占用怎么办？

**检查端口占用（Windows）:**
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :8000
```

**杀掉进程（Windows）:**
```powershell
taskkill /PID <PID> /F
```

**检查端口占用（WSL）:**
```bash
ss -tlnp | grep :8000
lsof -i :8000
```

### Q4: 热更新还是不工作？

1. **方案一（Windows）**: 确认前端确实在 Windows 侧运行
   ```powershell
   Get-Process | Where-Object {$_.Name -like "*node*"}
   ```

2. **方案二（WSL）**: 确认使用了 WSL 配置
   ```bash
   # 检查是否使用了正确的配置文件
   ps aux | grep vite
   # 应该看到 --config vite.config.wsl.ts
   ```

3. 清除缓存重启：
   ```bash
   cd frontend
   rm -rf node_modules/.vite
   npm run dev
   ```

### Q5: 如何在两个方案之间切换？

**切换到方案一（Windows）:**
```powershell
# 停止 WSL 中的前端
# 然后在 Windows PowerShell 运行
.\start-dev-windows.ps1
```

**切换到方案二（WSL）:**
```bash
# 停止 Windows 中的前端
# 然后在 WSL 运行
./start-dev.sh
```

---

## 性能对比

| 指标 | 方案一（Windows） | 方案二（WSL + 轮询） |
|------|------------------|---------------------|
| 热更新速度 | 即时 | 1 秒延迟 |
| 页面加载 | 快 | 较慢 |
| CPU 占用 | 低 | 中等（轮询） |
| 开发体验 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 推荐配置

**如果你：**
- ✅ Windows 已安装 Node.js → 使用方案一
- ✅ 追求最佳开发体验 → 使用方案一
- ✅ 频繁修改前端代码 → 使用方案一
- ❌ 不想装 Windows Node.js → 使用方案二
- ❌ 只修改后端代码 → 两种方案都可以

**总体推荐：方案一（Windows 侧运行前端）**
