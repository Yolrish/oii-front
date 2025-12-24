'use client';

import React, { useState, memo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CopyIcon, Twitter, Facebook, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';
import MarkdownRenderer from '@/components/common/markdown/MarkdownRenderer';
import Image from '@/components/common/image/Image';
import { toast } from 'sonner';
import styles from './ShareDialog.module.css';

interface ShareModelProps {
    dialog_open: boolean;
    share_link: string;
    share_title: string;
    share_content: string;
    share_image: string;
    onClose: () => void;
}

export function ShareModel({
    dialog_open,
    share_link,
    share_title,
    share_content,
    share_image,
    onClose
}: ShareModelProps) {

    const [copied, setCopied] = useState(false);

    // 复制分享链接
    const handleCopyLink = async () => {
        if (share_link) {
            try {
                await navigator.clipboard.writeText(share_link);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (error) {
                console.error('Failed to copy link:', error);
                toast.error('Copy failed, please copy manually');
            }
        }
    };

    // 处理Dialog的onOpenChange事件
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };

    // 社交媒体分享函数
    const shareToTwitter = () => {
        if (share_link) {
            const text = share_title ? `${share_title} ${share_link}` : share_link;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        }
    };

    const shareToFacebook = () => {
        if (share_link) {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(share_link)}`, '_blank');
        }
    };

    const shareToLinkedIn = () => {
        if (share_link) {
            const title = encodeURIComponent(share_title || '');
            const url = encodeURIComponent(share_link);
            window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`, '_blank');
        }
    };

    const shareToReddit = () => {
        if (share_link) {
            const title = encodeURIComponent(share_title || '');
            const url = encodeURIComponent(share_link);
            window.open(`https://www.reddit.com/submit?url=${url}&title=${title}`, '_blank');
        }
    };

    return (
        <Dialog open={dialog_open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md md:max-w-lg px-6 overflow-auto">
                <DialogHeader>
                    <DialogTitle>Share with your network</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* 预览卡片 */}
                    {share_image && (
                        <div className="relative w-full h-48">
                            <Image
                                src={share_image}
                                alt={share_title || 'Share image'}
                                wrapperClassName="w-full h-full rounded-lg flex items-center justify-center"
                                imageClassName="w-full h-full object-cover rounded-lg"
                            />
                        </div>
                    )}
                    <div className="p-2">
                        <div className={cn(
                            "mb-3",
                            "border-b border-gray-100",
                            "font-black text-xl text-gray-900"
                        )}>
                            <MarkdownRenderer
                                content={share_title || 'No title'}
                                className={cn(
                                    "prose-xl",
                                    "prose-p:text-xl prose-p:font-bold prose-p:text-gray-900 prose-p:mb-0 prose-p:leading-tight",
                                    "prose-strong:text-xl prose-strong:font-black prose-strong:text-gray-950",
                                    "prose-headings:text-xl prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mb-0",
                                    "prose-a:text-xl prose-a:font-bold prose-a:text-blue-600 prose-a:hover:text-blue-800",
                                    "prose-ul:text-xl prose-ul:font-bold prose-ul:text-gray-900 prose-ul:mb-0",
                                    "prose-ol:text-xl prose-ol:font-bold prose-ol:text-gray-900 prose-ol:mb-0",
                                    "prose-li:text-xl prose-li:font-bold prose-li:text-gray-900",
                                    styles.markdown_renderer
                                )}
                            />
                        </div>
                        <div className={cn(
                            "px-2",
                            "text-sm text-gray-600 line-clamp-4",
                            "[&>div]:text-sm [&>div]:text-gray-600",
                            "[&>div>*]:text-sm [&>div>*]:text-gray-600 [&>div>*]:mb-1",
                            "[&>div>p]:mb-1 [&>div>p]:leading-relaxed",
                            "[&>div>strong]:text-gray-700 [&>div>strong]:font-medium",
                            styles.markdown_renderer
                        )}>
                            <MarkdownRenderer
                                content={share_content || 'No content'}
                                className={cn(
                                    "prose-sm",
                                    "prose-p:text-sm prose-p:text-gray-600 prose-p:mb-1 prose-p:leading-relaxed",
                                    "prose-strong:text-gray-700 prose-strong:font-medium prose-strong:text-sm",
                                    "prose-headings:text-sm prose-headings:text-gray-700 prose-headings:font-semibold prose-headings:mb-1 prose-headings:mt-1",
                                    "prose-a:text-blue-600 prose-a:text-sm prose-a:hover:text-blue-800",
                                    "prose-ul:text-sm prose-ul:text-gray-600 prose-ul:mb-1",
                                    "prose-ol:text-sm prose-ol:text-gray-600 prose-ol:mb-1",
                                    "prose-li:text-sm prose-li:text-gray-600",
                                    styles.markdown_renderer
                                )}
                            />
                        </div>
                    </div>

                    {/* 社交媒体分享按钮 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-2">
                        <button
                            onClick={shareToTwitter}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="bg-[#1DA1F2] p-2 sm:p-3 rounded-lg w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center">
                                <Twitter className="text-white w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                            </div>
                            <span className="text-xs sm:text-sm text-gray-600">Twitter</span>
                        </button>

                        <button
                            onClick={shareToFacebook}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="bg-[#4267B2] p-2 sm:p-3 rounded-lg w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center">
                                <Facebook className="text-white w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                            </div>
                            <span className="text-xs sm:text-sm text-gray-600">Facebook</span>
                        </button>

                        <button
                            onClick={shareToLinkedIn}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="bg-[#0077B5] p-2 sm:p-3 rounded-lg w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center">
                                <Linkedin className="text-white w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                            </div>
                            <span className="text-xs sm:text-sm text-gray-600">LinkedIn</span>
                        </button>

                        <button
                            onClick={shareToReddit}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="bg-[#FF4500] p-2 sm:p-3 rounded-lg w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center">
                                <svg className="text-white w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#FF4500" />
                                    <path d="M19.1835 11.9998C19.1835 10.8742 18.2555 9.95941 17.1138 9.95941C16.5414 9.95941 16.0321 10.2114 15.6718 10.6009C14.439 9.79806 12.7791 9.27933 10.9335 9.22574L11.7417 5.98374L14.2734 6.55122C14.3006 7.27509 14.901 7.85683 15.642 7.85683C16.3993 7.85683 17.0129 7.24303 17.0129 6.48582C17.0129 5.7286 16.3993 5.11482 15.642 5.11482C15.1058 5.11482 14.6444 5.42248 14.4342 5.87328L11.6466 5.24934C11.5379 5.22277 11.4291 5.24934 11.3475 5.30294C11.2659 5.35654 11.2114 5.43627 11.1978 5.53421L10.2971 9.2125C8.41795 9.25285 6.73138 9.77158 5.47183 10.5876C5.1115 10.2114 4.60221 9.95941 4.02984 9.95941C2.88818 9.95941 1.96014 10.8874 1.96014 11.9998C1.96014 12.8027 2.48579 13.4961 3.2143 13.7906C3.18773 13.9877 3.17442 14.198 3.17442 14.4083C3.17442 17.021 7.08489 19.1298 11.8707 19.1298C16.6565 19.1298 20.5669 17.0342 20.5669 14.4083C20.5669 14.198 20.5536 13.9746 20.527 13.7775C21.2555 13.483 21.7811 12.8027 21.7811 11.9998H19.1835ZM7.11146 13.4165C7.11146 12.6593 7.72508 12.0455 8.48227 12.0455C9.23946 12.0455 9.85308 12.6593 9.85308 13.4165C9.85308 14.1737 9.23946 14.7875 8.48227 14.7875C7.72508 14.7743 7.11146 14.1737 7.11146 13.4165ZM15.8419 16.9295C14.6311 18.1404 12.1922 18.1801 11.8574 18.1801C11.5094 18.1801 9.07044 18.1272 7.87259 16.9295C7.67093 16.7278 7.67093 16.3939 7.87259 16.1923C8.07425 15.9907 8.40805 15.9907 8.60973 16.1923C9.32044 16.903 10.9335 17.1398 11.8706 17.1398C12.8078 17.1398 14.4076 16.903 15.1315 16.1923C15.3332 15.9907 15.667 15.9907 15.8687 16.1923C16.0571 16.3939 16.0571 16.7278 15.8419 16.9295ZM15.4922 14.8006C14.735 14.8006 14.1214 14.1869 14.1214 13.4297C14.1214 12.6724 14.735 12.0587 15.4922 12.0587C16.2494 12.0587 16.863 12.6724 16.863 13.4297C16.863 14.1869 16.2494 14.8006 15.4922 14.8006Z" fill="white" />
                                </svg>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-600">Reddit</span>
                        </button>

                        <button
                            onClick={handleCopyLink}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="bg-[#8A3FFC] p-2 sm:p-3 rounded-lg w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center">
                                <CopyIcon className="text-white w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                            </div>
                            <span className="text-xs sm:text-sm text-gray-600">Copy Link</span>
                        </button>
                    </div>

                    {/* 分享链接 */}
                    {share_link && (
                        <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg overflow-hidden">
                            <div className="flex-1 text-xs sm:text-sm text-gray-700 font-medium break-all select-text cursor-text">
                                {share_link}
                            </div>
                            <Button
                                onClick={handleCopyLink}
                                className={cn(
                                    "min-w-16 sm:min-w-24 text-white font-medium text-xs sm:text-sm whitespace-nowrap",
                                    copied ? "bg-green-600 hover:bg-green-700" : "bg-[#5865F2] hover:bg-[#4752c4]"
                                )}
                            >
                                <CopyIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                {copied ? "Copied" : "Copy"}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default memo(ShareModel);
