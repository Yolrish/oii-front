import { apiClient } from "@/lib/axios";
import { UserProfileType } from "@/types/user/user-profile-type";

interface GetUserProfileByIdResponse {
    code: number;
    message: string;
    data: UserProfileType;
}

/**
 * 根据用户ID获取用户资料
 * @param 
 * @returns 用户资料
 */
export const getUserProfileByIdAction = async (user_id: string): Promise<GetUserProfileByIdResponse> => {
    try {
        const response = await apiClient.get<GetUserProfileByIdResponse>(`/api/v1/users/profile?user_id=${user_id}`);
        console.log('get user profile by id response: ', response);
        return response.data;
    } catch (error) {
        console.error('获取用户资料失败:', error);
        throw error;
    }
};
