import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform, Alert } from 'react-native';
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

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // In development builds, skip StoreKit/Play init to avoid noisy retries and callback floods.
    if (__DEV__) {
      this.initialized = true;
      return;
    }
    try {
      await initConnection();
      // Warm entitlement state from any available purchases
      await this.refreshEntitlementsFromStore();

      // Set up purchase listeners once
      this.updateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
        try {
          if (purchase.purchaseState === 'purchased' || purchase.purchaseState === 'restored') {
            if (purchase.productId) {
              await AsyncStorage.multiSet([[SUB_KEY, '1'], [SUB_PRODUCT, purchase.productId]]);
            }
            // Always finish the transaction so the App Store/Play does not keep it pending
            await finishTransaction({ purchase });
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
            } catch {}
          }
        } catch {}
      });

      this.errorSub = purchaseErrorListener((err) => {
        // Quietly log purchase errors; avoid modal pop‑ups in the paywall flow
        try { console.warn('[IAP] purchase error:', err?.message || err); } catch {}
        // Reject any pending waiters (best-effort)
        const toReject = this.waiters.splice(0, this.waiters.length);
        toReject.forEach(w => { try { clearTimeout(w.timer); } catch {}; try { w.reject(err); } catch {} });
      });

      this.initialized = true;
    } catch (e) {
      // Leave initialized=false so callers could retry later
      this.initialized = false;
      if (__DEV__) {
        try { console.warn('[IAP] initConnection failed', e); } catch {}
      }
    }
  }

  private async ensureReady() {
    if (!this.initialized) {
      try { await this.initialize(); } catch {}
    }
  }

  private waitForPurchase(productId?: string, timeoutMs = 120000): Promise<SubscriptionStatus> {
    return new Promise<SubscriptionStatus>((resolve, reject) => {
      const timer = setTimeout(async () => {
        // Timeout: resolve with current status, do not flip UI spuriously
        try { resolve(await this.getStatus()); } catch (e) { reject(e); }
      }, timeoutMs);
      this.waiters.push({ productId, resolve, reject, timer });
    });
  }

  private async refreshEntitlementsFromStore() {
    try {
      const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
      // Mark active if we can find any purchase resembling our premium sub
      const match = purchases.find(p => !!p.productId);
      if (match?.productId) {
        await AsyncStorage.multiSet([[SUB_KEY, '1'], [SUB_PRODUCT, match.productId]]);
      }
    } catch {}
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
    // Ensure listeners are up
    await this.ensureReady();
    try {
      // Verify the product exists for this environment before attempting purchase
      const available = await getSubscriptions({ skus: [productId] }).catch(() => null);
      if (!available || (Array.isArray(available) && available.length === 0)) {
        // Silent fallback; surface in logs only
        try { console.warn('[IAP] product not available for this build'); } catch {}
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
    try {
      const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
      const best = purchases.find(p => !!p.productId);
      if (best?.productId) {
        await AsyncStorage.multiSet([[SUB_KEY, '1'], [SUB_PRODUCT, best.productId]]);
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
}

export const SubscriptionService = new SubscriptionServiceClass();
export default SubscriptionService;
