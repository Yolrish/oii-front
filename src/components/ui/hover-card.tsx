/**
 * HoverCard 组件 - 增强型悬浮卡片组件
 * 
 * 基于 Radix UI HoverCard 和 Motion/React 构建的悬浮卡片组件，
 * 提供了平滑的动画效果和交互式锁定功能。
 * 
 * 主要特性：
 * - 支持鼠标悬停时显示卡片内容
 * - 点击触发器可锁定/解锁卡片状态
 * - 支持自定义动画效果和过渡配置
 * - 提供键盘快捷键支持（ESC 关闭）
 * - 点击外部区域自动关闭并解锁
 * 
 * @example
 * <HoverCard>
 *   <HoverCardTrigger>Hover me</HoverCardTrigger>
 *   <HoverCardContent>Card content</HoverCardContent>
 * </HoverCard>
 */

'use client';

import * as React from 'react';
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"
import {
    AnimatePresence,
    motion,
    type HTMLMotionProps,
    type Transition,
} from 'motion/react';

import { cn } from '@/lib/utils';

/**
 * HoverCard 上下文类型定义
 * 
 * @property {boolean} isOpen - 卡片是否处于打开状态
 * @property {Function} setIsOpen - 设置卡片打开/关闭状态（受锁定保护）
 * @property {boolean} isLocked - 卡片是否被锁定（锁定时不会因鼠标移出而关闭）
 * @property {Function} setIsLocked - 设置卡片锁定状态
 * @property {Function} setIsOpenImmediate - 立即设置卡片状态（不受锁定保护）
 */
type HoverCardContextType = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isLocked: boolean;
    setIsLocked: (locked: boolean) => void;
    setIsOpenImmediate: (open: boolean) => void;
};

/**
 * HoverCard 上下文
 * 用于在组件树中共享悬浮卡片的状态和控制方法
 */
const HoverCardContext = React.createContext<HoverCardContextType | undefined>(
    undefined,
);

/**
 * useHoverCard Hook
 * 
 * 用于在 HoverCard 子组件中获取悬浮卡片的上下文
 * 必须在 HoverCard 组件内部使用，否则会抛出错误
 * 
 * @returns {HoverCardContextType} 悬浮卡片的上下文对象
 * @throws {Error} 当在 HoverCard 外部使用时抛出错误
 */
const useHoverCard = (): HoverCardContextType => {
    const context = React.useContext(HoverCardContext);
    if (!context) {
        throw new Error('useHoverCard must be used within a HoverCard');
    }
    return context;
};

/**
 * 卡片显示位置类型
 * 定义卡片相对于触发器的显示方位
 */
type Side = 'top' | 'bottom' | 'left' | 'right';

/**
 * 根据卡片显示位置获取初始动画偏移量
 * 
 * 用于实现卡片从指定方向滑入的动画效果
 * 
 * @param {Side} side - 卡片显示的位置
 * @returns {Object} 包含 x 或 y 偏移量的对象
 * 
 * @example
 * getInitialPosition('top') // { y: 15 } - 从上方向下滑入
 * getInitialPosition('left') // { x: 15 } - 从左侧向右滑入
 */
const getInitialPosition = (side: Side) => {
    switch (side) {
        case 'top':
            return { y: 15 };
        case 'bottom':
            return { y: -15 };
        case 'left':
            return { x: 15 };
        case 'right':
            return { x: -15 };
    }
};

/**
 * HoverCard 组件属性类型
 * 继承自 Radix UI HoverCard Root 组件的所有属性
 */
type HoverCardProps = React.ComponentProps<typeof HoverCardPrimitive.Root>;

/**
 * HoverCard 根组件
 * 
 * 提供悬浮卡片的核心功能，包括状态管理、锁定机制和键盘交互。
 * 
 * 功能说明：
 * 1. 状态管理：管理卡片的打开/关闭状态和锁定状态
 * 2. 锁定机制：点击触发器后可锁定卡片，防止鼠标移出时自动关闭
 * 3. 键盘支持：按 ESC 键可解除锁定并关闭卡片
 * 4. 外部点击：点击卡片外部区域会自动解锁并关闭
 * 
 * @param {HoverCardProps} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件（通常包含 Trigger 和 Content）
 * @param {boolean} [props.open] - 受控模式下的打开状态
 * @param {boolean} [props.defaultOpen] - 非受控模式下的初始打开状态
 * @param {Function} [props.onOpenChange] - 打开状态改变时的回调函数
 * 
 * @example
 * // 非受控模式
 * <HoverCard defaultOpen={false}>
 *   <HoverCardTrigger>触发器</HoverCardTrigger>
 *   <HoverCardContent>内容</HoverCardContent>
 * </HoverCard>
 * 
 * @example
 * // 受控模式
 * const [open, setOpen] = useState(false);
 * <HoverCard open={open} onOpenChange={setOpen}>
 *   <HoverCardTrigger>触发器</HoverCardTrigger>
 *   <HoverCardContent>内容</HoverCardContent>
 * </HoverCard>
 */
function HoverCard({ children, ...props }: HoverCardProps) {
    // 初始化打开状态：优先使用 open（受控），其次 defaultOpen，最后默认为 false
    const [isOpen, setIsOpenState] = React.useState(
        props?.open ?? props?.defaultOpen ?? false,
    );
    
    // 锁定状态：true 时卡片不会因鼠标移出而关闭
    const [isLocked, setIsLocked] = React.useState(false);

    // 同步受控模式下的 open 属性
    React.useEffect(() => {
        if (props?.open !== undefined) setIsOpenState(props.open);
    }, [props?.open]);

    /**
     * 处理打开状态变化
     * 
     * 带有锁定保护的状态更新函数：
     * - 当卡片被锁定时，阻止关闭操作（由鼠标移出触发）
     * - 允许所有打开操作和解锁后的关闭操作
     */
    const handleOpenChange = React.useCallback(
        (open: boolean) => {
            // 当已锁定时，阻止外部导致的关闭（例如鼠标移出）
            if (!open && isLocked) return;
            setIsOpenState(open);
            props.onOpenChange?.(open);
        },
        [props, isLocked],
    );

    /**
     * 立即设置打开状态
     * 
     * 不受锁定保护逻辑影响的状态更新函数
     * 用于强制更新状态，如点击外部区域时强制关闭
     */
    const setIsOpenImmediate = React.useCallback((open: boolean) => {
        setIsOpenState(open);
        props.onOpenChange?.(open);
    }, [props]);

    /**
     * 键盘事件监听
     * 
     * 监听 ESC 键按下事件：
     * - 当卡片处于锁定状态时，按 ESC 键会解除锁定并关闭卡片
     * - 清理函数会在组件卸载时移除事件监听器
     */
    React.useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isLocked) {
                setIsLocked(false);
                setIsOpenState(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isLocked]);

    return (
        <HoverCardContext.Provider
            value={{
                isOpen,
                setIsOpen: handleOpenChange,
                isLocked,
                setIsLocked,
                setIsOpenImmediate
            }}>
            <HoverCardPrimitive.Root
                data-slot="hover-card"
                {...props}
                onOpenChange={handleOpenChange}
            >
                {children}
            </HoverCardPrimitive.Root>
        </HoverCardContext.Provider>
    );
}

/**
 * HoverCardTrigger 组件属性类型
 * 继承自 Radix UI HoverCard Trigger 组件的所有属性
 */
type HoverCardTriggerProps = React.ComponentProps<
    typeof HoverCardPrimitive.Trigger
>;

/**
 * HoverCardTrigger 触发器组件
 * 
 * 用于触发悬浮卡片显示的元素，支持两种交互方式：
 * 1. 鼠标悬停：显示卡片，移出后自动隐藏
 * 2. 点击交互：锁定/解锁卡片状态
 * 
 * 点击行为说明：
 * - 首次点击：锁定卡片（如果未打开则先打开），此时移出鼠标卡片不会关闭
 * - 再次点击：解锁并关闭卡片
 * 
 * @param {HoverCardTriggerProps} props - 组件属性
 * @param {Function} [props.onClick] - 原始点击事件处理函数（会在锁定逻辑之前调用）
 * 
 * @example
 * <HoverCardTrigger>
 *   <button>Hover or click me</button>
 * </HoverCardTrigger>
 */
function HoverCardTrigger({ onClick, ...props }: HoverCardTriggerProps) {
    const { isOpen, setIsOpen, isLocked, setIsLocked } = useHoverCard();
    
    /**
     * 处理触发器点击事件
     * 
     * 实现卡片的锁定/解锁切换逻辑：
     * - 已锁定状态：解锁并关闭卡片
     * - 未锁定状态：锁定卡片，如果未打开则同时打开
     */
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        // 先执行用户传入的点击事件处理函数
        onClick?.(e as any);
        
        if (isLocked) {
            // 解锁并关闭
            setIsLocked(false);
            setIsOpen(false);
        } else {
            // 锁定并打开
            setIsLocked(true);
            if (!isOpen) {
                setIsOpen(true);
            }
        }
    };
    
    return (
        <HoverCardPrimitive.Trigger
            data-slot="hover-card-trigger"
            onClick={handleClick as any}
            {...props}
        />
    );
}

/**
 * HoverCardContent 组件属性类型
 * 
 * 组合了以下类型：
 * - Radix UI HoverCard Content 的所有属性
 * - Motion/React HTMLMotionProps 的动画属性
 * - 自定义 transition 过渡配置
 */
type HoverCardContentProps = React.ComponentProps<
    typeof HoverCardPrimitive.Content
> &
    HTMLMotionProps<'div'> & {
        /** 自定义动画过渡配置 */
        transition?: Transition;
    };

/**
 * HoverCardContent 内容组件
 * 
 * 显示悬浮卡片的内容区域，具有以下特性：
 * 1. 平滑的进入/退出动画效果（缩放 + 位移 + 透明度）
 * 2. 自动根据显示位置调整动画方向
 * 3. 支持点击外部区域关闭并解锁
 * 4. 使用 Portal 渲染，避免层级和样式问题
 * 
 * 动画效果：
 * - 进入：从指定方向缩放淡入（scale: 0.5 -> 1, opacity: 0 -> 1）
 * - 退出：向指定方向缩放淡出（scale: 1 -> 0.5, opacity: 1 -> 0）
 * - 默认使用弹簧动画效果
 * 
 * @param {HoverCardContentProps} props - 组件属性
 * @param {string} [props.className] - 自定义 CSS 类名
 * @param {'start' | 'center' | 'end'} [props.align='center'] - 相对于触发器的对齐方式
 * @param {'top' | 'bottom' | 'left' | 'right'} [props.side='bottom'] - 相对于触发器的显示位置
 * @param {number} [props.sideOffset=4] - 与触发器的距离（像素）
 * @param {Transition} [props.transition] - 自定义动画过渡配置
 * @param {Function} [props.onPointerDownOutside] - 点击外部区域的回调函数
 * @param {React.ReactNode} props.children - 卡片内容
 * 
 * @example
 * <HoverCardContent 
 *   side="top" 
 *   align="start"
 *   transition={{ type: 'tween', duration: 0.2 }}
 * >
 *   <div>Card content here</div>
 * </HoverCardContent>
 */
function HoverCardContent({
    className,
    align = 'center',
    side = 'bottom',
    sideOffset = 4,
    transition = { type: 'spring', stiffness: 300, damping: 25 },
    children,
    onPointerDownOutside,
    ...props
}: HoverCardContentProps) {
    const { isOpen, isLocked, setIsLocked, setIsOpenImmediate } = useHoverCard();
    
    // 根据显示位置获取初始动画偏移量
    const initialPosition = getInitialPosition(side);

    return (
        <AnimatePresence>
            {isOpen && (
                <HoverCardPrimitive.Portal forceMount data-slot="hover-card-portal">
                    <HoverCardPrimitive.Content
                        forceMount
                        align={align}
                        sideOffset={sideOffset}
                        className="z-50"
                        onPointerDownOutside={(e) => {
                            // 先执行用户传入的回调函数
                            onPointerDownOutside?.(e as any);
                            
                            // 如果卡片处于锁定状态，点击外部时强制解锁并关闭
                            if (isLocked) {
                                setIsLocked(false);
                                setIsOpenImmediate(false);
                            }
                        }}
                        {...props}
                    >
                        <motion.div
                            key="hover-card-content"
                            data-slot="hover-card-content"
                            // 初始状态：半透明 + 缩小 + 位移
                            initial={{ opacity: 0, scale: 0.5, ...initialPosition }}
                            // 动画状态：完全显示 + 原始大小 + 无位移
                            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                            // 退出状态：半透明 + 缩小 + 位移
                            exit={{ opacity: 0, scale: 0.5, ...initialPosition }}
                            transition={transition}
                            className={cn(
                                'w-64 border bg-popover p-4 text-popover-foreground shadow-md outline-none',
                                'rounded-[24px]', // 圆角半径 24px
                                className,
                            )}
                            {...props}
                        >
                            {children}
                        </motion.div>
                    </HoverCardPrimitive.Content>
                </HoverCardPrimitive.Portal>
            )}
        </AnimatePresence>
    );
}

/**
 * 导出模块
 * 
 * 提供以下组件和类型：
 * - HoverCard: 根组件，提供上下文和状态管理
 * - HoverCardTrigger: 触发器组件，用于触发卡片显示
 * - HoverCardContent: 内容组件，显示卡片内容
 * - useHoverCard: Hook，用于访问悬浮卡片的上下文
 * - 相关的 TypeScript 类型定义
 */
export {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
    useHoverCard,
    type HoverCardContextType,
    type HoverCardProps,
    type HoverCardTriggerProps,
    type HoverCardContentProps,
};