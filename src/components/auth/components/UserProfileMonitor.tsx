'use client';
/**
 * 
 * 该组件用于检查用户资料的变化
 * 当用户资料变化时，触发用户资料本地更新触发器与更新全局中的用户资料状态
 * 
 * 用户资料与登录状态之间的操作不是原子化的
 * 此组件只监控用户资料相关的数据变化，不监控登录状态的变化
 * 
 */
import { useEffect, useRef } from 'react';
import { isAuthenticatedLocal } from '@/utils/Auth0/Authentication';
import { getUserProfile, getUserProfileLocal } from '@/utils/Auth0/User';
import { useAuthStore } from '../stores/auth-store';

// 用户资料定时远程检查（毫秒）
const REMOTE_PROFILE_CHECK_INTERVAL = 600000; // 10 分钟
const UPDATE_LOCK_KEY = 'user_profile_update_in_progress';
const UPDATE_LOCK_DURATION = 30000; // 锁定 30 秒

export default function UserProfileMonitor() {

    const {
        // startUserProfileStorageTrigger,
        setUserProfile,
        userProfileStorageTrigger,
        startUserProfileStorageTrigger
    } = useAuthStore();

    const remoteCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstRenderRef = useRef(true);
    const ignoringStorageEventsRef = useRef(false);

    // 获取锁，防止多个标签页同时更新
    const acquireLock = (): boolean => {
        const lockTimestamp = localStorage.getItem(UPDATE_LOCK_KEY);
        if (lockTimestamp) {
            const lockTime = parseInt(lockTimestamp, 10);
            if (Date.now() - lockTime < UPDATE_LOCK_DURATION) {
                return false;
            }
        }
        localStorage.setItem(UPDATE_LOCK_KEY, Date.now().toString());
        return true;
    };

    const releaseLock = () => {
        localStorage.removeItem(UPDATE_LOCK_KEY);
    };

    // 远程检查：获取用户资料并更新到 localStorage（在工具函数里执行），随后触发全局通知
    const checkRemoteUserProfile = async () => {
        // 未登录则跳过 
        if (!isAuthenticatedLocal()) {
            return;
        }

        // 尝试获取锁，避免多标签页同时更新
        if (!acquireLock()) {
            return;
        }

        try {
            // 暂时忽略 storage 事件，避免自触发
            ignoringStorageEventsRef.current = true;

            const profile = await getUserProfile();
            if (profile) {
                // 工具函数内部已写入 localStorage('user')，此处触发通知
                startUserProfileStorageTrigger();
            }

            // 小延迟后恢复 storage 事件处理
            setTimeout(() => {
                ignoringStorageEventsRef.current = false;
            }, 500);
        } catch (error) {
            // 忽略错误，等待下次周期
            console.error('checkRemoteUserProfile 出错:', error);
            ignoringStorageEventsRef.current = false;
        } finally {
            releaseLock();
        }
    };

    useEffect(() => {
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            // 首次挂载立即尝试拉取一次
            checkRemoteUserProfile();
        }

        // 定时远程检查
        remoteCheckIntervalRef.current = setInterval(
            checkRemoteUserProfile,
            REMOTE_PROFILE_CHECK_INTERVAL
        );

        // 监听 storage 事件：当 'user'（资料）变化时，触发通知
        const handleStorageChange = (event: StorageEvent) => {
            if (ignoringStorageEventsRef.current) {
                return;
            }

            // 忽略锁 key 的变化
            if (event.key === UPDATE_LOCK_KEY) {
                return;
            }

            if (event.key === 'user') {
                // 本地用户资料发生变化（可能来自其他标签页或当前页）
                // startUserProfileStorageTrigger();
                setUserProfile(getUserProfileLocal());
            }
        };
        // 监听其它标签操作导致localStorage变化的事件
        // 注意： storage 事件只在其他标签页/窗口修改 localStorage 时触发，不会在当前标签页修改时触发。
        window.addEventListener('storage', handleStorageChange);

        return () => {
            if (remoteCheckIntervalRef.current) {
                clearInterval(remoteCheckIntervalRef.current);
            }
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        console.log('由userProfileStorageTrigger触发的本地更新', userProfileStorageTrigger);
        setUserProfile(getUserProfileLocal());
    }, [userProfileStorageTrigger]);

    return null;
}


