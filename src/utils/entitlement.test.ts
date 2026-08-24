import { describe, it, expect } from 'vitest';
import {
  canConvert,
  consumeAccessAfterSuccess,
  getUserWallet,
  setUserPlan,
  getAnonymousTrial,
  getSystemConfig
} from '../../scripts/db/tokenStore.mjs';

describe('Centralized 3-Stage Entitlement System (PDF to Word & PDF to Excel)', () => {
  const trialIdA = `test_trial_A_${Date.now()}`;
  const trialIdB = `test_trial_B_${Date.now()}`;
  const userIdFree = `test_user_free_${Date.now()}`;
  const userIdPro = `test_user_pro_${Date.now()}`;

  it('TEST A: New user performs 3 free trial conversions (2 Word + 1 Excel) -> All Allowed', () => {
    // Conversion 1: PDF to Word
    const check1 = canConvert({ tool: 'pdf-to-word', clientTrialId: trialIdA });
    expect(check1.allowed).toBe(true);
    expect(check1.accessType).toBe('anonymous_trial');
    consumeAccessAfterSuccess({ tool: 'pdf-to-word', clientTrialId: trialIdA, accessType: 'anonymous_trial' });

    // Conversion 2: PDF to Excel
    const check2 = canConvert({ tool: 'pdf-to-excel', clientTrialId: trialIdA });
    expect(check2.allowed).toBe(true);
    expect(check2.accessType).toBe('anonymous_trial');
    consumeAccessAfterSuccess({ tool: 'pdf-to-excel', clientTrialId: trialIdA, accessType: 'anonymous_trial' });

    // Conversion 3: PDF to Word
    const check3 = canConvert({ tool: 'pdf-to-word', clientTrialId: trialIdA });
    expect(check3.allowed).toBe(true);
    expect(check3.accessType).toBe('anonymous_trial');
    consumeAccessAfterSuccess({ tool: 'pdf-to-word', clientTrialId: trialIdA, accessType: 'anonymous_trial' });

    const anon = getAnonymousTrial(trialIdA);
    expect(anon.usedToday).toBe(3);
  });

  it('TEST B: Same anonymous user attempts conversion #4 -> Google Login Required', () => {
    const check4 = canConvert({ tool: 'pdf-to-word', clientTrialId: trialIdA });
    expect(check4.allowed).toBe(false);
    expect(check4.reason).toBe('LOGIN_REQUIRED');
  });

  it('TEST C & D: User signs in with Google -> Exactly 1 additional free conversion granted & executed (#4)', () => {
    setUserPlan(userIdFree, 'free');

    const checkAuthBonus = canConvert({ userId: userIdFree, tool: 'pdf-to-word', clientTrialId: trialIdA });
    expect(checkAuthBonus.allowed).toBe(true);
    expect(checkAuthBonus.accessType).toBe('authenticated_bonus');
    expect(checkAuthBonus.remainingBonus).toBe(1);

    // Consume 4th conversion
    consumeAccessAfterSuccess({ userId: userIdFree, tool: 'pdf-to-word', clientTrialId: trialIdA, accessType: 'authenticated_bonus' });

    const wallet = getUserWallet(userIdFree);
    expect(wallet.trial.authenticatedBonusUsed).toBe(true);
  });

  it('TEST E: Authenticated free user attempts conversion #5 -> Pro Required', () => {
    const check5 = canConvert({ userId: userIdFree, tool: 'pdf-to-excel', clientTrialId: trialIdA });
    expect(check5.allowed).toBe(false);
    expect(check5.reason).toBe('PRO_REQUIRED');
  });

  it('TEST F, G, H: Shared combined counter across PDF to Word and PDF to Excel', () => {
    // Word 1 + Excel 2 = 3 total -> Login required
    for (let i = 0; i < 3; i++) {
      const tool = i === 0 ? 'pdf-to-word' : 'pdf-to-excel';
      const c = canConvert({ tool, clientTrialId: trialIdB });
      expect(c.allowed).toBe(true);
      consumeAccessAfterSuccess({ tool, clientTrialId: trialIdB, accessType: 'anonymous_trial' });
    }

    const checkExhausted = canConvert({ tool: 'pdf-to-excel', clientTrialId: trialIdB });
    expect(checkExhausted.allowed).toBe(false);
    expect(checkExhausted.reason).toBe('LOGIN_REQUIRED');
  });

  it('TEST I: Failed conversion does NOT increment trial counter', () => {
    const testId = `test_fail_${Date.now()}`;
    const initial = canConvert({ tool: 'pdf-to-word', clientTrialId: testId });
    expect(initial.allowed).toBe(true);

    // Simulate failure -> do NOT call consumeAccessAfterSuccess
    const afterFail = canConvert({ tool: 'pdf-to-word', clientTrialId: testId });
    expect(afterFail.allowed).toBe(true);
    expect(afterFail.usedToday).toBe(0);
  });

  it('TEST J & K: Pro User has 10/day shared pool between Word (6) and Excel (4)', () => {
    setUserPlan(userIdPro, 'pro');

    // 6 Word conversions
    for (let i = 0; i < 6; i++) {
      const c = canConvert({ userId: userIdPro, tool: 'pdf-to-word', clientTrialId: 'pro_test' });
      expect(c.allowed).toBe(true);
      expect(c.accessType).toBe('pro_token');
      consumeAccessAfterSuccess({ userId: userIdPro, tool: 'pdf-to-word', clientTrialId: 'pro_test', accessType: 'pro_token' });
    }

    // 4 Excel conversions
    for (let i = 0; i < 4; i++) {
      const c = canConvert({ userId: userIdPro, tool: 'pdf-to-excel', clientTrialId: 'pro_test' });
      expect(c.allowed).toBe(true);
      expect(c.accessType).toBe('pro_token');
      consumeAccessAfterSuccess({ userId: userIdPro, tool: 'pdf-to-excel', clientTrialId: 'pro_test', accessType: 'pro_token' });
    }

    const wallet = getUserWallet(userIdPro);
    expect(wallet.dailyUsed).toBe(10);
    expect(wallet.availableTokens).toBe(0);

    // 11th attempt -> Daily limit reached
    const check11 = canConvert({ userId: userIdPro, tool: 'pdf-to-word', clientTrialId: 'pro_test' });
    expect(check11.allowed).toBe(false);
    expect(check11.reason).toBe('DAILY_LIMIT_REACHED');
  });

  it('TEST L & M & N: Pro User Status & Wallet Visibility', () => {
    const freeUser = getUserWallet(userIdFree);
    expect(freeUser.plan).toBe('free');

    const updatedPro = setUserPlan(userIdFree, 'pro');
    expect(updatedPro.plan).toBe('pro');
    expect(updatedPro.availableTokens).toBe(10);
  });

  it('TEST O: Adobe global quota protection never exceeds limit', () => {
    const sys = getSystemConfig();
    expect(sys.adobeMonthlyLimit).toBe(500);
    expect(sys.adobeMonthlyUsage).toBeLessThanOrEqual(500);
  });
});
