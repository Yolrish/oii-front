'use client';

import React, { useState } from 'react';
import { Canvas, useCanvasItems, type CanvasItemData, type CanvasMode, type Point } from '../index';

/**
 * Canvas组件使用示例
 * 展示如何使用Canvas组件、useCanvasItems Hook、三种鼠标模式和受控缩放
 */
export default function CanvasExample() {
    // 当前鼠标模式
    const [mode, setMode] = useState<CanvasMode>('normal');

    // 受控的缩放比例
    const [scale, setScale] = useState(1);

    // 受控的偏移量（可选）
    const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

    // 使用 useCanvasItems Hook 管理画布中的items
    const { items, addItem, updateItemPosition, removeItem, clearItems } = useCanvasItems([
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
            width: 180 + Math.random() * 60,
            height: 120 + Math.random() * 60,
            data: {
                title: `Card ${items.length + 1}`,
                color: randomColor,
            },
        });
    };

    // 模式按钮样式
    const getModeButtonStyle = (buttonMode: CanvasMode) => ({
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: 500,
        backgroundColor: mode === buttonMode ? 'hsl(var(--primary))' : 'hsl(var(--card))',
        color: mode === buttonMode ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    });

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
                {/* 缩放控制 */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        backgroundColor: 'hsl(var(--card) / 0.95)',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                    }}
                >
                    <button
                        onClick={() => setScale((s) => Math.max(0.2, s - 0.1))}
                        style={{
                            width: '28px',
                            height: '28px',
                            fontSize: '16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: 'hsl(var(--foreground))',
                        }}
                    >
                        −
                    </button>
                    <span
                        style={{
                            minWidth: '50px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'hsl(var(--foreground))',
                        }}
                    >
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => setScale((s) => Math.min(3, s + 0.1))}
                        style={{
                            width: '28px',
                            height: '28px',
                            fontSize: '16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: 'hsl(var(--foreground))',
                        }}
                    >
                        +
                    </button>
                    <button
                        onClick={() => setScale(1)}
                        style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            backgroundColor: 'hsl(var(--muted))',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: 'hsl(var(--muted-foreground))',
                        }}
                    >
                        Reset
                    </button>
                </div>
                {/* 清空 */}
                <button
                    onClick={() => clearItems()}
                    style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                        backgroundColor: 'hsl(var(--destructive, #ef4444))',
                        color: 'hsl(var(--destructive-foreground, white))',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                    title="Clear all items"
                >
                    Clear All
                </button>
            </div>

            {/* 模式切换器 */}
            <div
                style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '4px',
                    padding: '4px',
                    backgroundColor: 'hsl(var(--card) / 0.95)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <button
                    onClick={() => setMode('grab')}
                    style={getModeButtonStyle('grab')}
                    title="Grab Mode - Drag to pan canvas"
                >
                    🖐️ Grab
                </button>
                <button
                    onClick={() => setMode('normal')}
                    style={getModeButtonStyle('normal')}
                    title="Normal Mode - Double-click to fit item"
                >
                    🖱️ Normal
                </button>
                <button
                    onClick={() => setMode('move')}
                    style={getModeButtonStyle('move')}
                    title="Move Mode - Drag to move items"
                >
                    ✥ Move
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
                {mode === 'grab' && (
                    <span>🖐️ <strong>Grab Mode:</strong> Drag anywhere to pan the canvas</span>
                )}
                {mode === 'normal' && (
                    <span>🖱️ <strong>Normal Mode:</strong> Double-click a card to fit it to view</span>
                )}
                {mode === 'move' && (
                    <span>✥ <strong>Move Mode:</strong> Drag cards to reposition them</span>
                )}
                <span style={{ marginLeft: '16px', opacity: 0.7 }}>
                    (Middle-click + drag always pans | Ctrl + scroll to zoom)
                </span>
            </div>

            {/* Canvas组件 - 使用受控的scale和offset */}
            <Canvas
                items={items}
                renderItem={renderItem}
                onItemMove={updateItemPosition}
                mode={mode}
                onModeChange={setMode}
                showGrid={true}
                gridSize={20}
                minScale={0.2}
                maxScale={3}
                autoFitNewItem={true}
                // 受控模式：外部控制缩放
                scale={scale}
                onScaleChange={setScale}
                // 受控模式：外部控制偏移（可选）
                offset={offset}
                onOffsetChange={setOffset}
            />
        </div>
    );
}
