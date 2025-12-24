/**
 * 鉴权工具函数集合
 * 包含用户身份验证状态检查等功能
 */

import { auth0WebAuth } from "./Auth0Client";

/**
 * 获取本地存储的用户token
 * @returns {string | null} 用户token或null
 */
export const getUserTokenLocal = (): string | null => {
    return localStorage.getItem('accessToken');
};

/**
 * 检查用户是否已登录（同步版本-仅检查本地存储）
 * @returns {boolean} 用户登录状态
 */
export const isAuthenticatedLocal = (): boolean => {
    // 仅在客户端环境中执行
    if (typeof window === 'undefined') {
        console.log('isAuthenticatedLocal 没有window', false);
        return false;
    }

    // 检查localStorage中是否存在token和有效期
    const expiresAt = localStorage.getItem('expiresAt');
    if (!expiresAt) {
        console.log('isAuthenticatedLocal 没有有效期', false);
        return false;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        return true;
    }
    return false;
    // // 检查token是否已过期
    // const expiresAtTime = JSON.parse(expiresAt);
    // const currentTime = new Date().getTime();
    // console.log('isAuthenticatedLocal 有效期', expiresAtTime, currentTime);
    // // 同时验证token存在性和有效期
    // return currentTime < expiresAtTime && !!localStorage.getItem('accessToken');
};

/**
 * 使用Auth0服务器验证当前token是否有效
 * @returns {Promise<boolean>} token有效性
 */
export const validateToken = (): Promise<boolean> => {
    return new Promise((resolve) => {
        // 如果客户端检查已判定无效，直接返回false
        if (!isAuthenticatedLocal()) {
            resolve(false);
            return;
        }

        // 添加超时处理，避免DummyStorage警告
        let resolved = false;
        const timeout = setTimeout(() => {
            if (!resolved) {
                console.log('Token验证超时');
                resolved = true;
                resolve(false);
            }
        }, 20000); // 20秒超时

        // 通过Auth0服务器验证
        auth0WebAuth.checkSession({
            scope: 'openid profile email',
        }, (err, authResult) => {
            clearTimeout(timeout); // 清除超时计时器
            if (resolved) return; // 如果已经由超时处理器解决，不再继续

            resolved = true;
            if (err) {
                console.error('Token验证失败:', err);
                resolve(false);
                return;
            }

            // 如果成功获取新token，更新存储
            if (authResult && authResult.accessToken) {
                localStorage.setItem('accessToken', authResult.accessToken);

                if (authResult.idToken) {
                    localStorage.setItem('idToken', authResult.idToken);
                }

                if (authResult.expiresIn) {
                    const expiresAt = JSON.stringify(
                        authResult.expiresIn * 1000 + new Date().getTime()
                    );
                    localStorage.setItem('expiresAt', expiresAt);
                }

                // 保存用户信息
                if (authResult.idTokenPayload) {
                    // localStorage.setItem('user', JSON.stringify(authResult.idTokenPayload))
                }

                console.log('更新用户localstorage成功', authResult);

                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
};

/**
 * 检查用户是否已登录（异步版本-结合本地检查和服务器验证）
 * @returns {Promise<boolean>} 用户登录状态
 */
export const isAuthenticated = async (): Promise<boolean> => {
    // 先检查本地存储的token状态
    const isLocallyAuthenticated = isAuthenticatedLocal();

    // 如果本地验证不通过，则无需服务器验证
    if (!isLocallyAuthenticated) {
        return false;
    }

    // 本地验证通过，继续与Auth0服务器验证token有效性
    return await validateToken();
};

/**
 * 检查token在指定的世界时是否已过期
 * @param {Date | number} worldTime - 世界时（UTC时间），可以是Date对象或毫秒时间戳
 * @param {number} [minutesBuffer] - 可选参数，以分钟为单位的时间缓冲区。当提供此参数时，会检查token是否会在worldTime加上该分钟数的时间内过期
 * @returns {boolean} 如果token在指定时间（或指定时间+缓冲时间）已过期则返回true，未过期返回false
 */
export const isTokenExpiredAtTime = (worldTime: Date | number, minutesBuffer?: number): boolean => {
    if (typeof window === 'undefined') {
        return true; // 服务端环境默认认为已过期
    }

    // 获取token过期时间
    const expiresAt = localStorage.getItem('expiresAt');
    if (!expiresAt) {
        return true; // 没有过期时间信息，认为已过期
    }

    try {
        const expiresAtTime = JSON.parse(expiresAt);
        
        // 将传入的世界时转换为毫秒时间戳
        let worldTimeMs = worldTime instanceof Date ? worldTime.getTime() : worldTime;
        
        // 如果提供了分钟缓冲区参数，则将其加到检查时间上
        if (minutesBuffer !== undefined && minutesBuffer > 0) {
            worldTimeMs += minutesBuffer * 60 * 1000; // 将分钟转换为毫秒
        }
        
        // 比较计算后的时间与过期时间，如果计算后时间大于等于过期时间则认为已过期
        return worldTimeMs >= expiresAtTime;
    } catch (error) {
        console.error('解析token过期时间失败:', error);
        return true; // 解析失败，认为已过期
    }
};