/**
 * Axios HTTP 客户端配置
 * 
 * 主要功能：
 * - 基础配置（baseURL、超时时间等）
 * - 响应拦截器
 * - 错误处理与友好提示
 * - 重试逻辑交给 SWR 更细粒度的管理
 * 
 * TODO：后续可以根据后端的业务错误码，结合 Toast 进行更细粒度、友好的错误反馈
 * TODO：具体业务 actions 中，只需要贴合具体业务的错误处理
 */

import { generateDeviceId, getUserUTCOffset } from '@/utils/firebase/DeviceLocationUtils';
import axios, {
    AxiosHeaders
} from 'axios';

// 响应数据类型定义
// interface ApiResponse<T = unknown> {
//     data: T;
//     message?: string;
//     status: number;
//     code?: string;
// }

// 基础配置
const BASE_CONFIG = {
    baseURL: process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3001',
    timeout: 600000,
    headers: new AxiosHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    }),
};

/**
* 创建并配置 axios 实例
*/
export const apiClient = axios.create(BASE_CONFIG);

/**
* 请求拦截器
*/
apiClient.interceptors.request.use(
    (config) => {
        // 在客户端环境下获取并添加 accessToken
        if (typeof window !== 'undefined') {

            // 在25.10.9版本中，添加了Skip-Authorization的header，用于跳过自动附带 Authorization
            // 允许通过请求头 Skip-Authorization 跳过自动附带 Authorization
            const skipAuthorization = (config.headers as any)['Skip-Authorization'];
            if (skipAuthorization) {
                if (config.headers.Authorization) {
                    delete (config.headers as any).Authorization;
                }
                // 使用后移除该标识，避免传到服务端
                delete (config.headers as any)['Skip-Authorization'];
            }
            // 检查是否已经设置了 Authorization header
            if (!skipAuthorization) {
                if (!config.headers.Authorization) {
                    const accessToken = localStorage.getItem('accessToken');
                    if (accessToken) {
                        config.headers.Authorization = `Bearer ${accessToken}`;
                    }
                }
            }


            // 在25.9.27版本中，又添加了Device-ID的header
            if (!config.headers['Device-ID']) {
                const deviceId = generateDeviceId();
                if (deviceId) {
                    config.headers['Device-ID'] = deviceId;
                }
            }

            // 添加用户时区信息 - 格式为UTC偏移
            if (!config.headers['User-Timezone']) {
                const timezone = getUserUTCOffset();
                if (timezone) {
                    config.headers['User-Timezone'] = timezone;
                }
            }
        }
        // 可选：在开发环境下打印请求信息
        if (process.env.NODE_ENV === 'development') {
            console.log('API Request:', config.method?.toUpperCase(), config.url);
        }
        return config;
    },
    (error) => {
        console.error('请求错误:', error);
        return Promise.reject(error);
    }
);

/**
* 响应拦截器
*/
// apiClient.interceptors.response.use(
//     (response: AxiosResponse) => response,
//     async (error: AxiosError<ApiResponse>) => {

//         // 使用错误处理工具函数处理错误并显示友好提示
//         console.log('axios error : ', error)
//     }
// );