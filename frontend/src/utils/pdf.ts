/**
 * PDF 导出工具
 * 
 * 使用浏览器原生打印功能实现文字可复制的 PDF 导出
 * 支持智能分页，预览和导出效果一致
 */

/**
 * PDF 导出选项
 */
export interface ExportPDFOptions {
  /** PDF 文件名（不含扩展名） */
  filename?: string;
  /** 导出成功回调 */
  onSuccess?: () => void;
  /** 导出失败回调 */
  onError?: (error: Error) => void;
}

/**
 * 将页面导出为文字可复制的 PDF
 * 
 * 使用 window.print() 触发浏览器打印对话框
 * 用户可以选择"另存为PDF"来生成PDF文件
 * 
 * @param filename - 文件名（用于设置文档标题）
 */
export async function exportToPrintablePDF(
  filename: string = '简历'
): Promise<void> {
  try {
    console.log('准备打印PDF...');
    
    // 保存原始标题
    const originalTitle = document.title;
    
    // 设置打印标题
    document.title = filename;
    
    // 添加打印标记class，用于CSS选择器精确控制打印范围
    document.body.classList.add('printing-resume');
    
    // 延迟触发打印，确保class已应用到DOM
    setTimeout(() => {
      // 触发浏览器打印对话框
      window.print();
      
      // 恢复原始状态
      document.title = originalTitle;
      document.body.classList.remove('printing-resume');
      
      console.log('打印对话框已打开');
    }, 100);
  } catch (error) {
    console.error('打印失败:', error);
    // 确保出错时也移除class
    document.body.classList.remove('printing-resume');
    throw error;
  }
}
