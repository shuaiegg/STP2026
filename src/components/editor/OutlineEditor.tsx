"use client";

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus, Type, Heading2, Heading3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AlertDialog } from '@/components/ui/AlertDialog';

// Types
export interface OutlineNode {
    level: number;
    text: string;
}

interface OutlineItem extends OutlineNode {
    id: string;
}

interface OutlineEditorProps {
    initialData: OutlineNode[];
    onChange: (data: OutlineNode[]) => void;
}

// --- Sortable Item Component ---
function SortableItem({
    item,
    onRemove,
    onUpdate,
    onToggleLevel
}: {
    item: OutlineItem;
    onRemove: (id: string) => void;
    onUpdate: (id: string, text: string) => void;
    onToggleLevel: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all group bg-white ${isDragging
                ? 'border-brand-primary shadow-lg scale-[1.02]'
                : 'border-slate-100 hover:border-brand-primary/30'
                } ${item.level > 2 ? 'ml-8' : ''}`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-move text-slate-300 hover:text-brand-primary transition-colors p-1"
            >
                <GripVertical size={16} />
            </div>

            {/* Level Toggle Badge */}
            <button
                type="button"
                onClick={() => onToggleLevel(item.id)}
                className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-black text-xs border transition-colors ${item.level === 1
                    ? 'bg-brand-primary text-white border-brand-primary' // H1 shouldn't really be here multiple times, but just in case
                    : item.level === 2
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        : 'bg-white text-slate-400 border-slate-100 hover:text-brand-primary hover:border-brand-primary'
                    }`}
                title="点击切换标题层级 (H2/H3)"
            >
                {item.level === 1 ? 'H1' : item.level === 2 ? 'H2' : 'H3'}
            </button>

            {/* Input */}
            <input
                value={item.text}
                onChange={(e) => onUpdate(item.id, e.target.value)}
                className={`flex-1 bg-transparent border-none outline-none font-bold text-slate-700 placeholder:text-slate-300 ${item.level === 2 ? 'text-sm' : 'text-xs'
                    }`}
                placeholder="输入标题..."
            />

            {/* Delete Button */}
            <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg hover:bg-red-50"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}

// --- Main Editor Component ---
export function OutlineEditor({ initialData, onChange }: OutlineEditorProps) {
    const [items, setItems] = useState<OutlineItem[]>(() =>
        initialData.map((node) => ({ ...node, id: crypto.randomUUID() }))
    );
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Sync changes back to parent
    useEffect(() => {
        const cleanData = items.map(({ level, text }) => ({ level, text }));
        onChange(cleanData);
    }, [items, onChange]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleRemoveRequest = (id: string) => {
        setItemToDelete(id);
    };

    const confirmRemove = () => {
        if (itemToDelete) {
            setItems((items) => items.filter((i) => i.id !== itemToDelete));
            setItemToDelete(null);
        }
    };

    const handleUpdate = (id: string, text: string) => {
        setItems((items) =>
            items.map((i) => (i.id === id ? { ...i, text } : i))
        );
    };

    const handleToggleLevel = (id: string) => {
        setItems((items) =>
            items.map((i) => {
                if (i.id === id) {
                    // Toggle between 2 and 3. (Keep 1 as 1 if exists, though H1 implies root)
                    const newLevel = i.level === 2 ? 3 : i.level === 3 ? 2 : i.level;
                    return { ...i, level: newLevel };
                }
                return i;
            })
        );
    };

    const handleAdd = () => {
        const newItem: OutlineItem = {
            id: crypto.randomUUID(),
            level: 2,
            text: "新生成的段落标题"
        };
        setItems((prev) => [...prev, newItem]);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-3">
                <SortableContext
                    items={items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {items.map((item) => (
                        <SortableItem
                            key={item.id}
                            item={item}
                            onRemove={handleRemoveRequest}
                            onUpdate={handleUpdate}
                            onToggleLevel={handleToggleLevel}
                        />
                    ))}
                </SortableContext>

                <Button
                    onClick={handleAdd}
                    variant="outline"
                    className="w-full border-dashed border-2 border-slate-200 text-slate-400 hover:text-brand-primary hover:border-brand-primary hover:bg-brand-surface/50 mt-4"
                >
                    <Plus size={16} className="mr-2" /> 添加段落
                </Button>
            </div>

            <AlertDialog
                isOpen={!!itemToDelete}
                title="移除这个段落？"
                description="删除后，生成的文章中将不再包含此部分内容。该操作不可撤销。"
                confirmLabel="确认删除"
                isDestructive
                onConfirm={confirmRemove}
                onCancel={() => setItemToDelete(null)}
            />
        </DndContext>
    );
}
