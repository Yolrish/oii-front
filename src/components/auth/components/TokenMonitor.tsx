'use client';
/**
 * 
 * 该组件用于检查登录状态的变化
 * 当登录状态变化时，触发全局中的登录状态状态
 * 
 * 登录状态与用户资料之间的操作不是原子化的
 * 此组件只监控登录状态相关的数据变化，不参与用户资料的变化
 * 虽然该组件登录时会更新用户资料，但工具函数会同步更新localStorage中的用户资料，触发UserProfileMonitor组件对localStorage中的用户资料的监听，从而更新全局用户资料
 * 
 */
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { isAuthenticated, isAuthenticatedLocal, isTokenExpiredAtTime } from '@/utils/Auth0/Authentication';
import { useAuthStore } from '../stores/auth-store';
import { usePathname } from 'next/navigation';

const LOCAL_CHECK_INTERVAL = 60000; // 每分钟进行本地检查
const REMOTE_CHECK_INTERVAL = 3600000; // 每小时使用服务器验证一次
const TOAST_DURATION = 2000; // 提示显示2秒
const UPDATE_LOCK_KEY = 'auth_update_in_progress';
const UPDATE_LOCK_DURATION = 30000; // 锁定30秒

export default function TokenMonitor() {
    // 使用全局登录状态
    const {
        isLoggedIn,
        setLoginStatus
    } = useAuthStore();
    const pathname = usePathname();
    const prevAuthStateRef = useRef<boolean>(isLoggedIn);
    const localCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const remoteCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstRenderRef = useRef(true);
    const ignoringStorageEventsRef = useRef(false);

    // 获取锁，防止多个标签页同时更新
    const acquireLock = (): boolean => {
        // 检查锁是否已被获取
        const lockTimestamp = localStorage.getItem(UPDATE_LOCK_KEY);
        if (lockTimestamp) {
            const lockTime = parseInt(lockTimestamp, 10);
            // 如果锁的时间不到30秒，表示锁仍然有效
            if (Date.now() - lockTime < UPDATE_LOCK_DURATION) {
                return false;
            }
        }

        // 设置锁
        localStorage.setItem(UPDATE_LOCK_KEY, Date.now().toString());
        return true;
    };

    // 释放锁
    const releaseLock = () => {
        localStorage.removeItem(UPDATE_LOCK_KEY);
    };

    // 本地检查 - 不会更新localStorage
    const checkLocalAuthStatus = () => {
        try {
            const authStatus = isAuthenticatedLocal();

            setLoginStatus(authStatus);
            console.log('TokenMonitor - checkLocalAuthStatus 状态', authStatus);
            
        } catch (error) {
            console.error('验证登录状态时出错:', error);
        }
    };

    // 远程检查 - 会更新localStorage，但有锁机制保证仅一个标签页执行
    const checkRemoteAuthStatus = async () => {

        console.log('checkRemoteAuthStatus 开始');

        // 先检查本地认证状态，如果已经是未登录状态，无需进一步验证
        if (!isAuthenticatedLocal()) {
            setLoginStatus(false);
            return;
        }

        console.log('checkRemoteAuthStatus 本地认证状态', true);

        // 检查token是否在当前时间已过期，仅在过期时才进行服务器验证
        const currentTime = Date.now(); // 使用UTC时间戳（毫秒）
        const isExpiring = isTokenExpiredAtTime(currentTime, 60);

        if (!isExpiring) {
            console.log('Token尚未过期，跳过服务器验证');
            return;
        }

        console.log('Token已过期，开始服务器验证和刷新');

        // 尝试获取锁
        if (!acquireLock()) {
            return; // 无法获取锁，另一个标签页正在执行
        }

        console.log('checkRemoteAuthStatus 获取锁');

        try {
            // 暂时忽略storage事件，防止自己触发自己
            ignoringStorageEventsRef.current = true;

            const isValid = await isAuthenticated(); // 这会更新localStorage
            setLoginStatus(isValid);

            if (!isValid) {
                console.log('checkRemoteAuthStatus 登录状态验证失败 - 登录已过期');
                toast.error('Login has expired, please log in again', {
                    duration: TOAST_DURATION,
                });
            }

            // 等待一小段时间后再恢复storage事件处理
            setTimeout(() => {
                ignoringStorageEventsRef.current = false;
            }, 500);
        } catch (error) {
            console.error('远程验证登录状态时出错:', error);
            toast.error('Login verification failed, please log in again');
            setLoginStatus(false);
        } finally {
            releaseLock();
        }
    };

    useEffect(() => {
        // 组件挂载时进行第一次本地检查
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            checkLocalAuthStatus();
            checkRemoteAuthStatus();
        }

        // 设置两种检查的间隔
        localCheckIntervalRef.current = setInterval(checkLocalAuthStatus, LOCAL_CHECK_INTERVAL);
        remoteCheckIntervalRef.current = setInterval(checkRemoteAuthStatus, REMOTE_CHECK_INTERVAL);

        // 添加存储事件监听
        const handleStorageChange = (event: StorageEvent) => {
            // 如果是自己触发的更新，则忽略
            if (ignoringStorageEventsRef.current) {
                return;
            }

            // 忽略锁相关的事件
            if (event.key === UPDATE_LOCK_KEY) {
                return;
            }

            if (event.key === 'accessToken' || event.key === 'idToken' || event.key === 'expiresAt') {
                requestAnimationFrame(() => {
                    checkLocalAuthStatus();
                });
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // 清理函数
        return () => {
            if (localCheckIntervalRef.current) {
                clearInterval(localCheckIntervalRef.current);
            }
            if (remoteCheckIntervalRef.current) {
                clearInterval(remoteCheckIntervalRef.current);
            }
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        // 在路由变化时重新检查登录状态
        checkLocalAuthStatus();
        checkRemoteAuthStatus();
    }, [pathname]);

    // 不渲染任何UI元素
    return null;
}