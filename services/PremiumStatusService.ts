import AsyncStorage from '@react-native-async-storage/async-storage';
import SubscriptionService, { SubscriptionStatus } from './SubscriptionService';

const PREMIUM_STATUS_KEY = '@engniter.premium.cache';
const PREMIUM_TIMESTAMP_KEY = '@engniter.premium.lastChecked';
const CACHE_DURATION = 20 * 60 * 1000; // 20 minutes

class PremiumStatusServiceClass {
  private isChecking = false;
  private lastCheckTime = 0;
  private cachedStatus: SubscriptionStatus | null = null;

  /**
   * Get premium status with smart caching
   * - Returns cached status if fresh (<20 min)
   * - Otherwise checks IAP and updates cache
   */
  async getStatus(forceRefresh = false): Promise<SubscriptionStatus> {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastCheckTime;

    // Return cached status if fresh and not forced
    if (!forceRefresh && this.cachedStatus && timeSinceLastCheck < CACHE_DURATION) {
      // Cache is fresh, return silently
      return this.cachedStatus;
    }

    // Prevent concurrent checks
    if (this.isChecking) {
      console.log('[PremiumStatus] Already checking, waiting...');
      // Wait for ongoing check to complete
      while (this.isChecking) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.cachedStatus || { active: false, renews: false, expiryDate: null };
    }

    try {
      this.isChecking = true;

      // Check from SubscriptionService (reads AsyncStorage + IAP)
      const status = await SubscriptionService.getStatus();

      // Update cache
      this.cachedStatus = status;
      this.lastCheckTime = now;

      // Persist cache to AsyncStorage for cross-session
      await AsyncStorage.multiSet([
        [PREMIUM_STATUS_KEY, JSON.stringify(status)],
        [PREMIUM_TIMESTAMP_KEY, now.toString()],
      ]);

      console.log('[PremiumStatus] Status updated:', status.active ? 'Premium' : 'Free');
      return status;

    } catch (error) {
      console.error('[PremiumStatus] Check failed:', error);
      // Return cached status on error, or free tier as fallback
      return this.cachedStatus || { active: false, renews: false, expiryDate: null };
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Load cached status from AsyncStorage on app launch
   * Does NOT call IAP - just loads persisted cache
   */
  async loadCachedStatus(): Promise<SubscriptionStatus | null> {
    try {
      const [statusResult, timestampResult] = await AsyncStorage.multiGet([
        PREMIUM_STATUS_KEY,
        PREMIUM_TIMESTAMP_KEY,
      ]);

      const cachedStatusJson = statusResult[1];
      const cachedTimestamp = timestampResult[1];

      if (!cachedStatusJson || !cachedTimestamp) {
        return null;
      }

      const status = JSON.parse(cachedStatusJson) as SubscriptionStatus;
      const timestamp = parseInt(cachedTimestamp, 10);
      const cacheAge = Date.now() - timestamp;
      const minutesAgo = Math.round(cacheAge / 60000);

      this.cachedStatus = status;
      this.lastCheckTime = timestamp;

      console.log(`[PremiumStatus] Loaded cache (${minutesAgo}min old):`, status.active ? 'Premium' : 'Free');
      return status;

    } catch (error) {
      console.error('[PremiumStatus] Failed to load cache:', error);
      return null;
    }
  }

  /**
   * Prefetch premium status in background on app launch
   * Only fetches if cache is stale (>20 min)
   */
  async prefetchIfNeeded(): Promise<void> {
    try {
      // Load cache first
      const cached = await this.loadCachedStatus();

      if (cached) {
        const cacheAge = Date.now() - this.lastCheckTime;
        if (cacheAge < CACHE_DURATION) {
          const minutesAgo = Math.round(cacheAge / 60000);
          console.log(`[PremiumStatus] Cache is fresh (${minutesAgo}min old), skipping prefetch`);
          return;
        }
      }

      console.log('[PremiumStatus] Cache stale or missing, prefetching...');
      await this.getStatus(true);

    } catch (error) {
      console.error('[PremiumStatus] Prefetch error:', error);
    }
  }

  /**
   * Force refresh premium status
   * Call this after user visits Paywall or completes purchase
   */
  async refresh(): Promise<SubscriptionStatus> {
    console.log('[PremiumStatus] Force refresh requested');
    // Clear cache to ensure fresh fetch
    this.cachedStatus = null;
    this.lastCheckTime = 0;
    return this.getStatus(true);
  }

  /**
   * Clear cache (useful for testing or logout)
   */
  async clearCache(): Promise<void> {
    this.cachedStatus = null;
    this.lastCheckTime = 0;
    await AsyncStorage.multiRemove([PREMIUM_STATUS_KEY, PREMIUM_TIMESTAMP_KEY]);
    console.log('[PremiumStatus] Cache cleared');
  }
}

export const premiumStatusService = new PremiumStatusServiceClass();
