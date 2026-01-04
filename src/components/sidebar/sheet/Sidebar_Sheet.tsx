'use client'
import BaseSidebar from "../base/Sidebar"
import SheetSection from "@/components/common/sheet-section/SheetSection"
import { SidebarTabEnum } from "../type/sidebar-tab-enum"
import styles from "./Sidebar_Sheet.module.css"
import { MenuSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useCallback, useState, useEffect } from "react"

interface Sidebar_SheetProps {
    activeTab: string
    setActiveTab: (activeTab: string) => void;
}

export default function Sidebar_Sheet({
    activeTab,
    setActiveTab,
}: Sidebar_SheetProps) {

    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleNavTabClick = useCallback((tab: string) => {
        switch (tab) {
            case SidebarTabEnum.Home:
                router.push("/");
                setActiveTab(SidebarTabEnum.Home)
                break;
            default:
                if (tab) {
                    router.push(`/community/${tab}`);
                    setActiveTab(tab);
                } else {
                    setActiveTab(SidebarTabEnum.None);
                }
                setActiveTab(SidebarTabEnum.None)
                break;
        }
    }, [setActiveTab, router]);

    useEffect(() => {
        // Adds a keyboard shortcut to toggle the sidebar.
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.key === 'b' &&
                (event.metaKey || event.ctrlKey)
            ) {
                event.preventDefault();
                setIsOpen(!isOpen);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    return (
        <SheetSection
            title=""
            trigger={<button className={cn(
                styles.sidebar_sheet_trigger,
            )}>
                <MenuSquare className="size-6" />
            </button>}
            side="left"
            contentClassName={styles.sheet_content}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
        >
            <BaseSidebar
                activeTab={activeTab}
                onTabClick={handleNavTabClick}
                className={styles.sidebar_sheet_sidebar}
                collapsible="none"
            />
        </SheetSection>
    )
}