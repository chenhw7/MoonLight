/**
 * 右边栏实时预览组件
 * 
 * 使用完整的 ModernTemplate + SmartPagination
 * 支持自动缩放、多页滚动、页码指示器
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { ResumeFormData } from '@/types/resume';
import ModernTemplate from './templates/ModernTemplate';
import { useResumeHelpers } from '@/hooks/useResumeHelpers';
import { useSmartPagination } from '@/hooks/useSmartPagination';
import { Card } from '@/components/ui/card';

interface RightSidebarPreviewProps {
  data: ResumeFormData;
}

/**
 * 右边栏实时预览组件
 */
const RightSidebarPreview: React.FC<RightSidebarPreviewProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const helpers = useResumeHelpers();

  // A4 页面尺寸（像素）
  const A4_WIDTH_PX = 794; // 210mm × 3.7795
  const A4_HEIGHT_PX = 1123; // 297mm × 3.7795
  const PAGE_GAP_PX = 8; // 页面之间的间距（减小以让页面更紧密）

  /**
   * 自动计算缩放比例
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        // 减去左右 padding (24px × 2)
        const availableWidth = containerWidth - 48;
        // 计算缩放比例
        let calculatedScale = availableWidth / A4_WIDTH_PX;
        // 限制范围：0.3 ~ 0.6
        calculatedScale = Math.max(0.3, Math.min(calculatedScale, 0.6));
        setScale(calculatedScale);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [A4_WIDTH_PX]);

  /**
   * 监听滚动，更新当前页码
   */
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      // 缩放后的页面高度 + 间距 + 分隔符高度(约20px)
      const scaledPageHeight = A4_HEIGHT_PX * scale;
      const pageWithGap = scaledPageHeight + PAGE_GAP_PX + 20;
      
      // 计算当前页码（基于滚动位置）
      const page = Math.floor(scrollTop / pageWithGap) + 1;
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [scale, totalPages, A4_HEIGHT_PX, PAGE_GAP_PX]);

  /**
   * 渲染模板（memoize 避免不必要的重新渲染）
   */
  const renderedTemplate = useMemo(() => {
    return <ModernTemplate data={data} {...helpers} />;
  }, [data, helpers]);

  /**
   * 从 SmartPagination 获取总页数
   */
  const handlePagesCalculated = (pages: string[][]) => {
    setTotalPages(Math.max(1, pages.length));
  };

  return (
    <div ref={containerRef}>
      <Card className="flex flex-col overflow-hidden">
        {/* 标题栏 + 页码指示器 */}
        <div className="flex-shrink-0 p-4 border-b bg-muted/50 flex items-center justify-between">
          <h3 className="font-medium">实时预览</h3>
          <div className="text-sm text-muted-foreground font-mono">
            {currentPage}/{totalPages}
          </div>
        </div>

        {/* 可滚动的预览区域 */}
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto overflow-x-hidden bg-gray-50"
          style={{
            scrollBehavior: 'smooth',
            maxHeight: 'calc(100vh - 180px)',
          }}
        >
          <div
            className="py-4 px-6"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: `${PAGE_GAP_PX}px`,
            }}
          >
            {/* 使用自定义的 SmartPagination，支持页码回调 */}
            <SmartPaginationWithPageIndicator
              scale={scale}
              onPagesCalculated={handlePagesCalculated}
            >
              {renderedTemplate}
            </SmartPaginationWithPageIndicator>
          </div>
        </div>
      </Card>
    </div>
  );
};

/**
 * 增强版 SmartPagination - 支持缩放和页面分隔指示器
 */
interface SmartPaginationWithPageIndicatorProps {
  children: React.ReactNode;
  scale: number;
  onPagesCalculated: (pages: string[][]) => void;
}

const SmartPaginationWithPageIndicator: React.FC<SmartPaginationWithPageIndicatorProps> = ({
  children,
  scale,
  onPagesCalculated,
}) => {
  const { pages, measureRef } = useSmartPagination(children);

  useEffect(() => {
    onPagesCalculated(pages);
  }, [pages, onPagesCalculated]);

  return (
    <>
      {/* 隐藏的测量容器 */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '174mm', // 与 SmartPagination 保持一致 (210mm - 18mm*2)
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>

      {/* 渲染分页后的内容 */}
      {pages.length > 0 ? (
        pages.map((pageBlocks, pageIndex) => (
          <React.Fragment key={pageIndex}>
            {/* 外层 wrapper：显式设定缩放后的尺寸，消除 transform 布局占位问题 */}
            <div
              style={{
                width: `${794 * scale}px`,
                height: `${1123 * scale}px`,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* A4 页面容器 - 保持完整尺寸 */}
              <div
                className="bg-white shadow-lg"
                style={{
                  width: '794px',
                  minHeight: '1123px',
                  padding: '68px 68px',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
                dangerouslySetInnerHTML={{ __html: pageBlocks.join('') }}
              />
            </div>

            {/* 页面分隔指示器 */}
            {pageIndex < pages.length - 1 && (
              <div className="flex items-center justify-center text-xs text-gray-400 w-full py-1">
                <div className="flex items-center gap-2">
                  <div className="h-px w-8 bg-gray-300" />
                  <span>第 {pageIndex + 1} 页</span>
                  <div className="h-px w-8 bg-gray-300" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))
      ) : (
        // 加载状态
        <div
          style={{
            width: `${794 * scale}px`,
            height: `${400 * scale}px`,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            className="bg-white shadow-lg flex items-center justify-center"
            style={{
              width: '794px',
              minHeight: '400px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <div className="text-gray-400 text-sm">加载中...</div>
          </div>
        </div>
      )}
    </>
  );
};

export default RightSidebarPreview;
