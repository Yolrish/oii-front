"use client"
/**
 * 连续版本的阅读器，内容在可滚动容器中连续显示
 * 根据滚动进度计算页面进度
 */
import React, { useRef, useState, useEffect, useCallback, useMemo, useLayoutEffect } from "react"
import { cn } from "@/lib/utils"
import MarkdownRenderer from "@/components/common/markdown/MarkdownRenderer"
import styles from "./Reader_Continuous.module.css"

interface ReaderContinuousProps {
    /** Markdown 原始文本内容 */
    content: string
    /** 章节标题 */
    title?: string
    /** 容器高度，不传则由父组件决定 */
    height?: number | string
    /** 最高高度 */
    maxHeight?: number | string
    /** 自定义类名 */
    className?: string
    /** 页码/进度变化回调 */
    onPageChange?: (page: number, totalPages: number) => void
    /** 滚动进度变化回调 (0-100) */
    onProgressChange?: (progress: number) => void
    /** MarkdownRenderer 的 variant */
    variant?: 'default' | 'chat' | 'content'
    /** 每页的虚拟高度（用于计算页码），默认为容器高度 */
    pageHeight?: number
}

export default function ReaderContinuous({
    content,
    title,
    height,
    maxHeight,
    className,
    onPageChange,
    onProgressChange,
    variant = 'default',
    pageHeight: customPageHeight
}: ReaderContinuousProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [progress, setProgress] = useState(0)
    const [isReady, setIsReady] = useState(false)

    // 预处理内容：将单换行转为双换行，使每段成为独立块级元素
    // 这样 text-indent 能对每段生效
    const processedContent = useMemo(() => {
        // 避免使用 lookbehind（Safari 兼容性问题）
        // 先将双换行替换为占位符，再将单换行替换为双换行，最后还原
        const placeholder = '\u0000DOUBLE_NEWLINE\u0000'
        return content
            .replace(/\n\n/g, placeholder)
            .replace(/\n/g, '\n\n')
            .replace(new RegExp(placeholder, 'g'), '\n\n')
            // 清理多余的换行
            .replace(/\n{3,}/g, '\n\n')
    }, [content])

    // 用于节流的 ref
    const rafRef = useRef<number | null>(null)
    const lastPageRef = useRef(1)
    const lastProgressRef = useRef(0)
    // 标记是否正在程序化滚动，避免滚动事件处理器干扰
    const isScrollingRef = useRef(false)
    // 保存滚动位置，用于在重渲染后恢复
    const savedScrollTopRef = useRef(0)

    // 计算总页数
    const calculateTotalPages = useCallback(() => {
        if (!containerRef.current || !contentRef.current) return

        const containerHeight = containerRef.current.clientHeight
        const contentHeight = contentRef.current.scrollHeight
        const pageH = customPageHeight || containerHeight

        // 至少 1 页
        const pages = Math.max(1, Math.ceil(contentHeight / pageH))
        setTotalPages(pages)
        setIsReady(true)
    }, [customPageHeight])

    // 计算页码和进度（不触发状态更新）
    const calculatePageAndProgress = useCallback(() => {
        if (!containerRef.current || !contentRef.current) return

        const container = containerRef.current
        const contentHeight = contentRef.current.scrollHeight
        const containerHeight = container.clientHeight
        const scrollTop = container.scrollTop
        const maxScroll = contentHeight - containerHeight

        // 保存滚动位置
        savedScrollTopRef.current = scrollTop

        // 计算滚动进度 (0-100)
        const scrollProgress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0
        const newProgress = Math.min(100, Math.max(0, Math.round(scrollProgress)))

        // 计算当前页码
        const pageH = customPageHeight || containerHeight
        const newPage = (scrollTop + containerHeight >= contentHeight - 100) ?
            totalPages : Math.min(Math.floor(scrollTop / pageH) + 1, totalPages)

        lastPageRef.current = newPage
        lastProgressRef.current = newProgress

        return { page: newPage, progress: newProgress }
    }, [customPageHeight, totalPages])

    // 处理滚动事件（不在滚动中更新 state）
    const handleScroll = useCallback(() => {
        // 程序化滚动期间不处理
        if (isScrollingRef.current) return
        if (!containerRef.current) return

        // 保存当前滚动位置
        savedScrollTopRef.current = containerRef.current.scrollTop

        // 取消之前的 RAF
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current)
        }

        // 只计算，不更新状态
        rafRef.current = requestAnimationFrame(() => {
            calculatePageAndProgress()
        })
    }, [calculatePageAndProgress])

    // 滚动结束后同步状态（使用 scrollend 事件或防抖）
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        let syncTimer: ReturnType<typeof setTimeout> | null = null

        const syncState = () => {
            if (syncTimer) clearTimeout(syncTimer)
            syncTimer = setTimeout(() => {
                // 滚动停止后同步状态
                if (lastPageRef.current !== currentPage) {
                    setCurrentPage(lastPageRef.current)
                }
                if (lastProgressRef.current !== progress) {
                    setProgress(lastProgressRef.current)
                }
            }, 150) // 滚动停止 150ms 后同步
        }

        container.addEventListener('scroll', syncState, { passive: true })

        return () => {
            if (syncTimer) clearTimeout(syncTimer)
            container.removeEventListener('scroll', syncState)
        }
    }, [currentPage, progress])

    // 清理 RAF
    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }
        }
    }, [])

    // 在重渲染后恢复滚动位置（Safari 兼容性修复）
    useLayoutEffect(() => {
        if (!containerRef.current || isScrollingRef.current) return
        // 如果滚动位置被意外重置，恢复它
        if (containerRef.current.scrollTop === 0 && savedScrollTopRef.current > 0) {
            containerRef.current.scrollTop = savedScrollTopRef.current
        }
    }, [currentPage, progress])

    // 监听内容变化，重新计算页数
    useEffect(() => {
        const timer = setTimeout(() => {
            calculateTotalPages()
        }, 100)

        return () => clearTimeout(timer)
    }, [content, height, calculateTotalPages])

    // ResizeObserver 监听容器大小变化（添加节流避免频繁触发）
    useEffect(() => {
        if (!containerRef.current) return

        let resizeTimer: ReturnType<typeof setTimeout> | null = null
        const resizeObserver = new ResizeObserver(() => {
            // 节流：避免频繁触发导致滚动位置重置
            if (resizeTimer) clearTimeout(resizeTimer)
            resizeTimer = setTimeout(() => {
                calculateTotalPages()
            }, 200)
        })

        resizeObserver.observe(containerRef.current)

        return () => {
            if (resizeTimer) clearTimeout(resizeTimer)
            resizeObserver.disconnect()
        }
    }, [calculateTotalPages])

    // 页码变化回调
    useEffect(() => {
        onPageChange?.(currentPage, totalPages)
    }, [currentPage, totalPages, onPageChange])

    // 进度变化回调
    useEffect(() => {
        onProgressChange?.(progress)
    }, [progress, onProgressChange])

    // 跳转到指定页
    const goToPage = useCallback((page: number) => {
        if (!containerRef.current) return

        const targetPage = Math.max(1, Math.min(page, totalPages))
        const containerHeight = containerRef.current.clientHeight
        const pageH = customPageHeight || containerHeight
        const targetScroll = (targetPage - 1) * pageH

        // 标记程序化滚动开始
        isScrollingRef.current = true
        // 先更新页码状态
        lastPageRef.current = targetPage
        setCurrentPage(targetPage)

        containerRef.current.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        })

        // 滚动动画结束后重置标记（估算时间）
        setTimeout(() => {
            isScrollingRef.current = false
        }, 500)
    }, [totalPages, customPageHeight])

    // 生成分页按钮（使用 useMemo 缓存）
    const paginationPages = useMemo(() => {
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
    }, [currentPage, totalPages])

    // 容器样式
    const containerStyle: React.CSSProperties = {
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        maxHeight: maxHeight ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined,
    }

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

            {/* 可滚动内容区域 */}
            <div
                ref={containerRef}
                className={cn(
                    styles.reader__content,
                    !isReady && styles['reader__content--loading']
                )}
                onScroll={handleScroll}
            >
                <div ref={contentRef} className={styles.reader__inner}>
                    <MarkdownRenderer content={processedContent} variant={variant} />
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
                    {paginationPages.map((page, index) => (
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

