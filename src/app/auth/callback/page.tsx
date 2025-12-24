'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { handleAuthentication } from '@/utils/Auth0/Login'
import { userSyncAPI } from '@/actions/auth/user-sync'
import { toast } from 'sonner'
import { getUserProfile, updateUserProfileLocal } from '@/utils/Auth0/User'
import { getUserProfileAPI } from '@/actions/auth/user-profile'
import { useAuthStore } from '@/components/auth/stores/auth-store'

export default function CallbackPage() {
    const router = useRouter()
    const [error, setError] = useState(false)
    const [errorList, setErrorList] = useState<string[]>([])
    const [showErrorDetails, setShowErrorDetails] = useState(false)
    const {
        setLoginStatus,
        // setUserProfile,
        startUserProfileStorageTrigger
    } = useAuthStore()

    useEffect(() => {
        // 30秒后显示错误详情和登录按钮
        const timer = setTimeout(() => {
            setError(true)
            setShowErrorDetails(true)
        }, 30000)

        // 处理认证回调
        handleAuthentication(async (err, authResult) => {
            if (err) {
                console.error('认证回调错误:', JSON.stringify(err))
                // setError(err.errorDescription || err.error || 'Login failed, please try again')
                setErrorList(pre => [err.description || err.error || 'Login failed, please try again', ...pre])
                // 显示更详细的错误信息
                if (err.error_description) {
                    console.error('错误描述:', err.error_description);
                }
                if (err.state) {
                    console.error('状态:', err.state);
                }
                // 如果出错，重定向到登录页
                // setTimeout(() => {
                //     router.push('/auth/login')
                // }, 2000)
                return
            }

            if (!authResult) {
                // setError(c)
                setErrorList(pre => ['Login failed, no authentication result received', ...pre])
                // setTimeout(() => {
                //     router.push('/auth/login')
                // }, 2000)
                return
            }

            console.log(authResult)

            if (authResult.accessToken) {

                localStorage.setItem('accessToken', authResult.accessToken)
                // 同步用户到后端
                try {
                    await userSyncAPI(authResult.accessToken);
                } catch (err) {
                    console.error('用户同步失败:', err);
                    setErrorList(pre => ['user sync failed', ...pre])
                    toast.error('User sync failed, please try again');
                    return; // 提前返回，不执行后续操作
                }
                try {
                    const userProfileResponse = await getUserProfileAPI(authResult.accessToken);
                    if (userProfileResponse.code === 200) {
                        const userProfile = userProfileResponse.data;
                        console.log('用户资料获取成功:', userProfile);
                        const updateUser = updateUserProfileLocal(userProfile);
                        if (updateUser) {
                            // setUserProfile(userProfile);
                            startUserProfileStorageTrigger();
                        }
                    } else {
                        throw new Error('User profile not found');
                    }
                } catch (err) {
                    console.error('用户资料获取失败:', err);
                    setErrorList(pre => ['user profile not found', ...pre])
                    toast.error('User profile not found, please try again');
                    return; // 提前返回，不执行后续操作
                }
            }

            if (authResult.idToken) {
                localStorage.setItem('idToken', authResult.idToken)
            }

            if (authResult.expiresIn) {
                // 计算token过期时间
                const expiresAt = JSON.stringify(
                    authResult.expiresIn * 1000 + new Date().getTime()
                )
                localStorage.setItem('expiresAt', expiresAt)
            }

            // 清除URL中的hash部分
            if (window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname)
            }

            setLoginStatus(true)

            // 重定向到首页
            router.push('/')
        })

        return () => {
            clearTimeout(timer)
        }
    }, [router])

    const handleBackToLogin = () => {
        router.push('/auth/login')
    }

    return (
        <div className="callback-page flex h-screen w-full items-center justify-center">
            <div className="callback-page__content text-center max-w-md mx-auto px-4">
                {error ? (
                    <div className="callback-page__error">
                        <p className="callback-page__error-message text-red-500 mb-4">{error}</p>
                        {showErrorDetails && errorList.length > 0 && (
                            <div className="callback-page__error-list mb-6">
                                <h3 className="callback-page__error-title text-lg font-semibold mb-3">Error Details:</h3>
                                <ul className="callback-page__error-items text-left bg-red-50 p-4 rounded-lg">
                                    {errorList.map((errorItem, index) => (
                                        <li key={index} className="callback-page__error-item text-red-600 mb-2 text-sm">
                                            • {errorItem}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {showErrorDetails && (
                            <button
                                onClick={handleBackToLogin}
                                className="callback-page__login-button bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Back to Login
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="callback-page__loading">
                        <div className="callback-page__spinner mb-4 h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mx-auto"></div>
                        <p className="callback-page__loading-text text-lg">Logging in, please wait...</p>
                        {showErrorDetails && errorList.length > 0 && (
                            <div className="callback-page__warning mt-6">
                                <p className="callback-page__warning-text text-yellow-600 mb-4">Login is taking longer than expected...</p>
                                <div className="callback-page__error-list mb-4">
                                    <h3 className="callback-page__error-title text-lg font-semibold mb-3">Issues detected:</h3>
                                    <ul className="callback-page__error-items text-left bg-yellow-50 p-4 rounded-lg">
                                        {errorList.map((errorItem, index) => (
                                            <li key={index} className="callback-page__error-item text-yellow-700 mb-2 text-sm">
                                                • {errorItem}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button
                                    onClick={handleBackToLogin}
                                    className="callback-page__login-button bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Back to Login
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
} 