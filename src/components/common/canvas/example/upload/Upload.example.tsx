'use client';

import React, { useState, useCallback, useRef, type DragEvent } from 'react';
import { BaseCanvas, useCanvasItems, type CanvasItemData, type CanvasMode, type Point } from '../../index';
import ItemIndex, { type ItemType, type ItemData, type ImageItemData, type VideoItemData } from './Item.index';

// ==================== 类型定义 ====================

/** 拖放文件信息 */
export interface DropFileInfo {
    /** 文件对象 */
    file: File;
    /** 文件类型 */
    type: ItemType;
    /** 生成的URL（用于预览） */
    url: string;
    /** 在画布中的放置位置 */
    position: Point;
}

/** 拖放回调函数集合 */
export interface UploadCallbacks {
    /** 拖拽进入画布区域时触发 */
    onDragEnter?: (e: DragEvent<HTMLDivElement>) => void;
    /** 拖拽在画布区域上方移动时触发 */
    onDragOver?: (e: DragEvent<HTMLDivElement>, position: Point) => void;
    /** 拖拽离开画布区域时触发 */
    onDragLeave?: (e: DragEvent<HTMLDivElement>) => void;
    /** 文件放置时触发（在创建item之前） */
    onDrop?: (files: DropFileInfo[]) => void;
    /** 验证文件是否可接受 */
    onValidateFile?: (file: File) => boolean | Promise<boolean>;
    /** Item创建成功后触发 */
    onItemCreated?: (item: CanvasItemData, fileInfo: DropFileInfo) => void;
    /** 发生错误时触发 */
    onError?: (error: Error, file?: File) => void;
}

/** UploadCanvas组件Props */
export interface UploadCanvasProps extends UploadCallbacks {
    /** 初始items */
    initialItems?: CanvasItemData[];
    /** 图片默认宽度 */
    imageDefaultWidth?: number;
    /** 图片默认高度 */
    imageDefaultHeight?: number;
    /** 视频默认宽度 */
    videoDefaultWidth?: number;
    /** 视频默认高度 */
    videoDefaultHeight?: number;
    /** 是否自动居中新元素 */
    autoFitNewItem?: boolean;
}

// ==================== 常量定义 ====================

/** 图片MIME类型 */
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];

/** 视频MIME类型 */
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

/** 默认图片尺寸 */
const DEFAULT_IMAGE_SIZE = { width: 300, height: 200 };

/** 默认视频尺寸 */
const DEFAULT_VIDEO_SIZE = { width: 400, height: 225 };

// ==================== 工具函数 ====================

/**
 * 根据文件MIME类型判断ItemType
 */
function getItemTypeFromFile(file: File): ItemType | null {
    if (IMAGE_MIME_TYPES.includes(file.type)) {
        return 'image';
    }
    if (VIDEO_MIME_TYPES.includes(file.type)) {
        return 'video';
    }
    return null;
}

/**
 * 获取图片的实际尺寸
 */
function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * 计算等比缩放后的尺寸
 */
function calculateScaledSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = Math.min(originalWidth, maxWidth);
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
}

// ==================== 主组件 ====================

/**
 * 支持拖放上传的Canvas示例组件
 * 
 * 功能特性：
 * 1. 拖拽图片/视频文件到画布区域
 * 2. 自动识别文件类型并创建对应的Item
 * 3. 支持外部传入各步骤的回调函数
 * 4. 支持文件验证
 */
export default function UploadCanvasExample({
    initialItems = [],
    imageDefaultWidth = DEFAULT_IMAGE_SIZE.width,
    imageDefaultHeight = DEFAULT_IMAGE_SIZE.height,
    videoDefaultWidth = DEFAULT_VIDEO_SIZE.width,
    videoDefaultHeight = DEFAULT_VIDEO_SIZE.height,
    autoFitNewItem = true,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
    onValidateFile,
    onItemCreated,
    onError,
}: UploadCanvasProps) {
    // 画布容器ref
    const containerRef = useRef<HTMLDivElement>(null);

    // 当前鼠标模式
    const [mode, setMode] = useState<CanvasMode>('normal');

    // 是否正在拖拽状态
    const [isDragging, setIsDragging] = useState(false);

    // 拖拽计数器（处理子元素的dragenter/dragleave）
    const dragCounterRef = useRef(0);

    // 当前视图状态ref（用于坐标转换）
    const viewStateRef = useRef({ scale: 1, offset: { x: 0, y: 0 } });

    // 使用 useCanvasItems 管理items
    const { items, addItem, updateItemPosition, removeItem } = useCanvasItems(initialItems);

    /**
     * 将屏幕坐标转换为画布坐标
     */
    const screenToCanvasPosition = useCallback((screenX: number, screenY: number): Point => {
        const container = containerRef.current;
        if (!container) return { x: 0, y: 0 };

        const rect = container.getBoundingClientRect();
        const { scale, offset } = viewStateRef.current;

        // 鼠标相对于容器的位置
        const relativeX = screenX - rect.left;
        const relativeY = screenY - rect.top;

        // 转换为画布坐标
        const canvasX = (relativeX - offset.x) / scale;
        const canvasY = (relativeY - offset.y) / scale;

        return { x: canvasX, y: canvasY };
    }, []);

    /**
     * 处理拖拽进入
     */
    const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        dragCounterRef.current++;
        
        if (dragCounterRef.current === 1) {
            setIsDragging(true);
            onDragEnter?.(e);
        }
    }, [onDragEnter]);

    /**
     * 处理拖拽移动
     */
    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        // 设置拖拽效果
        e.dataTransfer.dropEffect = 'copy';

        const position = screenToCanvasPosition(e.clientX, e.clientY);
        onDragOver?.(e, position);
    }, [screenToCanvasPosition, onDragOver]);

    /**
     * 处理拖拽离开
     */
    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        dragCounterRef.current--;
        
        if (dragCounterRef.current === 0) {
            setIsDragging(false);
            onDragLeave?.(e);
        }
    }, [onDragLeave]);

    /**
     * 处理文件放置
     */
    const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        // 重置拖拽状态
        dragCounterRef.current = 0;
        setIsDragging(false);

        // 获取放置位置
        const dropPosition = screenToCanvasPosition(e.clientX, e.clientY);

        // 获取文件列表
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        // 处理每个文件
        const dropFileInfos: DropFileInfo[] = [];

        for (const file of files) {
            try {
                // 检查文件类型
                const itemType = getItemTypeFromFile(file);
                if (!itemType) {
                    onError?.(new Error(`Unsupported file type: ${file.type}`), file);
                    continue;
                }

                // 验证文件
                if (onValidateFile) {
                    const isValid = await onValidateFile(file);
                    if (!isValid) {
                        onError?.(new Error(`File validation failed: ${file.name}`), file);
                        continue;
                    }
                }

                // 创建预览URL
                const url = URL.createObjectURL(file);

                // 计算放置位置（多个文件时依次向下偏移）
                const offsetIndex = dropFileInfos.length;
                const position: Point = {
                    x: dropPosition.x + offsetIndex * 20,
                    y: dropPosition.y + offsetIndex * 20,
                };

                dropFileInfos.push({
                    file,
                    type: itemType,
                    url,
                    position,
                });
            } catch (error) {
                onError?.(error instanceof Error ? error : new Error(String(error)), file);
            }
        }

        // 触发onDrop回调
        if (dropFileInfos.length > 0) {
            onDrop?.(dropFileInfos);
        }

        // 创建items
        for (const fileInfo of dropFileInfos) {
            try {
                let itemWidth: number;
                let itemHeight: number;

                if (fileInfo.type === 'image') {
                    // 获取图片实际尺寸并等比缩放
                    try {
                        const dimensions = await getImageDimensions(fileInfo.url);
                        const scaled = calculateScaledSize(
                            dimensions.width,
                            dimensions.height,
                            imageDefaultWidth,
                            imageDefaultHeight
                        );
                        itemWidth = scaled.width;
                        itemHeight = scaled.height;
                    } catch {
                        itemWidth = imageDefaultWidth;
                        itemHeight = imageDefaultHeight;
                    }
                } else {
                    itemWidth = videoDefaultWidth;
                    itemHeight = videoDefaultHeight;
                }

                // 创建item数据
                const itemData: ItemData = fileInfo.type === 'image'
                    ? { src: fileInfo.url, name: fileInfo.file.name } as ImageItemData
                    : { src: fileInfo.url, name: fileInfo.file.name } as VideoItemData;

                const newItem: CanvasItemData = {
                    id: `${fileInfo.type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                    x: fileInfo.position.x,
                    y: fileInfo.position.y,
                    width: itemWidth,
                    height: itemHeight,
                    data: {
                        type: fileInfo.type,
                        itemData,
                    },
                };

                // 添加item
                addItem(newItem);

                // 触发创建成功回调
                onItemCreated?.(newItem, fileInfo);
            } catch (error) {
                onError?.(error instanceof Error ? error : new Error(String(error)), fileInfo.file);
            }
        }
    }, [
        screenToCanvasPosition,
        onDrop,
        onValidateFile,
        onError,
        onItemCreated,
        addItem,
        imageDefaultWidth,
        imageDefaultHeight,
        videoDefaultWidth,
        videoDefaultHeight,
    ]);

    /**
     * 渲染单个item
     */
    const renderItem = useCallback((item: CanvasItemData) => {
        const { type, itemData } = (item.data || {}) as { type?: ItemType; itemData?: ItemData };

        if (!type || !itemData) {
            return (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                        fontSize: '14px',
                    }}
                >
                    Unknown Item
                </div>
            );
        }

        return (
            <ItemIndex
                type={type}
                data={itemData}
                onDelete={() => removeItem(item.id)}
            />
        );
    }, [removeItem]);

    /**
     * 处理视图变化
     */
    const handleViewChange = useCallback((viewState: { scale: number; offset: Point }) => {
        viewStateRef.current = viewState;
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
            }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Canvas组件 */}
            <BaseCanvas
                items={items}
                renderItem={renderItem}
                onItemMove={updateItemPosition}
                onViewChange={handleViewChange}
                showGrid={true}
                gridSize={20}
                minScale={0.2}
                maxScale={3}
                autoFitNewItem={autoFitNewItem}
                mode={mode}
                onModeChange={setMode}
            />

            {/* 拖拽提示遮罩 */}
            {isDragging && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'hsl(var(--primary) / 0.1)',
                        border: '3px dashed hsl(var(--primary))',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            padding: '24px 48px',
                            backgroundColor: 'hsl(var(--card))',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                        }}
                    >
                        <span style={{ fontSize: '48px' }}>📁</span>
                        <span
                            style={{
                                fontSize: '18px',
                                fontWeight: 600,
                                color: 'hsl(var(--foreground))',
                            }}
                        >
                            Drop files here
                        </span>
                        <span
                            style={{
                                fontSize: '14px',
                                color: 'hsl(var(--muted-foreground))',
                            }}
                        >
                            Supports images and videos
                        </span>
                    </div>
                </div>
            )}

            {/* 使用说明 */}
            <div
                style={{
                    position: 'absolute',
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 100,
                    padding: '12px 24px',
                    backgroundColor: 'hsl(var(--card) / 0.95)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    backdropFilter: 'blur(8px)',
                    fontSize: '14px',
                    color: 'hsl(var(--muted-foreground))',
                }}
            >
                <span>📸 Drag and drop images or videos onto the canvas</span>
                {/* <span style={{ marginLeft: '16px', opacity: 0.7 }}>
                    (Ctrl + scroll to zoom | Middle-click to pan)
                </span> */}
            </div>

            {/* 统计信息 */}
            <div
                style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    zIndex: 100,
                    padding: '8px 16px',
                    backgroundColor: 'hsl(var(--card) / 0.95)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    backdropFilter: 'blur(8px)',
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))',
                }}
            >
                Items: {items.length}
            </div>

            {/* 模式切换器 */}
            <div
                style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    zIndex: 100,
                    display: 'flex',
                    gap: '4px',
                    padding: '4px',
                    backgroundColor: 'hsl(var(--card) / 0.95)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <button
                    onClick={() => setMode('grab')}
                    style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: mode === 'grab' ? 'hsl(var(--primary))' : 'transparent',
                        color: mode === 'grab' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    title="Grab Mode - Drag to pan canvas"
                >
                    🖐️ Grab
                </button>
                <button
                    onClick={() => setMode('normal')}
                    style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: mode === 'normal' ? 'hsl(var(--primary))' : 'transparent',
                        color: mode === 'normal' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    title="Normal Mode - Double-click to fit item"
                >
                    🖱️ Normal
                </button>
                <button
                    onClick={() => setMode('move')}
                    style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: mode === 'move' ? 'hsl(var(--primary))' : 'transparent',
                        color: mode === 'move' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    title="Move Mode - Drag to move items"
                >
                    ✥ Move
                </button>
            </div>
        </div>
    );
}

