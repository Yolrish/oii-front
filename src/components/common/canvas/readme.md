# Canvas 无限画布组件

基于 React 实现的无限画布组件，支持拖拽、缩放、添加自定义组件等功能。

## 功能特性

| 功能 | 描述 |
|------|------|
| 无限平移 | 滚轮滚动 / 中键拖拽 / 抓握模式拖拽 |
| 缩放 | Ctrl+滚轮以鼠标位置为中心缩放（已拦截浏览器默认行为） |
| 组件拖拽 | 移动模式下拖拽画布内的组件 |
| 自动适配 | 双击组件自动居中显示（带流畅动画） |
| 新元素定位 | 添加新元素时自动移动画布使其居中 |
| 可视区域检测 | 检测当前视口是否有元素，提供定位到最近元素功能 |
| 受控模式 | scale 和 offset 支持外部控制 |

## 三种鼠标模式

- **grab** - 抓握模式：左键拖动移动画布位置
- **normal** - 常规模式：双击元素自动适配显示
- **move** - 移动模式：左键拖拽移动画布内的组件

## 快速开始

```tsx
import { BaseCanvas, useCanvasItems } from '@/components/common/canvas';

function MyCanvas() {
    const { items, addItem, updateItemPosition, removeItem } = useCanvasItems([
        { id: '1', x: 100, y: 100, width: 200, height: 150 }
    ]);

    return (
        <BaseCanvas
            items={items}
            renderItem={(item) => <div>Item {item.id}</div>}
            onItemMove={updateItemPosition}
        />
    );
}
```

## API

### BaseCanvas Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| items | CanvasItemData[] | [] | 画布中的元素列表 |
| renderItem | (item) => ReactNode | - | 渲染单个元素的函数 |
| onItemMove | (id, position) => void | - | 元素位置变化回调 |
| onViewChange | (viewState) => void | - | 视图状态变化回调 |
| minScale | number | 0.1 | 最小缩放比例 |
| maxScale | number | 5 | 最大缩放比例 |
| initialViewState | Partial\<ViewState\> | - | 初始视图状态 |
| showGrid | boolean | true | 是否显示网格 |
| gridSize | number | 20 | 网格大小 |
| mode | CanvasMode | 'normal' | 当前鼠标模式 |
| onModeChange | (mode) => void | - | 模式变化回调 |
| onItemDoubleClick | (id, item) => void | - | 双击元素回调 |
| fitPadding | number | 50 | 自动适配时的边距 |
| autoFitNewItem | boolean | true | 添加新元素时是否自动居中 |
| scale | number | - | 受控模式：外部控制的缩放比例 |
| onScaleChange | (scale) => void | - | 缩放比例变化回调 |
| offset | Point | - | 受控模式：外部控制的偏移量 |
| onOffsetChange | (offset) => void | - | 偏移量变化回调 |

### useCanvasItems Hook

```tsx
const {
    items,              // 当前元素列表
    setItems,           // 直接设置元素列表
    addItem,            // 添加元素（自动放置在最后一个元素下方）
    removeItem,         // 移除元素
    updateItemPosition, // 更新元素位置
    updateItem,         // 更新元素数据
    clearItems,         // 清空所有元素
} = useCanvasItems(initialItems);
```

### 类型定义

```tsx
interface CanvasItemData {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    data?: Record<string, unknown>;
}

interface Point {
    x: number;
    y: number;
}

interface ViewState {
    offset: Point;
    scale: number;
}

type CanvasMode = 'grab' | 'normal' | 'move';
```

## 示例

### 1. 基础示例

位置：`example/normal/Canvas.example.tsx`

展示基本用法，包含模式切换、缩放控制等功能。

### 2. 拖放上传示例

位置：`example/upload/Upload.example.tsx`

支持拖放图片/视频文件到画布，自动创建对应元素。

```tsx
import { UploadCanvasExample } from '@/components/common/canvas/example/upload';

<UploadCanvasExample
    onDragEnter={() => console.log('开始拖拽')}
    onDrop={(files) => console.log('放置文件', files)}
    onValidateFile={(file) => file.size < 10 * 1024 * 1024}
    onItemCreated={(item, fileInfo) => console.log('创建成功', item)}
    onError={(error, file) => console.error('错误', error, file)}
/>
```

### Item 索引组件

位置：`example/upload/Item.index.tsx`

根据类型渲染不同的元素组件。

```tsx
import ItemIndex from './Item.index';

<ItemIndex
    type="image"  // 'image' | 'video' | 'text'
    data={{ src: 'xxx.jpg', name: 'Photo' }}
    onDelete={() => removeItem(id)}
/>
```

## 文件结构

```
canvas/
├── components/
│   ├── Canvas.tsx          # 主组件
│   └── Canvas.module.css   # 样式
├── hooks/
│   └── canvas-hook.ts      # useCanvasItems Hook
├── types/
│   └── canvas-type.ts      # 类型定义
├── example/
│   ├── normal/
│   │   └── Canvas.example.tsx  # 基础示例
│   └── upload/
│       ├── Upload.example.tsx  # 拖放上传示例
│       └── Item.index.tsx      # Item 索引组件
├── index.ts                # 统一导出
└── readme.md               # 文档
```

---

## 更新记录

### 2026-01-04

---

#### ✨ 新增功能

**1. 创建基础 Canvas 无限画布组件**
- 实现无限拖动功能
- 滚轮控制滚动
- Ctrl+滚轮控制放大缩小
- 按住滚轮（中键）拖动画布
- 支持在画布中添加自定义组件，组件被可拖拽容器包裹

**2. 添加三种鼠标模式**
- **grab 模式**：抓握模式，左键拖动移动画布位置
- **normal 模式**：常规模式，双击元素自动适配显示
- **move 模式**：移动模式，左键拖拽移动画布内的组件

**3. 使用 motion 库实现适配动画**
- 在 normal 模式下双击元素时，画布自动缩放并居中显示该元素
- 使用 `motion` 库的 `animate` 函数实现平滑过渡动画
- 动画时长 0.5s，使用 ease-out 缓动函数
- 支持动画中断：用户交互时自动停止当前动画

**4. 添加可视区域检测功能**
- 定期检测（500ms 间隔）当前视口是否有元素
- 当视口无元素时，延迟 1s 后显示提示 UI
- 提供"定位到最近元素"按钮，自动计算距离视口中心最近的元素并导航

**5. 添加新元素自动居中功能**
- 通过 `autoFitNewItem` 属性控制（默认开启）
- 监听 items 数组变化，检测新添加的元素
- 自动调用 `fitToItem` 使新元素居中显示

**6. 添加受控模式支持**
- `scale` 和 `offset` 支持外部控制
- 新增 `onScaleChange` 和 `onOffsetChange` 回调
- 支持受控/非受控双模式：传入 props 时使用外部值，否则使用内部状态

**7. 创建拖放上传示例组件**
- 位置：`example/upload/Upload.example.tsx`
- 支持拖拽图片/视频文件到画布区域
- 自动识别文件类型（image/video）并创建对应 Item
- 支持外部传入各步骤回调：`onDragEnter`、`onDragOver`、`onDragLeave`、`onDrop`、`onValidateFile`、`onItemCreated`、`onError`

**8. 创建 Item 索引组件**
- 位置：`example/upload/Item.index.tsx`
- 根据 `type` 参数（image/video/text）渲染不同的组件
- 每种类型有独立的样式和交互

---

#### 🔧 优化

**1. 拦截 Ctrl+滚轮的浏览器默认缩放行为**
- **问题**：Ctrl+滚轮会触发浏览器的页面缩放功能
- **原因**：React 的合成事件 `onWheel` 是 passive 的，无法调用 `e.preventDefault()`
- **解决**：使用原生 `addEventListener` 并设置 `{ passive: false }`，在事件处理函数中调用 `e.preventDefault()` 拦截默认行为

**2. 优化新 item 添加逻辑**
- **问题**：新添加的 item 位置固定，可能与已有 item 重叠
- **解决**：修改 `addItem` 函数，当未指定 x/y 坐标时，自动计算位置将新 item 放置在最后一个 item 的下方（y = lastItem.y + lastItem.height + gap）

**3. 将组件拆分到独立目录**
- **问题**：单文件代码过长，不便维护
- **解决**：拆分为 `types/canvas-type.ts`（类型定义）、`hooks/canvas-hook.ts`（useCanvasItems Hook）、`components/Canvas.tsx`（主组件）

---

#### 🐛 修复

**1. 修复渲染期间更新父组件状态导致的 React 警告**
- **问题**：拖动画布时控制台报错 `Cannot update a component while rendering a different component`
- **原因**：在 `setViewState` 函数内部直接调用父组件的回调（如 `onScaleChange`），导致在 Canvas 渲染期间更新父组件状态
- **解决**：使用 `queueMicrotask` 延迟触发回调，确保回调在当前渲染周期结束后执行
```tsx
queueMicrotask(() => {
    onScaleChange?.(resolvedState.scale);
    onOffsetChange?.(resolvedState.offset);
    onViewChange?.(resolvedState);
});
```

**2. 修复受控模式下拖动画布功能失效**
- **问题**：当使用受控模式（传入 `scale`/`offset` props）时，拖动画布无响应
- **原因**：受控模式下 `viewState` 来自外部 props，但内部只更新了 `internalViewState`，导致视图不变化，`useEffect` 也不触发回调
- **解决**：
  1. 创建 `setViewStateRef` 存储最新的更新函数
  2. 在 `useEffect` 回调中使用 `setViewStateRef.current()` 确保调用正确的更新函数
  3. 更新函数同时触发内部状态更新和外部回调

**3. 修复缩放后元素模糊问题**
- **问题**：双击放大元素后，元素显示模糊；有时模糊有时不模糊
- **原因**：
  1. CSS `transform: scale()` 会将元素栅格化为位图纹理
  2. `will-change: transform` 导致浏览器预先缓存低分辨率纹理
  3. 缩放时浏览器使用缓存纹理而不是重新渲染
- **解决**：
  1. 添加 `forceRepaintKey` 状态，动画完成后递增触发重绘
  2. 在 transform 中添加 `translateZ(${forceRepaintKey * 0.001}px)`，微小的 Z 轴变化强制浏览器重新栅格化
  3. CSS 添加 `transform-style: preserve-3d` 和 `backface-visibility: hidden` 确保 3D 渲染正确
```tsx
// 动画完成后
requestAnimationFrame(() => {
    setForceRepaintKey(prev => prev + 1);
});

// 渲染时
<div style={{
    transform: `translate(...) scale(...) translateZ(${forceRepaintKey * 0.001}px)`,
}}>
```
