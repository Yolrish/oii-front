import BaseSidebar from "../base/Sidebar"
import SheetSection from "@/components/common/sheet-section/SheetSection"
import { SidebarTabEnum } from "../type/sidebar-tab-enum"
import styles from "./Sidebar_Sheet.module.css"
import { MenuSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

interface Sidebar_SheetProps {
    activeTab: string
    setActiveTab: (activeTab: string) => void;
}

export default function Sidebar_Sheet({
    activeTab,
    setActiveTab,
}: Sidebar_SheetProps) {

    const router = useRouter();

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