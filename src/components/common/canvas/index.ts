// ==================== Canvas组件导出 ====================

// 组件
export { default as BaseCanvas } from './components/Canvas';

// Hooks
export { useCanvasItems } from './hooks/canvas-hook';

// 类型
export type {
    CanvasProps,
    CanvasItemData,
    CanvasMode,
    Point,
    ViewState,
    UseCanvasItemsReturn,
} from './types/canvas-type';

// 示例
export { default as CanvasExample } from './example/normal/Canvas.example';
export { default as UploadCanvasExample } from './example/upload/Upload.example';