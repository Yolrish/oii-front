'use client';

import { useState, useCallback } from 'react';
import type { CanvasItemData, Point, UseCanvasItemsReturn } from '../types/canvas-type';

// ==================== 常量定义 ====================

/** 新item与上一个item的默认垂直间距 */
const DEFAULT_ITEM_GAP = 20;
/** 新item的默认高度（当上一个item没有指定高度时使用） */
const DEFAULT_ITEM_HEIGHT = 100;
/** 第一个item的默认X坐标 */
const DEFAULT_FIRST_ITEM_X = 100;
/** 第一个item的默认Y坐标 */
const DEFAULT_FIRST_ITEM_Y = 100;

// ==================== Hook实现 ====================

/**
 * 用于管理Canvas items状态的Hook
 * @param initialItems - 初始items列表
 * @returns items状态和操作方法
 */
export function useCanvasItems(initialItems: CanvasItemData[] = []): UseCanvasItemsReturn {
    const [items, setItems] = useState<CanvasItemData[]>(initialItems);

    /** 
     * 添加item
     * 新item会被放置在最后一个item的下方
     * 如果没有传入x/y坐标，会自动计算位置
     */
    const addItem = useCallback((item: CanvasItemData | Omit<CanvasItemData, 'x' | 'y'> & Partial<Pick<CanvasItemData, 'x' | 'y'>>) => {
        setItems((prev) => {
            // 如果已经指定了x和y坐标，直接使用
            if (item.x !== undefined && item.y !== undefined) {
                return [...prev, item as CanvasItemData];
            }

            // 计算新item的位置
            let newX = item.x ?? DEFAULT_FIRST_ITEM_X;
            let newY = item.y ?? DEFAULT_FIRST_ITEM_Y;

            if (prev.length > 0) {
                // 找到最后一个item
                const lastItem = prev[prev.length - 1];
                // 新item的x坐标与最后一个item相同
                newX = item.x ?? lastItem.x;
                // 新item的y坐标 = 最后一个item的y + 高度 + 间距
                const lastItemHeight = lastItem.height ?? DEFAULT_ITEM_HEIGHT;
                newY = item.y ?? (lastItem.y + lastItemHeight + DEFAULT_ITEM_GAP);
            }

            const newItem: CanvasItemData = {
                ...item,
                x: newX,
                y: newY,
            };

            return [...prev, newItem];
        });
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

