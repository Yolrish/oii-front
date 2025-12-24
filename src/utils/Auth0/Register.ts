import auth0 from 'auth0-js';
import { auth0WebAuth } from './Auth0Client';

interface RegisterParams {
    email: string;
    password: string;
    given_name?: string;
    family_name?: string;
    name?: string;
    // nickname?: string;
    picture?: string;
    [key: string]: unknown;
}

/**
 * 用户注册函数
 * @param params 注册参数，包含email和password等
 * @param callback 回调函数
 */
export const registerUser = (
    params: RegisterParams,
    callback: auth0.Auth0Callback<unknown, auth0.Auth0Error>
) => {
    const { email, password, ...userMetadata } = params;
    
    // 调试：检查 Auth0 配置
    console.log('Auth0 WebAuth config:', {
        domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
        clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
        hasWebAuth: !!auth0WebAuth
    });
    
    const signupParams = {
        email,
        password,
        connection: 'Username-Password-Authentication',
        userMetadata,
    };
    
    console.log('Signup params (without password):', {
        ...signupParams,
        password: '[HIDDEN]'
    });
    
    auth0WebAuth.signup(signupParams, (err, result) => {
        console.log('Auth0 signup result:', result);
        console.log('Auth0 signup error:', err);
        if (err) {
            console.error('Auth0 signup error details:', {
                code: err.code,
                description: err.description,
                name: err.name,
                statusCode: err.statusCode
            });
        }
        callback(err, result);
    });
};

/**
 * 通过社交账号注册
 * @param connection 社交连接类型 (如 'google-oauth2', 'facebook', 'github' 等)
 */
export const registerWithSocialConnection = (connection: string) => {
    if (typeof window !== 'undefined') {
        auth0WebAuth.authorize({
            connection,
            responseType: 'token id_token',
            redirectUri: `${window.location.origin}/auth/callback`,
            screen_hint: 'signup',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
    }
};

/**
 * 通过弹出窗口进行注册
 * @param connection 社交连接类型
 * @param callback 回调函数
 */
export const registerWithPopup = (
    connection: string,
    callback: auth0.Auth0Callback<unknown, auth0.Auth0Error>
) => {
    if (typeof window !== 'undefined') {
        auth0WebAuth.popup.authorize(
            {
                connection,
                responseType: 'token id_token',
                redirectUri: `${window.location.origin}/auth/callback`,
                screen_hint: 'signup',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            callback
        );
    }
};

/**
 * 验证电子邮件
 * @param user_id 用户ID
 * @param callback 回调函数
 */
export const resendVerificationEmail = (
    user_id: string,
    callback: auth0.Auth0Callback<unknown, auth0.Auth0Error>
) => {
    auth0WebAuth.passwordlessStart(
        {
            connection: 'email',
            send: 'link',
            email: user_id,
        },
        callback
    );
};
