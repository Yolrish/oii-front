'use client';

/**
 * Image 组件
 * 
 * 这是一个对 next/image 标签进行封装的组件，具有以下特性：
 * 1. 图片预检：如果图片不存在，返回空组件
 * 2. 加载状态处理：图片加载过程中显示骨架屏
 * 3. 错误处理：图片加载失败时返回空组件
 * 4. 支持懒加载：通过 NextImage 的原生懒加载功能实现
 * 
 * @component
 */

import React, { memo, useState } from 'react';
import NextImage from 'next/image';
import { ImageOff, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCdnUrl } from '@/utils/global/cdn-utils';
import ImagePlaceholder from './ImagePlaceholder';

/**
 * Next.js Image 组件属性说明
 * 
 * 关于 sizes 和 width/height 属性的优先级关系：
 * - 当 fill 为 true 时：
 *   - sizes 属性会完全覆盖 width 和 height 属性
 *   - 图片会填充其父容器，并根据 sizes 属性来确定响应式行为
 *   - width 和 height 属性会被忽略
 * - 当 fill 为 false 时：
 *   - width 和 height 属性会生效
 *   - sizes 属性仍然会影响图片的响应式加载行为，但不会改变图片的显示尺寸
 */
interface ImageProps {
    /** 自定义Div类名 */
    wrapperClassName?: string;
    /** 自定义图片类名 */
    imageClassName?: string;
    /** 图片源地址 */
    src: string
    /** 图片替代文本 */
    alt: string
    /** 是否启用懒加载 */
    lazy?: boolean
    /** 响应式图片尺寸 */
    sizes?: string
    /** 图片加载方式：eager（立即加载）或 lazy（懒加载） */
    loading?: "eager" | "lazy"
    // CDN宽高
    CDNWidth?: number
    CDNHeight?: number
    /** 使用图片的固有尺寸（非 fill 模式）。*/
    intrinsic?: boolean
    // 当图片失效时是否显示图片
    showPlaceholderWhenError?: boolean
    /** 图片加载失败时回调 */
    onError?: () => void
    /** 图片加载完成时回调 */
    onLoad?: () => void
    // 自定义的placeholder
    customPlaceholder?: React.ReactNode
}

/**
 * Image 组件实现
 * 
 * 工作流程：
 * 1. 初始状态：显示骨架屏（isLoading 为 true）
 * 2. 图片加载：
 *    - 当 loading="eager" 时，立即开始加载图片
 *    - 当 loading="lazy" 时，等待图片进入视口才开始加载
 * 3. 加载完成：图片加载完成时，isLoading 变为 false，骨架屏消失
 * 4. 加载失败：图片加载失败时，hasError 变为 true，显示空组件
 * 
 * 实现特点：
 * - 使用 NextImage 的原生懒加载功能
 * - 骨架屏和图片使用绝对定位，确保平滑过渡
 * - 支持填充模式和固定尺寸模式
 * 
 * @param {ImageProps} props - 组件属性
 * @returns {JSX.Element} 图片组件
 */
function Image({
    wrapperClassName,
    imageClassName,
    src,
    alt = 'This is a news image',
    sizes = '100vw',
    loading = 'eager',
    CDNWidth = 800,
    CDNHeight = 450,
    intrinsic = false,
    showPlaceholderWhenError = true,
    onError,
    onLoad,
    customPlaceholder
}: ImageProps) {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 如果 src 为空字符串或发生错误，返回占位符
    if (!src || hasError) {
        if (showPlaceholderWhenError) {
            return (
                <div className={cn(
                    'relative',
                    wrapperClassName
                )}>
                    {/* <ImageOff className={cn(
                        'w-4/5! h-4/5! max-w-[100px] max-h-[100px]',
                        imageClassName
                    )} /> */}
                    {
                        customPlaceholder ?? <ImagePlaceholder
                            useRandomGradient={true}
                            text={alt}
                            alt={alt}
                            src={getCdnUrl(src, 100, 100) ?? 'no src'}
                        />
                    }
                </div>
            )
        } else {
            return null;
        }
    }

    const resolvedImageClassName = imageClassName ?? (intrinsic ? '' : 'w-full aspect-[2/1]')
    // 这里的初始赋值似乎有些问题，但intrinsic模式下渲染出来的图片还是保持了图片原资源的宽高，所以又似乎没问题
    const renderWidth = (intrinsic ? CDNWidth : undefined)
    const renderHeight = (intrinsic ? CDNHeight : undefined)

    return (
        <div className={cn(
            'relative',
            wrapperClassName
        )}>
            {/* {isLoading && (
                <Skeleton
                    className={cn(
                        'common-image',
                        imageClassName
                    )}
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        objectFit: 'cover',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </Skeleton>
            )} */}
            <NextImage
                className={cn(
                    'common-image',
                    resolvedImageClassName
                )}
                src={getCdnUrl(src, renderWidth ?? CDNWidth, renderHeight ?? CDNHeight)}
                alt={alt}
                {...(intrinsic ? { width: renderWidth, height: renderHeight } : { fill: true })}
                sizes={sizes}
                loading={loading}
                onError={() => {
                    setHasError(true)
                    onError?.()
                }}
                onLoad={() => {
                    setIsLoading(false)
                    onLoad?.()
                }}
                placeholder='blur'
                blurDataURL={'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNct3ldPQAGtgKQPeg9MgAAAABJRU5ErkJggg=='}
            />
        </div>
    );
}

export default memo(Image);    