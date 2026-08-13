export function resolveAdobeCredentials(env = process.env) {
  const candidates = [
    ['ADOBE_CLIENT_ID', 'ADOBE_CLIENT_SECRET'],
    ['PDF_SERVICES_CLIENT_ID', 'PDF_SERVICES_CLIENT_SECRET'],
    ['ADOBE_API_KEY', 'ADOBE_API_SECRET'],
    ['ADOBE_PDF_SERVICES_CLIENT_ID', 'ADOBE_PDF_SERVICES_CLIENT_SECRET']
  ];

  for (const [clientKey, secretKey] of candidates) {
    const clientId = String(env[clientKey] || '').trim();
    const clientSecret = String(env[secretKey] || '').trim();

    if (clientId && clientSecret) {
      return {
        clientId,
        clientSecret,
        source: `${clientKey}/${secretKey}`
      };
    }
  }

  const fallbackClientId = String(env.ADOBE_CLIENT_ID || env.PDF_SERVICES_CLIENT_ID || '').trim();
  const fallbackClientSecret = String(env.ADOBE_CLIENT_SECRET || env.PDF_SERVICES_CLIENT_SECRET || '').trim();

  return {
    clientId: fallbackClientId,
    clientSecret: fallbackClientSecret,
    source: fallbackClientId && fallbackClientSecret ? 'fallback-legacy' : null
  };
}
