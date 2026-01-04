'use client';

/**
 * 无限画布基础组件
 * 实现了画布内部功能，如需添加外部UI控件，参考 Canvas.example.tsx
 * 
 * 功能特性：
 * 1. 无限平移 - 滚轮滚动 / 中键拖拽 / 抓握模式拖拽
 * 2. 缩放 - Ctrl+滚轮以鼠标位置为中心缩放
 * 3. 组件拖拽 - 移动模式下拖拽画布内的组件
 * 4. 自动适配 - 双击组件自动居中显示（带流畅动画）
 * 5. 新元素定位 - 添加新元素时自动移动画布使其居中
 * 6. 可视区域检测 - 检测当前视口是否有元素，提供定位到最近元素功能
 * 7. 受控模式 - scale和offset支持外部控制（受控/非受控双模式）
 * 
 * 三种鼠标模式：
 * - grab: 抓握模式 - 左键拖动移动画布位置
 * - normal: 常规模式 - 双击元素自动适配显示
 * - move: 移动模式 - 左键拖拽移动画布内的组件
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
/** 可视区域检测间隔（毫秒） */
const VIEWPORT_CHECK_INTERVAL = 500;
/** 显示"无元素"提示的延迟（毫秒） */
const NO_ITEMS_HINT_DELAY = 1000;

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
 * 无限画布基础组件
 * 实现了画布内部功能，如需添加外部UI控件，参考 Canvas.example.tsx
 * 
 * 功能特性：
 * 1. 无限平移 - 滚轮滚动 / 中键拖拽 / 抓握模式拖拽
 * 2. 缩放 - Ctrl+滚轮以鼠标位置为中心缩放
 * 3. 组件拖拽 - 移动模式下拖拽画布内的组件
 * 4. 自动适配 - 双击组件自动居中显示（带流畅动画）
 * 5. 新元素定位 - 添加新元素时自动移动画布使其居中
 * 6. 可视区域检测 - 检测当前视口是否有元素，提供定位到最近元素功能
 * 7. 受控模式 - scale和offset支持外部控制（受控/非受控双模式）
 * 
 * 三种鼠标模式：
 * - grab: 抓握模式 - 左键拖动移动画布位置
 * - normal: 常规模式 - 双击元素自动适配显示
 * - move: 移动模式 - 左键拖拽移动画布内的组件
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
    autoFitNewItem = true,
    scale: controlledScale,
    onScaleChange,
    offset: controlledOffset,
    onOffsetChange,
}: CanvasProps) {
    // 容器ref
    const containerRef = useRef<HTMLDivElement>(null);

    // 用于追踪items变化，检测新元素添加
    const prevItemsRef = useRef<CanvasItemData[]>(items);
    const prevItemIdsRef = useRef<Set<string>>(new Set(items.map(item => item.id)));

    // 判断是否为受控模式
    const isScaleControlled = controlledScale !== undefined;
    const isOffsetControlled = controlledOffset !== undefined;

    // 内部视图状态（非受控模式使用）
    const [internalViewState, setInternalViewState] = useState<ViewState>({
        offset: initialViewState?.offset ?? { x: 0, y: 0 },
        scale: initialViewState?.scale ?? 1,
    });

    // 计算实际使用的视图状态（支持受控和非受控模式）
    const viewState: ViewState = {
        scale: isScaleControlled ? controlledScale : internalViewState.scale,
        offset: isOffsetControlled ? controlledOffset : internalViewState.offset,
    };

    // 使用ref存储最新的视图状态，供回调和动画使用
    const viewStateRef = useRef(viewState);
    viewStateRef.current = viewState;

    // 用于在 useEffect 回调中获取最新的 setViewState 函数
    const setViewStateRef = useRef<(newState: ViewState | ((prev: ViewState) => ViewState)) => void>(() => { });

    /**
     * 更新视图状态（同时支持受控和非受控模式）
     * 使用 queueMicrotask 延迟触发回调，避免在渲染期间更新父组件状态
     */
    const setViewState = useCallback((newState: ViewState | ((prev: ViewState) => ViewState)) => {
        const currentState = viewStateRef.current;
        const resolvedState = typeof newState === 'function'
            ? newState(currentState)
            : newState;

        // 更新内部状态
        setInternalViewState(resolvedState);

        // 使用 queueMicrotask 延迟触发回调，避免在渲染期间更新父组件状态
        queueMicrotask(() => {
            // 检查scale是否变化
            if (resolvedState.scale !== currentState.scale) {
                onScaleChange?.(resolvedState.scale);
            }

            // 检查offset是否变化
            if (resolvedState.offset.x !== currentState.offset.x ||
                resolvedState.offset.y !== currentState.offset.y) {
                onOffsetChange?.(resolvedState.offset);
            }

            // 触发通用回调
            if (resolvedState.scale !== currentState.scale ||
                resolvedState.offset.x !== currentState.offset.x ||
                resolvedState.offset.y !== currentState.offset.y) {
                onViewChange?.(resolvedState);
            }
        });
    }, [onScaleChange, onOffsetChange, onViewChange]);

    // 更新 setViewState ref
    setViewStateRef.current = setViewState;

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

    // 强制重绘计数器（用于解决缩放后模糊问题）
    const [forceRepaintKey, setForceRepaintKey] = useState(0);

    // 动画控制器引用，用于中断动画
    const animationControlsRef = useRef<ReturnType<typeof animate>[]>([]);

    // 可视区域内是否有元素
    const [hasItemsInViewport, setHasItemsInViewport] = useState(true);

    // 是否显示"无元素"提示（延迟显示，避免频繁闪烁）
    const [showNoItemsHint, setShowNoItemsHint] = useState(false);

    // 最近的元素
    const [nearestItem, setNearestItem] = useState<CanvasItemData | null>(null);

    // ==================== 可视区域检测功能 ====================

    /**
     * 检测指定item是否在当前可视区域内
     */
    const isItemInViewport = useCallback(
        (item: CanvasItemData, containerWidth: number, containerHeight: number): boolean => {
            const { offset, scale } = viewStateRef.current;

            // item在屏幕上的位置
            const itemLeft = item.x * scale + offset.x;
            const itemTop = item.y * scale + offset.y;
            const itemWidth = (item.width ?? 200) * scale;
            const itemHeight = (item.height ?? 150) * scale;
            const itemRight = itemLeft + itemWidth;
            const itemBottom = itemTop + itemHeight;

            // 检测是否与可视区域相交
            return !(
                itemRight < 0 ||
                itemLeft > containerWidth ||
                itemBottom < 0 ||
                itemTop > containerHeight
            );
        },
        []
    );

    /**
     * 查找距离可视区域中心最近的元素
     */
    const findNearestItem = useCallback(
        (containerWidth: number, containerHeight: number): CanvasItemData | null => {
            if (items.length === 0) return null;

            const { offset, scale } = viewStateRef.current;

            // 可视区域中心点（画布坐标系）
            const viewportCenterX = (containerWidth / 2 - offset.x) / scale;
            const viewportCenterY = (containerHeight / 2 - offset.y) / scale;

            let nearest: CanvasItemData | null = null;
            let minDistance = Infinity;

            items.forEach((item) => {
                // item的中心点
                const itemCenterX = item.x + (item.width ?? 200) / 2;
                const itemCenterY = item.y + (item.height ?? 150) / 2;

                // 计算距离
                const distance = Math.sqrt(
                    Math.pow(itemCenterX - viewportCenterX, 2) +
                    Math.pow(itemCenterY - viewportCenterY, 2)
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = item;
                }
            });

            return nearest;
        },
        [items]
    );

    /**
     * 检测可视区域内是否有元素
     */
    const checkViewportItems = useCallback(() => {
        const container = containerRef.current;
        if (!container || items.length === 0) {
            setHasItemsInViewport(items.length === 0);
            setNearestItem(null);
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        // 检测是否有任何item在可视区域内
        const hasItems = items.some((item) =>
            isItemInViewport(item, containerWidth, containerHeight)
        );

        setHasItemsInViewport(hasItems);

        // 如果没有元素在可视区域，查找最近的元素
        if (!hasItems) {
            const nearest = findNearestItem(containerWidth, containerHeight);
            setNearestItem(nearest);
        } else {
            setNearestItem(null);
        }
    }, [items, isItemInViewport, findNearestItem]);

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

                    // 强制重绘以解决缩放后模糊问题
                    // 使用 requestAnimationFrame 确保在下一帧触发重绘
                    requestAnimationFrame(() => {
                        setForceRepaintKey(prev => prev + 1);
                    });
                },
            });

            // 保存动画控制器
            animationControlsRef.current = [controls];
        },
        [fitPadding, maxScale, minScale, stopFitAnimation]
    );

    /**
     * 定位到最近的元素
     */
    const navigateToNearestItem = useCallback(() => {
        if (nearestItem) {
            fitToItem(nearestItem);
            setShowNoItemsHint(false);
        }
    }, [nearestItem, fitToItem]);

    // 监听新元素添加，自动适配显示
    useEffect(() => {
        if (!autoFitNewItem) {
            // 更新追踪的items
            prevItemsRef.current = items;
            prevItemIdsRef.current = new Set(items.map(item => item.id));
            return;
        }

        const currentIds = new Set(items.map(item => item.id));
        const prevIds = prevItemIdsRef.current;

        // 查找新添加的元素
        const newItems = items.filter(item => !prevIds.has(item.id));

        if (newItems.length > 0) {
            // 取最后一个新添加的元素进行适配
            const newestItem = newItems[newItems.length - 1];

            // 延迟一帧执行，确保DOM已更新
            requestAnimationFrame(() => {
                fitToItem(newestItem);
            });
        }

        // 更新追踪的items
        prevItemsRef.current = items;
        prevItemIdsRef.current = currentIds;
    }, [items, autoFitNewItem, fitToItem]);

    // 定期检测可视区域
    useEffect(() => {
        // 初始检测
        checkViewportItems();

        // 定期检测
        const intervalId = setInterval(checkViewportItems, VIEWPORT_CHECK_INTERVAL);

        return () => {
            clearInterval(intervalId);
        };
    }, [checkViewportItems]);

    // 延迟显示"无元素"提示，避免快速滑动时闪烁
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;

        if (!hasItemsInViewport && items.length > 0 && !isAnimating && !isPanning) {
            timeoutId = setTimeout(() => {
                setShowNoItemsHint(true);
            }, NO_ITEMS_HINT_DELAY);
        } else {
            setShowNoItemsHint(false);
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [hasItemsInViewport, items.length, isAnimating, isPanning]);

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

                setViewStateRef.current(newViewState);
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

                setViewStateRef.current(newViewState);
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

                const currentState = viewStateRef.current;
                const newViewState = {
                    ...currentState,
                    offset: {
                        x: currentState.offset.x + deltaX,
                        y: currentState.offset.y + deltaY,
                    },
                };

                setViewStateRef.current(newViewState);
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
            //   backgroundSize: `${gridSize * viewState.scale}px ${gridSize * viewState.scale}px`,
            //   backgroundPosition: `${viewState.offset.x}px ${viewState.offset.y}px`,
            backgroundImage:
                ` linear-gradient(to right, #dadada 1px, transparent 1px),
                linear-gradient(to bottom, #dadada 1px, transparent 1px),
                linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)`,
            backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
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
                    // translateZ 的微小变化强制浏览器重新栅格化，解决缩放后模糊问题
                    transform: `translate(${viewState.offset.x}px, ${viewState.offset.y}px) scale(${viewState.scale}) translateZ(${forceRepaintKey * 0.001}px)`,
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

            {/* 无元素提示 - 当可视区域内没有元素时显示 */}
            {showNoItemsHint && nearestItem && (
                <div
                    className={styles['canvas__no-items-hint']}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className={styles['canvas__no-items-hint-content']}>
                        <span className={styles['canvas__no-items-hint-icon']}>🔍</span>
                        <span className={styles['canvas__no-items-hint-text']}>
                            No items in view
                        </span>
                        <button
                            className={styles['canvas__no-items-hint-button']}
                            onClick={navigateToNearestItem}
                        >
                            Go to nearest item
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
