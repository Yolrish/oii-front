import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 将数字转换为带后缀的字符串格式
 * @param num 要转换的数字
 * @returns 格式化后的字符串
 */
export const formatNumber = (num: number | string): string => {
    // 处理非数字输入
    if (typeof num === 'string') {
        num = parseFloat(num);
    }

    // 处理无效数字
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }

    // 处理无穷大
    if (!isFinite(num)) {
        return num > 0 ? '∞' : '-∞';
    }

    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (absNum >= 1e12) {
        return sign + (absNum / 1e12).toFixed(1) + 't';
    }
    if (absNum >= 1e9) {
        return sign + (absNum / 1e9).toFixed(1) + 'b';
    }
    if (absNum >= 1e6) {
        return sign + (absNum / 1e6).toFixed(1) + 'm';
    }
    if (absNum >= 1e3) {
        return sign + (absNum / 1e3).toFixed(1) + 'k';
    }
    // 当数字小于1000时，返回原整数
    return sign + Math.floor(absNum).toString();
};

