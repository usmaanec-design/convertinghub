import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      vars[k] = v;
    }
  }
  return vars;
}

export async function runPreflight() {
  const env = loadEnv();
  const apiKey = env['PADDLE_API_KEY'];
  const clientToken = env['VITE_PADDLE_CLIENT_TOKEN'];
  const clientEnv = env['VITE_PADDLE_ENVIRONMENT'];
  const priceId = env['VITE_PADDLE_PRO_PRICE_ID'] || 'pri_01m0jtv6r29t5twfz0d0g3gvxx';
  const webhookSecret = env['PADDLE_WEBHOOK_SECRET'];

  const results = {
    apiAuth: false,
    checkoutDomain: false,
    priceId: false,
    webhookConfig: false,
    frontendConfig: false,
    notes: []
  };

  // 1. Frontend Paddle configuration check
  if (
    clientEnv === 'production' &&
    typeof clientToken === 'string' &&
    clientToken.startsWith('live_') &&
    clientToken.length > 20 &&
    typeof priceId === 'string' &&
    priceId.startsWith('pri_')
  ) {
    results.frontendConfig = true;
  } else {
    results.notes.push('Frontend Paddle config check failed (verify VITE_PADDLE_ENVIRONMENT, VITE_PADDLE_CLIENT_TOKEN, and VITE_PADDLE_PRO_PRICE_ID).');
  }

  // If no apiKey in .env or still old identifier
  if (!apiKey || !apiKey.startsWith('pdl_')) {
    results.notes.push('PADDLE_API_KEY in .env does not start with pdl_ or is missing. Please save the full secret key generated from Paddle Dashboard into .env.');
    return results;
  }

  // 2. Test API Authentication
  try {
    const authRes = await fetch('https://api.paddle.com/event-types', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (authRes.ok) {
      results.apiAuth = true;
    } else {
      results.notes.push(`API authentication returned HTTP ${authRes.status}.`);
      return results;
    }
  } catch (err) {
    results.notes.push(`API authentication network error: ${err.message}`);
    return results;
  }

  // 3. Test Checkout Domains (convertinghub.app)
  try {
    const domainRes = await fetch('https://api.paddle.com/checkout-domains', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (domainRes.ok) {
      const data = await domainRes.json();
      const list = data?.data || [];
      const found = list.find((d) => (d.domain || '').toLowerCase().includes('convertinghub.app'));
      if (found && found.status === 'approved') {
        results.checkoutDomain = true;
      } else if (found) {
        results.notes.push(`Domain convertinghub.app found with status "${found.status}". Must be "approved".`);
      } else {
        const existing = list.map((d) => `${d.domain} (${d.status})`).join(', ');
        results.notes.push(`convertinghub.app not found in checkout domains list. Existing: [${existing || 'none'}]`);
      }
    } else {
      results.notes.push(`Checkout domains API returned HTTP ${domainRes.status}.`);
    }
  } catch (err) {
    results.notes.push(`Checkout domains check failed: ${err.message}`);
  }

  // 4. Test Price ID
  try {
    const priceRes = await fetch(`https://api.paddle.com/prices/${priceId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (priceRes.ok) {
      const data = await priceRes.json();
      if (data?.data && data.data.status === 'active') {
        results.priceId = true;
      } else {
        results.notes.push(`Price ${priceId} status is "${data?.data?.status || 'unknown'}". Must be active.`);
      }
    } else {
      results.notes.push(`Price lookup for ${priceId} returned HTTP ${priceRes.status}.`);
    }
  } catch (err) {
    results.notes.push(`Price check failed: ${err.message}`);
  }

  // 5. Test Webhook Configuration
  try {
    const notifRes = await fetch('https://api.paddle.com/notification-settings', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (notifRes.ok) {
      const data = await notifRes.json();
      const settings = data?.data || [];
      const hasActive = settings.some((s) => s.active);
      const secretLooksValid = typeof webhookSecret === 'string' && webhookSecret.length >= 10;

      if (hasActive && secretLooksValid) {
        results.webhookConfig = true;
      } else if (!hasActive) {
        results.notes.push('No active notification/webhook destinations found in Paddle account.');
      } else if (!secretLooksValid) {
        results.notes.push('PADDLE_WEBHOOK_SECRET in .env appears missing or malformed.');
      }
    } else {
      results.notes.push(`Notification settings lookup returned HTTP ${notifRes.status}.`);
    }
  } catch (err) {
    results.notes.push(`Webhook configuration check failed: ${err.message}`);
  }

  return results;
}

if (process.argv[1] && process.argv[1].endsWith('verify_paddle_preflight.mjs')) {
  runPreflight().then((res) => {
    console.log(`* API authentication: ${res.apiAuth ? 'PASS' : 'FAIL'}`);
    console.log(`* Checkout domain: ${res.checkoutDomain ? 'PASS' : 'FAIL'}`);
    console.log(`* Price ID: ${res.priceId ? 'PASS' : 'FAIL'}`);
    console.log(`* Webhook configuration: ${res.webhookConfig ? 'PASS' : 'FAIL'}`);
    console.log(`* Frontend Paddle configuration: ${res.frontendConfig ? 'PASS' : 'FAIL'}`);
    if (res.notes.length > 0) {
      console.log('\nNotes / Actions Required:');
      for (const n of res.notes) {
        console.log(`- ${n}`);
      }
    }
  });
}
