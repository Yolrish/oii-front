import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import styles from './InfiniteCarousel.module.css';
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * 这是一个无限轮播组件，每次显示一个元素
 * 与无限滚动组件的区别：
 * 1. 无限滚动组件是每次在宽度/高度范围内显示多个元素，而无限轮播组件是每次固定显示一个元素
 * 2. 无限滚动组件设置了垂直和水平两个滚动状态，而无限轮播组件目前只设置了水平滚动状态
 */


/**
 * 将数字限制在指定范围内，超出范围时进行环绕
 */
const wrap = (min: number, max: number, value: number): number => {
    const range = max - min;
    return ((((value - min) % range) + range) % range) + min;
};

interface InfiniteCarouselProps {
    /**
     * 轮播内容，可以是单个元素或元素数组
     */
    children: React.ReactNode | React.ReactNode[];
    /**
     * 自动播放间隔时间（毫秒），设置为0则不自动播放
     * @default 0
     */
    autoPlayInterval?: number;
    /**
     * 是否显示导航按钮
     * @default true
     */
    showNavigation?: boolean;
    /**
     * 自定义类名
     */
    className?: string;
    /**
     * 自定义幻灯片类名
     */
    slideClassName?: string;
    /**
     * 轮播容器高度
     */
    height?: string;
    /**
     * 只在悬浮时显示箭头
     */
    onlyShowNavArrowInHover?: boolean;
    /**
     * 显示悬浮点
     */
    showNavDot?: boolean;
}

const SWIPE_CONFIDENCE_THRESHOLD = 10000;

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
    })
};

/**
 * 无限轮播组件
 * 支持触摸滑动、自动播放、自定义导航按钮等功能
 * 
 * @example
 * ```tsx
 * // 单个元素
 * <InfiniteCarousel>
 *   <div className="slide">Single Slide</div>
 * </InfiniteCarousel>
 * 
 * // 多个元素
 * <InfiniteCarousel autoPlayInterval={3000}>
 *   <div className="slide">Slide 1</div>
 *   <div className="slide">Slide 2</div>
 * </InfiniteCarousel>
 * ```
 */
export const InfiniteCarousel: React.FC<InfiniteCarouselProps> = ({
    children,
    autoPlayInterval = 0,
    showNavigation = true,
    className = '',
    slideClassName = '',
    height,
    onlyShowNavArrowInHover = false,
    showNavDot = false
}) => {
    // 将children转换为数组形式
    const slides = React.Children.toArray(children);
    const [[page, direction], setPage] = useState([0, 0]);
    const contentIndex = wrap(0, slides.length, page);

    // 自动播放
    React.useEffect(() => {
        if (!autoPlayInterval || slides.length <= 1) return;

        const timer = setInterval(() => {
            paginate(1);
        }, autoPlayInterval);

        return () => clearInterval(timer);
    }, [autoPlayInterval, page, slides.length]);

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    // 如果只有一个子元素，直接渲染它
    if (slides.length <= 1) {
        return (
            <div
                className={`${styles.carousel} ${className}`}
                style={height ? { height } : {}}
            >
                {slides[0]}
            </div>
        );
    }

    return (
        <div
            className={cn(
                styles.carousel,
                className,
                onlyShowNavArrowInHover ? styles.carouselHover : ''
            )}
            style={height ? { height } : {}}
        >
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={page}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    className={cn(styles.slide, slideClassName)}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = swipePower(offset.x, velocity.x);

                        if (swipe < -SWIPE_CONFIDENCE_THRESHOLD) {
                            paginate(1);
                        } else if (swipe > SWIPE_CONFIDENCE_THRESHOLD) {
                            paginate(-1);
                        }
                    }}
                >
                    {slides[contentIndex]}
                </motion.div>
                <div className={styles.slide_hidden}>
                    {slides[contentIndex]}
                </div>
            </AnimatePresence>

            {showNavigation && slides.length > 1 && (
                <>
                    <button
                        className={cn(styles.button, styles.buttonPrev,)}
                        onClick={() => paginate(-1)}
                    >
                        <ChevronLeft />
                    </button>
                    <button
                        className={cn(styles.button, styles.buttonNext)}
                        onClick={() => paginate(1)}
                    >
                        <ChevronRight />
                    </button>
                </>
            )}

            {showNavDot && slides.length > 1 && (
                <div className={styles.dotContainer}>
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={cn(
                                styles.dot,
                                contentIndex === index && styles.dotActive
                            )}
                            onClick={() => setPage([index, index > page ? 1 : -1])}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default InfiniteCarousel;
