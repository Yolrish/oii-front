/**
 * 图片占位符组件
 */

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ImageOffIcon } from 'lucide-react'

interface ImagePlaceholderProps {
    className?: string
    src?: string
    text?: string
    alt?: string
    useRandomGradient?: boolean
}

// 基于字符生成确定性渐变色
function generateGradientFromChar(char: string): string {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8C471', '#82E0AA', '#F1948A', '#85D4E3', '#F4D03F',
        '#AED6F1', '#A9DFBF', '#F9E79F', '#D7BDE2', '#F5B7B1'
    ]

    // 将字符转换为ASCII码，然后用于索引计算
    const charCode = char.toLowerCase().charCodeAt(0)

    // 基于字符码计算颜色索引和角度，确保结果是确定性的
    const color1Index = charCode % colors.length
    const color2Index = (charCode * 7 + 13) % colors.length // 使用不同的算法避免相同颜色
    const angle = (charCode * 5) % 360

    const color1 = colors[color1Index]
    const color2 = colors[color2Index]

    return `linear-gradient(${angle}deg, ${color1}, ${color2})`
}

// 生成随机渐变色
function generateRandomGradient(): string {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8C471', '#82E0AA', '#F1948A', '#85D4E3', '#F4D03F'
    ]

    const color1 = colors[Math.floor(Math.random() * colors.length)]
    const color2 = colors[Math.floor(Math.random() * colors.length)]
    const angle = Math.floor(Math.random() * 360)

    return `linear-gradient(${angle}deg, ${color1}, ${color2})`
}

function ImagePlaceholder({
    className,
    src,
    text = '',
    alt,
    useRandomGradient = false
}: ImagePlaceholderProps) {
    const gradientStyle = useMemo(() => {
        if (useRandomGradient) {
            if (alt && alt.length > 0) {
                // 使用 alt 的首字母生成确定性渐变色
                const firstChar = alt.charAt(0)
                return { background: generateGradientFromChar(firstChar) }
            } else {
                // 如果没有 alt 或 alt 为空，则生成随机渐变色
                return { background: generateRandomGradient() }
            }
        }
        return {}
    }, [useRandomGradient, alt])

    return (
        <div
            className={cn(
                'news-image-placeholder',
                'flex items-center justify-center gap-2',
                'w-full h-full p-4',
                !useRandomGradient && 'bg-[#f3f3f3]',
                'text-[#999999] text-lg',
                'overflow-hidden!',
                className
            )}
            style={gradientStyle}
            aria-description={`image not found: ${src}`}
        >
            <ImageOffIcon />
            {text}
        </div>
    )
}

export default ImagePlaceholder