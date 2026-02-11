/**
 * StoreKit bridge for iOS in-app subscriptions.
 *
 * Product IDs (set these up in App Store Connect):
 *   - com.routines365.app.premium.monthly  ($3.99/mo)
 *   - com.routines365.app.premium.yearly   ($29.99/yr)
 *
 * Both include a 7-day free trial (configured in App Store Connect).
 */

export interface StoreProduct {
  id: string;
  displayName: string;
  description: string;
  price: number;
  displayPrice: string;
  type: "subscription" | "other";
  period?: string;
  freeTrialDays?: number;
}

export interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  pending?: boolean;
  transactionId?: string;
  productId?: string;
  isPremium?: boolean;
}

export interface SubscriptionStatus {
  isPremium: boolean;
  subscription?: {
    productId: string;
    expiresDate: number;
    isTrialPeriod: boolean;
  } | null;
}

// ── Plugin access ──

let pluginInstance: Record<string, (...args: unknown[]) => Promise<unknown>> | null | undefined;

function getPlugin(): Record<string, (...args: unknown[]) => Promise<unknown>> | null {
  if (typeof window === "undefined") return null;
  // @ts-expect-error - Capacitor global
  const cap = window.Capacitor;
  if (!cap) return null;
  if (pluginInstance !== undefined) return pluginInstance;
  try {
    const p = cap.Plugins?.StoreKitPlugin ?? cap.registerPlugin?.("StoreKitPlugin") ?? null;
    pluginInstance = p;
    return p;
  } catch {
    pluginInstance = null;
    return null;
  }
}

/** True if running in native iOS (StoreKit available) */
export function isStoreKitAvailable(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-expect-error - Capacitor global
  const cap = window.Capacitor;
  if (!cap) return false;
  // Must be iOS specifically — StoreKit doesn't exist on Android or web Capacitor
  return cap.getPlatform?.() === "ios";
}

/** Product IDs */
export const PRODUCT_IDS = {
  monthly: "com.routines365.app.premium.monthly",
  yearly: "com.routines365.app.premium.yearly",
} as const;

/**
 * Fetch available subscription products from the App Store.
 */
export async function getProducts(): Promise<StoreProduct[]> {
  const plugin = getPlugin();
  if (!plugin) return [];
  try {
    const result = await plugin.getProducts() as { products: StoreProduct[] };
    return result.products ?? [];
  } catch (e) {
    console.error("StoreKit getProducts error:", e);
    return [];
  }
}

/**
 * Purchase a subscription product.
 */
export async function purchase(productId: string): Promise<PurchaseResult> {
  const plugin = getPlugin();
  if (!plugin) return { success: false };
  try {
    const result = await plugin.purchase({ productId }) as PurchaseResult;
    return result;
  } catch (e) {
    console.error("StoreKit purchase error:", e);
    return { success: false };
  }
}

/**
 * Restore previous purchases.
 */
export async function restorePurchases(): Promise<{ isPremium: boolean; restored: boolean }> {
  const plugin = getPlugin();
  if (!plugin) return { isPremium: false, restored: false };
  try {
    const result = await plugin.restorePurchases() as { isPremium: boolean; restored: boolean };
    return result;
  } catch (e) {
    console.error("StoreKit restore error:", e);
    return { isPremium: false, restored: false };
  }
}

/**
 * Check current subscription status.
 */
export async function getActiveSubscription(): Promise<SubscriptionStatus> {
  const plugin = getPlugin();
  if (!plugin) return { isPremium: false };
  try {
    const result = await plugin.getActiveSubscription() as SubscriptionStatus;
    return result;
  } catch (e) {
    console.error("StoreKit getActiveSubscription error:", e);
    return { isPremium: false };
  }
}

/**
 * Listen for subscription status changes (renewals, cancellations).
 * Returns a cleanup function.
 */
export function onSubscriptionChange(callback: (isPremium: boolean) => void): () => void {
  const plugin = getPlugin();
  if (!plugin) return () => {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handle: any = null;
  try {
    handle = (plugin as any).addListener?.("subscriptionStatusChanged", (data: { isPremium: boolean }) => {
      callback(data.isPremium);
    });
  } catch { /* ignore */ }

  return () => {
    try { handle?.remove?.(); } catch { /* ignore */ }
  };
}
