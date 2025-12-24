/**
 * 视频组件
 * 创建了视频管理器单例类，用于管理视频的播放、暂停、切换等操作
 * 当视频在视口内且没有视频播放时，自动播放视频
 * 当视频不在视口内时，暂停视频
 * 当视频移出视口时，如果当前视频正在播放，尝试播放下一个视频
 * TODO：将视频管理器代码抽离出去，并进一步优化视频播放逻辑
 */

"use client"

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import VideoManager from '../class/VideoManager';

interface VideoCardProps {
    videoUrl: string; // 视频文件 URL
    coverUrl?: string; // 封面图片 URL
    videoWidth?: number; // 视频宽度
    videoHeight?: number; // 视频高度
    controls?: boolean; // 是否显示控制条
    playsInline?: boolean; // 是否内联播放
    disablePictureInPicture?: boolean; // 是否禁用画中画
    muted?: boolean; // 是否静音
}

const VideoCard: React.FC<VideoCardProps> = ({
    videoUrl,
    coverUrl,
    videoWidth,
    videoHeight,
    controls = true,
    playsInline = true,
    disablePictureInPicture = true,
    muted = true,
}) => {
    // 创建封面元素的引用
    const coverRef = useRef<HTMLDivElement>(null);
    // 创建视频元素的引用
    const videoRef = useRef<HTMLVideoElement>(null);
    // 用于跟踪视频是否在视口内的状态
    const [isInViewPort, setIsInViewPort] = useState(false);
    // 获取视频管理器实例
    const videoManager = VideoManager.getInstance();

    // 注册和注销视频
    useEffect(() => {
        const video = videoRef.current;
        const cover = coverRef.current;

        if (video && cover) {
            videoManager.registerVideo(video, cover);
        }
        return () => {
            if (video) {
                videoManager.unregisterVideo(video);
            }
        };
    }, [videoManager]);

    // 处理视频播放事件
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        videoManager.playVideo(video);

        const handlePlay = () => {
            // 当用户手动播放视频时，暂停其他所有视频
            videoManager.pauseAllVideos(video);
            videoManager.setCurrentPlayingVideo(video);
        };

        video.addEventListener('play', handlePlay);
        return () => {
            video.removeEventListener('play', handlePlay);
        };
    }, [videoManager]);

    // 视口检测：滑入窗口时播放，滑出时暂停
    useEffect(() => {
        // 定义视口检测的配置常量
        const INTERSECTION_OBSERVER_CONFIG = { rootMargin: '0px 0px 200px 0px' };
        const cover = coverRef.current;
        if (!cover) return;

        // 创建一个 IntersectionObserver 实例
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInViewPort(true);
                    if (videoRef.current) {
                        videoManager.playVideo(videoRef.current);
                    }
                } else {
                    setIsInViewPort(false);
                    if (videoRef.current) {
                        // 如果当前视频正在播放，尝试播放下一个视频
                        if (videoRef.current === videoManager.getCurrentPlayingVideo()) {
                            videoManager.playNextVideo(videoRef.current);
                        }
                        videoManager.pauseVideo(videoRef.current);
                    }
                }
            },
            INTERSECTION_OBSERVER_CONFIG
        );

        observer.observe(cover);
        return () => observer.disconnect();
    }, [videoManager]);

    return (
        <div
            ref={coverRef}
            style={{
                position: 'relative',
                width: videoWidth ?? '100%',
                height: videoHeight ?? 'fit-content',
                overflow: 'hidden',
            }}
        >
            {/* 封面图片（默认展示） */}
            {coverUrl &&
                <div style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    display: isInViewPort ? 'none' : 'block', // 播放时隐藏封面
                }}>
                    <Image
                        src={coverUrl}
                        alt="Video Cover"
                        fill
                        style={{
                            objectFit: 'cover',
                        }}
                    />
                </div>
            }

            {/* 视频播放器 */}
            <video
                ref={videoRef}
                src={videoUrl}
                style={{
                    width: '100%',
                    height: '100%',
                    display: isInViewPort ? 'block' : 'none', // 视口内或Hover时显示
                }}
                controls={controls}
                playsInline={playsInline}
                disablePictureInPicture={disablePictureInPicture}
                muted={muted}
                preload="metadata" // 预加载元数据
            >
                Error
            </video>
        </div>
    );
};

export default VideoCard;