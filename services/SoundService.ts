import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from '../lib/rnsound';

/**
 * SoundService - Play app sound effects
 *
 * Sound files must be added to Xcode's "Copy Bundle Resources" build phase.
 * For iOS, files are loaded from the main bundle by filename only (no path).
 */

const SOUND_ENABLED_KEY = '@engniter.soundEnabled';

type SoundName = 'correct_answer' | 'incorrect_answer' | 'intro_for_exercises' | 'one_set_completion' | 'story_generated';

// Map sound names to their file extensions
const soundFileExtensions: Record<SoundName, string> = {
  correct_answer: 'wav',
  incorrect_answer: 'mp3',
  intro_for_exercises: 'wav',
  one_set_completion: 'wav',
  story_generated: 'mp3',
};

class SoundServiceClass {
  private sounds: Map<SoundName, Sound | null> = new Map();
  private initialized = false;
  private soundEnabled = true;

  /**
   * Initialize and preload all sounds
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load sound enabled setting
    try {
      const val = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
      this.soundEnabled = val !== '0'; // Default to true if not set
    } catch (e) {
      this.soundEnabled = true;
    }

    // Set audio category for iOS (allows playback with silent switch)
    if (Platform.OS === 'ios') {
      try {
        Sound.setCategory('Playback', true);
        Sound.enableInSilenceMode(true);
      } catch (e) {
        console.warn('[SoundService] Failed to set audio category:', e);
      }
    }

    // Preload sounds
    const soundFiles: SoundName[] = ['correct_answer', 'incorrect_answer', 'intro_for_exercises', 'one_set_completion', 'story_generated'];

    for (const name of soundFiles) {
      try {
        await this.loadSound(name);
      } catch (e) {
        console.warn(`[SoundService] Failed to load ${name}:`, e);
      }
    }

    this.initialized = true;
    console.log('[SoundService] Initialized, sounds enabled:', this.soundEnabled);
  }

  private loadSound(name: SoundName): Promise<void> {
    return new Promise((resolve, reject) => {
      const ext = soundFileExtensions[name];
      const filename = `${name}.${ext}`;

      const sound = new Sound(filename, '', (error) => {
        if (error) {
          console.warn(`[SoundService] Failed to load ${name}:`, error);
          this.sounds.set(name, null);
          reject(error);
        } else {
          console.log(`[SoundService] Loaded ${name}`);
          this.sounds.set(name, sound);
          resolve();
        }
      });
    });
  }

  /**
   * Play a sound effect
   */
  play(name: SoundName): void {
    // Check if sounds are enabled
    if (!this.soundEnabled) {
      return;
    }

    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`[SoundService] Sound not loaded: ${name}`);
      return;
    }

    // Stop and rewind before playing (allows rapid replays)
    sound.stop(() => {
      sound.play((success) => {
        if (!success) {
          console.warn(`[SoundService] Playback failed for ${name}`);
        }
      });
    });
  }

  /**
   * Update the sound enabled setting at runtime
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    console.log('[SoundService] Sounds enabled:', enabled);
  }

  /**
   * Check if sounds are enabled
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Play correct answer sound
   */
  playCorrectAnswer(): void {
    this.play('correct_answer');
  }

  /**
   * Play incorrect answer sound
   */
  playIncorrectAnswer(): void {
    this.play('incorrect_answer');
  }

  /**
   * Play exercise intro sound
   */
  playExerciseIntro(): void {
    this.play('intro_for_exercises');
  }

  /**
   * Play set completion sound
   */
  playSetCompletion(): void {
    this.play('one_set_completion');
  }

  /**
   * Play story generated sound
   */
  playStoryGenerated(): void {
    this.play('story_generated');
  }

  /**
   * Release all sounds (call on app exit if needed)
   */
  release(): void {
    for (const sound of this.sounds.values()) {
      sound?.release();
    }
    this.sounds.clear();
    this.initialized = false;
  }
}

export const soundService = new SoundServiceClass();
export default soundService;
