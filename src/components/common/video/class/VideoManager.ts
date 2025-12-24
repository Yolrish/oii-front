
// 全局视频管理器
export default class VideoManager {
    private static instance: VideoManager;
    private currentPlayingVideo: HTMLVideoElement | null = null;
    private videos: Map<HTMLVideoElement, { element: HTMLElement }> = new Map();

    private constructor() { }

    static getInstance(): VideoManager {
        if (!VideoManager.instance) {
            VideoManager.instance = new VideoManager();
        }
        return VideoManager.instance;
    }

    // 注册视频元素
    registerVideo(video: HTMLVideoElement, element: HTMLElement) {
        this.videos.set(video, { element });
    }

    // 注销视频元素
    unregisterVideo(video: HTMLVideoElement) {
        this.videos.delete(video);
        if (this.currentPlayingVideo === video) {
            this.currentPlayingVideo = null;
        }
    }

    // 计算元素在视口中的位置
    private getElementPosition(element: HTMLElement): number {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const elementCenter = rect.top + rect.height / 2;
        return Math.abs(elementCenter - viewportHeight / 2);
    }

    // 获取最接近视口中心的视频
    private getClosestToCenterVideo(): HTMLVideoElement | null {
        let closestVideo: HTMLVideoElement | null = null;
        let minDistance = Infinity;

        this.videos.forEach((data, video) => {
            const distance = this.getElementPosition(data.element);
            if (distance < minDistance) {
                minDistance = distance;
                closestVideo = video;
            }
        });

        return closestVideo;
    }

    // 获取在视口内的视频
    private getVideosInViewport(): HTMLVideoElement[] {
        const videosInViewport: HTMLVideoElement[] = [];

        this.videos.forEach((data, video) => {
            const rect = data.element.getBoundingClientRect();
            const isInViewport = (
                rect.top < window.innerHeight &&
                rect.bottom > 0
            );
            if (isInViewport) {
                videosInViewport.push(video);
            }
        });

        return videosInViewport;
    }

    // 暂停所有视频（除了指定的视频）
    pauseAllVideos(exceptVideo: HTMLVideoElement | null = null) {
        this.videos.forEach((_, video) => {
            if (video !== exceptVideo) {
                video.pause();
            }
        });
    }

    // 设置当前播放的视频
    setCurrentPlayingVideo(video: HTMLVideoElement | null) {
        this.currentPlayingVideo = video;
    }

    // 获取当前播放的视频
    getCurrentPlayingVideo(): HTMLVideoElement | null {
        return this.currentPlayingVideo;
    }

    // 播放下一个视频
    playNextVideo(currentVideo: HTMLVideoElement) {
        const videosInViewport = this.getVideosInViewport();
        if (videosInViewport.length === 0) return;

        // 找到当前视频在视口内视频列表中的索引
        const currentIndex = videosInViewport.indexOf(currentVideo);

        // 如果当前视频不在视口内或已经是最后一个视频，播放第一个视频
        if (currentIndex === -1 || currentIndex === videosInViewport.length - 1) {
            const nextVideo = videosInViewport[0];
            this.pauseAllVideos(nextVideo);
            this.currentPlayingVideo = nextVideo;
            nextVideo.play().catch((error) => {
                console.warn('自动播放失败，可能需要用户交互', error);
            });
        } else {
            // 播放下一个视频
            const nextVideo = videosInViewport[currentIndex + 1];
            this.pauseAllVideos(nextVideo);
            this.currentPlayingVideo = nextVideo;
            nextVideo.play().catch((error) => {
                console.warn('自动播放失败，可能需要用户交互', error);
            });
        }
    }

    playVideo(video: HTMLVideoElement) {
        // 如果没有视频在播放，直接播放新视频
        if (!this.currentPlayingVideo) {
            this.currentPlayingVideo = video;
            video.play().catch((error) => {
                console.warn('自动播放失败，可能需要用户交互', error);
            });
            return;
        }

        // 如果已经有视频在播放，找到最接近视口中心的视频
        const closestVideo = this.getClosestToCenterVideo();
        if (closestVideo && closestVideo !== this.currentPlayingVideo) {
            // 暂停当前播放的视频
            this.currentPlayingVideo.pause();
            // 播放最接近中心的视频
            this.currentPlayingVideo = closestVideo;
            closestVideo.play().catch((error) => {
                console.warn('自动播放失败，可能需要用户交互', error);
            });
        }
    }

    pauseVideo(video: HTMLVideoElement) {
        if (this.currentPlayingVideo === video) {
            this.currentPlayingVideo = null;
        }
        video.pause();
    }
}