import { SidebarTabEnum } from "../type/sidebar-tab-enum";
import { SidebarTabType } from "../type/sidebar-tab-type";
import { Home, Compass } from "lucide-react";
import HomeIcon from "@/components/common/icon/sidebar/home/HomeIcon";

export const sidebarNavTab: SidebarTabType[] = [
    {
        key: SidebarTabEnum.Home,
        label: "Home",
        icon: <HomeIcon mode="line" />,
        selectedIcon: <HomeIcon mode="fill" />,
    }
]


export const sidebarNavTab_mobile: SidebarTabType[] = [
    {
        key: SidebarTabEnum.Home,
        label: "For You",
        icon: <Home />,
        selectedIcon: <Home />,
    },
] 