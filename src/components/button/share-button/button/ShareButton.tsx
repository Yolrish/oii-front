'use client'
import { cn } from "@/lib/utils"
import { toast } from "sonner";
import ShareDialog from "../dialog/ShareDialog";
import styles from "./ShareButton.module.css";
import { useState } from "react";
import ShareIcon from "@/components/common/icon/interact/ShareIcon";

interface ShareButtonProps {
    share_id?: string;
    share_title?: string;
    share_content?: string;
    share_image?: string;
    share_link?: string;
    callback?: (e: React.MouseEvent) => void;
    show_count?: boolean;
    share_count?: number;
    className?: string;
    iconColor?: string;
    afterShare?: () => void;
}

export default function ShareButton({
    share_id,
    share_title,
    share_content,
    share_image,
    share_link,
    callback,
    className,
    share_count,
    show_count = false,
    iconColor,
    afterShare,
}: ShareButtonProps) {

    const [dialog_open, setDialogOpen] = useState(false);
    const [shareId, setShareId] = useState(share_id);
    const [shareTitle, setShareTitle] = useState(share_title);
    const [shareContent, setShareContent] = useState(share_content);
    const [shareImage, setShareImage] = useState(share_image);
    const [shareLink, setShareLink] = useState(share_link);

    // 处理分享按钮点击事件
    const handleShareClick = (e: React.MouseEvent) => {

        if (callback) {
            callback(e);
            return;
        }

        if (!share_id) {
            toast.error("Please provide component information or specify a callback function");
            console.error("ShareButton组件缺少必要信息", {
                share_id,
                share_title,
                share_content,
                share_image,
            });
            return;
        }

        // 获取分享所需的信息
        const id = share_id;
        const title = share_title;
        const content = share_content;
        // 使用mediaUrls中的第一张图片作为分享图片（如果有）
        const image = share_image;
        // 使用postInfo中的shareLink或生成一个新的链接
        const link = share_link || `${window.location.origin}/detail/persona/${id}`;

        setShareId(id);
        setShareTitle(title);
        setShareContent(content);
        setShareImage(image);
        setShareLink(link);


        // 打开分享模态框
        setDialogOpen(true);

        if (afterShare) {
            afterShare();
        }
    };

    return (
        <>
            <button
                className={
                    cn(
                        styles.shareButton,
                        className
                    )
                }
                onClick={handleShareClick}
            >
                <ShareIcon />

                {show_count && (
                    <span className={styles.count}>
                        {share_count}
                    </span>
                )}
            </button >
            <ShareDialog
                dialog_open={dialog_open}
                onClose={() => setDialogOpen(false)}
                share_link={shareLink ?? ''}
                share_title={shareTitle ?? ''}
                share_content={shareContent ?? ''}
                share_image={shareImage ?? ''}
            />
        </>
    )
}