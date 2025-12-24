'use client'
import styles from './UserInteractButton.module.css';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import Avatar from '@/components/common/avatar/Avatar'
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card'
import { ConfirmDialog } from '@/components/common/dialog/confirm/ConfirmDialog'
import { isAuthenticatedLocal } from '@/utils/Auth0/Authentication'
import { getUserProfileLocal } from '@/utils/Auth0/User'
import { logout } from '@/utils/Auth0/Login'
import { UserProfileType } from '@/types/user/user-profile-type'
import { useAuthStore } from '@/components/auth'
import { UserProfileDialog } from '@/components/auth/components/dialog/user-profile/UserProfileDialog';
import { trackEvent } from '@/utils/firebase/EventTracker';

interface UserInteractButtonProps {
    notLoggedInClassName?: string
    avatarClassName?: string
}

export default function UserInteractButton({
    notLoggedInClassName,
    avatarClassName
}: UserInteractButtonProps) {
    const router = useRouter()
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const {
        isLoggedIn: isLoggedInFromAuthStore,
        userProfile: userProfileFromAuthStore,
        setIsLoginDialogOpen
    } = useAuthStore()

    // User Profile Edit Dialog
    const [isEditing, setIsEditing] = useState(false)
    // Handle profile update from UserInfoSection or UserProfileDialog

    const handleSignIn = () => {
        if (typeof window !== 'undefined') {
            const ua = navigator.userAgent || ''
            const vendor = navigator.vendor || ''
            const isSafari = /Safari/.test(ua) && vendor.includes('Apple') && !/CriOS|FxiOS|Edg|EdgiOS|OPR|OPiOS|Chrome|Chromium/.test(ua)
            // 检测是否为移动设备
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
                (navigator.maxTouchPoints > 0 && /Mobi|Tablet/i.test(ua))

            // Safari 或移动设备使用页面跳转方式登录
            if (isSafari || isMobile) {
                router.push('/auth/login')
                return
            }
        }
        setIsLoginDialogOpen(true)
    }

    const handleProfile = () => {
        router.push('/profile')
        // setIsEditing(true)
    }

    const handleSettings = () => {
        router.push('/setting')
    }

    // const handleHelpCenter = () => {
    //     // 跳转到帮助中心
    //     console.log('Help Center')
    // }

    // const handleDarkMode = () => {
    //     // 切换暗黑模式
    //     console.log('Toggle Dark Mode')
    // }

    const handleSignOut = () => {
        setShowConfirmDialog(true)
    }

    const handleConfirmSignOut = () => {
        logout()
        setShowConfirmDialog(false)
    }

    const handleCancelSignOut = () => {
        setShowConfirmDialog(false)
    }

    // 未登录状态
    if (!isLoggedInFromAuthStore) {
        return (
            <button className={styles.user_interact_button}
                onClick={handleSignIn}
            >
                <span className={styles.user_interact_button_text}>
                    Sign In
                </span>
            </button>
        )
    }

    // 已登录状态
    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <button
                    className={cn(
                        "user-interact-button",
                        "user-interact-button--avatar",
                        "relative rounded-full"
                    )}
                >
                    <Avatar
                        src={userProfileFromAuthStore?.picture || ''}
                        alt={userProfileFromAuthStore?.name || 'User'}
                        avatarClassName={cn(
                            "size-10",
                            avatarClassName
                        )}
                        hoverAnimation={false}
                    />
                </button>
            </HoverCardTrigger>

            <HoverCardContent
                align="end"
                side="bottom"
                className={cn(
                    "user-interact-dropdown",
                    "w-64 p-2"
                )}
            >
                {/* 用户信息头部 */}
                <div className={cn(
                    "user-interact-dropdown__header",
                    "flex items-center space-x-3 p-3"
                )}>
                    <Avatar
                        src={userProfileFromAuthStore?.picture || ''}
                        alt={userProfileFromAuthStore?.name || 'User'}
                        avatarClassName="size-12"
                        hoverAnimation={false}
                    />
                    <div className={cn(
                        "user-interact-dropdown__user-info",
                        "flex-1 min-w-0"
                    )}>
                        <p className={cn(
                            "user-interact-dropdown__user-name",
                            "text-sm font-medium text-gray-900 truncate"
                        )}>
                            {userProfileFromAuthStore?.name || 'User'}
                        </p>
                        <p className={cn(
                            "user-interact-dropdown__user-email",
                            "text-sm text-gray-500 truncate"
                        )}>
                            {userProfileFromAuthStore?.email || ''}
                        </p>
                    </div>
                </div>

                {/* 菜单项 */}
                <div className="py-1">
                    <button
                        onClick={handleProfile}
                        className={cn(
                            styles.button,
                        )}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect opacity="0.5" x="2" y="2" width="20" height="20" rx="4" fill="#20201E" />
                            <path d="M12 12C11.3125 12 10.724 11.7552 10.2344 11.2656C9.74479 10.776 9.5 10.1875 9.5 9.5C9.5 8.8125 9.74479 8.22396 10.2344 7.73438C10.724 7.24479 11.3125 7 12 7C12.6875 7 13.276 7.24479 13.7656 7.73438C14.2552 8.22396 14.5 8.8125 14.5 9.5C14.5 10.1875 14.2552 10.776 13.7656 11.2656C13.276 11.7552 12.6875 12 12 12ZM7 15.75V15.25C7 14.8958 7.09125 14.5704 7.27375 14.2737C7.45625 13.9771 7.69833 13.7504 8 13.5937C8.64583 13.2708 9.30208 13.0287 9.96875 12.8675C10.6354 12.7062 11.3125 12.6254 12 12.625C12.6875 12.6246 13.3646 12.7054 14.0312 12.8675C14.6979 13.0296 15.3542 13.2717 16 13.5937C16.3021 13.75 16.5444 13.9767 16.7269 14.2737C16.9094 14.5708 17.0004 14.8962 17 15.25V15.75C17 16.0937 16.8777 16.3881 16.6331 16.6331C16.3885 16.8781 16.0942 17.0004 15.75 17H8.25C7.90625 17 7.61208 16.8777 7.3675 16.6331C7.12292 16.3885 7.00042 16.0942 7 15.75Z" fill="#20201E" />
                        </svg>
                        Profile
                    </button>

                    {/* <button
                        onClick={handleSettings}
                        className={cn(
                            "user-interact-dropdown__item",
                            "user-interact-dropdown__item--profile",
                            "w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-md transition-colors"
                        )}
                    >
                        <IconFont type="tapi_nav_setting_default" className="size-5! mr-3" />
                        Settings
                    </button> */}

                    {/* <button
                        onClick={handleHelpCenter}
                        className={cn(
                            "user-interact-dropdown__item",
                            "user-interact-dropdown__item--help",
                            "w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-md transition-colors"
                        )}
                    >
                        <HelpCircle className="size-4 mr-3" />
                        Help Center
                    </button> */}

                    {/* <button
                        onClick={handleDarkMode}
                        className={cn(
                            "user-interact-dropdown__item",
                            "user-interact-dropdown__item--dark-mode",
                            "w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-md transition-colors"
                        )}
                    >
                        <Moon className="size-4 mr-3" />
                        Dark Mode
                    </button> */}
                </div>

                {/* <div className="border-t my-1"></div> */}

                <button
                    onClick={handleSignOut}
                    className={cn(
                        styles.button,
                    )}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path opacity="0.6" d="M15 2H14C11.172 2 9.757 2 8.879 2.879C8 3.757 8 5.172 8 8V16C8 18.828 8 20.243 8.879 21.121C9.757 22 11.172 22 14 22H15C17.828 22 19.243 22 20.121 21.121C21 20.243 21 18.828 21 16V8C21 5.172 21 3.757 20.121 2.879C19.243 2 17.828 2 15 2Z" fill="#20201E" />
                        <path opacity="0.4" d="M8 8C8 6.462 8 5.343 8.141 4.5H8C5.643 4.5 4.464 4.5 3.732 5.232C3 5.964 3 7.143 3 9.5V14.5C3 16.857 3 18.035 3.732 18.768C4.464 19.501 5.643 19.5 8 19.5H8.141C8 18.657 8 17.538 8 16V8Z" fill="#20201E" />
                        <path d="M6.24438 8.08561C6.56845 7.86075 7.00024 8.10507 7.00024 8.51334V10.9997H13.0002C13.5525 10.9997 14.0002 11.4474 14.0002 11.9997C14.0002 12.552 13.5525 12.9997 13.0002 12.9997H7.00024V15.486C7.00024 15.8943 6.56845 16.1386 6.24438 15.9137L1.21996 12.4274C0.927982 12.2248 0.927982 11.7745 1.21996 11.5719L6.24438 8.08561Z" fill="#20201E" />
                    </svg>

                    Sign Out
                </button>
            </HoverCardContent>

            <ConfirmDialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
                title="Sign Out"
                content="Are you sure you want to sign out? You will need to log in again to access your account."
                cancelText="Cancel"
                confirmText="Sign Out"
                onConfirm={handleConfirmSignOut}
                onCancel={handleCancelSignOut}
                confirmButtonVariant="destructive"
            />

            {/* User Profile Edit Dialog */}
            {userProfileFromAuthStore &&
                <UserProfileDialog
                    open={isEditing}
                    onOpenChange={setIsEditing}
                    userProfile={userProfileFromAuthStore}
                    onProfileUpdate={() => { }}
                    onUpdateSuccess={() => { }}
                    onUpdateError={() => { }}
                />
            }
        </HoverCard>
    )
}
