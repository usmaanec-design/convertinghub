import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.resolve(process.cwd(), 'scripts/db/paddle_data.json');

// Ensure DB directory exists
function ensureDbFile() {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE_PATH)) {
    const initialData = {
      customers: {},
      subscriptions: {}
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function loadDb() {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      customers: parsed.customers || {},
      subscriptions: parsed.subscriptions || {}
    };
  } catch (err) {
    console.error('[PaddleStore] Error reading paddle_data.json:', err);
    return { customers: {}, subscriptions: {} };
  }
}

function saveDb(data) {
  ensureDbFile();
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[PaddleStore] Error writing paddle_data.json:', err);
  }
}

/**
 * Upsert Customer record (idempotent keyed on customer_id)
 */
export function upsertCustomer({ customer_id, email, created_at, updated_at }) {
  if (!customer_id) throw new Error('[PaddleStore] customer_id is required for upsertCustomer');

  const dbData = loadDb();
  const existing = dbData.customers[customer_id] || {};
  const now = new Date().toISOString();

  const customerRecord = {
    customer_id,
    email: email || existing.email || '',
    created_at: created_at || existing.created_at || now,
    updated_at: updated_at || now
  };

  dbData.customers[customer_id] = customerRecord;
  saveDb(dbData);
  console.log(`[PaddleStore] Upserted customer: ${customer_id} (${customerRecord.email})`);
  return customerRecord;
}

/**
 * Get Customer by email address
 */
export function getCustomerByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const dbData = loadDb();
  const customer = Object.values(dbData.customers).find(
    (c) => c.email && c.email.trim().toLowerCase() === cleanEmail
  );
  return customer || null;
}

/**
 * Get Customer by ID
 */
export function getCustomerById(customerId) {
  if (!customerId) return null;
  const dbData = loadDb();
  return dbData.customers[customerId] || null;
}

/**
 * Upsert Subscription record (idempotent keyed on subscription_id)
 */
export function upsertSubscription({
  subscription_id,
  customer_id,
  status,
  price_id,
  product_id,
  scheduled_change_action,
  scheduled_change_at,
  created_at,
  updated_at
}) {
  if (!subscription_id) {
    throw new Error('[PaddleStore] subscription_id is required for upsertSubscription');
  }

  const dbData = loadDb();
  const existing = dbData.subscriptions[subscription_id] || {};
  const now = new Date().toISOString();

  const subRecord = {
    subscription_id,
    customer_id: customer_id || existing.customer_id || '',
    status: status || existing.status || 'unknown',
    price_id: price_id || existing.price_id || '',
    product_id: product_id || existing.product_id || '',
    scheduled_change_action:
      scheduled_change_action !== undefined
        ? scheduled_change_action
        : existing.scheduled_change_action || null,
    scheduled_change_at:
      scheduled_change_at !== undefined
        ? scheduled_change_at
        : existing.scheduled_change_at || null,
    created_at: created_at || existing.created_at || now,
    updated_at: updated_at || now
  };

  dbData.subscriptions[subscription_id] = subRecord;
  saveDb(dbData);
  console.log(
    `[PaddleStore] Upserted subscription: ${subscription_id} (Customer: ${subRecord.customer_id}, Status: ${subRecord.status})`
  );
  return subRecord;
}

/**
 * Get Subscription by Customer ID
 */
export function getSubscriptionByCustomerId(customerId) {
  if (!customerId) return null;
  const dbData = loadDb();
  const subs = Object.values(dbData.subscriptions).filter(
    (s) => s.customer_id === customerId
  );
  if (subs.length === 0) return null;
  // Return the most recently updated subscription
  subs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return subs[0];
}

/**
 * Get Subscription by ID
 */
export function getSubscriptionById(subscriptionId) {
  if (!subscriptionId) return null;
  const dbData = loadDb();
  return dbData.subscriptions[subscriptionId] || null;
}

/**
 * Access evaluation helper.
 * Rules:
 * - Treat `active` AND `trialing` as access-granting.
 * - Do NOT revoke access just because a `scheduled_change` (like cancel/pause) exists.
 * - Only revoke when `status` is actually `canceled` (or `paused` / `past_due`).
 */
export function hasActiveSubscription(subscription) {
  if (!subscription || !subscription.status) return false;
  const status = subscription.status.toLowerCase();
  return status === 'active' || status === 'trialing';
}
