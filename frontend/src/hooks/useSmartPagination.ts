import { useState, useRef, useEffect } from 'react';

/**
 * 智能分页 Hook
 * 
 * 自动计算内容分页，支持模块内部拆分
 * 
 * @param children 内容
 * @param pageHeightPx 页面内容区域高度（像素），默认 A4 除去上下边距 (986px)
 * @returns { pages: string[][], measureRef: React.RefObject<HTMLDivElement> }
 */
export function useSmartPagination(children: React.ReactNode, pageHeightPx: number = 986) {
  const [pages, setPages] = useState<string[][]>([]);
  const measureRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // 清理上一次调度
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const doMeasure = () => {
      if (!measureRef.current) return;

      // 获取模板根元素
      const templateRoot = measureRef.current.firstElementChild as HTMLElement | null;
      if (!templateRoot) return;

      const blocks = Array.from(templateRoot.children) as HTMLElement[];
      if (blocks.length === 0) return;

      // ---- 智能分页算法 (支持模块拆分) ----
      const result: string[][] = [];
      let currentPage: string[] = [];
      let usedHeight = 0;

      for (const block of blocks) {
        const blockH = block.offsetHeight;
        const cs = window.getComputedStyle(block);
        const mt = parseFloat(cs.marginTop) || 0;
        const mb = parseFloat(cs.marginBottom) || 0;
        const pt = parseFloat(cs.paddingTop) || 0;
        const pb = parseFloat(cs.paddingBottom) || 0;
        const bt = parseFloat(cs.borderTopWidth) || 0;
        const bb = parseFloat(cs.borderBottomWidth) || 0;
        const totalH = blockH + mt + mb;

        // 1. 如果当前模块能完整放入当前页，直接放入
        if (usedHeight + totalH <= pageHeightPx) {
          currentPage.push(block.outerHTML);
          usedHeight += totalH;
          continue;
        }

        // 2. 如果放不下，尝试拆分模块
        // 检查是否有子元素可拆分 (例如 section 下的 h2 和 div)
        const children = Array.from(block.children) as HTMLElement[];
        if (children.length === 0) {
          // 无子元素，无法拆分，直接换页
          if (currentPage.length > 0) {
            result.push(currentPage);
            currentPage = [];
            usedHeight = 0;
          }
          currentPage.push(block.outerHTML);
          usedHeight += totalH;
          continue;
        }

        // 开始拆分逻辑
        // 克隆容器标签 (不含子元素)
        const cloneContainer = block.cloneNode(false) as HTMLElement;
        // 容器的基础高度 (padding + border)
        const wrapperOverhead = pt + pb + bt + bb;
        
        let currentPartChildren: string[] = [];
        let currentPartHeight = mt + wrapperOverhead; // 初始高度包含 margin-top 和容器自身

        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const childH = child.offsetHeight;
          const childCs = window.getComputedStyle(child);
          const childMt = parseFloat(childCs.marginTop) || 0;
          const childMb = parseFloat(childCs.marginBottom) || 0;
          const childTotalH = childH + childMt + childMb;

          // 检查当前子元素是否放入当前页
          if (usedHeight + currentPartHeight + childTotalH <= pageHeightPx) {
            currentPartChildren.push(child.outerHTML);
            currentPartHeight += childTotalH;
          } else {
            // 放不下，需要换页
            const isStartOfPage = usedHeight === 0;
            
            // 孤儿标题检测：如果当前部分只有标题 (h2/h3...)，则将其移动到下一页
            const isTitle = (html: string) => /<h[1-6]/.test(html);
            const onlyHasTitle = currentPartChildren.length === 1 && isTitle(currentPartChildren[0]);
            
            // 如果不是在页面顶部，且（当前部分为空 或 只有标题） -> 换页重试 (把标题带到下一页)
            if (!isStartOfPage && (currentPartChildren.length === 0 || onlyHasTitle)) {
              if (currentPage.length > 0) {
                result.push(currentPage);
                currentPage = [];
                usedHeight = 0;
              }
              
              // 重置状态，重新处理当前子元素 (及之前的标题)
              if (onlyHasTitle) {
                 i -= currentPartChildren.length; 
              } else {
                 i--;
              }
              
              currentPartChildren = [];
              currentPartHeight = wrapperOverhead; 
              continue;
            }

            // 如果是在页面顶部，且放不下 -> 强制放入 (避免死循环，接受溢出)
            if (isStartOfPage && (currentPartChildren.length === 0 || onlyHasTitle)) {
                currentPartChildren.push(child.outerHTML);
                currentPartHeight += childTotalH;
                continue;
            }

            // 正常换页：封装当前部分
            cloneContainer.innerHTML = currentPartChildren.join('');
            currentPage.push(cloneContainer.outerHTML);
            result.push(currentPage);
            
            // 开启新页
            currentPage = [];
            usedHeight = 0;
            currentPartChildren = [];
            currentPartHeight = wrapperOverhead; // 新页部分不需要 block 的 margin-top
            i--; // 回退，重新处理当前子元素
          }
        }

        // 处理剩余的子元素
        if (currentPartChildren.length > 0) {
          cloneContainer.innerHTML = currentPartChildren.join('');
          currentPage.push(cloneContainer.outerHTML);
          usedHeight += currentPartHeight + mb; // 加上 block 的 margin-bottom
        }
      }

      if (currentPage.length > 0) {
        result.push(currentPage);
      }

      setPages(result);
    };

    // 等待隐藏容器完成渲染后再测量
    rafRef.current = requestAnimationFrame(() => {
      timerRef.current = setTimeout(doMeasure, 200);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [children, pageHeightPx]);

  return {
    pages,
    measureRef
  };
}
