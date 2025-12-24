"use client"
/**
 * 断点版本的阅读器，对内容检测高度，按照每一页的高度进行分页将元素分配到每个页面中
 * 页面之间是不连续的
 */
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import MarkdownRenderer from "@/components/common/markdown/MarkdownRenderer"
import styles from "./Reader_Break.module.css"

interface ReaderProps {
    /** Markdown 原始文本内容 */
    content: string
    /** 章节标题 */
    title?: string
    /** 容器高度，不传则由父组件决定 */
    height?: number | string
    /** 自定义类名 */
    className?: string
    /** 页码变化回调 */
    onPageChange?: (page: number, totalPages: number) => void
    /** MarkdownRenderer 的 variant */
    variant?: 'default' | 'chat' | 'content'
}

export default function Reader({
    content,
    title,
    height,
    className,
    onPageChange,
    variant = 'default'
}: ReaderProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const measureRef = useRef<HTMLDivElement>(null)

    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [pageBreaks, setPageBreaks] = useState<number[]>([0])
    const [isReady, setIsReady] = useState(false)

    // 获取 MarkdownRenderer 内部的实际元素列表
    // MarkdownRenderer 返回结构：<div>解析出来的元素列表</div>
    // 所以需要 measureRef.children[0].children 获取实际元素
    const getContentChildren = useCallback(() => {
        if (!measureRef.current) return []
        const markdownWrapper = measureRef.current.children[0] as HTMLElement
        if (!markdownWrapper) return []
        return Array.from(markdownWrapper.children) as HTMLElement[]
    }, [])

    // 计算分页断点
    const calculatePages = useCallback(() => {
        if (!containerRef.current || !measureRef.current) return

        // 安全边距，防止边界情况导致元素被截断
        const SAFETY_MARGIN = 4
        const containerHeight = containerRef.current.clientHeight - SAFETY_MARGIN

        // 获取 MarkdownRenderer 内部的实际元素列表
        const children = getContentChildren()
        if (children.length === 0) {
            setTotalPages(1)
            setPageBreaks([0])
            setIsReady(true)
            return
        }

        // 获取 MarkdownRenderer 包装器作为位置参考
        const markdownWrapper = measureRef.current.children[0] as HTMLElement
        if (!markdownWrapper) {
            setTotalPages(1)
            setPageBreaks([0])
            setIsReady(true)
            return
        }

        const breaks: number[] = [0]
        let pageStartOffset = 0 // 当前页的起始偏移量

        children.forEach((child, index) => {
            // 使用元素相对于父容器的实际位置
            const childTop = child.offsetTop
            const childBottom = childTop + child.offsetHeight
            
            // 计算元素底部相对于当前页起始位置的距离
            const relativeBottom = childBottom - pageStartOffset
            
            // 如果元素底部超出容器高度，需要在此元素之前分页
            // 但要确保每页至少有一个元素（避免单个元素超高导致无限循环）
            if (relativeBottom > containerHeight && index > breaks[breaks.length - 1]) {
                breaks.push(index)
                // 更新新页的起始偏移量为当前元素的顶部
                pageStartOffset = childTop
            }
        })

        setPageBreaks(breaks)
        setTotalPages(breaks.length)
        setIsReady(true)
    }, [getContentChildren])

    // 监听内容和容器变化
    useEffect(() => {
        const timer = setTimeout(() => {
            calculatePages()
        }, 100)

        return () => clearTimeout(timer)
    }, [content, height, calculatePages])

    // ResizeObserver 监听容器大小变化
    useEffect(() => {
        if (!containerRef.current) return

        const resizeObserver = new ResizeObserver(() => {
            calculatePages()
        })

        resizeObserver.observe(containerRef.current)

        return () => resizeObserver.disconnect()
    }, [calculatePages])

    // 页码变化回调
    useEffect(() => {
        onPageChange?.(currentPage, totalPages)
    }, [currentPage, totalPages, onPageChange])

    // 获取当前页的内容范围
    const getCurrentPageContent = useMemo(() => {
        if (!measureRef.current) return null

        const children = getContentChildren()
        const startIndex = pageBreaks[currentPage - 1] ?? 0
        const endIndex = pageBreaks[currentPage] ?? children.length

        return { startIndex, endIndex }
    }, [currentPage, pageBreaks, getContentChildren])

    // 跳转到指定页
    const goToPage = useCallback((page: number) => {
        const targetPage = Math.max(1, Math.min(page, totalPages))
        setCurrentPage(targetPage)
    }, [totalPages])

    // 生成分页按钮
    const renderPagination = () => {
        const pages: (number | string)[] = []
        const maxVisible = 5

        if (totalPages <= maxVisible + 2) {
            // 页数较少，全部显示
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // 页数较多，显示省略号
            if (currentPage <= 3) {
                for (let i = 1; i <= maxVisible; i++) {
                    pages.push(i)
                }
                pages.push('...')
                pages.push(totalPages)
            } else if (currentPage >= totalPages - 2) {
                pages.push(1)
                pages.push('...')
                for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
                    pages.push(i)
                }
            } else {
                pages.push(1)
                pages.push('...')
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i)
                }
                pages.push('...')
                pages.push(totalPages)
            }
        }

        return pages
    }

    // 容器样式
    const containerStyle: React.CSSProperties = height
        ? { height: typeof height === 'number' ? `${height}px` : height }
        : {}

    return (
        <div className={cn(styles.reader, className)} style={containerStyle}>
            {/* 头部 - 标题和页码 */}
            <div className={styles.reader__header}>
                {title && (
                    <div className={styles.reader__title}>
                        <span className={styles.reader__title_bullet}>•</span>
                        <span className={styles.reader__title_text}>{title}</span>
                    </div>
                )}
                <div className={styles.reader__page_info}>
                    {String(currentPage).padStart(2, '0')}/{String(totalPages).padStart(2, '0')} Pages
                </div>
            </div>

            {/* 内容区域 */}
            <div
                ref={containerRef}
                className={styles.reader__content}
            >
                {/* 隐藏的测量容器 */}
                <div
                    ref={measureRef}
                    className={styles.reader__measure}
                    aria-hidden="true"
                >
                    <MarkdownRenderer content={content} variant={variant} />
                </div>

                {/* 可见内容 */}
                <div
                    ref={contentRef}
                    className={cn(
                        styles.reader__visible,
                        !isReady && styles['reader__visible--loading']
                    )}
                >
                    <PageContent
                        content={content}
                        variant={variant}
                        pageInfo={getCurrentPageContent}
                        measureRef={measureRef}
                        getContentChildren={getContentChildren}
                    />
                </div>
            </div>

            {/* 分页导航 */}
            <div className={styles.reader__pagination}>
                <button
                    className={cn(
                        styles.reader__pagination_btn,
                        styles['reader__pagination_btn--nav'],
                        currentPage === 1 && styles['reader__pagination_btn--disabled']
                    )}
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                >
                    <ChevronLeftIcon />
                </button>

                <div className={styles.reader__pagination_pages}>
                    {renderPagination().map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className={styles.reader__pagination_ellipsis}>
                                ···
                            </span>
                        ) : (
                            <button
                                key={page}
                                className={cn(
                                    styles.reader__pagination_btn,
                                    styles['reader__pagination_btn--page'],
                                    currentPage === page && styles['reader__pagination_btn--active']
                                )}
                                onClick={() => goToPage(page as number)}
                            >
                                {page}
                            </button>
                        )
                    ))}
                </div>

                <button
                    className={cn(
                        styles.reader__pagination_btn,
                        styles['reader__pagination_btn--nav'],
                        currentPage === totalPages && styles['reader__pagination_btn--disabled']
                    )}
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                >
                    <ChevronRightIcon />
                </button>
            </div>
        </div>
    )
}

// 页面内容组件 - 克隆并显示当前页的元素
function PageContent({
    content,
    variant,
    pageInfo,
    measureRef,
    getContentChildren
}: {
    content: string
    variant: 'default' | 'chat' | 'content'
    pageInfo: { startIndex: number; endIndex: number } | null
    measureRef: React.RefObject<HTMLDivElement | null>
    getContentChildren: () => HTMLElement[]
}) {
    const [visibleContent, setVisibleContent] = useState<React.ReactNode[]>([])

    useEffect(() => {
        if (!measureRef.current || !pageInfo) return

        // 获取 MarkdownRenderer 内部的实际元素列表
        const children = getContentChildren()
        const { startIndex, endIndex } = pageInfo

        // 克隆当前页范围内的元素
        const clonedElements = children
            .slice(startIndex, endIndex)
            .map((child, index) => {
                const clonedNode = child.cloneNode(true) as HTMLElement
                return (
                    <div
                        key={`${startIndex}-${index}`}
                        dangerouslySetInnerHTML={{ __html: clonedNode.outerHTML }}
                    />
                )
            })

        setVisibleContent(clonedElements)
    }, [pageInfo, measureRef, content, getContentChildren])

    // 如果还没有分页信息，显示完整内容
    if (!pageInfo) {
        return <MarkdownRenderer content={content} variant={variant} />
    }

    return <>{visibleContent}</>
}

// 左箭头图标
function ChevronLeftIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

// 右箭头图标
function ChevronRightIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

