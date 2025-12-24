"use client"
/**
 * 1.0版本
 * 每列元素按个数均匀分配
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"

interface MasonryLayoutProps {
    children: React.ReactNode
    minColumnWidth?: number
    maxColumns?: number
    gap?: number
    containerPadding?: string
    className?: string
    animationDelay?: number
}

// 动画包装组件
const AnimatedItem = ({
    children,
    index,
    animationDelay = 100,
    isNew = false,
}: {
    children: React.ReactNode
    index: number
    animationDelay?: number
    isNew?: boolean
}) => {
    const [isVisible, setIsVisible] = useState(!isNew)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (!isNew) return

        timeoutRef.current = setTimeout(() => {
            setIsVisible(true)
        }, index * animationDelay)

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [index, animationDelay, isNew])

    return (
        <div
            className={`transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
        >
            {children}
        </div>
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
    const [columns, setColumns] = useState(1)
    const [childrenArray, setChildrenArray] = useState<React.ReactNode[][]>([])
    const renderedItemsRef = useRef<Map<string, boolean>>(new Map())
    const layoutChangeKeyRef = useRef(0)
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
                return limitedColumnsCount
            }
            return prevColumns
        })
    }, [minColumnWidth, maxColumns])

    // 使用 useMemo 优化 children 数组的处理
    const childrenItems = useMemo(() => {
        return React.Children.toArray(children)
    }, [children])

    // 清理已删除项目的函数
    const cleanupRemovedItems = useCallback((currentKeys: Set<string>) => {
        const keysToDelete: string[] = []
        renderedItemsRef.current.forEach((_, key) => {
            if (!currentKeys.has(key)) {
                keysToDelete.push(key)
            }
        })
        keysToDelete.forEach((key) => {
            renderedItemsRef.current.delete(key)
        })
    }, [])

    // 分发子元素到各列
    useEffect(() => {
        if (!columns || childrenItems.length === 0) {
            setChildrenArray([])
            return
        }

        const newChildrenArray: React.ReactNode[][] = Array.from({ length: columns }, () => [])
        const currentKeys = new Set<string>()
        let newItemIndex = 0

        childrenItems.forEach((child, index) => {
            // 生成更安全的 key
            const childKey =
                React.isValidElement(child) && child.key
                    ? String(child.key)
                    : `item-${index}-${typeof child === "string" ? child.slice(0, 10) : "node"}`

            currentKeys.add(childKey)
            const isNewItem = !renderedItemsRef.current.has(childKey)

            // 找到项目数量最少的列
            const shortestColumnIndex = newChildrenArray
                .map((column, i) => ({ index: i, length: column.length }))
                .sort((a, b) => a.length - b.length)[0].index

            const wrappedChild = isNewItem ? (
                <AnimatedItem
                    key={`animated-${childKey}-${layoutChangeKeyRef.current}`}
                    index={newItemIndex}
                    animationDelay={animationDelay}
                    isNew={true}
                >
                    {child}
                </AnimatedItem>
            ) : (
                <div key={`static-${childKey}-${layoutChangeKeyRef.current}`}>{child}</div>
            )

            if (isNewItem) {
                newItemIndex++
                renderedItemsRef.current.set(childKey, true)
            }

            newChildrenArray[shortestColumnIndex].push(wrappedChild)
        })

        // 清理已删除的项目
        cleanupRemovedItems(currentKeys)
        setChildrenArray(newChildrenArray)
    }, [childrenItems, columns, animationDelay, cleanupRemovedItems])

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
            renderedItemsRef.current.clear()
        }
    }, [])

    if (childrenArray.length === 0) {
        return <div ref={containerRef} className={`w-full ${className}`} />
    }

    return (
        <div ref={containerRef} className={`w-full ${className}`} data-columns={columns}>
            <div className="flex" style={{ gap: `${gap}px`, padding: containerPadding??'16px' }}>
                {childrenArray.map((columnChildren, columnIndex) => (
                    <div
                        key={`column-${columnIndex}-${layoutChangeKeyRef.current}`}
                        className="flex-1 flex flex-col max-w-full"
                        style={{ gap: `${gap}px` }}
                    >
                        {columnChildren}
                    </div>
                ))}
            </div>
        </div>
    )
}
