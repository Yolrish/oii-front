/**
 * 内容列表组件
 */

"use client"

import type React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInfiniteScroll } from "@/hooks/infinite-scroll/use-infinite-scroll"

interface FeedProps {
    children: React.ReactNode,// 内容列表
    isInfiniteScrolling: boolean,// 是否正在无限滚动
    isReachingEnd: boolean,// 是否到达底部
    isEmpty: boolean,// 是否为空
    infiniteScrollCallback: () => void,// 无限滚动回调函数
    showReachingEndTip?: boolean,// 是否显示到达底部提示
    wrapClassName?: string,// 包裹类名
    containerClassName?: string,// 容器类名
    sentinelPosition?: 'top' | 'bottom',
    containerId?: string,
}

export interface FeedHandle {
    handleManualRefreshClick: () => void;
}

function Feed({ children,
    isInfiniteScrolling,
    isReachingEnd,
    isEmpty,
    infiniteScrollCallback,
    showReachingEndTip = true,
    wrapClassName,
    containerClassName,
    containerId = 'feed_container',
    sentinelPosition = 'bottom',
}: FeedProps) {

    // 设置无限滚动
    const { observerRef } = useInfiniteScroll(infiniteScrollCallback)

    const Indicator = (
        <div
            ref={observerRef}
            className={cn(
                "flex justify-center items-center py-4 transition-all duration-300",
                sentinelPosition === 'top' && "mb-4",
                sentinelPosition === 'bottom' && "mt-4",
                !isInfiniteScrolling && !isReachingEnd ? "opacity-0 h-0" : "opacity-100 h-12",
                // 最上方且不显示到达底部提示时，设置高度为0
                sentinelPosition === 'top' && !isInfiniteScrolling && isReachingEnd && !isEmpty && !showReachingEndTip && 
                    "mb-0 py-0 h-0",
            )}
        >
            {isInfiniteScrolling && (
                <div className="flex items-center space-x-2 text-gray-400 animate-fade-in">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading more...</span>
                </div>
            )}
            {!isInfiniteScrolling && isEmpty && (
                <div className="flex items-center space-x-2 text-gray-400 animate-fade-in">
                    <span className="text-sm">No data</span>
                </div>
            )}
            {!isInfiniteScrolling && isReachingEnd && !isEmpty && showReachingEndTip && (
                <div className="flex items-center space-x-2 text-gray-400 animate-fade-in">
                    <span className="text-sm">You've reached the end</span>
                </div>
            )}
        </div>
    );

    return (
        <div className={cn(
            'w-full flex-1',
            'overflow-y-auto',
            wrapClassName,
        )}>
            <div className={containerClassName} id={containerId}>
                {sentinelPosition === 'top' && Indicator}
                {children}
                {sentinelPosition === 'bottom' && Indicator}
            </div>
        </div>
    )
}

export default Feed;