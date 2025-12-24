/**
 * 创建用户回调接口
 */

import { apiClient } from '@/lib/axios';
import { UserProfileType } from '@/types/user/user-profile-type';
// import { AxiosResponse } from 'axios';

interface UserProfileResponse {
    code: number;
    message: string;
    data: UserProfileType;
}

/**
 * 创建用户回调接口
 * @param 
 * @returns 文章详细信息
 */
export const getUserProfileAPI = async (accessToken?: string): Promise<UserProfileResponse> => {
    const url = `/api/v1/users/me/profile`;

    try {
        const response = await apiClient.get<UserProfileResponse>(url,
            accessToken ? {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            } : {}
        );

        console.log('get current user response: ', response);
        return response.data;
    } catch (error) {
        console.error('获取用户资料失败:', error);
        throw error;
    }
};



interface UpdateUserProfileResponse {
    code: number;
    message: string;
    data: UserProfileType;
}

export const updateUserProfileAPI = async (formData: FormData): Promise<UpdateUserProfileResponse> => {
    const url = `/api/v1/users/update`;

    try {
        const response = await apiClient.put<UpdateUserProfileResponse>(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('更新用户资料失败:', error);
        throw error;
    }
};
