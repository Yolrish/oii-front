'use client'
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { SidebarTabEnum } from "@/components/sidebar/type/sidebar-tab-enum";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import BaseSidebar from "./base/Sidebar";
import styles from "./AppSidebar.module.css";
import MobileBar from "./mobile/MobileBar";

/**
 * AppSidebar组件的Props
 * @param activeTab 当前激活的Tab
 * @param setActiveTab 设置当前激活的Tab
 * @param children 子组件
 * @param enableMobileBar 是否显示移动端侧边栏
 * @param outsideSidebarProvider 是否在外部包裹SidebarProvider，默认不包裹， 如果在外部包裹，则需要在外部设置包裹的SidebarProvider，并设置outsideSidebarProvider为true
 * @returns
 */
type SidebarProps = {
    activeTab: string
    setActiveTab: (activeTab: string) => void;
    children: React.ReactNode;
    enableMobileBar?: boolean;
    outsideSidebarProvider?: boolean;
}

function AppSidebar({
    activeTab,
    setActiveTab,
    children,
    enableMobileBar = true,
    outsideSidebarProvider = false,
}: SidebarProps) {

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

    const renderContent = () => {
        return (
            <>
                <BaseSidebar
                    className={styles.desktop}
                    activeTab={activeTab}
                    onTabClick={handleNavTabClick}
                />
                <div
                    className={cn(
                        styles.content,
                    )}
                    id={'app-sidebar-content'}
                >
                    {children}
                </div>
                {
                    enableMobileBar && <MobileBar
                        className={styles.mobile}
                        activeTab={activeTab}
                        onTabClick={handleNavTabClick}
                    />
                }
            </>
        )
    }

    if (outsideSidebarProvider) {
        return (
            <div
                className={cn(
                    'app-sidebar-container',
                    'w-full h-full min-h-full max-h-full',
                    'flex flex-nowrap',
                    styles.container_display,
                    'relative',
                    'overflow-hidden',
                )}
            >
                {renderContent()}
            </div>
        )
    }

    return (
        <SidebarProvider
            className={cn(
                'sidebar-provider',
                'w-full h-full min-h-full max-h-full',
                'flex flex-nowrap',
                styles.container_display,
                'relative',
                'overflow-hidden',
            )}
        // style={{
        //     background: 'var(--color-bg-4, #FAFBFC)',
        // }}
        >
            {renderContent()}
            {/* <div className={styles.background_left_top}></div>
            <div className={styles.background_right_center}></div> */}
        </SidebarProvider>
    )
}

export default AppSidebar;