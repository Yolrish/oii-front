import auth0 from 'auth0-js';
import { auth0WebAuth } from './Auth0Client';

/**
 * 用户使用Email和密码登录
 * @param email 用户email
 * @param password 用户密码
 * @param callback 回调函数
 */
export const loginWithEmailPassword = (
    email: string,
    password: string,
    errCallback: auth0.Auth0Callback<unknown, auth0.Auth0Error>,
    onRedirecting?: () => void,
) => {
    auth0WebAuth.login(
        {
            realm: 'Username-Password-Authentication',
            email,
            password,
            onRedirecting: (done) => {
                onRedirecting?.();
                done();
            }
        },
        errCallback
    );
};

/**
 * 用户使用社交账号登录
 * @param connection 社交连接类型 (如 'google-oauth2', 'facebook', 'github' 等)
 */
export const loginWithSocialConnection = (connection: string) => {
    if (typeof window !== 'undefined') {
        try {
            console.log(`开始${connection}社交登录，重定向URL: ${window.location.origin}/auth/callback`);

            const authParams = {
                connection,
                responseType: 'token id_token',
                redirectUri: `${window.location.origin}/auth/callback`,
            };

            console.log('授权参数:', authParams);
            auth0WebAuth.authorize(authParams);
        } catch (error) {
            console.error('社交登录错误:', error);
            alert(`社交登录出错: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};

/**
 * 通过弹出窗口方式登录
 * @param connection 社交连接类型
 * @param callback 回调函数
 */
export const loginWithPopup = (
    connection: string,
    callback: auth0.Auth0Callback<unknown, auth0.Auth0Error>
) => {
    if (typeof window !== 'undefined') {
        const redirectUri = `${window.location.origin}/auth/popup-callback`;

        // 标志位：防止回调被重复执行
        let callbackInvoked = false;

        // 监听来自 popup 窗口的消息（用于处理 state 验证失败的情况）
        const messageHandler = (event: MessageEvent) => {
            // 验证消息来源
            if (event.origin !== window.location.origin) return;

            const data = event.data;
            if (data?.type === 'authorization_response') {
                // 如果已经成功处理过，直接返回
                if (callbackInvoked) return;

                window.removeEventListener('message', messageHandler);

                const response = data.response;
                if (response?.error) {
                    // 处理错误（不设置标志位，允许后续成功回调覆盖）
                    callback({
                        error: response.error,
                        errorDescription: response.errorDescription || response.error_description
                    } as auth0.Auth0Error, null);
                } else if (response?.access_token) {
                    // 处理成功响应，设置标志位防止重复
                    callbackInvoked = true;
                    callback(null, {
                        accessToken: response.access_token,
                        idToken: response.id_token,
                        expiresIn: response.expires_in,
                        tokenType: response.token_type || 'Bearer'
                    });
                }
            }
        };

        window.addEventListener('message', messageHandler);

        // 设置超时，如果 60 秒内没有收到消息，移除监听器
        const timeoutId = setTimeout(() => {
            window.removeEventListener('message', messageHandler);
        }, 60000);

        auth0WebAuth.popup.authorize(
            {
                connection,
                responseType: 'token id_token',
                redirectUri,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            (err, result) => {
                // 清理超时
                clearTimeout(timeoutId);

                // 如果是 state 不匹配错误，忽略 SDK 的错误，继续等待 message 事件处理
                if (err && (err as any)?.error === 'invalid_token' &&
                    (err as any)?.description?.includes('state')) {
                    return;
                }

                // 如果已经成功处理过（通过 message 处理），直接返回
                if (callbackInvoked) {
                    window.removeEventListener('message', messageHandler);
                    return;
                }

                // 只有成功时才设置标志位
                if (!err && result) {
                    callbackInvoked = true;
                }

                // 移除监听器并调用回调
                window.removeEventListener('message', messageHandler);
                callback(err, result);
            }
        );
    }
};

/**
 * 通过弹出窗口方式使用邮箱密码登录（数据库连接）
 * @param email 用户email
 * @param password 用户密码
 * @param callback 回调函数
 */
export const loginWithEmailPasswordPopup = (
    email: string,
    password: string,
    callback: auth0.Auth0Callback<unknown, auth0.Auth0Error>
) => {
    if (typeof window !== 'undefined') {
        const redirectUri = `${window.location.origin}/auth/popup-callback`;

        // 标志位：防止回调被重复执行
        let callbackInvoked = false;

        // 监听来自 popup 窗口的消息（用于处理 state 验证失败的情况）
        const messageHandler = (event: MessageEvent) => {
            // 验证消息来源
            if (event.origin !== window.location.origin) return;

            const data = event.data;
            if (data?.type === 'authorization_response') {
                // 如果已经成功处理过，直接返回
                if (callbackInvoked) return;

                window.removeEventListener('message', messageHandler);

                const response = data.response;
                if (response?.error) {
                    // 处理错误（不设置标志位，允许后续成功回调覆盖）
                    callback({
                        error: response.error,
                        errorDescription: response.errorDescription || response.error_description
                    } as auth0.Auth0Error, null);
                } else if (response?.access_token) {
                    // 处理成功响应，设置标志位防止重复
                    callbackInvoked = true;
                    callback(null, {
                        accessToken: response.access_token,
                        idToken: response.id_token,
                        expiresIn: response.expires_in,
                        tokenType: response.token_type || 'Bearer'
                    });
                }
            }
        };

        window.addEventListener('message', messageHandler);

        // 设置超时，如果 60 秒内没有收到消息，移除监听器
        const timeoutId = setTimeout(() => {
            window.removeEventListener('message', messageHandler);
        }, 60000);

        // 使用 popup.loginWithCredentials 在弹窗内完成认证与回调
        // 注意：需启用数据库连接，并允许该回调 URL
        auth0WebAuth.popup.loginWithCredentials(
            {
                realm: 'Username-Password-Authentication',
                username: email,
                password,
                responseType: 'token id_token',
                scope: 'openid profile email',
                redirectUri,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            (err, result) => {
                // 清理超时
                clearTimeout(timeoutId);

                // 如果是 state 不匹配错误，忽略 SDK 的错误，继续等待 message 事件处理
                if (err && (err as any)?.error === 'invalid_token' &&
                    (err as any)?.description?.includes('state')) {
                    return;
                }

                // 如果已经成功处理过（通过 message 处理），直接返回
                if (callbackInvoked) {
                    window.removeEventListener('message', messageHandler);
                    return;
                }

                // 只有成功时才设置标志位
                if (!err && result) {
                    callbackInvoked = true;
                }

                // 移除监听器并调用回调
                window.removeEventListener('message', messageHandler);
                callback(err, result);
            }
        );
    }
};

/**
 * 处理Auth0回调
 * @param callback 回调函数
 */
export const handleAuthentication = (
    callback: auth0.Auth0Callback<auth0.Auth0DecodedHash | null, auth0.Auth0ParseHashError>
) => {
    try {
        // 检查URL中是否有错误参数
        const url = new URL(window.location.href);
        const errorDesc = url.searchParams.get('error_description');
        const error = url.searchParams.get('error');

        if (error) {
            console.error('URL中包含错误:', error, errorDesc);
            const err = {
                error: error,
                errorDescription: errorDesc,
                error_description: errorDesc
            } as auth0.Auth0ParseHashError;

            callback(err, null);
            return;
        }

        // 继续正常Auth0回调处理
        console.log('处理Auth0验证回调...');
        auth0WebAuth.parseHash(callback);
    } catch (error) {
        console.error('处理认证回调时出错:', error);
        const err = {
            error: 'unexpected_error',
            errorDescription: error instanceof Error ? error.message : String(error)
        } as auth0.Auth0ParseHashError;

        callback(err, null);
    }
};

/**
 * 用户登出
 * @param returnTo 登出后重定向的URL，默认为当前域名
 */
export const logout = (returnTo?: string) => {
    if (typeof window !== 'undefined') {
        // 清除所有相关的本地存储项
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('user');

        // 清理sessionStorage
        sessionStorage.clear();

        auth0WebAuth.logout({
            returnTo: returnTo || `${window.location.origin}`,
            clientID: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',
        });
    }
};
