/**
 * 行内编辑组件
 *
 * 支持点击编辑、实时保存、取消编辑
 * 用于用户名等简单字段的编辑
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  validate?: (value: string) => string | null;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  validate,
  label,
  placeholder = '点击编辑',
  maxLength = 20,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 进入编辑模式时自动聚焦
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 取消编辑时重置值
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
      setError(null);
    }
  }, [isEditing, value]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  }, [value]);

  const handleSave = useCallback(async () => {
    const trimmedValue = editValue.trim();

    // 验证
    if (validate) {
      const validationError = validate(trimmedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // 值未改变，直接取消编辑
    if (trimmedValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsLoading(false);
    }
  }, [editValue, value, validate, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  // 点击外部自动保存（如果有修改）
  const handleBlur = useCallback(() => {
    // 延迟执行，让点击按钮的事件先处理
    setTimeout(() => {
      if (editValue.trim() !== value && !error) {
        handleSave();
      } else if (editValue.trim() === value) {
        setIsEditing(false);
      }
    }, 200);
  }, [editValue, value, error, handleSave]);

  if (isEditing) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {label && (
          <span className="text-sm text-muted-foreground">{label}</span>
        )}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              maxLength={maxLength}
              disabled={isLoading}
              className={cn(
                'h-9 pr-20',
                error && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {editValue.length}/{maxLength}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="p-1.5 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
      <div
        onClick={handleStartEdit}
        className="group flex items-center gap-2 cursor-pointer py-1 px-2 -mx-2 rounded-md hover:bg-muted transition-colors"
      >
        <span className="text-base font-medium">{value}</span>
        <Pencil
          size={14}
          className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
};
