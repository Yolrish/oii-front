'use client'

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { sidebarNavTab } from "../../tab-config/sidebar-nav-tab";
import styles from "./NavGroup.module.css";

type NavGroupProps = {
    activeTab: string;
    onTabClick: (navKey: string) => void;
}

/**
 * 页面导航组件
 */
function NavGroup({ activeTab, onTabClick }: NavGroupProps) {

    const { state } = useSidebar();

    return (
        <SidebarGroup
            className={cn(
                'p-0',
            )}
        >
            <SidebarGroupContent
                className={styles.content}
            >
                <SidebarMenu
                    className="gap-2"
                >
                    {sidebarNavTab.map((tab) => (
                        <SidebarMenuItem
                            className={cn(styles.item)}
                            key={tab.key}
                        >
                            <SidebarMenuButton
                                className={cn(
                                    styles.button,
                                    activeTab === tab.key
                                    && styles.button_active,
                                )}
                                tooltip={{
                                    children: tab.label,
                                    side: 'right',
                                    align: 'center'
                                }}
                                onClick={() => onTabClick(tab.key)}
                            >
                                {activeTab === tab.key
                                    ? tab.selectedIcon
                                    : tab.icon}
                                <span
                                    className={cn(
                                        styles.button_label,
                                        activeTab === tab.key
                                        && styles.button_label_active,
                                        state==='collapsed' && styles.hide,
                                    )}
                                >{tab.label}</span>

                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}

export default NavGroup;
