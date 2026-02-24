/**
 * 圆形头像组件
 *
 * 用于个人资料页面展示用户头像
 * 支持点击触发更换头像
 */

import React from 'react';
import { User, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CircularAvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

const iconSizes = {
  sm: 20,
  md: 28,
  lg: 40,
  xl: 48,
};

export const CircularAvatar: React.FC<CircularAvatarProps> = ({
  src,
  alt = '用户头像',
  size = 'lg',
  editable = false,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800',
        'flex items-center justify-center',
        'transition-all duration-200',
        editable && 'cursor-pointer hover:ring-4 hover:ring-primary/20',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <User
          size={iconSizes[size]}
          className="text-gray-400 dark:text-gray-500"
        />
      )}

      {/* 悬停时的遮罩和相机图标 */}
      {editable && (
        <div
          className={cn(
            'absolute inset-0 bg-black/40 flex items-center justify-center',
            'opacity-0 hover:opacity-100 transition-opacity duration-200'
          )}
        >
          <Camera className="text-white" size={iconSizes[size] * 0.6} />
        </div>
      )}
    </div>
  );
};
