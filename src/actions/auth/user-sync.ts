/**
 * 创建用户回调接口
 */

import { apiClient } from '@/lib/axios';
import { AxiosResponse } from 'axios';
/**
 * 创建用户回调接口
 * @param accessToken 用户访问令牌
 * @returns 文章详细信息
 */
export const userSyncAPI = async (accessToken: string): Promise<AxiosResponse<any, any>> => {
    const url = `/api/v1/users/sync_user`;

    try {
        const response = await apiClient.post<any>(url, {}, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        
        console.log('sync user response: ', response);
        return response;
    } catch (error) {
        console.error('用户同步失败:', error);
        throw error;
    }
}; 