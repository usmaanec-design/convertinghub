// Service for receiving files opened via Android 'Open With', Share Target, or PWA File Handling API

export type FileLaunchCallback = (file: File) => void;

class AndroidIntentService {
  private listeners: Set<FileLaunchCallback> = new Set();
  private isInitialized = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Check URL parameters for Android Cold-Start / Warm-Start Intent URIs
    try {
      const params = new URLSearchParams(window.location.search);
      const rawUri = params.get('open_file_uri');
      const rawMime = params.get('intent_mime');

      if (rawUri) {
        const decodedUri = decodeURIComponent(rawUri);
        const mimeType = rawMime ? decodeURIComponent(rawMime) : 'application/pdf';
        
        fetch(decodedUri)
          .then((res) => res.blob())
          .then((blob) => {
            const fileName = decodedUri.split('/').pop() || 'received_document.pdf';
            const file = new File([blob], fileName, { type: mimeType });
            this.notifyFileReceived(file);
          })
          .catch((err) => {
            console.warn('[IntentService] Failed fetching intent URI content:', err);
          });
      }
    } catch (e) {
      console.warn('[IntentService] URL intent parsing error:', e);
    }

    // 2. Listen for PWA Web Launch Queue (Launch Handler API)
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
