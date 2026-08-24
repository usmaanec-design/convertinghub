import { Environment, Paddle } from '@paddle/paddle-node-sdk';
import { upsertCustomer, upsertSubscription } from './db/paddleStore.mjs';

let cachedPaddleIps = [];
let lastIpFetchTime = 0;
const IP_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // Cache for 24 hours

/**
 * Dynamically fetch official Paddle IP CIDR blocks from https://api.paddle.com/ips
 */
export async function getPaddleOfficialIps() {
  const now = Date.now();
  if (cachedPaddleIps.length > 0 && now - lastIpFetchTime < IP_CACHE_TTL_MS) {
    return cachedPaddleIps;
  }

  try {
    const res = await fetch('https://api.paddle.com/ips');
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.ipv4_cidrs) {
        cachedPaddleIps = json.data.ipv4_cidrs.map((cidr) => cidr.split('/')[0]);
        lastIpFetchTime = now;
        console.log('[Paddle Webhook] Dynamically loaded official Paddle IPs:', cachedPaddleIps);
      }
    }
  } catch (err) {
    console.warn('[Paddle Webhook Warning] Failed to fetch official Paddle IPs, fallback to cached:', err);
  }

  return cachedPaddleIps;
}

/**
 * Verify client IP address against official Paddle CIDRs
 */
export async function isPaddleIpAllowed(clientIp) {
  if (!clientIp) return true;

  const allowedIps = await getPaddleOfficialIps();
  if (allowedIps.length === 0) return true; // Fail open if API unreachable

  const cleanClientIp = clientIp.includes(',')
    ? clientIp.split(',')[0].trim()
    : clientIp.trim();

  const isAllowed = allowedIps.includes(cleanClientIp) || cleanClientIp === '127.0.0.1' || cleanClientIp === '::1';
  return isAllowed;
}

/**
 * Get configured Paddle Node SDK instance
 */
function getPaddleNodeSdk() {
  const apiKey = process.env.PADDLE_API_KEY || '';
  const env = (process.env.PADDLE_ENVIRONMENT || 'sandbox').toLowerCase();

  return new Paddle(apiKey, {
    environment: env === 'production' ? Environment.production : Environment.sandbox
  });
}

/**
 * Helper to read raw request body as string
 */
export function getRawRequestBody(req) {
  return new Promise((resolve, reject) => {
    if (typeof req.body === 'string') {
      return resolve(req.body);
    }
    if (Buffer.isBuffer(req.body)) {
      return resolve(req.body.toString('utf-8'));
    }

    let chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Main Webhook Handler for Paddle Deliveries
 */
export async function handlePaddleWebhook(req, res) {
  try {
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        '[Paddle Webhook Error] PADDLE_WEBHOOK_SECRET is missing in process.env. Cannot verify signature.'
      );
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'PADDLE_WEBHOOK_SECRET is not configured on the server.'
        })
      );
      return;
    }

    // IP Allowlist check: Enforce in production or when explicitly enabled
    const isProduction = (process.env.PADDLE_ENVIRONMENT || 'production').toLowerCase() === 'production';
    const enableIpCheck = isProduction || process.env.PADDLE_ENABLE_IP_ALLOWLIST === 'true';

    if (enableIpCheck) {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const allowed = await isPaddleIpAllowed(clientIp);
      if (!allowed) {
        console.warn(`[Paddle Webhook Security Warning] Blocked request from unauthorized IP: ${clientIp}`);
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Access denied: IP address not authorized.' }));
        return;
      }
    }

    // Extract raw text body BEFORE JSON parsing
    const rawBody = await getRawRequestBody(req);

    // Extract signature header
    const signature =
      req.headers['paddle-signature'] ||
      req.headers['Paddle-Signature'] ||
      '';

    if (!signature) {
      console.warn('[Paddle Webhook] Missing Paddle-Signature header');
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing Paddle-Signature header' }));
      return;
    }

    const paddleNodeSdk = getPaddleNodeSdk();
    let eventData;

    try {
      // Verify signature via Paddle Node SDK
      eventData = await paddleNodeSdk.webhooks.unmarshal(
        rawBody,
        webhookSecret,
        signature
      );
    } catch (unmarshalErr) {
      console.error(
        '[Paddle Webhook] Signature verification failed:',
        unmarshalErr.message || unmarshalErr
      );
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Webhook signature verification failed.',
          details: unmarshalErr.message
        })
      );
      return;
    }

    const eventType = eventData.eventType || eventData.event_type;
    const data = eventData.data;

    console.log(`[Paddle Webhook Verified] Event: ${eventType} (ID: ${eventData.eventId})`);

    // Route event to idempotent typed handlers
    switch (eventType) {
      case 'customer.created':
      case 'customer.updated': {
        const customerId = data.id || data.customer_id;
        const email = data.email;
        const createdAt = data.created_at || data.createdAt;
        const updatedAt = data.updated_at || data.updatedAt;

        upsertCustomer({
          customer_id: customerId,
          email,
          created_at: createdAt,
          updated_at: updatedAt
        });
        break;
      }

      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.canceled': {
        const subscriptionId = data.id || data.subscription_id;
        const customerId = data.customer_id || data.customerId;
        const status = data.status;

        let priceId = '';
        let productId = '';

        if (data.items && data.items.length > 0) {
          const firstItem = data.items[0];
          priceId = firstItem.price?.id || firstItem.price_id || '';
          productId = firstItem.price?.product_id || firstItem.product_id || '';
        }

        const scheduledChange = data.scheduled_change;
        const scheduledAction = scheduledChange?.action || null;
        const scheduledAt = scheduledChange?.effective_at || null;

        const createdAt = data.created_at || data.createdAt;
        const updatedAt = data.updated_at || data.updatedAt;

        upsertSubscription({
          subscription_id: subscriptionId,
          customer_id: customerId,
          status,
          price_id: priceId,
          product_id: productId,
          scheduled_change_action: scheduledAction,
          scheduled_change_at: scheduledAt,
          created_at: createdAt,
          updated_at: updatedAt
        });
        break;
      }

      case 'transaction.completed': {
        const customerId = data.customer_id || data.customerId;
        const subscriptionId = data.subscription_id || data.subscriptionId;

        if (data.customer) {
          upsertCustomer({
            customer_id: data.customer.id || customerId,
            email: data.customer.email,
            created_at: data.customer.created_at,
            updated_at: data.customer.updated_at
          });
        }

        if (subscriptionId) {
          upsertSubscription({
            subscription_id: subscriptionId,
            customer_id: customerId,
            status: 'active',
            updated_at: new Date().toISOString()
          });
        }
        break;
      }

      default:
        console.log(`[Paddle Webhook] Safely ignored unhandled event type: ${eventType}`);
        break;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, eventType }));
  } catch (err) {
    console.error('[Paddle Webhook Fatal Error]:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
  }
}
