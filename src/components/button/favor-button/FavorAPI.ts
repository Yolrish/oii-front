import { apiClient } from "@/lib/axios";

/**
 * 帖子收藏接口
 * favorite_status:{
 *  0 : 无状态
 *  1 : 收藏
 * }
 */

interface FavorParams {
    post_id: string;
    favorite_status: number;  // 1=收藏, 0=无状态
}

// 收藏响应接口
export interface FavorResponse {
    code: number;          // 响应代码
    message: string;       // 响应消息
    data?: {
        favorite_status: number;
        success: boolean;
    };
}

/**
 * 帖子收藏API
 * @param post_id 帖子ID
 * @param favorite_status 收藏状态 (1=收藏, 0=无状态)
 */
export async function favorAPI({ post_id, favorite_status }: FavorParams): Promise<FavorResponse> {
    try {
        // 构建查询参数
        const queryParams = new URLSearchParams();
        queryParams.append('post_id', post_id);
        queryParams.append('favorite_status', favorite_status.toString());

        // 调用API
        const response = await apiClient.post(`/api/v1/posts/favorite?${queryParams.toString()}`);

        console.log('收藏操作：', response.data);
        return response.data;
    } catch (error) {
        console.error("收藏操作失败:", error);
        return {
            code: 500,
            message: "收藏操作失败",
        };
    }
}
