# PDF 导出问题修复指南

## 已修复的问题

### 1. 文本横向溢出
**修复内容：**
- ✅ 为所有长文本元素添加 `word-break: break-all`
- ✅ 为所有容器添加 `width: 100%` 和 `overflow: hidden`
- ✅ 使用 `overflowWrap: 'anywhere'` 强制换行
- ✅ 为工作描述、项目描述、个人总结添加完整的文字换行样式

**涉及文件：**
- `frontend/src/pages/Resume/components/templates/ModernTemplate.tsx`

### 2. PDF 下载功能
**修复内容：**
- ✅ 修复 jsPDF 4.x 版本兼容性问题
- ✅ 添加详细的控制台日志，便于调试
- ✅ 修改 PDF 构造函数调用方式，兼容旧版本
- ✅ 修复分页算法

**涉及文件：**
- `frontend/src/utils/pdf.ts`

## 测试步骤

### 测试文本换行
1. 在简历编辑页面，工作描述中输入：
   ```
   aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
   ```
2. 预览简历，确认文字自动换行，不会超出边界
3. 导出PDF，确认PDF中文字也正确换行

### 测试 PDF 导出
1. 打开简历预览页面
2. 打开浏览器控制台（F12）
3. 点击"导出PDF"按钮
4. 查看控制台输出：
   - 应该看到 "开始导出 PDF..."
   - 应该看到 "Canvas 渲染完成"
   - 应该看到 "PDF 保存成功！"
5. 检查下载文件夹，应该有新的 PDF 文件

## 如果 PDF 导出仍然失败

### 方案一：升级 jspdf（推荐）

在 `frontend` 目录下执行：
```bash
npm uninstall jspdf
npm install jspdf@latest
```

当前版本：`jspdf@4.1.0`（2018年，已过时）
最新版本：`jspdf@2.5.x`（2023年）

### 方案二：使用 CDN（临时方案）

如果升级后还有问题，可以在 `index.html` 中添加：
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

### 方案三：检查浏览器兼容性

某些浏览器可能阻止文件下载，检查：
1. 浏览器是否允许弹窗和下载
2. 是否有安全策略阻止下载
3. 尝试在隐私/无痕模式下测试

## 调试工具

在控制台执行以下命令进行调试：

```javascript
// 检查依赖是否加载
checkPDFDeps()

// 手动测试 PDF 导出
testPDFExport()

// 检查 token 状态（如果有 403 错误）
import { debugToken } from '@/utils/token';
debugToken()
```

## 常见错误

### 错误 1: "Cannot read property 'addImage' of undefined"
**原因：** jsPDF 未正确初始化
**解决：** 升级 jspdf 到最新版本

### 错误 2: "Tainted canvases may not be exported"
**原因：** 跨域图片问题
**解决：** 确保头像图片配置了 CORS

### 错误 3: PDF 文件无法打开
**原因：** 图片数据过大或损坏
**解决：** 降低图片质量（imageQuality 参数）

### 错误 4: 403 Forbidden
**原因：** Token 过期或无效
**解决：** 重新登录获取新 token

## 验证清单

- [ ] 长文本不会横向溢出
- [ ] URL 链接会自动换行
- [ ] 点击"导出PDF"按钮有反应
- [ ] 控制台没有错误信息
- [ ] PDF 文件成功下载
- [ ] PDF 文件可以正常打开
- [ ] PDF 内容完整，分页正确
- [ ] 头像正常显示
- [ ] 中文字体正常显示
