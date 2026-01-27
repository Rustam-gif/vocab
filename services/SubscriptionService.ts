import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform, Alert, DeviceEventEmitter } from 'react-native';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
  deepLinkToSubscriptions,
  type Product,
  type Purchase,
} from 'react-native-iap';

// Local persistence keys for simple entitlement gating
const SUB_KEY = '@engniter.premium.active';
const SUB_PRODUCT = '@engniter.premium.product';
const SIMULATOR_DETECTED_KEY = '@engniter.simulator.detected';

// Valid subscription product IDs for this app
const VALID_PRODUCT_IDS = [
  'com.royal.vocadoo.premium.months',
  'com.royal.vocadoo.premium.annually',
];

export type SubscriptionStatus = {
  active: boolean;
  productId?: string;
  renews?: boolean;
  expiryDate?: Date | null;
};

export type SubscriptionProduct = {
  id: string;
  title: string;
  duration: 'monthly' | 'yearly' | 'weekly' | 'lifetime';
  price: number | undefined; // numeric price if provided by store
  currency: string; // ISO 4217 (e.g., 'USD')
  localizedPrice: string; // e.g., '$4.99'
  introductoryPrice?: string | null; // e.g., 'Free for 7 days'
  hasFreeTrial?: boolean; // whether an intro free trial is available
};

class SubscriptionServiceClass {
  private initialized = false;
  private updateSub?: { remove(): void };
  private errorSub?: { remove(): void };
  private waiters: Array<{ productId?: string; resolve: (s: SubscriptionStatus) => void; reject: (e?: any) => void; timer?: any }> = [];
  private isSimulatorDetected = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Check if simulator was detected in a previous session
    try {
      const persistedSimulator = await AsyncStorage.getItem(SIMULATOR_DETECTED_KEY);
      if (persistedSimulator === '1') {
        console.log('[IAP] Simulator detected - skipping StoreKit');
        this.isSimulatorDetected = true;
        this.initialized = true;
        return;
      }
    } catch (e) {
      console.warn('[IAP] Failed to check simulator flag:', e);
    }

    // Skip if already detected as simulator in this session
    if (this.isSimulatorDetected) {
      this.initialized = true;
      return;
    }

    try {
      await initConnection();
      console.log('[IAP] StoreKit connected');
      // Warm entitlement state from any available purchases
      await this.refreshEntitlementsFromStore();

      // Set up purchase listeners once
      this.updateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
        try {
          if (purchase.purchaseState === 'purchased' || purchase.purchaseState === 'restored') {
            // Only accept valid product IDs
            if (purchase.productId && VALID_PRODUCT_IDS.includes(purchase.productId)) {
              await AsyncStorage.multiSet([[SUB_KEY, '1'], [SUB_PRODUCT, purchase.productId]]);
            }
            // Always finish the transaction so the App Store/Play does not keep it pending
            await finishTransaction({ purchase });

            // Immediately refresh premium status in the store to activate premium features
            try {
              const { useAppStore } = require('../lib/store');
              const { premiumStatusService } = require('./PremiumStatusService');

              // Force refresh premium cache
              await premiumStatusService.refresh();

              // Refresh store
              await useAppStore.getState().refreshPremiumStatus();
              console.log('[IAP] Premium status refreshed after purchase');

              // Notify all screens that premium status changed
              DeviceEventEmitter.emit('PREMIUM_STATUS_CHANGED', true);
            } catch (e) {
              console.warn('[IAP] Failed to refresh store premium status:', e);
            }

            // Notify any pending waiters for this product
            try {
              const status = await this.getStatus();
              const toResolve = this.waiters.splice(0, this.waiters.length);
              toResolve.forEach(w => {
                if (!w.productId || w.productId === purchase.productId) {
                  try { clearTimeout(w.timer); } catch {}
                  try { w.resolve(status); } catch {}
                } else {
                  // requeue unmatched waiters
                  this.waiters.push(w);
                }
              });
            } catch (e) {
              console.error('[IAP] Failed to notify waiters:', e);
            }
          }
        } catch (e) {
          console.error('[IAP] Purchase listener error:', e);
        }
      });

      this.errorSub = purchaseErrorListener((err) => {
        // Quietly log purchase errors; avoid modal pop‑ups in the paywall flow
        try { console.warn('[IAP] purchase error:', err?.message || err); } catch {}
        // Reject any pending waiters (best-effort)
        const toReject = this.waiters.splice(0, this.waiters.length);
        toReject.forEach(w => { try { clearTimeout(w.timer); } catch {}; try { w.reject(err); } catch {} });
      });

      this.initialized = true;
    } catch (e: any) {
      // Check if error indicates simulator (SKErrorDomain error 2 = "The operation couldn't be completed")
      const errorMsg = e?.message || e?.toString() || '';
      const isSimulatorError = errorMsg.includes('SKErrorDomain error 2') ||
                               errorMsg.includes("operation couldn't be completed") ||
                               errorMsg.includes('not available');

      if (isSimulatorError) {
        console.log('[IAP] Simulator detected - IAP disabled');
        this.isSimulatorDetected = true;
        // Persist flag so we don't try again on next app launch
        try {
          await AsyncStorage.setItem(SIMULATOR_DETECTED_KEY, '1');
        } catch (storageErr) {
          console.warn('[IAP] Failed to persist simulator flag:', storageErr);
        }
      } else {
        console.warn('[IAP] initConnection failed:', e);
      }

      // Mark as initialized anyway to prevent retry loops
      this.initialized = true;
    }
  }

  private async ensureReady() {
    if (!this.initialized) {
      try { await this.initialize(); } catch {}
    }
  }

  private waitForPurchase(productId?: string, timeoutMs = 45000): Promise<SubscriptionStatus> {
    return new Promise<SubscriptionStatus>((resolve, reject) => {
      const timer = setTimeout(async () => {
        // Timeout: Check status one more time, then reject with timeout error
        try {
          const status = await this.getStatus();
          if (status.active) {
            resolve(status);
          } else {
            reject(new Error('Purchase timed out. Please check your App Store purchases and try Restore if needed.'));
          }
        } catch (e) {
          reject(new Error('Purchase timed out'));
        }
      }, timeoutMs);
      this.waiters.push({ productId, resolve, reject, timer });
    });
  }

  private async refreshEntitlementsFromStore() {
    // Skip on simulator to avoid Apple Account prompts
    if (this.isSimulatorDetected) {
      return;
    }

    try {
      const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });

      // Mark active if we can find a matching purchase with our valid product IDs
      const match = purchases.find(p => p.productId && VALID_PRODUCT_IDS.includes(p.productId));
      if (match?.productId) {
        console.log('[IAP] Active subscription found:', match.productId);
        await AsyncStorage.multiSet([[SUB_KEY, '1'], [SUB_PRODUCT, match.productId]]);
      } else {
        // CRITICAL: Clear premium status if no active purchases found
        console.log('[IAP] No active subscription - clearing premium status');
        await AsyncStorage.multiRemove([SUB_KEY, SUB_PRODUCT]);
      }
    } catch (e: any) {
      const errorMsg = e?.message || e?.toString() || '';

      // Check if this is a simulator error
      const isSimulatorError = errorMsg.includes('SKErrorDomain error 2') ||
                               errorMsg.includes("operation couldn't be completed") ||
                               errorMsg.includes('not available');

      if (isSimulatorError && !this.isSimulatorDetected) {
        console.log('[IAP] Simulator detected - IAP disabled');
        this.isSimulatorDetected = true;
        // Persist flag so we don't try again
        try {
          await AsyncStorage.setItem(SIMULATOR_DETECTED_KEY, '1');
        } catch (storageErr) {
          console.warn('[IAP] Failed to persist simulator flag:', storageErr);
        }
      } else {
        console.error('[IAP] Failed to refresh entitlements:', errorMsg);
      }
    }
  }

  /** Map react-native-iap product -> our lightweight SubscriptionProduct */
  private mapProduct(p: any): SubscriptionProduct {
    const currency = p.currency || 'USD';
    const localizedPrice = p.localizedPrice || p.displayPrice || (p.price != null ? `${p.price}` : '');
    const title = p.title || p.displayName || p.productId || p.id;

    // Best effort: infer duration from StoreKit metadata when available
    let duration: SubscriptionProduct['duration'] = 'monthly';
    const unit = (p.subscriptionPeriodUnitIOS || '').toString().toLowerCase();
    const countStr = p.subscriptionPeriodNumberIOS || '1';
    const value = Number(countStr);
    if (unit.includes('year')) duration = 'yearly';
    else if (unit.includes('week')) duration = 'weekly';
    else if (unit.includes('month')) duration = value === 12 ? 'yearly' : 'monthly';
    else if (/(year|annual)/i.test(p.productId || '')) duration = 'yearly';
    else if (/week/i.test(p.productId || '')) duration = 'weekly';

    let hasFreeTrial = (p.introductoryPricePaymentModeIOS === 'FREETRIAL') ||
      (typeof p.introductoryPrice === 'string' && /free/i.test(p.introductoryPrice));
    // Fallback for dev: if monthly premium SKU but StoreKit metadata not available,
    // assume 7‑day trial so UI can reflect intended offer (real eligibility is decided by the store).
    const pid = (p.productId || p.id || '').toString();
    if (!hasFreeTrial && /premium.*month/i.test(pid)) {
      hasFreeTrial = true;
      p.introductoryPrice = p.introductoryPrice || 'Free for 7 days';
    }
    // Also assume trial for an annual/yr SKU in dev unless store metadata is present
    if (!hasFreeTrial && /premium.*(year|annual)/i.test(pid)) {
      hasFreeTrial = true;
      p.introductoryPrice = p.introductoryPrice || 'Free for 7 days';
    }

    return {
      id: p.productId || p.id,
      title,
      duration,
      price: p.price ?? undefined,
      currency,
      localizedPrice,
      introductoryPrice: p.introductoryPrice ?? null,
      hasFreeTrial,
    };
  }

  async getProducts(productIds: string[]): Promise<SubscriptionProduct[]> {
    // Try to initialize first (this will detect simulator if needed)
    await this.ensureReady();

    // Skip StoreKit queries on simulator to avoid Apple Account prompts
    if (this.isSimulatorDetected) {
      // Return mock products for UI testing
      return [
        {
          id: 'com.royal.vocadoo.premium.months',
          title: 'Monthly Premium',
          duration: 'monthly',
          price: 4.99,
          currency: 'USD',
          localizedPrice: '$4.99',
          introductoryPrice: 'Free for 7 days',
          hasFreeTrial: true,
        },
        {
          id: 'com.royal.vocadoo.premium.annually',
          title: 'Annual Premium',
          duration: 'yearly',
          price: 39.99,
          currency: 'USD',
          localizedPrice: '$39.99',
          introductoryPrice: 'Free for 7 days',
          hasFreeTrial: true,
        },
      ];
    }

    try {
      const res = await getSubscriptions({ skus: productIds });
      if (!res) return [] as SubscriptionProduct[];
      return (res as any[]).map(p => this.mapProduct(p as any as Product));
    } catch {
      return [];
    }
  }

  async getStatus(): Promise<SubscriptionStatus> {
    try {
      const active = (await AsyncStorage.getItem(SUB_KEY)) === '1';
      const productId = (await AsyncStorage.getItem(SUB_PRODUCT)) || undefined;
      return { active, productId, renews: active || false, expiryDate: null };
    } catch {
      return { active: false, renews: false, expiryDate: null };
    }
  }

  async purchase(productId: string): Promise<SubscriptionStatus> {
    // Mock successful purchase on simulator for UI testing
    if (this.isSimulatorDetected) {
      console.log('[IAP] Simulator - mocking successful purchase');
      // Simulate purchase success
      await AsyncStorage.multiSet([[SUB_KEY, '1'], [SUB_PRODUCT, productId]]);
      return { active: true, productId, renews: true, expiryDate: null };
    }

    // Ensure listeners are up
    await this.ensureReady();
    try {
      // Verify the product exists for this environment before attempting purchase
      const available = await getSubscriptions({ skus: [productId] }).catch(() => null);
      if (!available || (Array.isArray(available) && available.length === 0)) {
        console.warn('[IAP] Product not available');
        return this.getStatus();
      }
      const waiter = this.waitForPurchase(productId);
      await requestSubscription({ sku: productId });
      return await waiter;
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : 'Unable to start purchase.';
      if (!/cancel/i.test(msg)) { try { console.warn('[IAP] start error:', msg); } catch {} }
      // Fallback to current status on error
      return this.getStatus();
    }
  }

  async restore(): Promise<SubscriptionStatus> {
    // On simulator, just return current status (might have mock purchases)
    if (this.isSimulatorDetected) {
      console.log('[IAP] Simulator - checking mock subscription status');
      return this.getStatus();
    }

    try {
      const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });

      // Only accept our current valid product IDs
      const best = purchases.find(p => p.productId && VALID_PRODUCT_IDS.includes(p.productId));
      if (best?.productId) {
        await AsyncStorage.multiSet([[SUB_KEY, '1'], [SUB_PRODUCT, best.productId]]);

        // Refresh premium status in the store after restore
        try {
          const { useAppStore } = require('../lib/store');
          const { premiumStatusService } = require('./PremiumStatusService');

          // Force refresh premium cache
          await premiumStatusService.refresh();

          // Refresh store
          await useAppStore.getState().refreshPremiumStatus();
          console.log('[IAP] Premium status refreshed after restore');

          // Notify all screens that premium status changed
          DeviceEventEmitter.emit('PREMIUM_STATUS_CHANGED', true);
        } catch (e) {
          console.warn('[IAP] Failed to refresh store premium status after restore:', e);
        }
      }
    } catch {}
    return this.getStatus();
  }

  async manage(): Promise<void> {
    try {
      // iOS: Always open the App Store Subscriptions page. This avoids any
      // Nitro dependency from showManageSubscriptionsIOS and is the
      // recommended path for managing auto‑renewing subscriptions.
      if (Platform.OS === 'ios') {
        await Linking.openURL('itms-apps://apps.apple.com/account/subscriptions');
        return;
      }

      // Android: open Play subscriptions surface when possible
      try {
        await deepLinkToSubscriptions({
          packageNameAndroid: 'com.rustikkarim.vocabworking',
          skuAndroid: (await AsyncStorage.getItem(SUB_PRODUCT)) || undefined,
        });
      } catch {
        try { await Linking.openURL('https://play.google.com/store/account/subscriptions'); } catch {}
      }
    } catch {}
  }

  /**
   * Verify subscription status with App Store/Play Store
   * Call this when app comes to foreground to ensure expired subscriptions are detected
   */
  async verifySubscription(): Promise<SubscriptionStatus> {
    // Try to initialize first (this will detect simulator if needed)
    await this.ensureReady();

    // Skip StoreKit verification on simulator
    if (this.isSimulatorDetected) {
      return this.getStatus();
    }

    await this.refreshEntitlementsFromStore();
    return this.getStatus();
  }

  /**
   * Clear simulator detection flag (for testing on real devices after simulator use)
   * Call this manually if you test on a real device after using simulator
   */
  async clearSimulatorFlag(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SIMULATOR_DETECTED_KEY);
      this.isSimulatorDetected = false;
      this.initialized = false;
      console.log('[IAP] Simulator flag cleared');
    } catch (e) {
      console.error('[IAP] Failed to clear simulator flag:', e);
    }
  }

  /**
   * Clear mock subscription (for testing free tier on simulator)
   * Only works on simulator - does nothing on real devices
   */
  async clearMockSubscription(): Promise<void> {
    if (this.isSimulatorDetected) {
      try {
        await AsyncStorage.multiRemove([SUB_KEY, SUB_PRODUCT]);
        console.log('[IAP] Simulator - mock subscription cleared');
      } catch (e) {
        console.error('[IAP] Failed to clear mock subscription:', e);
      }
    }
  }

}

export const SubscriptionService = new SubscriptionServiceClass();
export default SubscriptionService;
