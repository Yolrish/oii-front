'use client';

import React from 'react';
import Canvas, { useCanvasItems, type CanvasItemData } from '../Canvas';

/**
 * Canvas组件使用示例
 * 展示如何使用Canvas组件和useCanvasItems Hook
 */
export default function CanvasExample() {
    // 使用 useCanvasItems Hook 管理画布中的items
    const { items, addItem, updateItemPosition, removeItem } = useCanvasItems([
        // 初始items
        {
            id: 'item-1',
            x: 100,
            y: 100,
            width: 200,
            height: 150,
            data: { title: 'Card 1', color: '#3b82f6' },
        },
        {
            id: 'item-2',
            x: 400,
            y: 200,
            width: 180,
            height: 120,
            data: { title: 'Card 2', color: '#10b981' },
        },
        {
            id: 'item-3',
            x: 200,
            y: 400,
            width: 220,
            height: 160,
            data: { title: 'Card 3', color: '#f59e0b' },
        },
    ]);

    // 渲染单个item的函数
    const renderItem = (item: CanvasItemData) => {
        const { title, color } = (item.data || {}) as { title?: string; color?: string };

        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    padding: '16px',
                    backgroundColor: color || '#6366f1',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                    {title || 'Untitled'}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
                    Position: ({Math.round(item.x)}, {Math.round(item.y)})
                </p>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                    }}
                    style={{
                        marginTop: '8px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer',
                    }}
                >
                    Delete
                </button>
            </div>
        );
    };

    // 添加新item
    const handleAddItem = () => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        addItem({
            id: `item-${Date.now()}`,
            x: Math.random() * 500 + 100,
            y: Math.random() * 400 + 100,
            width: 180 + Math.random() * 60,
            height: 120 + Math.random() * 60,
            data: {
                title: `Card ${items.length + 1}`,
                color: randomColor,
            },
        });
    };

    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            {/* 工具栏 */}
            <div
                style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '8px',
                }}
            >
                <button
                    onClick={handleAddItem}
                    style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                >
                    + Add Card
                </button>
            </div>

            {/* 操作提示 */}
            <div
                style={{
                    position: 'absolute',
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    padding: '8px 16px',
                    backgroundColor: 'hsl(var(--card) / 0.95)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    backdropFilter: 'blur(8px)',
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))',
                }}
            >
                <span style={{ marginRight: '16px' }}>🖱️ Middle-click + drag to pan</span>
                <span style={{ marginRight: '16px' }}>⚙️ Ctrl + scroll to zoom</span>
                <span>📦 Drag cards to move</span>
            </div>

            {/* Canvas组件 */}
            <Canvas
                items={items}
                renderItem={renderItem}
                onItemMove={updateItemPosition}
                showGrid={true}
                gridSize={20}
                minScale={0.2}
                maxScale={3}
            />
        </div>
    );
}

