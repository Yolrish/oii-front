'use client'
import { cn } from "@/lib/utils"
import { formatNumber } from "@/utils/global/format-num"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { favorAPI } from "./FavorAPI"
import styles from "./FavorButton.module.css"
import FavorIcon from "@/components/common/icon/interact/FavorIcon"
import { useAuthStore } from "@/components/auth"

interface FavorButtonProps {
    target_id: string;
    is_favored: boolean;
    show_count?: boolean;
    favor_count?: number;
    className?: string;
    onFavorChange?: (isFavored: boolean) => void; // 可选的回调函数，通知父组件收藏状态变化
}

export default function FavorButton({
    target_id,
    is_favored = false,
    favor_count = 0,
    show_count = false,
    className,
    onFavorChange,
}: FavorButtonProps) {
    // 本地状态管理
    const [localFavored, setLocalFavored] = useState(is_favored);
    const [localCount, setLocalCount] = useState(favor_count);
    const [isLoading, setIsLoading] = useState(false);

    // 获取用户信息
    const {
        isLoggedIn
    } = useAuthStore();

    // 当props变化时更新本地状态
    useEffect(() => {
        setLocalFavored(is_favored);
    }, [is_favored]);

    // 收藏/取消收藏功能
    const toggleFavor = async (currentFavorState: boolean) => {
        if (isLoading) return; // 正在加载则不执行操作

        setIsLoading(true);

        try {
            // 先乐观更新UI
            const newFavorState = !currentFavorState;
            setLocalFavored(newFavorState);
            setLocalCount(prev => newFavorState ? prev + 1 : Math.max(0, prev - 1));

            // 通知父组件（如果提供了回调）
            if (onFavorChange) {
                onFavorChange(newFavorState);
            }

            // 发送API请求
            const response = await favorAPI({
                post_id: target_id,
                favorite_status: newFavorState ? 1 : 0,
            });

            // 如果请求失败，回滚UI状态
            if (response.code !== 200) {
                setLocalFavored(currentFavorState);
                setLocalCount(prev => currentFavorState ? prev + 1 : Math.max(0, prev - 1));

                // 通知父组件回滚
                if (onFavorChange) {
                    onFavorChange(currentFavorState);
                }

                if (response.code === 403) {
                    console.error('收藏操作失败:', response);
                    toast.error("Favor operation failed, please login first");
                } else {
                    console.error('收藏操作失败:', response);
                    toast.error("Favor operation failed");
                }
            }
        } catch (err) {
            // 发生错误时回滚UI状态
            setLocalFavored(currentFavorState);
            setLocalCount(prev => currentFavorState ? prev + 1 : Math.max(0, prev - 1));

            // 通知父组件回滚
            if (onFavorChange) {
                onFavorChange(currentFavorState);
            }

            console.error('收藏操作失败:', err);
            toast.error("Favor operation failed, please try again later");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClick = () => {
        if (isLoading) return;

        if (!isLoggedIn) {
            toast.warning("Please login first");
            return;
        }

        // 调用toggleFavor函数切换收藏状态
        toggleFavor(localFavored);
    };

    return (
        <button
            className={
                cn(
                    styles.favorButton,
                    localFavored && styles.favored,
                    isLoading && styles.loading,
                    className
                )
            }
            onClick={handleClick}
            disabled={isLoading}
        >
            <FavorIcon
                className={cn(
                    styles.icon,
                    isLoading && styles.loading
                )}
                mode={localFavored ? 'fill' : 'line'}
            />
            {
                show_count && (
                    <span className={styles.count}>
                        {localCount > 0 ? formatNumber(localCount) : "0"}
                    </span>
                )
            }
        </button>
    )
}

