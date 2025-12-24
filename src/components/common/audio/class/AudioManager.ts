/**
 * 全局音频管理器（单例模式）
 * 功能：当一个音频播放时，自动暂停其他所有音频
 */
export default class AudioManager {
    private static instance: AudioManager;
    // 当前正在播放的音频元素
    private currentPlayingAudio: HTMLAudioElement | null = null;
    // 注册的所有音频元素集合
    private audios: Set<HTMLAudioElement> = new Set();

    private constructor() {}

    /**
     * 获取单例实例
     */
    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    /**
     * 注册音频元素
     */
    registerAudio(audio: HTMLAudioElement) {
        this.audios.add(audio);
    }

    /**
     * 注销音频元素
     */
    unregisterAudio(audio: HTMLAudioElement) {
        this.audios.delete(audio);
        if (this.currentPlayingAudio === audio) {
            this.currentPlayingAudio = null;
        }
    }

    /**
     * 暂停所有其他音频（除了指定的音频）
     */
    pauseOthers(exceptAudio: HTMLAudioElement) {
        this.audios.forEach((audio) => {
            if (audio !== exceptAudio && !audio.paused) {
                audio.pause();
            }
        });
    }

    /**
     * 设置当前播放的音频
     * 当音频开始播放时调用，会自动暂停其他音频
     */
    setCurrentPlaying(audio: HTMLAudioElement) {
        // 暂停其他所有音频
        this.pauseOthers(audio);
        // 设置当前播放的音频
        this.currentPlayingAudio = audio;
    }

    /**
     * 清除当前播放状态
     * 当音频暂停或结束时调用
     */
    clearCurrentPlaying(audio: HTMLAudioElement) {
        if (this.currentPlayingAudio === audio) {
            this.currentPlayingAudio = null;
        }
    }

    /**
     * 获取当前正在播放的音频
     */
    getCurrentPlayingAudio(): HTMLAudioElement | null {
        return this.currentPlayingAudio;
    }
}

