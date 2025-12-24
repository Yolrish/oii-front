'use client';

/**
 * 无限画布组件
 * 支持拖拽、缩放、添加自定义组件等功能
 * 
 * 三种鼠标模式：
 * - grab: 抓握模式 - 拖动移动画布位置
 * - normal: 常规模式 - 双击元素自动适配显示（带动画）
 * - move: 移动模式 - 移动画布内部的组件
 */
import React, {
    useRef,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
    type MouseEvent as ReactMouseEvent,
} from 'react';
import { animate } from 'motion';
import styles from './Canvas.module.css';
import { cn } from '@/lib/utils';
import type { CanvasProps, CanvasItemData, CanvasMode, Point, ViewState } from '../types/canvas-type';

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
/** 默认适配边距 */
const DEFAULT_FIT_PADDING = 50;
/** 适配动画时长（秒） */
const FIT_ANIMATION_DURATION = 0.5;
/** 适配动画缓动函数 */
const FIT_ANIMATION_EASING = [0.4, 0, 0.2, 1] as const;

// ==================== 可拖拽Item组件 ====================

interface DraggableItemProps {
    item: CanvasItemData;
    scale: number;
    mode: CanvasMode;
    onDragStart: (id: string, e: ReactMouseEvent) => void;
    onDoubleClick: (id: string, item: CanvasItemData) => void;
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
    mode,
    onDragStart,
    onDoubleClick,
    children,
    isSelected,
    onSelect,
}: DraggableItemProps) {
    const handleMouseDown = useCallback(
        (e: ReactMouseEvent) => {
            e.stopPropagation();
            onSelect?.(item.id);
            
            // 只有移动模式下才能拖拽组件
            if (mode === 'move') {
                onDragStart(item.id, e);
            }
        },
        [item.id, mode, onDragStart, onSelect]
    );

    const handleDoubleClick = useCallback(
        (e: ReactMouseEvent) => {
            e.stopPropagation();
            // 常规模式下双击触发适配
            if (mode === 'normal') {
                onDoubleClick(item.id, item);
            }
        },
        [item, mode, onDoubleClick]
    );

    // 根据模式设置光标样式
    const getCursorClass = () => {
        switch (mode) {
            case 'grab':
                return styles['canvas__item--grab'];
            case 'move':
                return styles['canvas__item--move'];
            case 'normal':
            default:
                return styles['canvas__item--normal'];
        }
    };

    return (
        <div
            className={cn(
                styles['canvas__item'],
                isSelected && styles['canvas__item--selected'],
                getCursorClass()
            )}
            style={{
                transform: `translate(${item.x}px, ${item.y}px)`,
                width: item.width ? `${item.width}px` : 'auto',
                height: item.height ? `${item.height}px` : 'auto',
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            <div className={styles['canvas__item-content']}>
                {children}
            </div>
            {/* 拖拽手柄 - 只在移动模式下显示 */}
            {mode === 'move' && <div className={styles['canvas__item-handle']} />}
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
 * 4. 中键拖拽 - 按住鼠标中键可以拖拽画布（所有模式下都可用）
 * 5. 三种鼠标模式 - grab/normal/move
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
    mode = 'normal',
    onModeChange,
    onItemDoubleClick,
    fitPadding = DEFAULT_FIT_PADDING,
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

    // 是否正在播放适配动画
    const [isAnimating, setIsAnimating] = useState(false);

    // 动画控制器引用，用于中断动画
    const animationControlsRef = useRef<ReturnType<typeof animate>[]>([]);

    // ==================== 自动适配功能（带动画） ====================

    /**
     * 停止当前正在进行的适配动画
     */
    const stopFitAnimation = useCallback(() => {
        animationControlsRef.current.forEach((control) => {
            control.stop();
        });
        animationControlsRef.current = [];
        setIsAnimating(false);
    }, []);

    /**
     * 将视图自动适配到指定的item（带流畅动画）
     * 使item居中显示并适当缩放
     */
    const fitToItem = useCallback(
        (item: CanvasItemData) => {
            const container = containerRef.current;
            if (!container) return;

            // 停止之前的动画
            stopFitAnimation();

            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;

            // 获取item尺寸（默认200x150）
            const itemWidth = item.width ?? 200;
            const itemHeight = item.height ?? 150;

            // 计算适配缩放比例（考虑边距）
            const availableWidth = containerWidth - fitPadding * 2;
            const availableHeight = containerHeight - fitPadding * 2;
            
            const scaleX = availableWidth / itemWidth;
            const scaleY = availableHeight / itemHeight;
            
            // 取较小的缩放比例，确保item完全可见，但不超过最大缩放
            let targetScale = Math.min(scaleX, scaleY, maxScale);
            // 也不低于最小缩放
            targetScale = Math.max(targetScale, minScale);
            // 限制最大缩放为2倍，避免过度放大
            targetScale = Math.min(targetScale, 2);

            // 计算使item居中的偏移量
            const itemCenterX = item.x + itemWidth / 2;
            const itemCenterY = item.y + itemHeight / 2;

            const targetOffsetX = containerWidth / 2 - itemCenterX * targetScale;
            const targetOffsetY = containerHeight / 2 - itemCenterY * targetScale;

            // 获取当前值
            const startScale = viewStateRef.current.scale;
            const startOffsetX = viewStateRef.current.offset.x;
            const startOffsetY = viewStateRef.current.offset.y;

            // 标记动画开始
            setIsAnimating(true);

            // 使用 motion 的 animate 创建动画
            // 动画进度从 0 到 1
            const controls = animate(0, 1, {
                duration: FIT_ANIMATION_DURATION,
                ease: FIT_ANIMATION_EASING,
                onUpdate: (progress) => {
                    // 根据进度插值计算当前值
                    const currentScale = startScale + (targetScale - startScale) * progress;
                    const currentOffsetX = startOffsetX + (targetOffsetX - startOffsetX) * progress;
                    const currentOffsetY = startOffsetY + (targetOffsetY - startOffsetY) * progress;

                    const currentViewState: ViewState = {
                        scale: currentScale,
                        offset: { x: currentOffsetX, y: currentOffsetY },
                    };

                    setViewState(currentViewState);
                    onViewChangeRef.current?.(currentViewState);
                },
                onComplete: () => {
                    // 动画完成
                    setIsAnimating(false);
                    animationControlsRef.current = [];

                    // 确保最终状态精确
                    const finalViewState: ViewState = {
                        scale: targetScale,
                        offset: { x: targetOffsetX, y: targetOffsetY },
                    };
                    setViewState(finalViewState);
                    onViewChangeRef.current?.(finalViewState);
                },
            });

            // 保存动画控制器
            animationControlsRef.current = [controls];
        },
        [fitPadding, maxScale, minScale, stopFitAnimation]
    );

    /**
     * 处理item双击事件
     */
    const handleItemDoubleClick = useCallback(
        (id: string, item: CanvasItemData) => {
            // 自动适配显示该元素
            fitToItem(item);
            // 触发回调
            onItemDoubleClick?.(id, item);
        },
        [fitToItem, onItemDoubleClick]
    );

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

            // 用户滚动时停止适配动画
            animationControlsRef.current.forEach((control) => control.stop());
            animationControlsRef.current = [];

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
     */
    const handleMouseDown = useCallback(
        (e: ReactMouseEvent) => {
            // 用户开始交互时停止适配动画
            if (isAnimating) {
                stopFitAnimation();
            }

            // 中键拖拽画布（所有模式下都可用）
            if (e.button === 1) {
                e.preventDefault();
                setIsPanning(true);
                setPanStart({ x: e.clientX, y: e.clientY });
                return;
            }

            // 左键操作
            if (e.button === 0) {
                // 抓握模式：左键拖拽画布
                if (mode === 'grab') {
                    e.preventDefault();
                    setIsPanning(true);
                    setPanStart({ x: e.clientX, y: e.clientY });
                }

                // 点击空白处取消选中
                if (e.target === e.currentTarget) {
                    setSelectedItemId(null);
                }
            }
        },
        [mode, isAnimating, stopFitAnimation]
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

            // Item拖拽（只在移动模式下有效）
            if (draggingItem && mode === 'move') {
                const deltaX = (e.clientX - draggingItem.startMouse.x) / viewState.scale;
                const deltaY = (e.clientY - draggingItem.startMouse.y) / viewState.scale;

                const newX = draggingItem.startPos.x + deltaX;
                const newY = draggingItem.startPos.y + deltaY;

                onItemMove?.(draggingItem.id, { x: newX, y: newY });
            }
        },
        [isPanning, panStart, viewState, draggingItem, mode, onViewChange, onItemMove]
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
            // 只在移动模式下允许拖拽
            if (mode !== 'move') return;

            const item = items.find((i) => i.id === id);
            if (!item) return;

            setDraggingItem({
                id,
                startPos: { x: item.x, y: item.y },
                startMouse: { x: e.clientX, y: e.clientY },
            });
        },
        [items, mode]
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

            // Item拖拽（只在移动模式下有效）
            if (draggingItem && mode === 'move') {
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
    }, [isPanning, panStart, draggingItem, viewState.scale, mode, onItemMove, onViewChange]);

    // ==================== 渲染 ====================

    // 计算网格背景样式
    const gridStyle = showGrid
        ? {
              backgroundSize: `${gridSize * viewState.scale}px ${gridSize * viewState.scale}px`,
              backgroundPosition: `${viewState.offset.x}px ${viewState.offset.y}px`,
          }
        : {};

    // 根据模式获取画布光标样式类
    const getModeClass = () => {
        switch (mode) {
            case 'grab':
                return styles['canvas--mode-grab'];
            case 'move':
                return styles['canvas--mode-move'];
            case 'normal':
            default:
                return styles['canvas--mode-normal'];
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                styles['canvas'],
                getModeClass(),
                isPanning && styles['canvas--panning'],
                draggingItem && styles['canvas--dragging'],
                isAnimating && styles['canvas--animating'],
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
                        mode={mode}
                        onDragStart={handleItemDragStart}
                        onDoubleClick={handleItemDoubleClick}
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

            {/* 模式指示器 */}
            <div className={styles['canvas__mode-indicator']}>
                {mode === 'grab' && '🖐️ Grab'}
                {mode === 'normal' && '🖱️ Normal'}
                {mode === 'move' && '✥ Move'}
            </div>
        </div>
    );
}
