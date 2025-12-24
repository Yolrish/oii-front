'use client'

import { useEffect } from 'react'

export default function PopupCallback() {
    useEffect(() => {
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
    }, [])

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mx-auto"></div>
                <p className="text-lg">Completing login, don't close this window...</p>
            </div>
        </div>
    )
}