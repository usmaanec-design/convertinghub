import { triggerRatingPromptIfNeeded } from '../components/MicrosoftStoreRatingDialog';
import { requestGoogleLoginWithModal } from '../components/DownloadAuthModal';
import {
  canUserDownloadFree,
  checkAndReset10HourLimit,
  formatResetTimeRemaining,
  hasUserRated,
  recordSuccessfulDownload
} from './conversionTracker';

export interface ProtectedDownloadAuthContext {
  isAuthenticated: boolean;
  isProUser?: boolean;
  signInWithGoogle: () => Promise<void>;
}

/**
 * Executes a file download through the required pipeline:
 * 1. Rating Popup Check (if user has not rated yet).
 * 2. Pro User Check (Pro users bypass 10-conversion limit).
 * 3. 10-Hour Download Limit Check (10 free conversions per 10 hours for free/guest users).
 * 4. File download execution and success recording ONLY when download succeeds.
 */
export async function executeProtectedDownload(
  downloadFn: () => void | Promise<void>,
  authContext?: ProtectedDownloadAuthContext
): Promise<boolean> {
  // Step 1: Rating Popup Flow
  if (!hasUserRated()) {
    try {
      await triggerRatingPromptIfNeeded();
    } catch (e) {
      console.warn('[DownloadInterceptor] Rating prompt error:', e);
    }
  }

  // Step 2: Ensure 10-hour limit state is up-to-date
  checkAndReset10HourLimit();

  // Step 3: Check Pro Subscription Status
  const isProUser = authContext?.isProUser ?? false;

  if (isProUser) {
    // Pro / Business Subscribers bypass 10-conversion limit
    try {
      await downloadFn();
      recordSuccessfulDownload();
      return true;
    } catch (err) {
      console.error('[DownloadInterceptor] Pro download execution failed:', err);
      return false;
    }
  }

  // All standard tools are 100% free and unlimited!
  try {
    await downloadFn();
    recordSuccessfulDownload();
    return true;
  } catch (err) {
    console.error('[DownloadInterceptor] Download execution failed:', err);
    return false;
  }
}
