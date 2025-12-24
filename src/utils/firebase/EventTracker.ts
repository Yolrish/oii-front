/**
 * 简化的自定义事件追踪模块（带缓存）
 * 
 * 提供一个封装好的事件追踪函数，支持：
 * - 自定义事件名称和参数
 * - 可选的 user_id、device_id、region 参数
 * - 三个 get 函数均内置内存 + localStorage 缓存
 */

import { analytics } from '@/components/analytics/firebase/FirebaseInit';
import { generateDeviceId, getDeviceAndLocationInfo } from '@/utils/firebase/DeviceLocationUtils';

// 事件追踪选项
export interface TrackEventOptions {
    includeUserId?: boolean;
    includeDeviceId?: boolean; // 使用 DeviceLocationUtils.generateDeviceId()
    includeRegion?: boolean;   // 使用 DeviceLocationUtils.getDeviceAndLocationInfo() 的位置参数
}

// 缓存常量
const LS_KEY_USER_ID = 'user'; // 外部系统应写入
// 设备与地区改由 DeviceLocationUtils 管理

// TTL（毫秒）
// TTL 逻辑已迁移到 DeviceLocationUtils（如有）

// 内存缓存
let cachedUserId: string | null | undefined; // undefined 表示未读取，null 表示明确无
// 仅保留 userId 的内存缓存

// 安全的localStorage读写
const safeGet = (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
};
const safeSet = (key: string, val: string): void => {
    try { localStorage.setItem(key, val); } catch { /* ignore */ }
};

/**
 * 获取用户ID（缓存：内存 → localStorage）
 * 说明：用户登录后，应由业务侧将 user_id 写入 localStorage。
 */
const getUserId = (): string | null => {
    if (cachedUserId !== undefined) {
        return cachedUserId;
    }
    const user = safeGet(LS_KEY_USER_ID);
    if (user) {
        cachedUserId = JSON.parse(user).id;
        return cachedUserId || null;
    } else {
        const anonymousUser = safeGet('anonymous_user');
        if (anonymousUser) {
            cachedUserId = JSON.parse(anonymousUser).id;
            return cachedUserId || null;
        }
    }
    return null;
};

/**
 * 生成/获取设备ID（缓存：内存 → localStorage，带TTL）
 */
// 设备ID统一由 DeviceLocationUtils.generateDeviceId 生成

/**
 * 尝试通过IP服务获取国家/地区（带超时、回退）
 */
// 地区解析统一由 DeviceLocationUtils 提供

/**
 * 通过时区尽可能推断国家/地区（兜底）
 */
// 时区推断逻辑由 DeviceLocationUtils 负责

/**
 * 获取地区（优先IP，带缓存与TTL；失败回退时区）
 */
// 地区获取改为使用 DeviceLocationUtils.getDeviceAndLocationInfo

/**
 * 简化的自定义事件追踪函数
 * @param eventName 事件名称
 * @param customParams 自定义事件参数
 * @param options 选项：是否包含 user_id、device_id、region
 */
export const trackEvent = async (
    eventName: string,
    customParams: Record<string, string | number | boolean> = {},
    options: TrackEventOptions = {}
): Promise<void> => {
    // 环境检查
    if (!analytics || typeof window === 'undefined') {
        console.warn('Firebase Analytics not ready. Event not sent:', eventName);
        return;
    }

    if (!eventName || typeof eventName !== 'string') {
        console.error('Event name must be a non-empty string');
        return;
    }

    try {
        // 构建最终的事件参数
        const finalParams: Record<string, string | number | boolean> = { ...customParams };

        // if (options.includeUserId) {
        //     const userId = getUserId();
        //     if (userId) finalParams.user_id = userId;
        // }
        // if (options.includeDeviceId) {
        //     finalParams.device_id = generateDeviceId();
        // }
        // if (options.includeRegion) {
        //     const info = await getDeviceAndLocationInfo();
        //     if (info) {
        //         const { device, location } = info;
        //         // 以 DeviceLocationUtils 的字段为基准
        //         if (location.country) finalParams.region = location.country;
        //         // if (location.region) finalParams.region = location.region;
        //         // if (location.city) finalParams.city = location.city;
        //         // if (location.source) finalParams.location_source = location.source;
        //         // time_zone 来自设备信息或位置信息
        //         const tz = device?.timeZone || location.timeZone;
        //         if (tz) finalParams.time_zone = tz;
        //     }
        // }

        // 添加user_id
        const userId = getUserId();
        if (userId) finalParams.user_id = userId;

        // 添加device_id
        finalParams.device_id = generateDeviceId();

        // 添加地区与时区
        const info = await getDeviceAndLocationInfo();
        if (info) {
            const { device, location } = info;
            if (location.country) finalParams.region = location.country;
            // time_zone 来自设备信息或位置信息
            const tz = device?.timeZone || location.timeZone;
            if (tz) finalParams.time_zone = tz;
        }

        // 添加时间戳
        finalParams.timestamp = new Date().toISOString();
        // 添加时区（统一命名为 time_zone），若上面没填则兜底
        if (!('time_zone' in finalParams)) {
            finalParams.time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }

        // 发送事件
        if (window.gtag) {
            window.gtag('event', eventName, finalParams);
            if (process.env.NODE_ENV === 'development') {
                // console.log('📊 Event tracked:', { eventName, params: finalParams, options });
            }
        } else {
            console.warn('gtag not available, event not sent');
        }
    } catch (error) {
        console.error('❌ Event tracking failed:', error);
    }
};

// 为 window.gtag 添加类型声明
declare global {
    interface Window {
        gtag: (
            command: 'config' | 'event' | 'js',
            targetId: string | Date,
            config?: Record<string, string | number | boolean | object>
        ) => void;
    }
}