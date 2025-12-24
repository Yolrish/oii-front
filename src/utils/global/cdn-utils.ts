/**
 * CDN函数，用于获取CDN图片的URL
 * @param path 图片路径
 * @returns 图片URL
 */
export const getCdnUrl = (path: string, width: number = 400, height: number = 300) => {
    try {
        const url = new URL(path);
        if (
            url.hostname === (process.env.NEXT_PUBLIC_CDN_URL ?? 'd6xpbmnqj8nsz.cloudfront.net')
            || url.hostname === ('d6xpbmnqj8nsz.cloudfront.net')
            || url.hostname === ('d6xpbmnqj8nsz.cloudfront.net')
        ) {
            return path.replace('{SIZE_PLACEHOLDER}', `${width}x${height}`);
        }
        return path;
    } catch {
        return path;
    }
}