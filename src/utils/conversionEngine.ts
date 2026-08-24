export type AdobeFailureKind =
  | 'quota_exhausted'
  | 'rate_limited'
  | 'temporary_failure'
  | 'timeout'
  | 'authentication'
  | 'invalid_response'
  | 'document_limit'
  | 'unknown';

export interface ConversionStatusMessage {
  userMessage: string;
  fallbackNeeded: boolean;
  kind: AdobeFailureKind;
}

export function isAdobeQuotaOrRateLimitFailure(message: string): boolean {
  const normalized = (message || '').toLowerCase();
  return (
    normalized.includes('quota') ||
    normalized.includes('limit reached') ||
    normalized.includes('usage limit') ||
    normalized.includes('429') ||
    normalized.includes('rate limit') ||
    normalized.includes('too many requests') ||
    normalized.includes('monthly quota') ||
    normalized.includes('exceeded')
  );
}

export function isTemporaryServiceFailure(message: string): boolean {
  const normalized = (message || '').toLowerCase();
  return (
    normalized.includes('timeout') ||
    normalized.includes('timed out') ||
    normalized.includes('503') ||
    normalized.includes('5xx') ||
    normalized.includes('temporary') ||
    normalized.includes('service unavailable') ||
    normalized.includes('server failure') ||
    normalized.includes('connection reset') ||
    normalized.includes('network error')
  );
}

export function getNeutralConversionMessage(target: string): string {
  const label = target?.toLowerCase() || 'document';
  const baseMessages = {
    docx: 'Processing document...',
    xlsx: 'Processing spreadsheet...',
    pptx: 'Processing presentation...',
    pdf: 'Processing document...'
  };
  return (
    baseMessages[label as keyof typeof baseMessages] || 'Processing document...'
  );
}

export function isUserFacingProviderName(value: string): boolean {
  const normalized = (value || '').toLowerCase();
  return /(adobe|libreoffice|fallback engine|provider|backend engine|adobe api|libreoffice headless)/.test(
    normalized
  );
}

export function classifyAdobeError(message: string): ConversionStatusMessage {
  const normalized = (message || '').toLowerCase();

  if (isAdobeQuotaOrRateLimitFailure(normalized)) {
    return {
      userMessage: getNeutralConversionMessage('docx'),
      fallbackNeeded: true,
      kind:
        normalized.includes('429') || normalized.includes('rate limit')
          ? 'rate_limited'
          : 'quota_exhausted'
    };
  }

  if (
    normalized.includes('auth') ||
    normalized.includes('unauthorized') ||
    normalized.includes('invalid credentials')
  ) {
    return {
      userMessage: getNeutralConversionMessage('docx'),
      fallbackNeeded: true,
      kind: 'authentication'
    };
  }

  if (normalized.includes('timeout') || normalized.includes('timed out')) {
    return {
      userMessage: getNeutralConversionMessage('docx'),
      fallbackNeeded: true,
      kind: 'timeout'
    };
  }

  if (
    normalized.includes('503') ||
    normalized.includes('5xx') ||
    normalized.includes('temporary') ||
    normalized.includes('server failure')
  ) {
    return {
      userMessage: getNeutralConversionMessage('docx'),
      fallbackNeeded: true,
      kind: 'temporary_failure'
    };
  }

  if (normalized.includes('document') && normalized.includes('limit')) {
    return {
      userMessage: getNeutralConversionMessage('docx'),
      fallbackNeeded: true,
      kind: 'document_limit'
    };
  }

  if (
    normalized.includes('invalid response') ||
    normalized.includes('unexpected')
  ) {
    return {
      userMessage: getNeutralConversionMessage('docx'),
      fallbackNeeded: true,
      kind: 'invalid_response'
    };
  }

  return {
    userMessage: getNeutralConversionMessage('docx'),
    fallbackNeeded: true,
    kind: 'unknown'
  };
}
