'use client'
import { cn } from "@/lib/utils"
import { formatNumber } from "@/utils/global/format-num"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { likeAPI } from "./LikeAPI"
import styles from "./LikeButton.module.css"
import HeartIcon from "@/components/common/icon/interact/HeartIcon"
import { useAuthStore } from "@/components/auth"

interface LikeButtonProps {
    target_id: string;
    is_liked: boolean;
    show_count?: boolean;
    like_count?: number;
    className?: string;
    onLikeChange?: (isLiked: boolean) => void; // 可选的回调函数，通知父组件点赞状态变化
}

export default function LikeButton({
    target_id,
    is_liked = false,
    like_count = 0,
    show_count = false,
    className,
    onLikeChange,
}: LikeButtonProps) {
    // 本地状态管理
    const [localLiked, setLocalLiked] = useState(is_liked);
    const [localCount, setLocalCount] = useState(like_count);
    const [isLoading, setIsLoading] = useState(false);

    // 获取用户信息
    const {
        isLoggedIn
    } = useAuthStore();

    // 当props变化时更新本地状态
    useEffect(() => {
        setLocalLiked(is_liked);
    }, [is_liked]);

    // 点赞/取消点赞功能
    const toggleLike = async (currentLikeState: boolean) => {
        if (isLoading) return; // 未登录或正在加载则不执行操作

        setIsLoading(true);

        try {
            // 先乐观更新UI
            const newLikeState = !currentLikeState;
            setLocalLiked(newLikeState);
            setLocalCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));

            // 通知父组件（如果提供了回调）
            if (onLikeChange) {
                onLikeChange(newLikeState);
            }

            // 发送API请求
            const response = await likeAPI({
                post_id: target_id,
                like_status: newLikeState ? 1 : 0,
            });

            // 如果请求失败，回滚UI状态
            if (response.code !== 200) {
                setLocalLiked(currentLikeState);
                setLocalCount(prev => currentLikeState ? prev + 1 : Math.max(0, prev - 1));

                // 通知父组件回滚
                if (onLikeChange) {
                    onLikeChange(currentLikeState);
                }

                if (response.code === 403) {
                    console.error('点赞操作失败:', response);
                    toast.error("Like operation failed, please login first");
                } else {
                    console.error('点赞操作失败:', response);
                    toast.error("Like operation failed");
                }
            }
        } catch (err) {
            // 发生错误时回滚UI状态
            setLocalLiked(currentLikeState);
            setLocalCount(prev => currentLikeState ? prev + 1 : Math.max(0, prev - 1));

            // 通知父组件回滚
            if (onLikeChange) {
                onLikeChange(currentLikeState);
            }

            console.error('点赞操作失败:', err);
            toast.error("Like operation failed, please try again later");
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

        // 调用toggleLike函数切换点赞状态
        toggleLike(localLiked);
    };

    return (
        <button
            className={
                cn(
                    styles.likeButton,
                    localLiked && styles.liked,
                    isLoading && styles.loading,
                    className
                )
            }
            onClick={handleClick}
            disabled={isLoading}
        >
            <HeartIcon
                className={cn(
                    styles.icon,
                    isLoading && styles.loading
                )}
                mode={localLiked ? 'fill' : 'line'}
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