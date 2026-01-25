import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Debounced AsyncStorage utility
 * Batches multiple setItem calls into single operations to reduce JSON serialization overhead
 */

type PendingWrite = {
  value: string;
  timestamp: number;
};

class DebouncedStorage {
  private pendingWrites = new Map<string, PendingWrite>();
  private writeTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 250; // Wait 250ms before writing

  /**
   * Queue a write operation - will be batched with other writes
   */
  async setItem(key: string, value: string): Promise<void> {
    // Add to pending writes
    this.pendingWrites.set(key, {
      value,
      timestamp: Date.now(),
    });

    // Clear existing timer
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
    }

    // Schedule batched write
    this.writeTimer = setTimeout(() => {
      this.flush();
    }, this.DEBOUNCE_MS);
  }

  /**
   * Immediately flush all pending writes
   */
  async flush(): Promise<void> {
    if (this.pendingWrites.size === 0) return;

    const writes = Array.from(this.pendingWrites.entries());
    this.pendingWrites.clear();

    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }

    try {
      // Batch write using multiSet
      await AsyncStorage.multiSet(writes.map(([key, data]) => [key, data.value]));
      console.log(`[DebouncedStorage] Flushed ${writes.length} writes`);
    } catch (error) {
      console.error('[DebouncedStorage] Flush error:', error);
      // If batch write fails, try individual writes as fallback
      for (const [key, data] of writes) {
        try {
          await AsyncStorage.setItem(key, data.value);
        } catch (e) {
          console.error(`[DebouncedStorage] Failed to write ${key}:`, e);
        }
      }
    }
  }

  /**
   * Get item (reads directly from AsyncStorage)
   */
  async getItem(key: string): Promise<string | null> {
    // Check if there's a pending write for this key
    const pending = this.pendingWrites.get(key);
    if (pending) {
      return pending.value;
    }
    return AsyncStorage.getItem(key);
  }

  /**
   * Remove item
   */
  async removeItem(key: string): Promise<void> {
    this.pendingWrites.delete(key);
    return AsyncStorage.removeItem(key);
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    this.pendingWrites.clear();
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    return AsyncStorage.clear();
  }
}

export const debouncedStorage = new DebouncedStorage();
