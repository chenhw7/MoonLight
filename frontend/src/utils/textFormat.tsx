/**
 * 文本格式化工具函数
 *
 * 支持将 **加粗文本** 语法解析为 React 元素
 */

import React from 'react';

/**
 * 解析加粗语法，将 **文本** 转换为加粗样式
 *
 * @param text - 原始文本
 * @returns React 节点数组
 *
 * @example
 * parseBoldText('负责 **前端开发** 工作')
 * // 返回: ['负责 ', <strong>前端开发</strong>, ' 工作']
 */
export function parseBoldText(text: string | undefined | null): React.ReactNode {
  if (!text) return null;

  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    const match = part.match(/^\*\*([^*]+)\*\*$/);
    if (match) {
      return <strong key={index}>{match[1]}</strong>;
    }
    return part;
  });
}

/**
 * 渲染支持加粗语法的文本段落
 *
 * @param text - 原始文本
 * @param className - 额外的 CSS 类名
 * @param style - 额外的样式
 * @returns 段落元素
 */
export function renderFormattedParagraph(
  text: string | undefined | null,
  className?: string,
  style?: React.CSSProperties
): React.ReactElement | null {
  if (!text) return null;

  return (
    <p className={className} style={style}>
      {parseBoldText(text)}
    </p>
  );
}
