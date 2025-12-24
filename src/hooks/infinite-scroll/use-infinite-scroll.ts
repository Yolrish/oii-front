"use client"

import { useEffect, useRef } from "react"

/**
 * 无限滚动自定义 Hook
 * @param callback - 当元素进入视口时要执行的回调函数
 * @param options - IntersectionObserver 的配置选项
 * @returns 返回一个包含 observerRef 的对象，用于绑定到需要观察的 DOM 元素
 */
export function useInfiniteScroll(callback: () => void, options = {}) {
    // 创建一个 ref 用于绑定到需要观察的 DOM 元素
    const observerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // 保存当前观察的元素的引用
        const currentElement = observerRef.current

        // 创建 IntersectionObserver 实例
        const observer = new IntersectionObserver(
            // 当观察的元素进入视口时触发的回调
            (entries) => {
                const [entry] = entries
                // 当元素进入视口时执行回调函数
                if (entry.isIntersecting) {
                    callback()
                }
            },
            // IntersectionObserver 的配置选项
            {
                root: null, // 使用视口作为根元素
                rootMargin: "0px", // 观察区域的外边距
                threshold: 0.1, // 当目标元素 10% 可见时触发
                ...options, // 允许覆盖默认配置
            },
        )

        // 如果 ref 已绑定到 DOM 元素，开始观察
        if (currentElement) {
            observer.observe(currentElement)
        }

        // 组件卸载时清理观察者
        return () => {
            if (currentElement) {
                observer.unobserve(currentElement)
            }
        }
    }, [callback, options]) // 当 callback 或 options 改变时重新设置观察者

    // 返回 ref，供组件使用
    return { observerRef }
}