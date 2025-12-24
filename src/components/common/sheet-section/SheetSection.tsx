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
}

function SheetSection({
    title = "侧边栏",
    trigger = <button className={styles.timeline_sheet_section_triggerButton}>打开侧边栏</button>,
    children,
    side = "right",
    contentClassName
}: SheetSectionProps) {
    return (
        <Sheet>
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