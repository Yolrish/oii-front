import { UserProfileType } from '@/types/user/user-profile-type';
import { create } from 'zustand';

// 本地缓存的触发变量
interface AuthState {

    // 登录状态
    isLoggedIn: boolean;
    // 设置登录状态
    setLoginStatus: (isLoggedIn: boolean) => void;

    // 用户资料
    userProfile: UserProfileType | null;
    // 设置用户资料
    setUserProfile: (userProfile: UserProfileType | null) => void;

    // 用户状态本地更新触发器
    // 与事件监听storage同时使用，storage监听其它标签页操作导致的变化，该触发器用于触发当前标签页用户资料更新
    userProfileStorageTrigger: boolean;
    // 触发函数 - 只限于用户资料本地缓存更改后触发
    startUserProfileStorageTrigger: () => void;

    // 登录对话框的打开状态
    isLoginDialogOpen: boolean;
    // 设置登录对话框的打开状态
    setIsLoginDialogOpen: (isLoginDialogOpen: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    // 登录状态
    isLoggedIn: false,
    setLoginStatus: (isLoggedIn: boolean) => {
        set({ isLoggedIn });
    },
    // 用户资料
    userProfile: null,
    setUserProfile: (userProfile: UserProfileType | null) => {
        set({ userProfile });
    },
    // 用户资料本地更新触发器
    userProfileStorageTrigger: false,
    startUserProfileStorageTrigger: () => {
        set((state) => ({ userProfileStorageTrigger: !state.userProfileStorageTrigger }));
    },
    // 登录对话框的打开状态
    isLoginDialogOpen: false,
    setIsLoginDialogOpen: (isLoginDialogOpen: boolean) => {
        set({ isLoginDialogOpen });
    }

}));