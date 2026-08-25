// Service for receiving files opened via Android 'Open With', Share Target, or PWA File Handling API

export type FileLaunchCallback = (file: File) => void;

class AndroidIntentService {
  private listeners: Set<FileLaunchCallback> = new Set();
  private isInitialized = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Listen for PWA Web Launch Queue (Launch Handler API)
    if ('launchQueue' in window && (window as any).launchQueue) {
      try {
        (window as any).launchQueue.setConsumer(async (launchParams: any) => {
          if (launchParams.files && launchParams.files.length > 0) {
            for (const handle of launchParams.files) {
              try {
                const file = await handle.getFile();
                this.notifyFileReceived(file);
              } catch (e) {
                console.warn('[IntentService] Failed to read file from launch handle:', e);
              }
            }
          }
        });
      } catch (err) {
        console.warn('[IntentService] LaunchQueue registration error:', err);
      }
    }
  }

  public subscribe(callback: FileLaunchCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public notifyFileReceived(file: File) {
    if (!file) return;
    (window as any).__pendingConversionFile = file;
    this.listeners.forEach((cb) => cb(file));
  }
}

export const androidIntentService = new AndroidIntentService();
