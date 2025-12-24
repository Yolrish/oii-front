import { SidebarTabEnum } from "@/components/sidebar/type/sidebar-tab-enum";

export interface SidebarTabType {
    key: string;
    label: string;
    icon: React.ReactNode;
    selectedIcon: React.ReactNode;

}