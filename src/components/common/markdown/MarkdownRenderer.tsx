"use client"

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import { cn } from "@/lib/utils"
import ImagePlaceholder from "@/components/common/image/ImagePlaceholder"
import styles from "./md.module.css"

interface MarkdownRendererProps {
    content: string
    className?: string
    variant?: 'default' | 'chat' | 'content'
}

export default function MarkdownRenderer({ content, className, variant = 'default' }: MarkdownRendererProps) {
    // 预处理content，改善换行处理
    const preprocessContent = (text: string) => {
        return text
            // 将连续的星号粗体文本后的单个换行转为双换行（段落分隔）
            .replace(/(\*\*[^*]+\*\*)\n(?!\n)/g, '$1\n\n')
            // 将冒号后的单个换行转为双换行
            .replace(/(:)\n(?!\n)/g, '$1\n\n')
            // 保持原有的双换行
            .replace(/\n\n+/g, '\n\n')
    }

    const processedContent = preprocessContent(content)

    const baseDefault = cn(
        "prose prose-gray max-w-none",
        "prose-headings:text-gray-900 prose-headings:font-bold",
        "prose-p:text-gray-800 prose-p:text-base prose-p:leading-relaxed",
        "prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline",
        "prose-strong:text-gray-900 prose-strong:font-semibold",
        "prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded",
        "prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200",
        "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4",
        "prose-ul:list-disc prose-ol:list-decimal",
        "prose-li:text-gray-800",
    )

    const baseChat = cn(
        "prose max-w-none",
        // 以下为聊天基线，匹配 chat_item_text 语义和尺寸
        "prose-sm",
        // 只控制尺寸与间距，颜色继承容器的 var(--color-text-0)
        "prose-p:text-sm prose-p:leading-relaxed",
        "prose-strong:font-medium prose-strong:text-sm",
        "prose-headings:text-sm prose-headings:font-semibold prose-headings:mb-1 prose-headings:mt-1",
        "prose-a:text-blue-600 prose-a:text-sm prose-a:hover:text-blue-800",
        "prose-ul:text-sm",
        "prose-ol:text-sm",
        "prose-li:text-sm",
    )

    const baseContent = cn(
        // 避免 Tailwind Typography 的默认字号覆盖，交给外部容器样式（如 .content_text）控制
        "max-w-none"
    )

    return (
        <div className={cn(
            variant === 'chat' ? baseChat
                : (variant === 'content' ? baseContent
                    : baseDefault),
            styles.markdown_common,
            className
        )}
            style={variant === 'chat' ? { color: 'var(--color-text-0, #262722)' } : undefined}
        >
            <ReactMarkdown
                remarkPlugins={[remarkBreaks]}
                components={{
                    // 自定义组件样式
                    h1: ({ children }) => (
                        <h1 className={cn(
                            variant === 'chat' ? "text-sm font-semibold mb-1 mt-1"
                                : (variant === 'content' ? undefined :
                                    "text-2xl font-bold text-gray-900 mb-4 mt-6")
                        )}>{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className={cn(
                            variant === 'chat' ? "text-sm font-semibold mb-1 mt-1"
                                : (variant === 'content' ? undefined
                                    : "text-xl font-bold text-gray-900 mb-3 mt-5")
                        )}>{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className={cn(
                            variant === 'chat' ? "text-sm font-semibold mb-1 mt-1"
                                : (variant === 'content' ? undefined
                                    : "text-lg font-bold text-gray-900 mb-2 mt-4")
                        )}>{children}</h3>
                    ),
                    p: ({ children }) => (
                        <div className={cn(
                            variant === 'chat' ? "text-sm leading-relaxed mb-1"
                                : (variant === 'content' ? undefined :
                                    "text-base text-gray-800 leading-relaxed mb-3")
                        )}>{children}</div>
                    ),
                    br: () => (
                        <br className="my-1" />
                    ),
                    code: ({ children, ...props }) => {
                        // @ts-ignore - react-markdown类型定义问题
                        const { inline } = props;
                        return inline ? (
                            <code className={cn(
                                "bg-gray-100 text-sm px-1 py-0.5 rounded text-gray-800"
                            )}>
                                {children}
                            </code>
                        ) : (
                            <code className={cn(
                                "block bg-gray-50 border border-gray-200 p-3 rounded text-sm overflow-x-auto"
                            )} style={{whiteSpace: 'pre-line'}}>
                                {children}
                            </code>
                        );
                    },
                    blockquote: ({ children }) => (
                        <blockquote className={cn(
                            variant === 'chat' ? "border-l-4 border-gray-300 pl-3 my-2 italic"
                                : (variant === 'content' ? undefined
                                    : "border-l-4 border-gray-300 pl-4 my-4 text-gray-700 italic")
                        )}>
                            {children}
                        </blockquote>
                    ),
                    ul: ({ children }) => (
                        <ul className={cn(
                            variant === 'chat' ? "list-disc list-inside mb-1 ml-4 space-y-1"
                                : (variant === 'content' ? "list-disc list-outside mb-1 ml-4 space-y-1"
                                    : "list-disc list-inside mb-3 text-gray-800 space-y-1")
                        )}>
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className={cn(
                            variant === 'chat' ? "list-decimal list-outside mb-1 ml-4 space-y-1"
                                : (variant === 'content' ? "list-decimal list-outside mb-1 ml-4 space-y-1"
                                    : "list-decimal list-inside mb-3 text-gray-800 space-y-1")
                        )}>
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className={cn(
                            variant === 'chat' ? undefined
                                : (variant === 'content' ? undefined
                                    : "text-gray-800")
                        )}>{children}</li>
                    ),
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {children}
                        </a>
                    ),
                    strong: ({ children }) => (
                        <strong className={cn(
                            variant === 'chat' ? "font-medium"
                                : (variant === 'content' ? undefined
                                    : "font-semibold text-gray-900")
                        )}>{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className={cn(
                            variant === 'chat' ? "italic"
                                : (variant === 'content' ? undefined
                                    : "italic text-gray-800")
                        )}>{children}</em>
                    ),
                    img: ({ src, alt }) => <MarkdownImgWithFallback src={src} alt={alt} />
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div >
    )
}


function MarkdownImgWithFallback({ src, alt }: { src?: string | Blob; alt?: string }) {
    const [failed, setFailed] = useState(false)
    const normalizedSrc = typeof src === 'string' ? src : undefined
    if (!normalizedSrc || failed) {
        return (
            <ImagePlaceholder
                className={cn("w-full h-fit", styles.placeholder_img)}
                text={`${alt} - image not found`}
                alt={`image not found: ${alt}`}
                useRandomGradient={false}
            />
        )
    }
    return (
        <img
            src={normalizedSrc}
            alt={alt}
            className="w-full h-auto"
            onError={() => setFailed(true)}
        />
    )
}