'use client'
import { ArrowLeft } from "lucide-react";
import styles from './BackButton.module.css'
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BackButtonProps {
    onClick?: () => void;
    className?: string;
}

export default function BackButton({
    onClick,
    className
}: BackButtonProps) {

    const router = useRouter();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            // 检查前一个页面的域名是否与当前网站域名相同
            const referrer = document.referrer;
            if (referrer) {
                try {
                    const referrerHost = new URL(referrer).hostname;
                    const currentHost = window.location.hostname;
                    if (referrerHost === currentHost) {
                        router.back();
                        return;
                    }
                } catch {
                    // URL 解析失败，跳转到首页
                }
            }
            // 没有 referrer 或域名不同，跳转到首页
            router.push('/');
        }
    }

    return (
        <button
            className={cn(
                styles['back-button'],
                className
            )}
            onClick={handleClick}
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_18_1549)">
                    <path d="M0.79502 7.07987C0.497459 7.37743 0.497459 7.85987 0.79502 8.15743L5.64405 13.0065C5.94162 13.304 6.42406 13.304 6.72162 13.0065C7.01918 12.7089 7.01918 12.2265 6.72162 11.9289L2.41136 7.61865L6.72162 3.3084C7.01918 3.01084 7.01918 2.5284 6.72162 2.23084C6.42406 1.93327 5.94162 1.93327 5.64405 2.23084L0.79502 7.07987ZM15.6204 8.3806C16.0412 8.3806 16.3824 8.03947 16.3824 7.61865C16.3824 7.19784 16.0412 6.8567 15.6204 6.8567V7.61865V8.3806ZM1.3338 7.61865V8.3806H15.6204V7.61865V6.8567H1.3338V7.61865Z" fill="#20201E" />
                </g>
                <defs>
                    <clipPath id="clip0_18_1549">
                        <rect width="16" height="16" fill="white" />
                    </clipPath>
                </defs>
            </svg>

        </button>
    )
}