'use client';

import React, {
    useRef,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
    type MouseEvent as ReactMouseEvent,
} from 'react';
import styles from './Canvas.module.css';
import { cn } from '@/lib/utils';

// ==================== 类型定义 ====================

/** 2D坐标点 */
export interface Point {
    x: number;
    y: number;
}

/** 画布视图状态 */
export interface ViewState {
    /** 画布偏移量 */
    offset: Point;
    /** 缩放比例 */
    scale: number;
}

/** 可拖拽组件的位置和尺寸 */
export interface CanvasItemData {
    /** 唯一标识符 */
    id: string;
    /** X坐标（画布坐标系） */
    x: number;
    /** Y坐标（画布坐标系） */
    y: number;
    /** 宽度 */
    width?: number;
    /** 高度 */
    height?: number;
    /** 自定义数据 */
    data?: Record<string, unknown>;
}

/** Canvas组件的Props */
export interface CanvasProps {
    /** 自定义类名 */
    className?: string;
    /** 画布中的子元素项 */
    items?: CanvasItemData[];
    /** 渲染单个item的函数 */
    renderItem?: (item: CanvasItemData) => ReactNode;
    /** item位置变化时的回调 */
    onItemMove?: (id: string, position: Point) => void;
    /** 视图状态变化时的回调 */
    onViewChange?: (viewState: ViewState) => void;
    /** 最小缩放比例 */
    minScale?: number;
    /** 最大缩放比例 */
    maxScale?: number;
    /** 初始视图状态 */
    initialViewState?: Partial<ViewState>;
    /** 是否显示网格 */
    showGrid?: boolean;
    /** 网格大小 */
    gridSize?: number;
}

// ==================== 常量定义 ====================

/** 默认最小缩放 */
const DEFAULT_MIN_SCALE = 0.1;
/** 默认最大缩放 */
const DEFAULT_MAX_SCALE = 5;
/** 缩放速度因子 */
const ZOOM_SPEED = 0.001;
/** 滚轮滚动速度 */
const SCROLL_SPEED = 1;
/** 默认网格大小 */
const DEFAULT_GRID_SIZE = 20;

// ==================== 可拖拽Item组件 ====================

interface DraggableItemProps {
    item: CanvasItemData;
    scale: number;
    onDragStart: (id: string, e: ReactMouseEvent) => void;
    children: ReactNode;
    isSelected?: boolean;
    onSelect?: (id: string) => void;
}

/**
 * 可拖拽的Item包装组件
 * 用于包裹用户自定义组件，提供拖拽功能
 */
function DraggableItem({
    item,
    scale,
    onDragStart,
    children,
    isSelected,
    onSelect,
}: DraggableItemProps) {
    const handleMouseDown = useCallback(
        (e: ReactMouseEvent) => {
            e.stopPropagation();
            onSelect?.(item.id);
            onDragStart(item.id, e);
        },
        [item.id, onDragStart, onSelect]
    );

    return (
        <div
            className={cn(
                styles['canvas__item'],
                isSelected && styles['canvas__item--selected']
            )}
            style={{
                transform: `translate(${item.x}px, ${item.y}px)`,
                width: item.width ? `${item.width}px` : 'auto',
                height: item.height ? `${item.height}px` : 'auto',
            }}
            onMouseDown={handleMouseDown}
        >
            <div className={styles['canvas__item-content']}>
                {children}
            </div>
            {/* 拖拽手柄 */}
            <div className={styles['canvas__item-handle']} />
        </div>
    );
}

// ==================== Canvas主组件 ====================

/**
 * 无限画布组件
 * 
 * 功能特性：
 * 1. 无限拖动 - 画布可以无限平移
 * 2. 滚轮滚动 - 使用滚轮进行垂直/水平滚动
 * 3. Ctrl+滚轮缩放 - 按住Ctrl并滚动滚轮可以缩放画布
 * 4. 中键拖拽 - 按住鼠标中键可以拖拽画布
 * 5. 组件拖拽 - 画布中的组件可以自由拖拽
 */
export default function Canvas({
    className,
    items = [],
    renderItem,
    onItemMove,
    onViewChange,
    minScale = DEFAULT_MIN_SCALE,
    maxScale = DEFAULT_MAX_SCALE,
    initialViewState,
    showGrid = true,
    gridSize = DEFAULT_GRID_SIZE,
}: CanvasProps) {
    // 容器ref
    const containerRef = useRef<HTMLDivElement>(null);

    // 视图状态：偏移量和缩放
    const [viewState, setViewState] = useState<ViewState>({
        offset: initialViewState?.offset ?? { x: 0, y: 0 },
        scale: initialViewState?.scale ?? 1,
    });

    // 拖拽状态
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

    // 当前选中的item
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // 正在拖拽的item状态
    const [draggingItem, setDraggingItem] = useState<{
        id: string;
        startPos: Point;
        startMouse: Point;
    } | null>(null);

    // ==================== 滚轮事件处理（使用原生事件以阻止浏览器默认缩放） ====================

    // 使用ref存储最新的状态值，避免useEffect依赖频繁变化
    const viewStateRef = useRef(viewState);
    viewStateRef.current = viewState;

    const onViewChangeRef = useRef(onViewChange);
    onViewChangeRef.current = onViewChange;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        /**
         * 处理滚轮事件（原生事件监听器）
         * - 普通滚动：垂直/水平平移画布
         * - Ctrl+滚动：缩放画布（阻止浏览器默认缩放行为）
         */
        const handleWheel = (e: WheelEvent) => {
            // 阻止浏览器默认行为（特别是Ctrl+滚轮的页面缩放）
            e.preventDefault();

            const currentViewState = viewStateRef.current;

            if (e.ctrlKey || e.metaKey) {
                // Ctrl+滚轮：缩放
                const rect = container.getBoundingClientRect();

                // 获取鼠标相对于容器的位置
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // 计算缩放前鼠标在画布坐标系中的位置
                const mouseCanvasX = (mouseX - currentViewState.offset.x) / currentViewState.scale;
                const mouseCanvasY = (mouseY - currentViewState.offset.y) / currentViewState.scale;

                // 计算新的缩放比例
                const delta = -e.deltaY * ZOOM_SPEED;
                const newScale = Math.min(
                    maxScale,
                    Math.max(minScale, currentViewState.scale * (1 + delta))
                );

                // 调整偏移量使缩放以鼠标位置为中心
                const newOffsetX = mouseX - mouseCanvasX * newScale;
                const newOffsetY = mouseY - mouseCanvasY * newScale;

                const newViewState = {
                    scale: newScale,
                    offset: { x: newOffsetX, y: newOffsetY },
                };

                setViewState(newViewState);
                onViewChangeRef.current?.(newViewState);
            } else {
                // 普通滚动：平移画布
                const deltaX = e.shiftKey ? e.deltaY : e.deltaX;
                const deltaY = e.shiftKey ? 0 : e.deltaY;

                const newOffset = {
                    x: currentViewState.offset.x - deltaX * SCROLL_SPEED,
                    y: currentViewState.offset.y - deltaY * SCROLL_SPEED,
                };

                const newViewState = {
                    ...currentViewState,
                    offset: newOffset,
                };

                setViewState(newViewState);
                onViewChangeRef.current?.(newViewState);
            }
        };

        // 使用 { passive: false } 允许调用 preventDefault()
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [minScale, maxScale]);

    // ==================== 画布操作 ====================

    /**
     * 处理鼠标按下事件
     * 中键按下开始拖拽画布
     */
    const handleMouseDown = useCallback(
        (e: ReactMouseEvent) => {
            // 中键拖拽画布
            if (e.button === 1) {
                e.preventDefault();
                setIsPanning(true);
                setPanStart({ x: e.clientX, y: e.clientY });
            }

            // 左键点击空白处取消选中
            if (e.button === 0 && e.target === e.currentTarget) {
                setSelectedItemId(null);
            }
        },
        []
    );

    /**
     * 处理鼠标移动事件
     */
    const handleMouseMove = useCallback(
        (e: ReactMouseEvent) => {
            // 画布拖拽
            if (isPanning) {
                const deltaX = e.clientX - panStart.x;
                const deltaY = e.clientY - panStart.y;

                const newViewState = {
                    ...viewState,
                    offset: {
                        x: viewState.offset.x + deltaX,
                        y: viewState.offset.y + deltaY,
                    },
                };

                setViewState(newViewState);
                setPanStart({ x: e.clientX, y: e.clientY });
                onViewChange?.(newViewState);
            }

            // Item拖拽
            if (draggingItem) {
                const deltaX = (e.clientX - draggingItem.startMouse.x) / viewState.scale;
                const deltaY = (e.clientY - draggingItem.startMouse.y) / viewState.scale;

                const newX = draggingItem.startPos.x + deltaX;
                const newY = draggingItem.startPos.y + deltaY;

                onItemMove?.(draggingItem.id, { x: newX, y: newY });
            }
        },
        [isPanning, panStart, viewState, draggingItem, onViewChange, onItemMove]
    );

    /**
     * 处理鼠标释放事件
     */
    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
        setDraggingItem(null);
    }, []);

    /**
     * 开始拖拽item
     */
    const handleItemDragStart = useCallback(
        (id: string, e: ReactMouseEvent) => {
            const item = items.find((i) => i.id === id);
            if (!item) return;

            setDraggingItem({
                id,
                startPos: { x: item.x, y: item.y },
                startMouse: { x: e.clientX, y: e.clientY },
            });
        },
        [items]
    );

    /**
     * 选中item
     */
    const handleItemSelect = useCallback((id: string) => {
        setSelectedItemId(id);
    }, []);

    // ==================== 全局事件监听 ====================

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsPanning(false);
            setDraggingItem(null);
        };

        const handleGlobalMouseMove = (e: MouseEvent) => {
            // 画布拖拽
            if (isPanning) {
                const deltaX = e.clientX - panStart.x;
                const deltaY = e.clientY - panStart.y;

                setViewState((prev) => {
                    const newViewState = {
                        ...prev,
                        offset: {
                            x: prev.offset.x + deltaX,
                            y: prev.offset.y + deltaY,
                        },
                    };
                    onViewChange?.(newViewState);
                    return newViewState;
                });
                setPanStart({ x: e.clientX, y: e.clientY });
            }

            // Item拖拽
            if (draggingItem) {
                const deltaX = (e.clientX - draggingItem.startMouse.x) / viewState.scale;
                const deltaY = (e.clientY - draggingItem.startMouse.y) / viewState.scale;

                const newX = draggingItem.startPos.x + deltaX;
                const newY = draggingItem.startPos.y + deltaY;

                onItemMove?.(draggingItem.id, { x: newX, y: newY });
            }
        };

        // 防止中键点击的默认行为
        const handleAuxClick = (e: MouseEvent) => {
            if (e.button === 1) {
                e.preventDefault();
            }
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('auxclick', handleAuxClick);

        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('auxclick', handleAuxClick);
        };
    }, [isPanning, panStart, draggingItem, viewState.scale, onItemMove, onViewChange]);

    // ==================== 渲染 ====================

    // 计算网格背景样式
    const gridStyle = showGrid
        ? {
              backgroundSize: `${gridSize * viewState.scale}px ${gridSize * viewState.scale}px`,
              backgroundPosition: `${viewState.offset.x}px ${viewState.offset.y}px`,
          }
        : {};

    return (
        <div
            ref={containerRef}
            className={cn(
                styles['canvas'],
                isPanning && styles['canvas--panning'],
                draggingItem && styles['canvas--dragging'],
                showGrid && styles['canvas--grid'],
                className
            )}
            style={gridStyle}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* 画布内容层 */}
            <div
                className={styles['canvas__content']}
                style={{
                    transform: `translate(${viewState.offset.x}px, ${viewState.offset.y}px) scale(${viewState.scale})`,
                }}
            >
                {/* 渲染所有items */}
                {items.map((item) => (
                    <DraggableItem
                        key={item.id}
                        item={item}
                        scale={viewState.scale}
                        onDragStart={handleItemDragStart}
                        onSelect={handleItemSelect}
                        isSelected={selectedItemId === item.id}
                    >
                        {renderItem?.(item)}
                    </DraggableItem>
                ))}
            </div>

            {/* 缩放指示器 */}
            <div className={styles['canvas__zoom-indicator']}>
                {Math.round(viewState.scale * 100)}%
            </div>
        </div>
    );
}

// ==================== 辅助Hooks ====================

/**
 * 用于管理Canvas items状态的Hook
 */
export function useCanvasItems(initialItems: CanvasItemData[] = []) {
    const [items, setItems] = useState<CanvasItemData[]>(initialItems);

    /** 添加item */
    const addItem = useCallback((item: CanvasItemData) => {
        setItems((prev) => [...prev, item]);
    }, []);

    /** 移除item */
    const removeItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    /** 更新item位置 */
    const updateItemPosition = useCallback((id: string, position: Point) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, x: position.x, y: position.y } : item
            )
        );
    }, []);

    /** 更新item数据 */
    const updateItem = useCallback(
        (id: string, updates: Partial<CanvasItemData>) => {
            setItems((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, ...updates } : item
                )
            );
        },
        []
    );

    /** 清空所有items */
    const clearItems = useCallback(() => {
        setItems([]);
    }, []);

    return {
        items,
        setItems,
        addItem,
        removeItem,
        updateItemPosition,
        updateItem,
        clearItems,
    };
}

