import { apiClient } from '@/lib/axios';
import { ReportType } from '../types/report-type';

// 举报响应接口
export interface UserReportResponse {
    code: number;          // 响应代码
    message: string;       // 响应消息
}

/**
 * 发送举报请求的函数
 * @param params 举报参数
 * @returns 请求响应
 */
export const UserReportAPI = async (params: ReportType): Promise<UserReportResponse> => {
    try {
        const response = await apiClient.post("/api/v1/report/create", params);
        console.log('开始举报请求:', response.data);
        return response.data;
    } catch (error) {
        console.error('举报请求出错:', error);
        // 返回一个标准化的错误响应
        return {
            code: 500,
            message: '举报请求失败',
        };
    }
};
