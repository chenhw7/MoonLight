/**
 * 智能分页组件
 *
 * 自动将简历内容分配到多个A4页面
 * 确保每个 section 不被截断，预览和 PDF 导出效果一致
 */

import React, { useEffect, useRef, useState } from 'react';
import PageContainer from './PageContainer';

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
  const [pages, setPages] = useState<string[][]>([]);
  const measureRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // A4 页面内容可用高度
  // 总高 297mm − 上下边距 18mm × 2 = 261mm
  // 261mm × 3.7795 px/mm ≈ 986px
  const PAGE_HEIGHT_PX = 986;

  useEffect(() => {
    // 清理上一次调度
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const doMeasure = () => {
      if (!measureRef.current) return;

      // ★ 关键：ModernTemplate 渲染为一个根 <div>，
      //   其直接子元素才是 header / section 等内容块
      const templateRoot = measureRef.current.firstElementChild as HTMLElement | null;
      if (!templateRoot) return;

      const blocks = Array.from(templateRoot.children) as HTMLElement[];
      if (blocks.length === 0) return;

      // ---- 智能分页算法 ----
      const result: string[][] = [];
      let currentPage: string[] = [];
      let usedHeight = 0;

      for (const block of blocks) {
        const blockH = block.offsetHeight;
        const cs = window.getComputedStyle(block);
        const mt = parseFloat(cs.marginTop) || 0;
        const mb = parseFloat(cs.marginBottom) || 0;
        const totalH = blockH + mt + mb;

        // 放不下且当前页已有内容 → 换页
        if (usedHeight + totalH > PAGE_HEIGHT_PX && currentPage.length > 0) {
          result.push(currentPage);
          currentPage = [];
          usedHeight = 0;
        }

        currentPage.push(block.outerHTML);
        usedHeight += totalH;
      }

      if (currentPage.length > 0) {
        result.push(currentPage);
      }

      setPages(result);
    };

    // 等待隐藏容器完成渲染后再测量
    // requestAnimationFrame 确保 DOM 已就绪，setTimeout 等待字体/样式生效
    rafRef.current = requestAnimationFrame(() => {
      timerRef.current = setTimeout(doMeasure, 200);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [children]);

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
