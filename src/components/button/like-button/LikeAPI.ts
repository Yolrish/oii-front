import { apiClient } from "@/lib/axios";

/**
 * 帖子点赞接口
 * like_status:{
 *  -1 : 不喜欢
 *  0 : 无状态
 *  1 : 喜欢
 * }
 */

interface LikeParams {
    post_id: string;
    like_status: number;  // 1=喜欢, 0=无状态, -1=不喜欢
}

// 点赞响应接口
export interface LikeResponse {
    code: number;          // 响应代码
    message: string;       // 响应消息
    data?: {
        like_status: number;
        success: boolean;
    };
}

/**
 * 帖子点赞API
 * @param post_id 帖子ID
 * @param like_status 点赞状态 (1=喜欢, 0=无状态, -1=不喜欢)
 */
export async function likeAPI({ post_id, like_status }: LikeParams): Promise<LikeResponse> {
    try {
        // 构建查询参数
        const queryParams = new URLSearchParams();
        queryParams.append('post_id', post_id);
        queryParams.append('like_status', like_status.toString());

        // 调用API
        const response = await apiClient.post(`/api/v1/posts/like?${queryParams.toString()}`);

        console.log('点赞操作：', response.data);
        return response.data;
    } catch (error) {
        console.error("点赞操作失败:", error);
        return {
            code: 500,
            message: "点赞操作失败",
        };
    }
}
