/**
 * 格式化URL，将路径参数与当前域名拼接成完整的URL
 * @param path - 要拼接的路径参数，可以是带或不带前导斜杠的字符串
 * @returns 完整的URL字符串
 */
export const formatUrl = (path: string): string => {
    // 获取当前域名
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    // 确保path以斜杠开头
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // 拼接并返回完整URL
    return `${baseUrl}${normalizedPath}`;
};

/**
 * 格式化URL并添加查询参数
 * @param path - 基础路径
 * @param params - 查询参数对象
 * @returns 带查询参数的完整URL
 */
export const formatUrlWithParams = (path: string, params?: Record<string, string | number>): string => {
    const baseUrl = formatUrl(path);

    if (!params || Object.keys(params).length === 0) {
        return baseUrl;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
    });

    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${searchParams.toString()}`;
};
