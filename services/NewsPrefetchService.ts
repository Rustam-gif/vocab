import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_ANON_KEY } from '../lib/supabase';

/**
 * News Prefetch Service
 * Fetches news in background on app launch to have it ready when user visits Home
 */

const NEWS_PAYLOAD_KEY = '@engniter.news.payload';
const NEWS_TIMESTAMP_KEY = '@engniter.news.lastFetchedAt';
const ONE_HOUR = 60 * 60 * 1000;

class NewsPrefetchService {
  private isFetching = false;

  /**
   * Prefetch news if cache is stale (>1 hour old)
   * Called on app launch
   */
  async prefetchIfNeeded(): Promise<void> {
    // Don't fetch if already fetching
    if (this.isFetching) {
      console.log('[NewsPrefetch] Already fetching, skipping');
      return;
    }

    try {
      // Check cache freshness
      const lastFetched = await AsyncStorage.getItem(NEWS_TIMESTAMP_KEY);

      if (lastFetched) {
        const fetchedTime = new Date(lastFetched).getTime();
        const now = Date.now();
        const cacheAge = now - fetchedTime;

        if (cacheAge < ONE_HOUR) {
          const minutesAgo = Math.round(cacheAge / 60000);
          console.log(`[NewsPrefetch] Cache is fresh (${minutesAgo}min old), skipping`);
          return;
        }

        console.log(`[NewsPrefetch] Cache is stale (${Math.round(cacheAge / 60000)}min old), fetching fresh news`);
      } else {
        console.log('[NewsPrefetch] No cache found, fetching news');
      }

      // Fetch in background
      this.isFetching = true;
      await this.fetchNews();

    } catch (error) {
      console.error('[NewsPrefetch] Error:', error);
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Fetch news from Supabase edge function
   */
  private async fetchNews(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(
        'https://auirkjgyattnvqaygmfo.supabase.co/functions/v1/news',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ refresh: 0 }), // Don't force refresh, use server cache
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('[NewsPrefetch] API error:', response.status);
        return;
      }

      const data = await response.json();

      if (data?.articles && Array.isArray(data.articles)) {
        // Save to cache
        const payload = {
          articles: data.articles,
          status: data.status || 'Live feed',
        };

        await AsyncStorage.multiSet([
          [NEWS_PAYLOAD_KEY, JSON.stringify(payload)],
          [NEWS_TIMESTAMP_KEY, new Date().toISOString()],
        ]);

        console.log(`[NewsPrefetch] Cached ${data.articles.length} articles`);
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[NewsPrefetch] Request timed out');
      } else {
        console.error('[NewsPrefetch] Fetch error:', error);
      }
    }
  }
}

export const newsPrefetchService = new NewsPrefetchService();
