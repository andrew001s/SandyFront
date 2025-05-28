export class AudioQueueManager {
    private static instance: AudioQueueManager;
    private queue: { blob: Blob; url: string }[] = [];
    private isPlaying = false;
    private audioElement: HTMLAudioElement | null = null;
    private processedUrls = new Set<string>();
    private callbacks: Set<(isPlaying: boolean) => void> = new Set();

    private constructor() {}

    static getInstance(): AudioQueueManager {
        if (!AudioQueueManager.instance) {
            AudioQueueManager.instance = new AudioQueueManager();
        }
        return AudioQueueManager.instance;
    }

    setAudioElement(element: HTMLAudioElement | null) {
        this.audioElement = element;
        if (element) {
            element.onended = () => {
                if (element.src) {
                    URL.revokeObjectURL(element.src);
                }
                this.isPlaying = false;
                this.notifyStateChange();
                void this.playNext();
            };
        }
    }

    subscribe(callback: (isPlaying: boolean) => void) {
        this.callbacks.add(callback);
        return () => {
            this.callbacks.delete(callback);
        };
    }

    private notifyStateChange() {
        for (const callback of this.callbacks) {
            callback(this.isPlaying);
        }
    }

    async addToQueue(audioBlob: Blob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        if (!this.processedUrls.has(audioUrl)) {
            this.processedUrls.add(audioUrl);
            this.queue.push({ blob: audioBlob, url: audioUrl });
            if (!this.isPlaying) {
                await this.playNext();
            }
        }
    }

    private async playNext() {
        if (this.queue.length > 0 && !this.isPlaying && this.audioElement) {
            this.isPlaying = true;
            this.notifyStateChange();
            const nextAudio = this.queue.shift();
            if (nextAudio) {
                this.audioElement.src = nextAudio.url;
                try {
                    await this.audioElement.play();
                } catch (error) {
                    console.error('Error reproduciendo audio:', error);
                    this.isPlaying = false;
                    URL.revokeObjectURL(nextAudio.url);
                    this.notifyStateChange();
                    await this.playNext();
                }
            }
        }
    }

    clearQueue() {
        for (const audio of this.queue) {
            URL.revokeObjectURL(audio.url);
        }
        this.queue = [];
        this.processedUrls.clear();
        if (this.audioElement) {
            this.audioElement.pause();
            if (this.audioElement.src) {
                URL.revokeObjectURL(this.audioElement.src);
            }
            this.audioElement.src = '';
        }
        this.isPlaying = false;
        this.notifyStateChange();
    }
}
