"use client"

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import AudioManager from '../class/AudioManager';
import styles from './Audio.module.css';

interface AudioPlayerProps {
    src: string; // 音频文件 URL
    className?: string; // 自定义类名
}

/**
 * 格式化时间为 mm:ss 格式
 */
const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, className }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const volumeRef = useRef<HTMLDivElement>(null);
    // 获取音频管理器实例
    const audioManager = AudioManager.getInstance();

    // 播放状态
    const [isPlaying, setIsPlaying] = useState(false);
    // 当前播放时间
    const [currentTime, setCurrentTime] = useState(0);
    // 音频总时长
    const [duration, setDuration] = useState(0);
    // 音量（0-1）
    const [volume, setVolume] = useState(1);
    // 静音前保存的音量
    const [prevVolume, setPrevVolume] = useState(1);
    // 是否静音
    const [isMuted, setIsMuted] = useState(false);
    // 是否正在拖动进度条
    const [isDragging, setIsDragging] = useState(false);
    // 是否正在拖动音量滑块
    const [isVolumeDragging, setIsVolumeDragging] = useState(false);

    // 播放进度百分比
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    // 注册和注销音频
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audioManager.registerAudio(audio);
        }
        return () => {
            if (audio) {
                audioManager.unregisterAudio(audio);
            }
        };
    }, [audioManager]);

    /**
     * 切换播放/暂停状态
     */
    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
    }, [isPlaying]);

    /**
     * 切换静音状态
     */
    const toggleMute = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isMuted || volume === 0) {
            // 取消静音，恢复之前的音量
            const newVolume = prevVolume > 0 ? prevVolume : 0.5;
            audio.volume = newVolume;
            audio.muted = false;
            setVolume(newVolume);
            setIsMuted(false);
        } else {
            // 静音前保存当前音量
            setPrevVolume(volume);
            audio.muted = true;
            setIsMuted(true);
        }
    }, [isMuted, volume, prevVolume]);

    /**
     * 处理音量滑块点击/拖动
     */
    const handleVolumeChange = useCallback((clientX: number) => {
        const audio = audioRef.current;
        const volumeBar = volumeRef.current;
        if (!audio || !volumeBar) return;

        const rect = volumeBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

        audio.volume = percent;
        setVolume(percent);
        // 如果调节音量大于0，取消静音状态
        if (percent > 0 && isMuted) {
            audio.muted = false;
            setIsMuted(false);
        }
        // 如果调节音量为0，设置静音状态
        if (percent === 0) {
            setIsMuted(true);
        }
    }, [isMuted]);

    /**
     * 音量滑块鼠标按下事件
     */
    const handleVolumeMouseDown = useCallback((e: React.MouseEvent) => {
        setIsVolumeDragging(true);
        handleVolumeChange(e.clientX);
    }, [handleVolumeChange]);

    /**
     * 处理进度条点击/拖动
     */
    const handleProgressChange = useCallback((clientX: number) => {
        const audio = audioRef.current;
        const progressBar = progressRef.current;
        if (!audio || !progressBar) return;

        const rect = progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const newTime = percent * duration;

        audio.currentTime = newTime;
        setCurrentTime(newTime);
    }, [duration]);

    /**
     * 进度条鼠标按下事件
     */
    const handleProgressMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        handleProgressChange(e.clientX);
    }, [handleProgressChange]);

    // 处理进度条拖动和释放
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            handleProgressChange(e.clientX);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleProgressChange]);

    // 处理音量滑块拖动和释放
    useEffect(() => {
        if (!isVolumeDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            handleVolumeChange(e.clientX);
        };

        const handleMouseUp = () => {
            setIsVolumeDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isVolumeDragging, handleVolumeChange]);

    // 监听音频事件
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleTimeUpdate = () => {
            if (!isDragging) {
                setCurrentTime(audio.currentTime);
            }
        };

        const handlePlay = () => {
            setIsPlaying(true);
            // 当音频播放时，通知管理器暂停其他音频
            audioManager.setCurrentPlaying(audio);
        };

        const handlePause = () => {
            setIsPlaying(false);
            // 当音频暂停时，清除当前播放状态
            audioManager.clearCurrentPlaying(audio);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            // 当音频结束时，清除当前播放状态
            audioManager.clearCurrentPlaying(audio);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [isDragging, audioManager]);

    return (
        <div className={cn(styles.audio_player, className)}>
            {/* 隐藏的原生 audio 元素 */}
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* 播放/暂停按钮 */}
            <button
                className={styles.play_btn}
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                <div className={styles.play_btn_dot} />
                {isPlaying ? (
                    // 暂停图标
                    <svg
                        className={styles.icon}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                ) : (
                    // 播放图标
                    <svg
                        className={styles.icon}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36a1 1 0 00-1.5.86z" />
                    </svg>
                )}
            </button>

            {/* 当前时间 */}
            <span className={styles.time}>
                {formatTime(currentTime)}
            </span>

            {/* 进度条 */}
            <div
                ref={progressRef}
                className={styles.progress}
                onMouseDown={handleProgressMouseDown}
            >
                {/* 已播放进度 */}
                <div
                    className={styles.progress_filled}
                    style={{ width: `${progress}%` }}
                />
                {/* 进度条拖动手柄 */}
                <div
                    className={styles.progress_thumb}
                    style={{ left: `${progress}%` }}
                />
            </div>

            {/* 总时长 */}
            <span className={styles.time}>
                {formatTime(duration)}
            </span>

            {/* 音量控制区域 */}
            <div className={styles.volume_control}>
                {/* 音量按钮 */}
                <button
                    className={styles.volume_btn}
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted || volume === 0 ? (
                        // 静音图标
                        <svg
                            className={styles.volume_icon}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z" />
                        </svg>
                    ) : volume < 0.5 ? (
                        // 低音量图标
                        <svg
                            className={styles.volume_icon}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                        </svg>
                    ) : (
                        // 高音量图标
                        <svg
                            className={styles.volume_icon}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                    )}
                </button>

                {/* 音量滑块包装器 - 拖动时保持显示 */}
                <div
                    className={cn(
                        styles.volume_slider_wrapper,
                        isVolumeDragging && styles.visible
                    )}
                >
                    {/* 音量滑块 */}
                    <div
                        ref={volumeRef}
                        className={styles.volume_slider}
                        onMouseDown={handleVolumeMouseDown}
                    >
                        {/* 音量填充 */}
                        <div
                            className={styles.volume_slider_filled}
                            style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                        />
                        {/* 音量滑块手柄 */}
                        <div
                            className={styles.volume_slider_thumb}
                            style={{ left: `${(isMuted ? 0 : volume) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
