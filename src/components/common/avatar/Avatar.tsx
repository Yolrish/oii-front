'use client'

/**
 * 头像组件
 */

import React, { useState, useMemo, memo } from 'react'
import { cn } from '@/lib/utils'
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import AvatarPlaceholder from '@/components/common/avatar/AvatarPlaceholder'
import Link from 'next/link'
import { getCdnUrl } from '@/utils/global/cdn-utils'

// 随机背景颜色数组
export const bgColors_Avatar = [
    'bg-[#94B0DA]',
    'bg-[#A72A28]',
    'bg-[#3A7895]',
    'bg-[#20201E]',
    'bg-[#A6A0C8]',
];


/**
 * 根据文本确定背景颜色
 * @param text 文本
 * @returns 背景颜色类名
 */
export const getBackgroundColorByText = (text: string): string => {
    // 获取文本的第一个字符的Unicode码点
    const firstChar = text.charCodeAt(0) || 0;
    // 使用Unicode码点对背景颜色数组长度取模，确保获得有效索引
    const colorIndex = firstChar % bgColors_Avatar.length;
    return bgColors_Avatar[colorIndex];
};

interface AvatarProps {
    containerClassName?: string
    avatarClassName?: string
    placeholderClassName?: string
    hoverAnimation?: boolean
    src: string
    alt: string
    jumpable?: boolean
    jumpId?: string
}

function Avatar({
    containerClassName,
    avatarClassName,
    placeholderClassName,
    hoverAnimation = true,
    src,
    alt = 'This is a avatar',
    jumpable = false,
    jumpId
}: AvatarProps) {
    const [imageStatus, setImageStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('loading');

    // 根据alt的第一个字符确定PlaceHolder的背景颜色
    const determineBgColor = useMemo(() => {
        return getBackgroundColorByText(alt);
    }, [alt]);

    // 判断是否为可加载的 URL（支持 http/https 以及 blob/data 预览）
    const isHttpUrl = (value: string): boolean => {
        try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'blob:' || url.protocol === 'data:';
        } catch {
            return false;
        }
    };

    // 处理图片加载状态变化（幂等保护，避免重复 setState）
    const handleLoadingStatusChange = (status: 'idle' | 'loading' | 'loaded' | 'error') => {
        setImageStatus((prev) => (prev === status ? prev : status));
    };

    // 判断是否显示占位符
    const shouldShowFallback = !src || src === null || !isHttpUrl(src) || imageStatus === 'error';

    const avatarNode = (
        <ShadcnAvatar
            className={jumpable
                ? cn(
                    'w-full h-full',
                    'rounded-full',
                    'overflow-hidden',
                ) : cn(
                    'card-common-avatar',
                    'flex justify-center items-center',
                    'w-full h-full',
                    'rounded-full',
                    'overflow-hidden',
                    'relative',
                    'cursor-pointer',
                    hoverAnimation ?
                        cn(
                            'hover:scale-120',
                            'transition-all',
                            'duration-200'
                        ) : '',
                    avatarClassName,
                )}
        >
            {
                imageStatus === 'loading' && !shouldShowFallback && (
                    <div className={cn(
                        'card-common-avatar__loading',
                        'w-full h-full',
                        'rounded-full',
                        'overflow-hidden',
                        'absolute',
                        'inset-0',
                        'bg-gray-200',
                        'animate-pulse duration-150',
                        'z-1 ',
                        avatarClassName
                    )}></div>
                )
            }
            {
                shouldShowFallback ? (
                    <AvatarFallback
                        className={cn(
                            'card-common-avatar__fallback',
                            'bg-transparent',
                            'w-full h-full',
                            'rounded-full',
                            avatarClassName
                        )}
                    >
                        <AvatarPlaceholder
                            className={cn(
                                'card-common-avatar__placeholder',
                                determineBgColor,
                                'text-white font-bold',
                                'relative',
                                hoverAnimation ?
                                    cn(
                                        'after:absolute',
                                        'after:z-10',
                                        'after:inset-0'
                                    ) : "",
                                hoverAnimation ?
                                    'after:bg-red-500' : "",
                                hoverAnimation ?
                                    cn(
                                        'after:transition-all',
                                        'after:duration-500',
                                        'after:ease-in-out'
                                    ) : "",
                                hoverAnimation ?
                                    cn(
                                        'after:opacity-0',
                                        'hover:after:opacity-60',
                                        'hover:after:scale-150'
                                    ) : "",
                                placeholderClassName
                            )}
                            text={alt}
                        />
                    </AvatarFallback>
                ) : (
                    <AvatarImage
                        src={getCdnUrl(src, 300, 300)}
                        alt={alt}
                        className={cn(
                            'card-common-avatar__image',
                            'w-full h-full',
                            'object-cover'
                        )}
                        onLoadingStatusChange={handleLoadingStatusChange}
                    />
                )
            }
        </ShadcnAvatar>
    );

    if (jumpable && jumpId && jumpId !== '') {
        return (
            <Link className={cn(
                'card-common-avatar',
                'flex justify-center items-center',
                'w-full h-full',
                'rounded-full',
                'overflow-hidden',
                'relative',
                'cursor-pointer',
                hoverAnimation ?
                    cn(
                        'hover:scale-120',
                        'transition-all',
                        'duration-200'
                    ) : '',
                containerClassName
            )} href={`/user/${jumpId}`}>
                {avatarNode}
            </Link>
        )
    } else {
        return (
            <div className={cn(
                'card-common-avatar',
                containerClassName
            )}>
                {avatarNode}
            </div>
        )
    }
}

export default memo(Avatar);