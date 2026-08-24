/**
 * Central Microsoft Store Integration Configuration
 * Stores the Product ID / App ID and deep-link URI logic.
 */

export const MICROSOFT_STORE_CONFIG = {
  // Official Microsoft Store Product ID for ConvertingHub
  // Can be configured via VITE_MICROSOFT_STORE_PRODUCT_ID env variable
  productId: import.meta.env.VITE_MICROSOFT_STORE_PRODUCT_ID || '9PHBPD4FF03G',

  // Microsoft Store Rating/Review Deep Link URI (Opens Store app directly to review tab)
  get reviewUri(): string {
    return `ms-windows-store://review/?ProductId=${this.productId}`;
  },

  // Microsoft Store Product Detail Page (PDP) URI (Fallback Store app URI)
  get pdpUri(): string {
    return `ms-windows-store://pdp/?ProductId=${this.productId}`;
  },

  // Official Web Browser Fallback URL
  get webUrl(): string {
    return `https://apps.microsoft.com/detail/${this.productId}`;
  }
};

/**
 * Gracefully opens the Microsoft Store rating / review flow.
 * 1. Attempts ms-windows-store://review/?ProductId=... protocol link.
 * 2. If protocol fails or is unsupported, attempts pdp protocol link.
 * 3. Gracefully falls back to web product URL without crashing.
 */
export const openMicrosoftStoreRating = (): void => {
  const { productId, reviewUri, pdpUri, webUrl } = MICROSOFT_STORE_CONFIG;
  if (!productId) return;

  try {
    const isWindows =
      typeof navigator !== 'undefined' &&
      /Win/i.test(navigator.userAgent || '');
    if (isWindows) {
      // In Windows desktop / MSIX / PWA context, setting location.href triggers Windows Store app
      window.location.href = reviewUri;
    } else {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    console.warn(
      '[Microsoft Store] Direct review protocol failed, attempting fallback:',
      err
    );
    try {
      window.location.href = pdpUri;
    } catch (e) {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  }
};
