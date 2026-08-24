/**
 * Conversion Success Tracker & 10-Hour Free Conversion Limit Manager
 */

export interface MicrosoftStoreRatingState {
  hasRated: boolean;
  totalSuccessfulConversions: number;
  lastPromptedConversionCount: number;
  lastPromptedTimestamp: number | null;
}

export interface DownloadLimitState {
  downloadCount: number;
  downloadPeriodStart: number | null;
  lastSuccessfulDownload: number | null;
}

const RATING_STORAGE_KEY = 'convertinghub_ms_store_rating_state';
const DOWNLOAD_STORAGE_KEY = 'convertinghub_download_limit_state';

export const TEN_HOURS_MS = 10 * 60 * 60 * 1000; // 10 hours in milliseconds
export const FREE_CONVERSION_LIMIT = 10; // 10 free conversions

const DEFAULT_RATING_STATE: MicrosoftStoreRatingState = {
  hasRated: false,
  totalSuccessfulConversions: 0,
  lastPromptedConversionCount: 0,
  lastPromptedTimestamp: null
};

const DEFAULT_DOWNLOAD_STATE: DownloadLimitState = {
  downloadCount: 0,
  downloadPeriodStart: null,
  lastSuccessfulDownload: null
};

export const getRatingState = (): MicrosoftStoreRatingState => {
  if (typeof window === 'undefined') return DEFAULT_RATING_STATE;
  try {
    const raw = localStorage.getItem(RATING_STORAGE_KEY);
    if (!raw) return DEFAULT_RATING_STATE;
    const parsed = JSON.parse(raw);
    return {
      hasRated: Boolean(parsed.hasRated),
      totalSuccessfulConversions: Number(
        parsed.totalSuccessfulConversions || 0
      ),
      lastPromptedConversionCount: Number(
        parsed.lastPromptedConversionCount || 0
      ),
      lastPromptedTimestamp: parsed.lastPromptedTimestamp
        ? Number(parsed.lastPromptedTimestamp)
        : null
    };
  } catch (e) {
    console.warn(
      '[ConversionTracker] Failed to parse rating state from localStorage:',
      e
    );
    return DEFAULT_RATING_STATE;
  }
};

export const saveRatingState = (state: MicrosoftStoreRatingState): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn(
      '[ConversionTracker] Failed to save rating state to localStorage:',
      e
    );
  }
};

export const hasUserRated = (): boolean => {
  return getRatingState().hasRated;
};

export const recordUserRated = (): void => {
  const state = getRatingState();
  saveRatingState({
    ...state,
    hasRated: true
  });
};

/**
 * Download / Conversion Limit Tracking (10 Free Conversions Per 10 Hours)
 */
export const getDownloadState = (): DownloadLimitState => {
  if (typeof window === 'undefined') return DEFAULT_DOWNLOAD_STATE;
  try {
    const raw = localStorage.getItem(DOWNLOAD_STORAGE_KEY);
    if (!raw) return DEFAULT_DOWNLOAD_STATE;
    const parsed = JSON.parse(raw);
    return {
      downloadCount: Number(parsed.downloadCount || 0),
      downloadPeriodStart: parsed.downloadPeriodStart
        ? Number(parsed.downloadPeriodStart)
        : null,
      lastSuccessfulDownload: parsed.lastSuccessfulDownload
        ? Number(parsed.lastSuccessfulDownload)
        : null
    };
  } catch (e) {
    console.warn(
      '[ConversionTracker] Failed to parse download state from localStorage:',
      e
    );
    return DEFAULT_DOWNLOAD_STATE;
  }
};

export const saveDownloadState = (state: DownloadLimitState): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DOWNLOAD_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn(
      '[ConversionTracker] Failed to save download state to localStorage:',
      e
    );
  }
};

/**
 * Checks if 10 hours have passed since downloadPeriodStart.
 * If so, resets downloadCount to 0 and clears downloadPeriodStart.
 */
export const checkAndReset10HourLimit = (): DownloadLimitState => {
  const state = getDownloadState();
  const now = Date.now();

  if (state.downloadPeriodStart !== null) {
    const elapsed = now - state.downloadPeriodStart;
    if (elapsed >= TEN_HOURS_MS) {
      const resetState: DownloadLimitState = {
        downloadCount: 0,
        downloadPeriodStart: null,
        lastSuccessfulDownload: state.lastSuccessfulDownload
      };
      saveDownloadState(resetState);
      return resetState;
    }
  }

  return state;
};

// Backward-compatible alias
export const checkAndReset15HourLimit = checkAndReset10HourLimit;

/**
 * Gets milliseconds remaining until the 10-hour limit resets.
 */
export const getResetTimeRemainingMs = (): number => {
  const state = checkAndReset10HourLimit();
  if (!state.downloadPeriodStart) return 0;
  const elapsed = Date.now() - state.downloadPeriodStart;
  return Math.max(0, TEN_HOURS_MS - elapsed);
};

/**
 * Formats time remaining into a readable string (e.g. "9h 45m" or "30m")
 */
export const formatResetTimeRemaining = (): string => {
  const ms = getResetTimeRemainingMs();
  if (ms <= 0) return '0m';

  const totalMinutes = Math.ceil(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Gets the number of free conversions remaining in the current 10-hour period.
 */
export const getRemainingFreeDownloads = (): number => {
  const state = checkAndReset10HourLimit();
  return Math.max(0, FREE_CONVERSION_LIMIT - state.downloadCount);
};

/**
 * Returns true if the user can make a free conversion.
 */
export const canUserDownloadFree = (): boolean => {
  return getRemainingFreeDownloads() > 0;
};

/**
 * Records that a file conversion/download was SUCCESSFULLY completed.
 * Increments downloadCount and sets downloadPeriodStart on the first conversion.
 */
export const recordSuccessfulDownload = (): DownloadLimitState => {
  const currentState = checkAndReset10HourLimit();
  const now = Date.now();

  const newPeriodStart =
    currentState.downloadPeriodStart === null
      ? now
      : currentState.downloadPeriodStart;

  const updatedState: DownloadLimitState = {
    downloadCount: currentState.downloadCount + 1,
    downloadPeriodStart: newPeriodStart,
    lastSuccessfulDownload: now
  };

  saveDownloadState(updatedState);
  return updatedState;
};

let lastDispatchTimestamp = 0;

export const resetLastDispatchTimestamp = (): void => {
  lastDispatchTimestamp = 0;
};

/**
 * Dispatches a central conversion completion event when a conversion
 * reaches 100% and output file is generated and ready for download.
 */
export const dispatchConversionSuccess = (): void => {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  if (now - lastDispatchTimestamp < 2000) return;
  lastDispatchTimestamp = now;

  const state = getRatingState();
  const updatedState: MicrosoftStoreRatingState = {
    ...state,
    totalSuccessfulConversions: state.totalSuccessfulConversions + 1
  };
  saveRatingState(updatedState);

  window.dispatchEvent(new Event('conversionCompleted'));
  window.dispatchEvent(new Event('toolUsageCompleted'));
};

/**
 * Determines whether the rating prompt modal should be displayed.
 */
export const shouldShowRatingPrompt = (): boolean => {
  const state = getRatingState();
  if (state.hasRated) return false;

  const total = state.totalSuccessfulConversions;
  if (total === 1 && state.lastPromptedConversionCount === 0) {
    return true;
  }

  const minConversionsDelta = 5;
  const minDaysMs = 3 * 24 * 60 * 60 * 1000;

  const conversionsSinceLastPrompt = total - state.lastPromptedConversionCount;
  const timeSinceLastPrompt = state.lastPromptedTimestamp
    ? Date.now() - state.lastPromptedTimestamp
    : Infinity;

  return (
    conversionsSinceLastPrompt >= minConversionsDelta &&
    timeSinceLastPrompt >= minDaysMs
  );
};

export const recordPromptDisplayed = (): void => {
  const state = getRatingState();
  saveRatingState({
    ...state,
    lastPromptedConversionCount: state.totalSuccessfulConversions,
    lastPromptedTimestamp: Date.now()
  });
};
