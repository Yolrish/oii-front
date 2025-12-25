'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** Item类型 */
export type ItemType = 'image' | 'video' | 'text';

/** Item数据基础接口 */
export interface ItemDataBase {
    /** 显示名称 */
    name?: string;
}

/** 图片类型数据 */
export interface ImageItemData extends ItemDataBase {
    /** 图片URL */
    src: string;
    /** 替代文本 */
    alt?: string;
}

/** 视频类型数据 */
export interface VideoItemData extends ItemDataBase {
    /** 视频URL */
    src: string;
    /** 封面图URL */
    poster?: string;
}

/** 文本类型数据 */
export interface TextItemData extends ItemDataBase {
    /** 文本内容 */
    content: string;
    /** 字体大小 */
    fontSize?: number;
    /** 文本颜色 */
    color?: string;
}

/** Item数据联合类型 */
export type ItemData = ImageItemData | VideoItemData | TextItemData;

/** ItemIndex组件Props */
export interface ItemIndexProps {
    /** Item类型 */
    type: ItemType;
    /** Item数据 */
    data: ItemData;
    /** 点击回调 */
    onClick?: () => void;
    /** 删除回调 */
    onDelete?: () => void;
}

// ==================== 子组件 ====================

/** 图片Item组件 */
function ImageItem({ data, onDelete }: { data: ImageItemData; onDelete?: () => void }) {
    return (
        <div className="item-image">
            <img
                src={data.src}
                alt={data.alt || data.name || 'Image'}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '4px',
                }}
                draggable={false}
            />
            {/* 图片名称标签 */}
            {data.name && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        right: '8px',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '12px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {data.name}
                </div>
            )}
            {/* 删除按钮 */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        color: 'white',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                    }}
                    className="item-delete-btn"
                >
                    ×
                </button>
            )}
            <style>{`
                .item-image:hover .item-delete-btn {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}

/** 视频Item组件 */
function VideoItem({ data, onDelete }: { data: VideoItemData; onDelete?: () => void }) {
    return (
        <div className="item-video" style={{ position: 'relative', width: '100%', height: '100%' }}>
            <video
                src={data.src}
                poster={data.poster}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '4px',
                }}
                controls
                muted
            />
            {/* 视频名称标签 */}
            {data.name && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '48px',
                        left: '8px',
                        right: '8px',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '12px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                    }}
                >
                    🎬 {data.name}
                </div>
            )}
            {/* 删除按钮 */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        color: 'white',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                    }}
                    className="item-delete-btn"
                >
                    ×
                </button>
            )}
            <style>{`
                .item-video:hover .item-delete-btn {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}

/** 文本Item组件 */
function TextItem({ data, onDelete }: { data: TextItemData; onDelete?: () => void }) {
    return (
        <div
            className="item-text"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                padding: '16px',
                backgroundColor: 'hsl(var(--card))',
                borderRadius: '4px',
                overflow: 'auto',
            }}
        >
            <p
                style={{
                    margin: 0,
                    fontSize: data.fontSize || 14,
                    color: data.color || 'hsl(var(--foreground))',
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
                }}
            >
                {data.content}
            </p>
            {/* 文本名称标签 */}
            {data.name && (
                <div
                    style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        padding: '2px 6px',
                        backgroundColor: 'hsl(var(--muted))',
                        borderRadius: '4px',
                        color: 'hsl(var(--muted-foreground))',
                        fontSize: '10px',
                    }}
                >
                    📝 {data.name}
                </div>
            )}
            {/* 删除按钮 */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        color: 'white',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                    }}
                    className="item-delete-btn"
                >
                    ×
                </button>
            )}
            <style>{`
                .item-text:hover .item-delete-btn {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}

// ==================== 主组件 ====================

/**
 * Item索引组件
 * 根据type渲染对应的Item组件
 */
export default function ItemIndex({ type, data, onClick, onDelete }: ItemIndexProps) {
    const handleClick = () => {
        onClick?.();
    };

    return (
        <div
            onClick={handleClick}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            {type === 'image' && <ImageItem data={data as ImageItemData} onDelete={onDelete} />}
            {type === 'video' && <VideoItem data={data as VideoItemData} onDelete={onDelete} />}
            {type === 'text' && <TextItem data={data as TextItemData} onDelete={onDelete} />}
        </div>
    );
}

