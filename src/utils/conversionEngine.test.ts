import { describe, expect, it } from 'vitest';
import {
  isAdobeQuotaOrRateLimitFailure,
  isTemporaryServiceFailure,
  getNeutralConversionMessage,
  isUserFacingProviderName
} from './conversionEngine';

describe('conversion engine safety', () => {
  it('recognizes Adobe quota and rate-limit failures', () => {
    expect(isAdobeQuotaOrRateLimitFailure('quota exceeded')).toBe(true);
    expect(isAdobeQuotaOrRateLimitFailure('HTTP 429')).toBe(true);
    expect(isAdobeQuotaOrRateLimitFailure('usage limit reached')).toBe(true);
    expect(isAdobeQuotaOrRateLimitFailure('authentication failed')).toBe(false);
  });

  it('classifies temporary backend failures', () => {
    expect(isTemporaryServiceFailure('timeout')).toBe(true);
    expect(isTemporaryServiceFailure('503 Service Unavailable')).toBe(true);
    expect(isTemporaryServiceFailure('Invalid document')).toBe(false);
  });

  it('uses neutral user-facing status strings without provider names', () => {
    const msg = getNeutralConversionMessage('pdf-to-docx');
    expect(msg).toContain('Processing');
    expect(isUserFacingProviderName(msg)).toBe(false);
  });
});
