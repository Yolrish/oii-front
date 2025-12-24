'use client'

import React from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./MobileBar.module.css";
import { sidebarNavTab_mobile } from "../tab-config/sidebar-nav-tab";

type MobileBarProps = {
    className?: string;
    activeTab: string;
    onTabClick: (navKey: string) => void;
};

function MobileBar({ className, activeTab, onTabClick }: MobileBarProps) {
    return (
        <div
            className={cn(
                styles.wrapper,
                className,
            )}
            role='navigation'
            aria-label='Mobile navigation bar'
        >
            <div
                className={cn(
                    styles.bar,
                    'w-full',
                    'flex flex-row items-stretch justify-evenly'
                )}
            >
                {sidebarNavTab_mobile.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            className={cn(
                                styles.item,
                            )}
                            onClick={() => onTabClick(tab.key)}
                            aria-label={tab.label}
                            aria-current={isActive ? 'page' : undefined}
                        >

                            <motion.div
                                className={cn(
                                    styles.icon,
                                )}
                                initial={false}
                                animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.05 : 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {isActive ? tab.selectedIcon : tab.icon}
                            </motion.div>


                            <motion.span
                                key="label"
                                className={cn(
                                    styles.label,
                                )}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {tab.label}
                            </motion.span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default MobileBar;


