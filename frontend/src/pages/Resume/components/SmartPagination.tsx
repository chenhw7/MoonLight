/**
 * 智能分页组件
 *
 * 自动将简历内容分配到多个A4页面
 * 确保每个 section 不被截断，预览和 PDF 导出效果一致
 */

import React from 'react';
import PageContainer from './PageContainer';
import { useSmartPagination } from '@/hooks/useSmartPagination';

interface SmartPaginationProps {
  children: React.ReactNode;
}

/**
 * 智能分页组件
 *
 * 工作原理：
 * 1. 在一个隐藏的等宽容器中渲染模板内容
 * 2. 查找模板根元素（div）的直接子元素（header / section 等内容块）
 * 3. 逐个测量内容块高度，按 A4 内容区高度将其分配到不同页面
 * 4. 用 outerHTML + dangerouslySetInnerHTML 将内容渲染到各 PageContainer
 */
const SmartPagination: React.FC<SmartPaginationProps> = ({ children }) => {
  const { pages, measureRef } = useSmartPagination(children);
  
  const totalPages = Math.max(1, pages.length);

  return (
    <>
      {/* 隐藏的测量容器 —— 宽度与 A4 内容区一致 */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '174mm', // 210mm - 18mm × 2
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>

      {/* 分页后的内容 */}
      {pages.length > 0
        ? pages.map((sectionHTMLs, pageIdx) => (
            <PageContainer
              key={pageIdx}
              pageNumber={pageIdx + 1}
              isLastPage={pageIdx === totalPages - 1}
            >
              {sectionHTMLs.map((html, sIdx) => (
                <div
                  key={`p${pageIdx}-s${sIdx}`}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ))}
            </PageContainer>
          ))
        : (
            <PageContainer pageNumber={1} isLastPage>
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                正在排版...
              </div>
            </PageContainer>
          )}
    </>
  );
};

export default SmartPagination;
