import React from 'react';
import { logger } from '@/utils/logger';

/**
 * {{ComponentName}} 组件
 *
 * @description 组件描述
 * @param props - 组件属性
 */
interface {{ComponentName}}Props {
  // 定义 props
}

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = (props) => {
  logger.debug('{{ComponentName}} rendered');

  return (
    <div>
      {/* 组件内容 */}
    </div>
  );
};

export default {{ComponentName}};
