/**
 * 动态表单列表组件
 *
 * 支持添加、删除、排序多条记录的表单组件
 */

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 可排序项的属性
 */
interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  onRemove: () => void;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * 可排序项组件
 */
const SortableItem: React.FC<SortableItemProps> = ({
  id,
  children,
  onRemove,
  title,
  isExpanded,
  onToggle,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-50')}>
      <Card className="mb-4">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="font-medium text-sm">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        {isExpanded && <CardContent className="pt-0">{children}</CardContent>}
      </Card>
    </div>
  );
};

/**
 * 动态表单列表属性
 */
interface DynamicFormListProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemId: (item: T, index: number) => string;
  getItemTitle: (item: T, index: number) => string;
  addButtonText: string;
  emptyText?: string;
  onAdd: () => void;
  minItems?: number;
}

/**
 * 动态表单列表组件
 */
function DynamicFormList<T>({
  items,
  onChange,
  renderItem,
  getItemId,
  getItemTitle,
  addButtonText,
  emptyText = '暂无记录，点击添加',
  onAdd,
  minItems = 0,
}: DynamicFormListProps<T>) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    () => new Set(items.map((_, i) => getItemId(items[i], i)))
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * 处理拖拽结束
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(
        (item, i) => getItemId(item, i) === active.id
      );
      const newIndex = items.findIndex(
        (item, i) => getItemId(item, i) === over.id
      );

      onChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  /**
   * 处理删除
   */
  const handleRemove = (index: number) => {
    if (items.length <= minItems) {
      return;
    }
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  /**
   * 切换展开状态
   */
  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
          {emptyText}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item, i) => getItemId(item, i))}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item, index) => (
              <SortableItem
                key={getItemId(item, index)}
                id={getItemId(item, index)}
                title={getItemTitle(item, index)}
                onRemove={() => handleRemove(index)}
                isExpanded={expandedItems.has(getItemId(item, index))}
                onToggle={() => toggleExpanded(getItemId(item, index))}
              >
                {renderItem(item, index)}
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        className="w-full"
      >
        {addButtonText}
      </Button>
    </div>
  );
}

export default DynamicFormList;
