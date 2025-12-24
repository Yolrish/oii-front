/**
 * Firebase 设备与地理位置信息获取工具
 * 
 * 这个模块提供了多种方式来获取用户设备信息和地理位置：
 * 1. Firebase Analytics 自动收集的信息
 * 2. 浏览器 API 获取的设备信息
 * 3. 地理位置 API 获取精确位置
 * 4. IP 地理位置服务
 */

import { analytics } from '@/components/analytics/firebase/FirebaseInit';
import { logEvent } from 'firebase/analytics';

// 设备信息接口
export interface DeviceInfo {
    deviceId: string;
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
    operatingSystem: string;
    browser: string;
    screenResolution: string;
    language: string;
    timeZone: string;
    userAgent: string;
}

// 地理位置信息接口
export interface LocationInfo {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    timeZone?: string;
    source: 'gps' | 'ip' | 'timezone' | 'firebase';
}

// Firebase自动收集的信息接口
export interface FirebaseAutoCollectedInfo {
    deviceCategory: string;
    deviceModel: string;
    operatingSystem: string;
    operatingSystemVersion: string;
    language: string;
    country: string;
    region: string;
    city: string;
}

/**
 * 生成设备唯一标识符
 * 基于多种浏览器特征生成稳定的设备ID
 * 优先返回localStorage中的设备ID
 */
export const generateDeviceId = (): string => {
    if (typeof window === 'undefined') return 'server-side';
    
    // 检查是否已有存储的设备ID
    const storedId = localStorage.getItem('firebase_device_id');
    if (storedId) return storedId;
    
    try {
        // 优先：使用 Web Crypto 生成强随机且更长的ID
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            const uuid = window.crypto.randomUUID().replace(/-/g, ''); // 32位hex
            const deviceId = 'web_device_' + uuid; // 总长度约 43
            localStorage.setItem('firebase_device_id', deviceId);
            return deviceId;
        }

        // 其次：使用 getRandomValues 生成16字节随机hex（32位）
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            const bytes = new Uint8Array(16);
            window.crypto.getRandomValues(bytes);
            const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
            const deviceId = 'web_device_' + hex; // 总长度约 43
            localStorage.setItem('firebase_device_id', deviceId);
            return deviceId;
        }

        // 回退：使用现有的指纹hash方案（较短），并附加时间戳以拉长
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let canvasFingerprint = '';
        if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Device fingerprint 🔐', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Device fingerprint 🔐', 4, 17);
            canvasFingerprint = canvas.toDataURL();
        }
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            navigator.languages?.join(',') || '',
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.platform,
            navigator.cookieEnabled,
            canvasFingerprint.substring(0, 100),
            navigator.hardwareConcurrency || 0,
            navigator.maxTouchPoints || 0
        ].join('|');
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const base36 = Math.abs(hash).toString(36).padStart(8, '0');
        const ts36 = Date.now().toString(36);
        const deviceId = 'web_device_' + base36 + ts36; // 长度约 11+8+10=29 左右
        localStorage.setItem('firebase_device_id', deviceId);
        return deviceId;
    } catch (error) {
        console.warn('Error generating device ID:', error);
        return 'device_fallback_' + Date.now().toString(36);
    }
};

/**
 * 获取详细的设备信息
 */
export const getDeviceInfo = (): DeviceInfo => {
    if (typeof window === 'undefined') {
        return {
            deviceId: 'server-side',
            deviceType: 'unknown',
            operatingSystem: 'unknown',
            browser: 'unknown',
            screenResolution: 'unknown',
            language: 'unknown',
            timeZone: 'unknown',
            userAgent: 'server-side'
        };
    }

    const userAgent = navigator.userAgent;
    
    // 检测设备类型
    let deviceType: DeviceInfo['deviceType'] = 'unknown';
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        if (/iPad|Tablet/i.test(userAgent)) {
            deviceType = 'tablet';
        } else {
            deviceType = 'mobile';
        }
    } else {
        deviceType = 'desktop';
    }
    
    // 检测操作系统
    let operatingSystem = 'unknown';
    if (userAgent.includes('Windows')) operatingSystem = 'Windows';
    else if (userAgent.includes('Mac')) operatingSystem = 'macOS';
    else if (userAgent.includes('Linux')) operatingSystem = 'Linux';
    else if (userAgent.includes('Android')) operatingSystem = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) operatingSystem = 'iOS';
    
    // 检测浏览器
    let browser = 'unknown';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';
    
    return {
        deviceId: generateDeviceId(),
        deviceType,
        operatingSystem,
        browser,
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userAgent: userAgent.substring(0, 200) // 限制长度
    };
};

/**
 * 获取用户的UTC偏移
 * @returns 形如 'UTC +08:00' 的偏移字符串
 */
export const getUserUTCOffset = (): string => {
    try {
        const offsetMinutes = new Date().getTimezoneOffset(); // 本地时间与UTC的差值（分钟），东区为负，西区为正
        const totalMinutesFromUTC = -offsetMinutes; // 转为东区为正、西区为负
        const sign = totalMinutesFromUTC >= 0 ? '+' : '-';
        const absMinutes = Math.abs(totalMinutesFromUTC);
        const hours = Math.floor(absMinutes / 60);
        const minutes = absMinutes % 60;
        const hh = String(hours).padStart(2, '0');
        const mm = String(minutes).padStart(2, '0');
        return `UTC ${sign}${hh}:${mm}`;
    } catch (error) {
        console.warn('Error getting user UTC offset:', error);
        return 'UTC +00:00';
    }
};

/**
 * 基于时区推断地理位置
 */
export const getLocationFromTimezone = (): LocationInfo => {
    if (typeof window === 'undefined') {
        return { source: 'timezone' };
    }

    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let country = 'unknown';
        let region = 'unknown';
        
        // 时区到国家/地区的映射
        if (timezone.includes('Asia')) {
            if (timezone.includes('Shanghai') || timezone.includes('Beijing') || timezone.includes('Chongqing')) {
                country = 'CN';
                region = 'China';
            } else if (timezone.includes('Tokyo')) {
                country = 'JP';
                region = 'Japan';
            } else if (timezone.includes('Seoul')) {
                country = 'KR';
                region = 'Korea';
            } else if (timezone.includes('Singapore')) {
                country = 'SG';
                region = 'Singapore';
            } else if (timezone.includes('Hong_Kong')) {
                country = 'HK';
                region = 'Hong Kong';
            } else {
                region = 'Asia';
            }
        } else if (timezone.includes('America')) {
            if (timezone.includes('New_York') || timezone.includes('Chicago') || timezone.includes('Los_Angeles') || timezone.includes('Denver')) {
                country = 'US';
                region = 'United States';
            } else if (timezone.includes('Toronto') || timezone.includes('Vancouver')) {
                country = 'CA';
                region = 'Canada';
            } else {
                region = 'Americas';
            }
        } else if (timezone.includes('Europe')) {
            if (timezone.includes('London')) {
                country = 'GB';
                region = 'United Kingdom';
            } else if (timezone.includes('Paris')) {
                country = 'FR';
                region = 'France';
            } else if (timezone.includes('Berlin')) {
                country = 'DE';
                region = 'Germany';
            } else {
                region = 'Europe';
            }
        } else if (timezone.includes('Australia')) {
            country = 'AU';
            region = 'Australia';
        }
        
        return {
            country,
            region,
            timeZone: timezone,
            source: 'timezone'
        };
    } catch (error) {
        console.warn('Error getting location from timezone:', error);
        return { source: 'timezone' };
    }
};

/**
 * 使用浏览器地理位置API获取精确位置
 */
export const getLocationFromGPS = (): Promise<LocationInfo> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
            resolve({ source: 'gps' });
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5分钟缓存
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    source: 'gps'
                });
            },
            (error) => {
                console.warn('GPS location error:', error.message);
                resolve({ source: 'gps' });
            },
            options
        );
    });
};

/**
 * 使用免费IP地理位置服务
 */
export const getLocationFromIP = async (): Promise<LocationInfo> => {
    try {
        // 使用免费的ipapi.co服务
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('IP location service unavailable');
        
        const data = await response.json();
        
        return {
            country: data.country_code,
            region: data.region,
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude,
            source: 'ip'
        };
    } catch (error) {
        console.warn('Error getting location from IP:', error);
        
        // 备用方案：使用免费的ipinfo.io
        try {
            const response = await fetch('https://ipinfo.io/json');
            if (!response.ok) throw new Error('Backup IP service unavailable');
            
            const data = await response.json();
            const [lat, lng] = data.loc ? data.loc.split(',').map(Number) : [null, null];
            
            return {
                country: data.country,
                region: data.region,
                city: data.city,
                latitude: lat || undefined,
                longitude: lng || undefined,
                source: 'ip'
            };
        } catch (backupError) {
            console.warn('Error with backup IP service:', backupError);
            return { source: 'ip' };
        }
    }
};

/**
 * 发送设备和位置信息到Firebase Analytics
 */
export const sendDeviceLocationToFirebase = async (
    deviceInfo: DeviceInfo,
    locationInfo: LocationInfo
) => {
    if (!analytics) {
        console.warn('Firebase Analytics not initialized');
        return;
    }

    try {
        // 发送设备信息事件
        logEvent(analytics, 'device_info_collected', {
            device_id: deviceInfo.deviceId,
            device_type: deviceInfo.deviceType,
            operating_system: deviceInfo.operatingSystem,
            browser: deviceInfo.browser,
            screen_resolution: deviceInfo.screenResolution,
            language: deviceInfo.language,
            time_zone: deviceInfo.timeZone
        });

        // 发送位置信息事件（如果有的话）
        if (locationInfo.country || locationInfo.region) {
            logEvent(analytics, 'location_info_collected', {
                country: locationInfo.country || 'unknown',
                region: locationInfo.region || 'unknown',
                city: locationInfo.city || 'unknown',
                location_source: locationInfo.source,
                has_coordinates: !!(locationInfo.latitude && locationInfo.longitude)
            });
        }

        console.log('Device and location info sent to Firebase');
    } catch (error) {
        console.error('Error sending device/location info to Firebase:', error);
    }
};

/**
 * 综合获取设备和位置信息
 */
export const getDeviceAndLocationInfo = async (): Promise<{
    device: DeviceInfo;
    location: LocationInfo;
}> => {
    const device = getDeviceInfo();
    
    // 尝试多种位置获取方式
    let location: LocationInfo = { source: 'timezone' };
    
    try {
        // 首先尝试从缓存获取
        const cachedLocation = localStorage.getItem('user_location_info');
        const cacheTime = localStorage.getItem('user_location_time');
        
        if (cachedLocation && cacheTime) {
            const cacheAge = Date.now() - parseInt(cacheTime);
            if (cacheAge < 24 * 60 * 60 * 1000) { // 24小时缓存
                location = JSON.parse(cachedLocation);
                return { device, location };
            }
        }
        
        // 尝试IP地理位置（优先）
        try {
            const ipLocation = await getLocationFromIP();
            if (ipLocation.country) {
                location = ipLocation;
            }
        } catch (error) {
            console.warn('IP location failed, falling back to timezone');
        }
        
        // 如果IP地理位置失败，使用时区推断
        if (!location.country) {
            location = getLocationFromTimezone();
        }
        
        // 缓存结果
        localStorage.setItem('user_location_info', JSON.stringify(location));
        localStorage.setItem('user_location_time', Date.now().toString());
        
    } catch (error) {
        console.warn('Error getting location info:', error);
        location = getLocationFromTimezone();
    }
    
    return { device, location };
};

/**
 * 完整的设备和位置信息收集流程
 */
export const collectAndSendDeviceLocationInfo = async () => {
    try {
        const { device, location } = await getDeviceAndLocationInfo();
        
        // 发送到Firebase Analytics
        await sendDeviceLocationToFirebase(device, location);
        
        // 如果用户同意，也可以尝试获取GPS位置
        if (typeof window !== 'undefined' && navigator.geolocation) {
            // 这里可以添加用户同意的检查
            const gpsLocation = await getLocationFromGPS();
            if (gpsLocation.latitude) {
                logEvent(analytics!, 'precise_location_collected', {
                    latitude: gpsLocation.latitude,
                    longitude: gpsLocation.longitude,
                    accuracy: gpsLocation.accuracy
                });
            }
        }
        
        return { device, location };
    } catch (error) {
        console.error('Error in device/location collection:', error);
        return null;
    }
};