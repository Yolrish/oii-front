/**
 * 将十六进制颜色转换为RGB对象
 * @param hex 十六进制颜色字符串 (例如: "#ff0000" 或 "ff0000")
 * @returns RGB颜色对象
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    // 移除可能存在的#前缀
    hex = hex.replace(/^#/, '');

    // 检查是否是有效的十六进制颜色
    const validHexInput = /^([A-Fa-f0-9]{3}){1,2}$/.test(hex);
    if (!validHexInput) {
        return null;
    }

    // 如果是3位十六进制，转换为6位
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    // 转换为RGB值
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    return { r, g, b };
}

/**
 * 计算两个RGB颜色之间的欧几里得距离
 * @param color1 第一个RGB颜色对象
 * @param color2 第二个RGB颜色对象
 * @returns 颜色距离值
 */
function calculateColorDistance(
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number }
): number {
    return Math.sqrt(
        Math.pow(color2.r - color1.r, 2) +
        Math.pow(color2.g - color1.g, 2) +
        Math.pow(color2.b - color1.b, 2)
    );
}

/**
 * 从颜色数组中找出与目标颜色最接近的颜色
 * @param targetColor 目标颜色（十六进制格式）
 * @param colorArray 候选颜色数组（十六进制格式）
 * @returns 最接近的颜色（十六进制格式）或 null
 */
export function findClosestColor(targetColor: string, colorArray: string[]): string | null {
    // 转换目标颜色为RGB
    const targetRgb = hexToRgb(targetColor);
    if (!targetRgb) {
        return null;
    }

    let closestColor = null;
    let minDistance = Infinity;

    // 遍历所有候选颜色
    for (const color of colorArray) {
        const currentRgb = hexToRgb(color);
        if (!currentRgb) {
            continue;
        }

        const distance = calculateColorDistance(targetRgb, currentRgb);
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = color;
        }
    }

    return closestColor;
}

/**
 * 判断颜色是深色还是浅色
 * @param color 十六进制颜色字符串
 * @returns 是否为深色
 */
export function isDarkColor(color: string): boolean {
    const rgb = hexToRgb(color);
    if (!rgb) {
        return false;
    }

    // 使用相对亮度公式
    // https://www.w3.org/TR/WCAG20/#relativeluminancedef
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance < 0.5;
}

/**
 * 将RGB颜色值转换为十六进制颜色字符串
 * @param r 红色值 (0-255)
 * @param g 绿色值 (0-255)
 * @param b 蓝色值 (0-255)
 * @returns 十六进制颜色字符串 (例如: "#ff0000")
 */
export function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 获取图片的平均颜色
 * @param imageUrl 图片URL
 * @returns Promise，解析为十六进制颜色字符串
 */
export function getImageAverageColor(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // 处理跨域图片

        img.onload = () => {
            // 创建Canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
                reject(new Error('无法获取canvas上下文'));
                return;
            }

            // 设置canvas大小
            // 使用较小的尺寸以提高性能，同时保持足够的精度
            const maxSize = 100;
            const scale = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);

            // 绘制图片
            context.drawImage(img, 0, 0, canvas.width, canvas.height);

            try {
                // 获取像素数据
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                let sumR = 0, sumG = 0, sumB = 0;
                let count = 0;

                // 计算所有像素的平均值
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];

                    // 忽略完全透明的像素
                    if (a === 0) continue;

                    // 根据alpha通道的值来权衡颜色贡献
                    const alpha = a / 255;
                    sumR += r * alpha;
                    sumG += g * alpha;
                    sumB += b * alpha;
                    count += alpha;
                }

                // 计算平均值
                const avgR = count > 0 ? sumR / count : 0;
                const avgG = count > 0 ? sumG / count : 0;
                const avgB = count > 0 ? sumB / count : 0;

                // 转换为十六进制颜色
                const hexColor = rgbToHex(avgR, avgG, avgB);
                resolve(hexColor);
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = (error) => {
            reject(error);
        };

        img.src = imageUrl;
    });
}

/**
 * 获取图片的主色调并匹配最接近的颜色
 * @param imageUrl 图片URL
 * @param availableColors 可用的颜色数组（十六进制格式）
 * @returns Promise，解析为最接近的颜色
 */
export async function getClosestColorFromImage(
    imageUrl: string,
    availableColors: string[]
): Promise<string | null> {
    try {
        const averageColor = await getImageAverageColor(imageUrl);
        return findClosestColor(averageColor, availableColors);
    } catch (error) {
        console.error('获取图片颜色失败:', error);
        return null;
    }
} 