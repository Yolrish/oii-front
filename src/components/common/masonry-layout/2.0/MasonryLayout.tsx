"use client"
/**
 * 2.0版本
 * 每列不再均匀分配而是根据每列的高度自动分配
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { motion } from "framer-motion"

interface MasonryLayoutProps {
    children: React.ReactNode
    minColumnWidth?: number
    maxColumns?: number
    gap?: number
    containerPadding?: string
    className?: string
    animationDelay?: number
}

// 动画包装组件 - 使用 framer-motion
const AnimatedItem = ({
    children,
    index,
    animationDelay = 100,
    isNew = false
}: {
    children: React.ReactNode
    index: number
    animationDelay?: number
    isNew?: boolean
}) => {
    // 计算延迟（秒）
    const delay = isNew ? (index * animationDelay) / 1000 : 0

    return (
        <motion.div
            initial={isNew ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{
                duration: 0.5,
                delay: delay,
                ease: [0.4, 0, 0.2, 1], // cubic-bezier easing
            }}
            className="animated-wrapper"
        >
            {children}
        </motion.div>
    )
}

export function MasonryLayout({
    children,
    minColumnWidth = 300,
    maxColumns = 4,
    gap = 16,
    containerPadding = "16px",
    className = "",
    animationDelay = 100,
}: MasonryLayoutProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const measurementContainerRef = useRef<HTMLDivElement>(null)
    const [columns, setColumns] = useState(1)
    const [childrenArray, setChildrenArray] = useState<React.ReactNode[][]>([])
    const renderedItemsRef = useRef<Map<string, boolean>>(new Map())
    const layoutChangeKeyRef = useRef(0)
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // 存储每个项目的高度（通过离屏预测量获得）
    const itemHeightsRef = useRef<Map<string, number>>(new Map())
    // 存储每列的总高度
    const columnHeightsRef = useRef<number[]>([])
    // 存储项目到列的映射
    const itemToColumnRef = useRef<Map<string, number>>(new Map())
    // 已测量完成的项目 key 集合
    const measuredItemsRef = useRef<Set<string>>(new Set())
    // 当前正在测量的 children 快照
    const currentChildrenRef = useRef<React.ReactNode[]>([])
    // 测量观察器
    const measureObserversRef = useRef<Map<string, ResizeObserver>>(new Map())
    // 记录已经显示过动画的元素ID（永不清空）
    const animatedItemsRef = useRef<Set<string>>(new Set())
    // 记录每个元素的动画索引（每次children变化时清零）
    const animationIndexRef = useRef<Map<string, number>>(new Map())
    // 全局动画计数器（每次children变化时清零）
    const nextAnimationIndexRef = useRef(0)

    // 使用 useCallback 优化 calculateColumns 函数
    const calculateColumns = useCallback(() => {
        if (!containerRef.current) return

        const containerWidth = containerRef.current.offsetWidth
        let columnsCount = 1

        if (containerWidth >= minColumnWidth * 2) {
            columnsCount = Math.floor(containerWidth / minColumnWidth)
        }

        const limitedColumnsCount = Math.min(columnsCount, maxColumns)

        setColumns((prevColumns) => {
            if (prevColumns !== limitedColumnsCount) {
                layoutChangeKeyRef.current += 1
                // 重置列高度和映射
                columnHeightsRef.current = Array(limitedColumnsCount).fill(0)
                itemToColumnRef.current.clear()
                // 同步初始化 childrenArray（防止 addItemToLayout 在初始化前被调用）
                setChildrenArray(Array.from({ length: limitedColumnsCount }, () => []))
                return limitedColumnsCount
            }
            // 首次渲染时确保 columnHeightsRef 被初始化
            if (columnHeightsRef.current.length === 0) {
                columnHeightsRef.current = Array(prevColumns).fill(0)
            }
            return prevColumns
        })
    }, [minColumnWidth, maxColumns])

    // 使用 useMemo 优化 children 数组的处理
    const childrenItems = useMemo(() => {
        return React.Children.toArray(children)
    }, [children])

    // 生成子元素的唯一 key
    const getChildKey = useCallback((child: React.ReactNode, index: number) => {
        if (React.isValidElement(child) && child.key) {
            return String(child.key)
        }
        // 使用 index 作为后备，确保唯一性
        return `masonry-item-${index}`
    }, [])


    // 根据高度找到最短的列
    const getShortestColumnIndex = useCallback((columnHeights: number[]) => {
        // 防御性检查：如果列高度数组为空或未定义，返回 0
        if (!columnHeights || columnHeights.length === 0) return 0

        let minHeight = columnHeights[0] ?? 0
        let minIndex = 0

        for (let i = 1; i < columnHeights.length; i++) {
            const height = columnHeights[i] ?? 0
            if (height < minHeight) {
                minHeight = height
                minIndex = i
            }
        }

        return minIndex
    }, [])

    // 增量添加单个元素到 childrenArray
    const addItemToLayout = useCallback((childKey: string, child: React.ReactNode) => {
        // 防御性检查：确保 columnHeightsRef 已初始化
        if (!columnHeightsRef.current || columnHeightsRef.current.length === 0) {
            console.warn(`⚠️ columnHeightsRef 未初始化，跳过添加 ${childKey}`)
            return
        }

        // 找到最短的列
        const shortestColumnIndex = getShortestColumnIndex(columnHeightsRef.current)
        const itemHeight = itemHeightsRef.current.get(childKey) || 0

        console.log(`📦 ${childKey} (${itemHeight}px) -> 列 ${shortestColumnIndex}`)

        // 防御性检查：确保列索引有效
        if (shortestColumnIndex >= columnHeightsRef.current.length) {
            console.warn(`⚠️ 列索引 ${shortestColumnIndex} 越界，跳过添加 ${childKey}`)
            return
        }

        // 更新列高度
        columnHeightsRef.current[shortestColumnIndex] += itemHeight + gap
        
        // 记录元素到列的映射
        itemToColumnRef.current.set(childKey, shortestColumnIndex)

        // 检查是否已经显示过动画
        const hasAnimated = animatedItemsRef.current.has(childKey)
        const isNew = !hasAnimated

        let animIndex = 0

        // 只有未显示过动画的元素才分配动画索引
        if (isNew) {
            animIndex = nextAnimationIndexRef.current
            animationIndexRef.current.set(childKey, animIndex)
            nextAnimationIndexRef.current++
            // 标记为已显示过动画（永不清除）
            animatedItemsRef.current.add(childKey)
            console.log(`✨ ${childKey} 分配动画索引: ${animIndex}`)
        } else {
            console.log(`⏭️ ${childKey} 跳过动画（已显示过）`)
        }

        // 包装子元素
        const wrappedChild = (
            <AnimatedItem
                key={`${childKey}`}
                index={animIndex}
                animationDelay={animationDelay}
                isNew={isNew}
            >
                {child}
            </AnimatedItem>
        )

        // 增量添加到对应的列
        setChildrenArray((prev) => {
            // 防御性检查：如果 prev 为空或列不存在，则先初始化
            if (prev.length === 0 || shortestColumnIndex >= prev.length) {
                console.warn(`⚠️ childrenArray 未初始化或列索引越界，跳过添加 ${childKey}`)
                return prev
            }
            const newArray = prev.map((col) => [...col])
            newArray[shortestColumnIndex].push(wrappedChild)
            return newArray
        })

        console.log('📊 各列高度:', columnHeightsRef.current.map(h => `${h.toFixed(0)}px`))
    }, [gap, animationDelay, getShortestColumnIndex])

    // 单个元素测量完成回调
    const handleItemMeasured = useCallback((childKey: string, height: number, child: React.ReactNode) => {
        console.log(`📏 测量完成 ${childKey}:`, height, 'px')

        // 保存高度
        itemHeightsRef.current.set(childKey, height)

        // 标记为已测量
        measuredItemsRef.current.add(childKey)

        // 标记为已渲染
        renderedItemsRef.current.set(childKey, true)

        // 增量添加到布局
        addItemToLayout(childKey, child)
    }, [addItemToLayout])

    // 离屏预测量：使用 ResizeObserver 监听每个元素
    useEffect(() => {
        if (!measurementContainerRef.current || childrenItems.length === 0) {
            return
        }

        console.log('🔍 开始离屏测量，列数:', columns)

        // 保存当前 children 快照
        currentChildrenRef.current = childrenItems

        // 延迟执行，确保 DOM 已渲染
        const setupTimer = setTimeout(() => {
            if (!measurementContainerRef.current) return

            const childElements = measurementContainerRef.current.children

            childrenItems.forEach((child, index) => {
                const childKey = getChildKey(child, index)
                const element = childElements[index] as HTMLElement

                if (!element) return

                // 如果已经测量过，跳过
                if (measuredItemsRef.current.has(childKey)) {
                    console.log(`⏭️ ${childKey} 已测量，跳过`)
                    // 但如果还没有渲染到布局中，需要重新添加
                    if (!renderedItemsRef.current.has(childKey)) {
                        handleItemMeasured(childKey, element.offsetHeight, child)
                    }
                    return
                }

                // 如果已经有观察器，跳过
                if (measureObserversRef.current.has(childKey)) return

                // 创建 ResizeObserver 监听元素
                const observer = new ResizeObserver(() => {
                    if (element.offsetHeight > 0) {
                        handleItemMeasured(childKey, element.offsetHeight, child)
                        // 测量完成后断开观察器
                        observer.disconnect()
                        measureObserversRef.current.delete(childKey)
                    }
                })

                observer.observe(element)
                measureObserversRef.current.set(childKey, observer)
            })
        }, 10)

        return () => {
            clearTimeout(setupTimer)
        }
    }, [childrenItems, getChildKey, handleItemMeasured, columns])

    // 用 ref 记录上一次的列数
    const prevColumnsRef = useRef(columns)

    // 当 children 或列数变化时，增量更新布局
    useEffect(() => {
        const columnsChanged = prevColumnsRef.current !== columns
        prevColumnsRef.current = columns

        // 如果列数变化，需要完全重新布局
        if (columnsChanged) {
            console.log('🔄 列数变化，完全重新布局:', columns)

            // 清空 childrenArray（会重新分配所有元素到新列）
            setChildrenArray(Array.from({ length: columns }, () => []))

            // 重置列高度
            columnHeightsRef.current = Array(columns).fill(0)

            // 清空已测量和已渲染标记（触发重新测量和添加）
            measuredItemsRef.current.clear()
            renderedItemsRef.current.clear()

            // 清空高度缓存（列宽变化会导致元素高度变化，需要重新测量）
            itemHeightsRef.current.clear()
            itemToColumnRef.current.clear()
        } else {
            console.log('🔄 children 变化，增量更新布局')

            // 获取当前 children 的所有 key
            const currentKeys = new Set<string>()
            childrenItems.forEach((child, index) => {
                currentKeys.add(getChildKey(child, index))
            })

            // 找出需要删除的元素
            const keysToDelete: string[] = []
            renderedItemsRef.current.forEach((_, key) => {
                if (!currentKeys.has(key)) {
                    keysToDelete.push(key)
                }
            })

            // 如果有需要删除的元素，从 childrenArray 中移除
            if (keysToDelete.length > 0) {
                console.log('🗑️ 删除元素:', keysToDelete)

                // 在删除前，从列高度中减去被删除元素的高度
                keysToDelete.forEach((key) => {
                    const columnIndex = itemToColumnRef.current.get(key)
                    const itemHeight = itemHeightsRef.current.get(key)
                    console.log('🔍 columnIndex:', columnIndex)
                    console.log('🔍 itemHeight:', itemHeight)
                    if (columnIndex !== undefined && itemHeight !== undefined) {
                        columnHeightsRef.current[columnIndex] -= (itemHeight + gap)
                        console.log(`📉 从列 ${columnIndex} 减去高度 ${itemHeight}px`)
                    }
                })

                setChildrenArray((prev) => {
                    return prev.map((column) => {
                        return column.filter((item) => {
                            // 直接使用 key 判断
                            if (React.isValidElement(item)) {
                                const itemKey = String(item.key || '')
                                return !keysToDelete.includes(itemKey)
                            }
                            return true
                        })
                    })
                })

                // 清理已删除元素的数据
                keysToDelete.forEach((key) => {
                    renderedItemsRef.current.delete(key)
                    measuredItemsRef.current.delete(key)
                    itemHeightsRef.current.delete(key)
                    itemToColumnRef.current.delete(key)
                })

                console.log('📊 删除后各列高度:', columnHeightsRef.current.map(h => `${h.toFixed(0)}px`))
            }
        }

        // 清空动画索引（每次children变化时清零）
        animationIndexRef.current.clear()

        // 重置动画计数器（每次children变化时清零）
        nextAnimationIndexRef.current = 0

        console.log('🎬 已显示过动画的元素:', Array.from(animatedItemsRef.current))

        // 清空所有观察器（会在离屏测量时重新创建）
        measureObserversRef.current.forEach((observer) => {
            observer.disconnect()
        })
        measureObserversRef.current.clear()

    }, [children, columns, childrenItems, getChildKey])

    // 设置 ResizeObserver，添加防抖
    useEffect(() => {
        calculateColumns()

        const handleResize = () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current)
            }
            resizeTimeoutRef.current = setTimeout(() => {
                calculateColumns()
            }, 10) // 10ms 防抖
        }

        const resizeObserver = new ResizeObserver(handleResize)

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        return () => {
            resizeObserver.disconnect()
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current)
            }
        }
    }, [calculateColumns])

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            console.log('🧹 组件卸载，清理所有状态')
            renderedItemsRef.current.clear()
            measuredItemsRef.current.clear()
            animationIndexRef.current.clear()
            animatedItemsRef.current.clear()
            itemHeightsRef.current.clear()
            itemToColumnRef.current.clear()
            // 清理所有测量观察器
            measureObserversRef.current.forEach((observer) => {
                observer.disconnect()
            })
            measureObserversRef.current.clear()
            // 重置计数器
            nextAnimationIndexRef.current = 0
        }
    }, [])

    // 获取容器宽度，用于隐藏容器的尺寸匹配
    const containerWidth = containerRef.current?.offsetWidth

    return (
        <>
            {/* 隐藏的测量容器 - 离屏预渲染 */}
            <div
                ref={measurementContainerRef}
                style={{
                    position: 'absolute',
                    top: -9999,
                    left: -9999,
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    width: containerWidth || '100%',
                    opacity: 0,
                }}
                aria-hidden="true"
            >
                {childrenItems.map((child, index) => (
                    <div
                        key={`masonry-measure-${getChildKey(child, index)}`}
                        style={{
                            // 确保测量容器的宽度与实际列宽一致
                            width: containerWidth && columns > 0
                                ? `${(containerWidth - gap * (columns - 1)) / columns}px`
                                : '100%'
                        }}
                    >
                        {child}
                    </div>
                ))}
            </div>

            {/* 实际显示的瀑布流布局 */}
            <div ref={containerRef} className={`w-full ${className}`} data-columns={columns}>
                {childrenArray.length > 0 ? (
                    <div className="flex" style={{ gap: `${gap}px`, padding: containerPadding ?? '16px' }}>
                        {childrenArray.map((columnChildren, columnIndex) => (
                            <div
                                key={`masonry-column-${columnIndex}`}
                                className="flex-1 flex flex-col max-w-full"
                                style={{ gap: `${gap}px` }}
                            >
                                {columnChildren}
                            </div>
                        ))}
                    </div>
                ) : (
                    // 空状态占位
                    <div style={{ padding: containerPadding ?? '16px' }} />
                )}
            </div>
        </>
    )
}
