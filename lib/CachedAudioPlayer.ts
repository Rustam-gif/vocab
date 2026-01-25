import RNFS from 'react-native-fs';
import Sound from './rnsound';

// Enable playback in silent mode
Sound.setCategory('Playback');

const CACHE_DIR = `${RNFS.DocumentDirectoryPath}/tts_cache`;

class CachedAudioPlayer {
  private currentSound: Sound | null = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      const exists = await RNFS.exists(CACHE_DIR);
      if (!exists) {
        await RNFS.mkdir(CACHE_DIR);
        console.log('[CachedAudio] Created cache directory');
      }
      this.initialized = true;
    } catch (error) {
      console.error('[CachedAudio] Init error:', error);
    }
  }

  async play(url: string, onComplete?: () => void) {
    await this.initialize();

    // Stop current sound
    if (this.currentSound) {
      this.currentSound.stop(() => {
        this.currentSound?.release();
        this.currentSound = null;
      });
    }

    try {
      // Generate cache filename from URL
      const urlHash = url.split('/').pop()?.split('?')[0] || 'audio';
      const localPath = `${CACHE_DIR}/${urlHash}`;

      // Check if cached
      const cached = await RNFS.exists(localPath);

      if (!cached) {
        console.log('[CachedAudio] Downloading:', url.substring(0, 60));
        await RNFS.downloadFile({
          fromUrl: url,
          toFile: localPath,
        }).promise;
        console.log('[CachedAudio] Downloaded to:', localPath);
      } else {
        console.log('[CachedAudio] Using cached file');
      }

      // Play from local file
      const sound = new Sound(localPath, (error) => {
        if (error) {
          console.error('[CachedAudio] Load error:', error);
          onComplete?.();
          return;
        }

        console.log('[CachedAudio] Playing, duration:', sound.getDuration().toFixed(2), 's');

        // Small delay to ensure audio is fully ready
        setTimeout(() => {
          sound.play((success) => {
            if (success) {
              console.log('[CachedAudio] Completed successfully');
            } else {
              console.error('[CachedAudio] Playback failed');
            }
            sound.release();
            if (this.currentSound === sound) {
              this.currentSound = null;
            }
            onComplete?.();
          });
        }, 100);
      });

      this.currentSound = sound;
    } catch (error) {
      console.error('[CachedAudio] Error:', error);
      onComplete?.();
    }
  }

  stop() {
    if (this.currentSound) {
      this.currentSound.stop(() => {
        this.currentSound?.release();
        this.currentSound = null;
      });
    }
  }
}

export const cachedAudioPlayer = new CachedAudioPlayer();
