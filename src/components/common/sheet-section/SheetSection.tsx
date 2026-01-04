import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from '@/components/ui/sheet';
import styles from './SheetSection.module.css';
import { cn } from '@/lib/utils';

interface SheetSectionProps {
    title?: string;
    trigger?: React.ReactNode;
    children?: React.ReactNode;
    side?: "left" | "right" | "top" | "bottom";
    contentClassName?: string;
    isOpen?: boolean;
    setIsOpen?: (isOpen: boolean) => void;
}

/**
 * SheetSection组件的Props
 * @param title 标题
 * @param trigger 触发器 - 传入自定义样式的组件作为触发器
 * @param children 子组件 - 传入自定义样式的组件作为Sheet Content的内容
 * @param side 方向 - 默认右
 * @param contentClassName 内容类名 - 传入自定义样式的类名作为Sheet Content的类名
 * @param isOpen 是否打开 - 外部控制变量 - 默认不添加
 * @param setIsOpen 设置是否打开 - 外部控制变量 - 默认不添加
 * @returns SheetSection组件
 */
function SheetSection({
    title = "侧边栏",
    trigger = <button className={styles.timeline_sheet_section_triggerButton}>打开侧边栏</button>,
    children,
    side = "right",
    contentClassName,
    isOpen,
    setIsOpen,
}: SheetSectionProps) {
    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                {trigger}
            </SheetTrigger>
            <SheetContent
                side={side}
                className={cn(
                    styles.sheet_section_sheetContent,
                    contentClassName,
                    side === 'bottom' && styles.sheet_bottom
                )}
                sheetOverlayClassName={'bg-black/60'}
            >
                <SheetHeader>
                    <SheetTitle className={styles.sheet_section_sheetTitle}>{title}</SheetTitle>
                </SheetHeader>
                <div className={styles.sheet_section_sheetBody}>
                    {
                        children ? (
                            <div className={styles.sheet_section_sheetBody_content}>
                                {children}
                            </div>
                        ) : (
                            <div className={styles.sheet_section_sheetBody_content}>
                                No content
                            </div>
                        )
                    }
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default SheetSection;