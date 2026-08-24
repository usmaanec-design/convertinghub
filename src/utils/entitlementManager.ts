import { getBackendUrl } from './backendConfig';

export interface EntitlementStatus {
  allowed: boolean;
  accessType?: 'anonymous_trial' | 'authenticated_bonus' | 'pro_token' | 'free_standard';
  reason?: 'LOGIN_REQUIRED' | 'PRO_REQUIRED' | 'DAILY_LIMIT_REACHED' | 'GLOBAL_QUOTA_EXHAUSTED';
  message?: string;
  remainingTrial?: number;
  remainingBonus?: number;
  remainingTokens?: number;
  usedToday?: number;
  isPro?: boolean;
}

const CLIENT_TRIAL_KEY = 'convertinghub_client_trial_id';

export function getClientTrialId(): string {
  if (typeof window === 'undefined') return 'anonymous_ssr';
  try {
    let id = localStorage.getItem(CLIENT_TRIAL_KEY);
    if (!id) {
      id = `trial_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(CLIENT_TRIAL_KEY, id);
    }
    return id;
  } catch (e) {
    return 'anonymous_fallback';
  }
}

export async function fetchEntitlementStatus(
  tool: string,
  userId?: string | null
): Promise<EntitlementStatus> {
  const clientTrialId = getClientTrialId();
  const headers: Record<string, string> = {
    'x-client-trial-id': clientTrialId
  };

  if (userId) {
    headers['x-user-id'] = userId;
    headers['authorization'] = `Bearer ${userId}`;
  }

  try {
    const fullUrl = getBackendUrl(
      `/api/tokens/entitlement?tool=${encodeURIComponent(tool)}&clientTrialId=${encodeURIComponent(clientTrialId)}`
    );
    const res = await fetch(fullUrl, {
      headers,
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.entitlement) {
        return data.entitlement;
      }
      return { allowed: true, accessType: 'free_standard' };
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.entitlement) {
        return errData.entitlement;
      }
      // If backend is sleeping or unreachable, don't block user with network error
      return {
        allowed: true,
        accessType: 'free_standard',
        message: errData.error || 'Server offline. Free conversion mode enabled.'
      };
    }
  } catch (err) {
    console.warn('[EntitlementManager] Backend check unreachable, allowing free conversion fallback:', err);
    return {
      allowed: true,
      accessType: 'free_standard'
    };
  }
}
