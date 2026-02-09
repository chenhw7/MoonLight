# 智能分页和文字可复制PDF - 使用指南

## 问题修复

### ✅ 已修复的问题

1. **文字无法复制** - 改用浏览器原生打印功能，生成的PDF文字完全可复制
2. **最后一行被截断** - 智能分页算法确保section不会被截断
3. **移除页码显示** - PageContainer不再显示"第X页"
4. **智能分页** - 自动根据内容高度分配到多个页面

## 核心改进

### 1. 智能分页组件（SmartPagination）

**文件：** `frontend/src/pages/Resume/components/SmartPagination.tsx`

**工作原理：**
```
1. 在隐藏容器中渲染所有内容
2. 测量每个section的高度
3. 计算页面可用高度（986px ≈ 261mm）
4. 按贪心算法分配：
   - 从第一个section开始累加高度
   - 如果当前页放不下，创建新页
   - 确保section完整，不被截断
5. 生成多个PageContainer
```

**关键参数：**
- `PAGE_HEIGHT_PX = 986` - A4可用高度（297mm - 18mm×2）

### 2. 打印导出（exportToPrintablePDF）

**文件：** `frontend/src/utils/pdf.ts`

**改动：**
- 移除html2canvas（图片导出）
- 使用 `window.print()` 浏览器原生打印
- 配合 `@media print` CSS实现完美分页

**优势：**
- ✅ 文字完全可复制
- ✅ PDF文件更小
- ✅ 打印质量更高
- ✅ 不需要额外的图片库

### 3. 打印样式优化

**文件：** `frontend/src/pages/Resume/resume-print.css`

**关键样式：**
```css
@page {
  size: A4 portrait;
  margin: 0;
}

.page-container {
  page-break-after: always;  /* 每页后强制分页 */
  page-break-inside: avoid;  /* 页面内容不截断 */
}

section {
  page-break-inside: avoid;  /* section不截断 */
}
```

## 使用方法

### 1. 预览简历

打开简历预览页面：
- 内容自动分配到多个白色卡片（每个代表一页）
- 页面之间有20px间隔
- 可以缩放查看
- 不再显示页码

### 2. 导出PDF

点击"导出PDF"按钮：
1. 浏览器打开打印对话框
2. 选择"另存为PDF"或直接打印
3. 设置：
   - 页面大小：A4
   - 边距：无边距（已在CSS中设置）
   - 背景图形：开启（保留样式）
4. 保存或打印

### 3. 验证效果

打开生成的PDF：
- ✅ 每页都有18mm边距
- ✅ 内容不会被截断
- ✅ 文字可以选中和复制
- ✅ 格式保持一致
- ✅ 分页位置正确

## 技术细节

### 页面高度计算

```
A4纸张：210mm × 297mm
上下边距：18mm × 2 = 36mm
可用高度：297mm - 36mm = 261mm

转换为像素（96 DPI）：
261mm × 3.7795 px/mm ≈ 986px
```

### 智能分页算法（贪心）

```typescript
let currentHeight = 0;
const PAGE_HEIGHT = 986;

sections.forEach(section => {
  const height = section.offsetHeight;
  
  if (currentHeight + height > PAGE_HEIGHT) {
    // 创建新页
    currentHeight = height;
  } else {
    // 添加到当前页
    currentHeight += height;
  }
});
```

### 打印流程

```
用户点击"导出PDF"
  ↓
调用 window.print()
  ↓
浏览器应用 @media print 样式
  ↓
.page-container 设置 page-break-after: always
  ↓
每个页面独立打印/导出
  ↓
生成PDF文件
```

## 浏览器兼容性

### 支持的浏览器
- ✅ Chrome/Edge（推荐）
- ✅ Firefox
- ✅ Safari
- ⚠️ IE不支持（已过时）

### 推荐设置

**Chrome/Edge:**
- 目标打印机：另存为PDF
- 页面：全部
- 布局：纵向
- 页面大小：A4
- 边距：无
- 选项：背景图形 ✓

**Firefox:**
- 打印到：PDF
- 纸张大小：A4
- 方向：纵向
- 页边距：无
- 打印背景：是

## 常见问题

### Q1: PDF文字还是无法复制？
**A:** 确保在打印对话框中选择"另存为PDF"，而不是截图或扫描。

### Q2: 分页位置不对？
**A:** 可能是DPI设置问题，尝试调整 `PAGE_HEIGHT_PX` 参数。

### Q3: 第二页上边距丢失？
**A:** 检查 `@media print` 中的 `.page-container` 样式是否正确应用。

### Q4: 打印预览和实际PDF不一致？
**A:** 确保浏览器缩放为100%，清除浏览器缓存后重试。

### Q5: 内容仍然被截断？
**A:** 检查是否有 `section` 的高度超过了一页，需要拆分该section。

## 后续优化方向

### 1. 更智能的分页
- 支持段落级别的分页（而不仅是section级别）
- 避免孤行（一页开头或结尾只有一行）
- 支持用户手动调整分页位置

### 2. 导出格式
- 支持直接导出为.docx（Word格式）
- 支持导出为纯文本
- 支持导出为Markdown

### 3. 高级功能
- 页眉页脚自定义
- 水印支持
- 多模板切换时保持分页一致性

## 测试清单

- [ ] 短简历（1页）：正确显示，文字可复制
- [ ] 中等简历（2-3页）：正确分页，无截断
- [ ] 长简历（5+页）：所有页面边距一致
- [ ] 长文本：自动换行，不溢出
- [ ] 图片（头像）：正常显示，不模糊
- [ ] 中文字符：显示正常，可复制
- [ ] 英文字符：显示正常，可复制
- [ ] 特殊符号：显示正常
- [ ] Chrome导出：效果正确
- [ ] Firefox导出：效果正确
- [ ] Safari导出：效果正确

## 文件清单

### 核心文件
- `SmartPagination.tsx` - 智能分页组件（新增）
- `PageContainer.tsx` - 页面容器（移除页码）
- `ResumePreview.tsx` - 预览组件（使用智能分页）
- `pdf.ts` - PDF导出工具（使用window.print）
- `resume-print.css` - 打印样式（优化分页）

### 移除的代码
- `exportMultiPageToPDF()` - 旧的图片导出方法
- `html2canvas` 相关代码 - 不再需要
- `getPageBreakPositions()` - 旧的分页线计算

## 总结

这次重构从根本上解决了PDF导出的核心问题：

1. **文字可复制** - 使用原生打印，而不是图片
2. **智能分页** - 自动测量和分配内容
3. **预览一致** - 所见即所得

用户体验：
- 点击"导出PDF" → 浏览器打印对话框 → 选择"另存为PDF" → 完成

简单、高效、可靠！
