import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.resolve(process.cwd(), 'scripts/db/token_data.json');

function ensureDbFile() {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE_PATH)) {
    const initialData = {
      systemConfig: {
        adobeMonthlyLimit: 500,
        adobeMonthlyUsage: 0,
        quotaMonth: getCurrentMonthString()
      },
      userWallets: {},
      anonymousTrials: {},
      transactions: []
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function getCurrentMonthString() {
  const d = new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getCurrentDayString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function loadDb() {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);

    const currentMonth = getCurrentMonthString();
    if (!parsed.systemConfig) {
      parsed.systemConfig = {
        adobeMonthlyLimit: 500,
        adobeMonthlyUsage: 0,
        quotaMonth: currentMonth
      };
    } else if (parsed.systemConfig.quotaMonth !== currentMonth) {
      parsed.systemConfig.quotaMonth = currentMonth;
      parsed.systemConfig.adobeMonthlyUsage = 0;
      saveDb(parsed);
    }

    if (!parsed.anonymousTrials) {
      parsed.anonymousTrials = {};
    }

    return parsed;
  } catch (err) {
    console.error('[TokenStore] Error reading token_data.json:', err);
    return {
      systemConfig: {
        adobeMonthlyLimit: 500,
        adobeMonthlyUsage: 0,
        quotaMonth: getCurrentMonthString()
      },
      userWallets: {},
      anonymousTrials: {},
      transactions: []
    };
  }
}

function saveDb(data) {
  ensureDbFile();
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[TokenStore] Error writing token_data.json:', err);
  }
}

/**
 * Get or initialize user token wallet and plan status
 */
export function getUserWallet(userId) {
  if (!userId || userId === 'guest') return null;
  const dbData = loadDb();
  let wallet = dbData.userWallets[userId];
  const today = getCurrentDayString();

  if (!wallet) {
    wallet = {
      userId,
      plan: 'free',
      trial: {
        authenticatedBonusUsed: false,
        authenticatedBonusGranted: true
      },
      dailyLimit: 10,
      dailyUsed: 0,
      bonusTokens: 0,
      lastResetDate: today,
      lastResetAt: Date.now()
    };
    dbData.userWallets[userId] = wallet;
    saveDb(dbData);
  } else {
    // Daily token reset check for Pro users
    if (wallet.lastResetDate !== today) {
      wallet.dailyUsed = 0;
      wallet.lastResetDate = today;
      wallet.lastResetAt = Date.now();
      dbData.userWallets[userId] = wallet;
      saveDb(dbData);
    }
  }

  const availableTokens = Math.max(0, wallet.dailyLimit - wallet.dailyUsed) + (wallet.bonusTokens || 0);

  return {
    ...wallet,
    availableTokens
  };
}

/**
 * Set user plan (e.g. 'free' or 'pro')
 */
export function setUserPlan(userId, plan) {
  if (!userId || userId === 'guest') return null;
  const dbData = loadDb();
  const wallet = dbData.userWallets[userId] || {
    userId,
    plan,
    trial: {
      authenticatedBonusUsed: false,
      authenticatedBonusGranted: true
    },
    dailyLimit: 10,
    dailyUsed: 0,
    bonusTokens: 0,
    lastResetDate: getCurrentDayString(),
    lastResetAt: Date.now()
  };
  wallet.plan = plan;
  dbData.userWallets[userId] = wallet;
  saveDb(dbData);
  return {
    ...wallet,
    availableTokens: Math.max(0, wallet.dailyLimit - wallet.dailyUsed) + (wallet.bonusTokens || 0)
  };
}

/**
 * Get anonymous trial record
 */
export function getAnonymousTrial(clientTrialId) {
  if (!clientTrialId) return { clientTrialId: 'guest', usedToday: 0 };
  const dbData = loadDb();
  const today = getCurrentDayString();
  let trial = dbData.anonymousTrials[clientTrialId];

  if (!trial) {
    trial = {
      clientTrialId,
      usedToday: 0,
      lastResetDate: today
    };
    dbData.anonymousTrials[clientTrialId] = trial;
    saveDb(dbData);
  } else if (trial.lastResetDate !== today) {
    trial.usedToday = 0;
    trial.lastResetDate = today;
    dbData.anonymousTrials[clientTrialId] = trial;
    saveDb(dbData);
  }

  return trial;
}

/**
 * Get system config (Adobe monthly limit & usage)
 */
export function getSystemConfig() {
  const dbData = loadDb();
  return dbData.systemConfig;
}

/**
 * Centralized Entitlement Checker Function: canConvert(userId, tool, clientTrialId)
 * Stage 1: Anonymous -> 3 combined free trial conversions/day
 * Stage 2: Google-Authenticated Free User -> 1 additional bonus conversion
 * Stage 3: Pro User -> 10 Premium tokens/day + Adobe Global Quota (<500/month)
 * @param {{ userId?: string | null, tool?: string, clientTrialId?: string }} params
 */
export function canConvert({ userId = null, tool = 'pdf-to-word', clientTrialId = 'none' } = {}) {
  const config = getSystemConfig();

  // Normalize tool format (e.g. 'pdf-to-word', 'pdf-to-excel', 'docx', 'xlsx')
  const normalizedTool = (tool || '').toLowerCase();
  const isPaidTool =
    normalizedTool.includes('word') ||
    normalizedTool.includes('docx') ||
    normalizedTool.includes('excel') ||
    normalizedTool.includes('xlsx');

  // Standard free tools have 100% free unlimited access
  if (!isPaidTool) {
    return {
      allowed: true,
      accessType: 'free_standard',
      isPro: false
    };
  }

  // Check global Adobe API quota (must NEVER be bypassed)
  if (config.adobeMonthlyUsage >= config.adobeMonthlyLimit) {
    return {
      allowed: false,
      reason: 'GLOBAL_QUOTA_EXHAUSTED',
      message: 'Monthly Premium conversion capacity limit reached. Please try again when monthly quota resets.',
      isPro: false
    };
  }

  const isValidUser = userId && userId !== 'guest' && userId.trim().length > 0;

  // 1. PRO USER EVALUATION
  if (isValidUser) {
    const wallet = getUserWallet(userId);
    if (wallet && wallet.plan === 'pro') {
      const availableTokens = Math.max(0, wallet.dailyLimit - wallet.dailyUsed) + (wallet.bonusTokens || 0);
      if (availableTokens > 0) {
        return {
          allowed: true,
          accessType: 'pro_token',
          remainingTokens: availableTokens,
          wallet,
          isPro: true
        };
      } else {
        return {
          allowed: false,
          reason: 'DAILY_LIMIT_REACHED',
          message: 'Your daily Premium conversion limit (10/day) has been reached.',
          wallet,
          isPro: true
        };
      }
    }

    // 2. GOOGLE-AUTHENTICATED FREE USER EVALUATION (Stage 2)
    const bonusUsed = wallet?.trial?.authenticatedBonusUsed ?? false;
    if (!bonusUsed) {
      return {
        allowed: true,
        accessType: 'authenticated_bonus',
        remainingBonus: 1,
        isPro: false
      };
    } else {
      // Conversion 5+: Requires Pro Upgrade
      return {
        allowed: false,
        reason: 'PRO_REQUIRED',
        message: 'Free trial completed. Upgrade to Pro to continue converting PDF files to Word and Excel.',
        isPro: false
      };
    }
  }

  // 3. ANONYMOUS USER EVALUATION (Stage 1)
  const trialId = clientTrialId || 'anonymous_default';
  const anonTrial = getAnonymousTrial(trialId);

  if (anonTrial.usedToday < 3) {
    return {
      allowed: true,
      accessType: 'anonymous_trial',
      remainingTrial: 3 - anonTrial.usedToday,
      usedToday: anonTrial.usedToday,
      isPro: false
    };
  } else {
    // Completed 3 free trial conversions -> Require Google Login
    return {
      allowed: false,
      reason: 'LOGIN_REQUIRED',
      message: 'Your 3 free conversions for today are complete. Sign in with Google to get 1 additional free conversion.',
      usedToday: anonTrial.usedToday,
      isPro: false
    };
  }
}

/**
 * Backward compatible alias for canPerformAdobeConversion
 */
export function canPerformAdobeConversion(userId, clientTrialId, tool = 'pdf-to-word') {
  return canConvert({ userId, tool, clientTrialId });
}

/**
 * ATOMIC ACCESS & TOKEN DEDUCTION ONLY UPON CONVERSION SUCCESS
 * @param {{ userId?: string | null, tool?: string, clientTrialId?: string, accessType?: string }} params
 */
export function consumeAccessAfterSuccess({ userId = null, tool = 'pdf-to-word', clientTrialId = 'none', accessType = 'pro_token' } = {}) {
  const dbData = loadDb();
  const normalizedTool = (tool || 'pdf-to-word').toLowerCase();
  const isValidUser = userId && userId !== 'guest' && userId.trim().length > 0;
  const today = getCurrentDayString();

  let walletResult = null;
  let anonResult = null;

  if (accessType === 'pro_token' && isValidUser) {
    const wallet = dbData.userWallets[userId];
    if (wallet) {
      const dailyRemaining = Math.max(0, wallet.dailyLimit - wallet.dailyUsed);
      if (dailyRemaining > 0) {
        wallet.dailyUsed += 1;
      } else if ((wallet.bonusTokens || 0) > 0) {
        wallet.bonusTokens -= 1;
      } else {
        wallet.dailyUsed += 1;
      }
      dbData.userWallets[userId] = wallet;
      walletResult = {
        ...wallet,
        availableTokens: Math.max(0, wallet.dailyLimit - wallet.dailyUsed) + (wallet.bonusTokens || 0)
      };
    }
  } else if (accessType === 'authenticated_bonus' && isValidUser) {
    const wallet = dbData.userWallets[userId] || {
      userId,
      plan: 'free',
      trial: { authenticatedBonusUsed: false, authenticatedBonusGranted: true },
      dailyLimit: 10,
      dailyUsed: 0,
      bonusTokens: 0,
      lastResetDate: today,
      lastResetAt: Date.now()
    };
    wallet.trial = wallet.trial || {};
    wallet.trial.authenticatedBonusUsed = true;
    dbData.userWallets[userId] = wallet;
  } else if (accessType === 'anonymous_trial') {
    const trialId = clientTrialId || 'anonymous_default';
    let trial = dbData.anonymousTrials[trialId];
    if (!trial) {
      trial = { clientTrialId: trialId, usedToday: 0, lastResetDate: today };
    }
    if (trial.lastResetDate !== today) {
      trial.usedToday = 0;
      trial.lastResetDate = today;
    }
    trial.usedToday += 1;
    dbData.anonymousTrials[trialId] = trial;
    anonResult = trial;
  }

  // Increment global Adobe usage
  dbData.systemConfig.adobeMonthlyUsage += 1;

  // Log transaction
  const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const transactionRecord = {
    transactionId,
    userId: isValidUser ? userId : 'anonymous',
    clientTrialId: clientTrialId || 'none',
    tool: normalizedTool,
    accessType,
    tokensUsed: accessType === 'pro_token' ? 1 : 0,
    status: 'success',
    createdAt: new Date().toISOString()
  };
  dbData.transactions.push(transactionRecord);

  saveDb(dbData);

  return {
    wallet: walletResult,
    anonymousTrial: anonResult,
    systemConfig: dbData.systemConfig,
    transaction: transactionRecord
  };
}

/**
 * Backward compatible alias for consumeTokenAfterSuccess
 */
export function consumeTokenAfterSuccess({ userId, tool, clientTrialId, accessType = 'pro_token' }) {
  return consumeAccessAfterSuccess({ userId, tool, clientTrialId, accessType });
}

/**
 * Log failed conversion attempt (NO trial or token deducted)
 */
export function logFailedConversion({ userId, clientTrialId, tool, reason }) {
  const dbData = loadDb();
  const transactionId = `tx_fail_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const transactionRecord = {
    transactionId,
    userId: userId || 'anonymous',
    clientTrialId: clientTrialId || 'none',
    tool,
    type: 'conversion',
    tokensUsed: 0,
    status: 'failed',
    reason,
    createdAt: new Date().toISOString()
  };
  dbData.transactions.push(transactionRecord);
  saveDb(dbData);
  return transactionRecord;
}

/**
 * Get Admin Adobe Statistics
 */
export function getAdminAdobeStats() {
  const dbData = loadDb();
  const userWallets = Object.values(dbData.userWallets);
  userWallets.sort((a, b) => b.dailyUsed - a.dailyUsed);

  return {
    adobeMonthlyLimit: dbData.systemConfig.adobeMonthlyLimit,
    adobeMonthlyUsage: dbData.systemConfig.adobeMonthlyUsage,
    remainingCapacity: Math.max(0, dbData.systemConfig.adobeMonthlyLimit - dbData.systemConfig.adobeMonthlyUsage),
    quotaMonth: dbData.systemConfig.quotaMonth,
    topUsers: userWallets.slice(0, 10).map(u => ({
      userId: u.userId,
      plan: u.plan,
      dailyUsed: u.dailyUsed,
      dailyLimit: u.dailyLimit
    }))
  };
}
