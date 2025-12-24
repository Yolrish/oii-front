/**
 * 头像占位组件
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface AvatarPlaceholderProps {
    className?: string
    text?: string
}

function AvatarPlaceholder({ className, text = 'Avatar' }: AvatarPlaceholderProps) {
    // 判断字符是否为中文
    const isChinese = (char: string) => {
        return /[\u4e00-\u9fa5]/.test(char);
    };

    // 根据首字符是否为中文决定显示的文本长度
    const displayText = () => {
        if (!text || text.length === 0) return '';

        // 如果首字符是中文，只取第一个字符
        if (isChinese(text[0])) {
            return text.slice(0, 1);
        }
        // 如果是英文或其他字符，取前两个字符
        return text.slice(0, 1);
    };

    return (
        <div className={cn(
            'relative',
            'card-avatar-placeholder',
            'flex justify-center items-center',
            'w-full h-full',
            'rounded-full',
            'overflow-hidden',
            'font-[Roboto]',
            className
        )}
            style={{ textTransform: 'capitalize' }}
        >
            <span className="z-11 absolute inset-0 flex items-center justify-center">
                {displayText()}
            </span>
            {/* 下面这一行在0图层上，0图层没有元素似乎会在hover时产生偏移 */}
            {displayText()}
        </div>
    )
}

export default AvatarPlaceholder;