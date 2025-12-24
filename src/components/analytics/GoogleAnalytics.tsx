/**
 * Firebase Analytics 初始化组件
 * 
 * 专门负责 Firebase Analytics 和 gtag.js 的初始化配置：
 * 
 * 🔧 核心职责：
 * 1. 加载和初始化 gtag.js 脚本
 * 2. 确保 Firebase Analytics 正确初始化
 * 3. 配置页面浏览自动跟踪
 * 4. 提供统一的初始化状态管理
 * 
 * 🎯 设计原则：
 * - 单一职责：只负责初始化，不处理事件发送
 * - 模块分离：事件跟踪功能在独立的 EventTracker 模块中
 * - 性能优化：延迟加载和异步初始化
 * - 错误恢复：初始化失败时的降级策略
 * 
 * 📦 相关模块：
 * - EventTracker: 事件发送和跟踪
 * - PageTracker: 页面浏览跟踪
 * - DeviceLocationUtils: 设备和位置信息
 * 
 * 使用方法：
 * ```tsx
 * // 在 MainLayout 中使用
 * <GoogleAnalytics />
 * 
 * // 事件发送使用独立模块
 * import { trackEvent } from '@/utils/analytics/EventTracker';
 * trackEvent('button_click', { button_name: 'Submit' });
 * ```
 */

'use client';

import { useEffect, Suspense, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { analytics, initializeFirebaseAnalytics } from './firebase/FirebaseInit';

// 为window.gtag添加类型声明
declare global {
    interface Window {
        gtag: (
            command: 'config' | 'event' | 'js',
            targetId: string | Date,
            config?: Record<string, string | number | boolean | object>
        ) => void;
        dataLayer: Array<Record<string, unknown>>;
    }
}

// 使用Firebase的measurement ID - 确保与Firebase配置中的measurementId一致
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '';

// 检查 GA 测量 ID 是否存在
const isGAMeasurementIdSet = () => {
    if (!GA_MEASUREMENT_ID) {
        console.warn('Google Analytics measurement ID is not set.');
        return false;
    }
    return true;
};

// 页面浏览跟踪函数 - 使用page_view事件而不是config
// const trackPageview = (url: string) => {
//     if (isGAMeasurementIdSet() && analytics && typeof window !== 'undefined') {
//         window.gtag('event', 'tapi_web_page_view', {
//             page_path: url,
//             page_title: document.title,
//             page_location: window.location.href
//         });
//     }
// };

// 简化版本，移除页面跟踪导入

// 内部组件，包含useSearchParams逻辑
function GoogleAnalyticsInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const fullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    const [isFirebaseReady, setIsFirebaseReady] = useState(false);

    // 确保Firebase Analytics初始化完成
    useEffect(() => {
        const ensureFirebaseAnalytics = async () => {
            try {
                // 如果analytics还没有初始化，尝试初始化
                const analyticsInstance = await initializeFirebaseAnalytics();
                if (analyticsInstance) {
                    setIsFirebaseReady(true);
                    console.log('Firebase Analytics ready for gtag integration');
                } else if (analytics) {
                    // 如果analytics已经存在，直接标记为准备就绪
                    setIsFirebaseReady(true);
                }
            } catch (error) {
                console.warn('Error ensuring Firebase Analytics:', error);
            }
        };

        ensureFirebaseAnalytics();
    }, []);

    // 简化的页面浏览跟踪
    useEffect(() => {
        if (isFirebaseReady && typeof window !== 'undefined' && window.gtag) {
            // 直接使用gtag发送页面浏览事件
            window.gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_path: fullUrl
            });
        }
    }, [fullUrl, isFirebaseReady]);

    return null;
}

// 主要的GoogleAnalytics组件
export default function GoogleAnalytics() {
    if (!isGAMeasurementIdSet()) {
        return null;
    }

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        // 重要：已移除 gtag('config', '${GA_MEASUREMENT_ID}') 调用
                        // Firebase Analytics 将处理配置，确保事件与Firebase服务集成
                    `
                }}
            />
            <Suspense fallback={null}>
                <GoogleAnalyticsInner />
            </Suspense>
        </>
    );
}


