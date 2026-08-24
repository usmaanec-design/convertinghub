import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  getRatingState,
  dispatchConversionSuccess,
  shouldShowRatingPrompt,
  recordPromptDisplayed,
  recordUserRated,
  resetLastDispatchTimestamp,
  getDownloadState,
  recordSuccessfulDownload,
  checkAndReset10HourLimit,
  getRemainingFreeDownloads,
  canUserDownloadFree,
  TEN_HOURS_MS,
  FREE_CONVERSION_LIMIT
} from './conversionTracker';
import {
  MICROSOFT_STORE_CONFIG,
  openMicrosoftStoreRating
} from '../config/storeConfig';

describe('conversionTracker & storeConfig', () => {
  beforeEach(() => {
    localStorage.clear();
    resetLastDispatchTimestamp();
  });

  it('provides default rating state when storage is empty', () => {
    const state = getRatingState();
    expect(state.hasRated).toBe(false);
    expect(state.totalSuccessfulConversions).toBe(0);
    expect(state.lastPromptedConversionCount).toBe(0);
    expect(state.lastPromptedTimestamp).toBeNull();
  });

  it('triggers rating prompt on 1st successful conversion', () => {
    expect(shouldShowRatingPrompt()).toBe(false);

    dispatchConversionSuccess();

    const state = getRatingState();
    expect(state.totalSuccessfulConversions).toBe(1);
    expect(shouldShowRatingPrompt()).toBe(true);
  });

  it('records prompt displayed timestamp and count', () => {
    dispatchConversionSuccess(); // 1st conversion
    recordPromptDisplayed();

    const state = getRatingState();
    expect(state.lastPromptedConversionCount).toBe(1);
    expect(state.lastPromptedTimestamp).toBeGreaterThan(0);

    // Prompt should NOT show immediately after being displayed
    expect(shouldShowRatingPrompt()).toBe(false);
  });

  it('never shows rating prompt once user has rated', () => {
    dispatchConversionSuccess();
    recordUserRated();

    const state = getRatingState();
    expect(state.hasRated).toBe(true);

    expect(shouldShowRatingPrompt()).toBe(false);
  });

  it('has valid store configuration URLs and exact Product ID 9PHBPD4FF03G', () => {
    expect(MICROSOFT_STORE_CONFIG.productId).toBe('9PHBPD4FF03G');
    expect(MICROSOFT_STORE_CONFIG.reviewUri).toBe(
      'ms-windows-store://review/?ProductId=9PHBPD4FF03G'
    );
    expect(MICROSOFT_STORE_CONFIG.pdpUri).toBe(
      'ms-windows-store://pdp/?ProductId=9PHBPD4FF03G'
    );
    expect(MICROSOFT_STORE_CONFIG.webUrl).toBe(
      'https://apps.microsoft.com/detail/9PHBPD4FF03G'
    );
  });

  it('executes openMicrosoftStoreRating targeting the exact Product ID 9PHBPD4FF03G', () => {
    const originalLocation = window.location;
    const locationMock = { href: '' };
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = locationMock;

    openMicrosoftStoreRating();

    expect(window.location.href).toBe(
      'ms-windows-store://review/?ProductId=9PHBPD4FF03G'
    );

    // Restore window.location
    // @ts-ignore
    window.location = originalLocation;
  });

  it('tracks 10 free conversions per 10-hour period accurately', () => {
    expect(getDownloadState().downloadCount).toBe(0);
    expect(getRemainingFreeDownloads()).toBe(FREE_CONVERSION_LIMIT);
    expect(canUserDownloadFree()).toBe(true);

    for (let i = 1; i <= FREE_CONVERSION_LIMIT; i++) {
      recordSuccessfulDownload();
      expect(getDownloadState().downloadCount).toBe(i);
    }

    expect(getRemainingFreeDownloads()).toBe(0);
    expect(canUserDownloadFree()).toBe(false);
  });

  it('does NOT increment download count on conversion success alone', () => {
    expect(getDownloadState().downloadCount).toBe(0);
    dispatchConversionSuccess();
    expect(getDownloadState().downloadCount).toBe(0);
  });

  it('resets 10-hour conversion limit after 10 hours pass', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    for (let i = 0; i < FREE_CONVERSION_LIMIT; i++) {
      recordSuccessfulDownload();
    }
    expect(canUserDownloadFree()).toBe(false);

    // Advance time by 9 hours (not expired yet)
    vi.setSystemTime(now + 9 * 60 * 60 * 1000);
    expect(canUserDownloadFree()).toBe(false);

    // Advance time by 10 hours + 1 ms (expired)
    vi.setSystemTime(now + TEN_HOURS_MS + 1);
    expect(canUserDownloadFree()).toBe(true);
    expect(getRemainingFreeDownloads()).toBe(FREE_CONVERSION_LIMIT);
    expect(getDownloadState().downloadCount).toBe(0);

    vi.useRealTimers();
  });
});
