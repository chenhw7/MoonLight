/**
 * 页面容器组件
 *
 * 用于简历预览和PDF导出的单页容器
 * 每个页面都是独立的 A4 纸张容器，包含 18mm 四周边距
 */

import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  pageNumber: number;
  isLastPage?: boolean;
}

/**
 * A4 页面容器
 *
 * 固定尺寸为 A4 纸张（210mm × 297mm）
 * 包含 18mm 的上下左右边距，每页内容可用高度 ≈ 261mm
 */
const PageContainer: React.FC<PageContainerProps> = ({
  children,
  pageNumber,
  isLastPage = false,
}) => {
  return (
    <div
      className="page-container bg-white text-gray-900 relative"
      data-page={pageNumber}
      style={{
        width: '210mm',
        height: '297mm',
        padding: '18mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
        marginBottom: isLastPage ? '0' : '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        position: 'relative',
      }}
    >
      {/* 页面内容 —— 不设固定高度，由外层 overflow:hidden 裁剪 */}
      <div style={{ width: '100%' }}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
