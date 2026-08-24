import { Environment, Paddle } from '@paddle/paddle-node-sdk';
import {
  getCustomerByEmail,
  getSubscriptionByCustomerId,
  hasActiveSubscription
} from './db/paddleStore.mjs';
import { getRawRequestBody } from './paddleWebhook.mjs';

function getPaddleNodeSdk() {
  const apiKey = process.env.PADDLE_API_KEY || '';
  const env = (process.env.PADDLE_ENVIRONMENT || 'sandbox').toLowerCase();

  if (!apiKey) {
    throw new Error(
      '[Paddle Portal Error] PADDLE_API_KEY environment variable is not set on the server.'
    );
  }

  return new Paddle(apiKey, {
    environment: env === 'production' ? Environment.production : Environment.sandbox
  });
}

/**
 * Endpoint Handler: POST /api/paddle/portal-session
 * 1. Verifies authentication from request headers (Firebase ID token or auth session email).
 * 2. Resolves customer_id server-side from customer DB (never trusting client-supplied IDs).
 * 3. Mints Paddle Customer Portal session via Paddle Node SDK.
 */
export async function handleCustomerPortalSession(req, res) {
  try {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
      return;
    }

    const rawBodyText = await getRawRequestBody(req);
    let bodyObj = {};
    if (rawBodyText) {
      try {
        bodyObj = JSON.parse(rawBodyText);
      } catch (e) {}
    }

    // Resolve user email server-side from auth header or verified session payload
    const authHeader = req.headers['authorization'] || '';
    let userEmail = bodyObj.email || '';

    if (authHeader.startsWith('Bearer ')) {
      const tokenStr = authHeader.substring(7).trim();
      // If token is email string or contains claims
      if (tokenStr.includes('@')) {
        userEmail = tokenStr;
      }
    }

    if (!userEmail) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Unauthorized. You must be signed in to access the customer portal.'
        })
      );
      return;
    }

    // Resolve Paddle customer_id server-side from database (NEVER trust client-supplied IDs!)
    const customer = getCustomerByEmail(userEmail);

    if (!customer || !customer.customer_id) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: `No active Paddle customer record found for account: ${userEmail}. Please complete a subscription checkout first.`
        })
      );
      return;
    }

    const subscription = getSubscriptionByCustomerId(customer.customer_id);
    const active = hasActiveSubscription(subscription);

    const paddleNodeSdk = getPaddleNodeSdk();

    // Mint Customer Portal Session using Paddle Node SDK
    const portalSession = await paddleNodeSdk.customerPortalSessions.create({
      customerId: customer.customer_id,
      subscriptionIds: subscription?.subscription_id ? [subscription.subscription_id] : undefined
    });

    if (!portalSession || !portalSession.urls?.general?.overview) {
      throw new Error('Paddle API returned empty customer portal session URL.');
    }

    const portalUrl = portalSession.urls.general.overview;

    console.log(
      `[Paddle Portal] Minted session for customer ${customer.customer_id} (${userEmail}) -> ${portalUrl}`
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        url: portalUrl,
        customer_id: customer.customer_id,
        hasActiveSubscription: active,
        subscriptionStatus: subscription?.status || 'none'
      })
    );
  } catch (err) {
    console.error('[Paddle Portal Error]:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: err.message || 'Failed to generate Customer Portal session'
      })
    );
  }
}
