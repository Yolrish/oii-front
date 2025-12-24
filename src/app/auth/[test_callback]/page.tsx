'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { handleAuthentication } from '@/utils/Auth0/Login'
import { userSyncAPI } from '@/actions/auth/user-sync'
import { toast } from 'sonner'
import { getUserProfile, updateUserProfileLocal } from '@/utils/Auth0/User'
import { getUserProfileAPI } from '@/actions/auth/user-profile'
import { auth0WebAuth } from '@/utils/Auth0/Auth0Client'
import { useAuthStore } from '@/components/auth/stores/auth-store'

export default function CallbackPage() {
    const router = useRouter()
    const params = useParams()
    const isPopupCallback = ((params?.test_callback as string) ?? 'callback').startsWith('popup-callback')

    const [error, setError] = useState(false)
    const [errorList, setErrorList] = useState<string[]>([])
    const [showErrorDetails, setShowErrorDetails] = useState(false)
    const {
        setLoginStatus,
        // setUserProfile,
        startUserProfileStorageTrigger
    } = useAuthStore()

    useEffect(() => {
        if (isPopupCallback) {
            try {
                // 直接从 URL hash 中获取认证结果
                const hash = window.location.hash

                // 检查是否有错误
                if (hash.includes('error=')) {
                    const params = new URLSearchParams(hash.substring(1))
                    const error = params.get('error')
                    const errorDescription = params.get('error_description')
                    console.error('Auth0 popup 返回错误:', error, errorDescription)

                    // 通过 postMessage 将错误发送给父窗口
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'authorization_response',
                            response: {
                                error: error,
                                errorDescription: errorDescription
                            }
                        }, window.location.origin)

                        // 关闭 popup 窗口
                        setTimeout(() => {
                            window.close()
                        }, 100)
                    }
                    return
                }

                // 解析 hash 中的 token 信息
                if (hash && hash.length > 1) {
                    const params = new URLSearchParams(hash.substring(1))
                    const accessToken = params.get('access_token')
                    const idToken = params.get('id_token')
                    const expiresIn = params.get('expires_in')
                    const state = params.get('state')

                    // 通过 postMessage 将结果发送给父窗口
                    // 父窗口的 Auth0 SDK 会监听这个消息
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'authorization_response',
                            response: {
                                access_token: accessToken,
                                id_token: idToken,
                                expires_in: expiresIn ? parseInt(expiresIn) : undefined,
                                state: state,
                                token_type: 'Bearer'
                            }
                        }, window.location.origin)

                        // 关闭 popup 窗口
                        setTimeout(() => {
                            window.close()
                        }, 100)
                    }
                }
            } catch (e) {
                console.error('popup callback 处理失败', e)
                // 尝试将错误发送给父窗口
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'authorization_response',
                        response: {
                            error: 'callback_error',
                            errorDescription: e instanceof Error ? e.message : String(e)
                        }
                    }, window.location.origin)
                }
            }
            return
        }

        // 30秒后显示错误详情和登录按钮
        const timer = setTimeout(() => {
            setError(true)
            setShowErrorDetails(true)
        }, 30000)

        // 处理认证回调（普通 redirect 回调）
        handleAuthentication(async (err, authResult) => {
            if (err) {
                console.error('认证回调错误:', JSON.stringify(err))
                setErrorList(pre => [err.description || err.error || 'Login failed, please try again', ...pre])
                if (err.error_description) {
                    console.error('错误描述:', err.error_description);
                }
                if ((err as any).state) {
                    console.error('状态:', (err as any).state);
                }
                return
            }

            if (!authResult) {
                setErrorList(pre => ['Login failed, no authentication result received', ...pre])
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
    }, [router, isPopupCallback, startUserProfileStorageTrigger])

    if (isPopupCallback) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mx-auto"></div>
                    <p className="text-lg">Completing login, don't close this window...</p>
                    {error && errorList.length > 0 && (
                        <div className="mt-4 text-left text-sm text-red-600">
                            {errorList.map((e, i) => (
                                <div key={i}>• {e}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="callback-page flex h-screen w-full items-center justify-center">
            <div className="callback-page__content text-center max-w-md mx-auto px-4">
                {error ? (
                    <div className="callback-page__error">
                        <p className="callback-page__error-message text-red-500 mb-4">{String(error)}</p>
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
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
} 