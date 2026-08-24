import { initializePaddle, Paddle } from '@paddle/paddle-js';

export const getPaddleConfig = () => {
  const environment = import.meta.env.VITE_PADDLE_ENVIRONMENT;
  const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;

  if (!environment) {
    throw new Error(
      '[Paddle Configuration Error] VITE_PADDLE_ENVIRONMENT is missing. You must set VITE_PADDLE_ENVIRONMENT=production (or sandbox) in your environment variables.'
    );
  }

  if (environment !== 'sandbox' && environment !== 'production') {
    throw new Error(
      `[Paddle Configuration Error] Invalid VITE_PADDLE_ENVIRONMENT: "${environment}". Expected "production" or "sandbox".`
    );
  }

  if (!clientToken) {
    throw new Error(
      '[Paddle Configuration Error] VITE_PADDLE_CLIENT_TOKEN is missing. You must set VITE_PADDLE_CLIENT_TOKEN (starting with "live_" for production or "test_" for sandbox) in your environment variables.'
    );
  }

  return {
    environment: environment as 'sandbox' | 'production',
    token: clientToken
  };
};

let paddleInstancePromise: Promise<Paddle | undefined> | null = null;

export const getPaddleInstance = (paddleCustomerId?: string): Promise<Paddle | undefined> => {
  if (paddleInstancePromise && !paddleCustomerId) {
    return paddleInstancePromise;
  }

  const { environment, token } = getPaddleConfig();

  const options: any = {
    environment,
    token,
    eventCallback: (event: any) => {
      console.log('[Paddle Event Callback]:', event?.name, event);
    }
  };

  if (paddleCustomerId && paddleCustomerId.startsWith('ctm_')) {
    options.pwCustomer = { id: paddleCustomerId };
  }

  const promise = initializePaddle(options);
  if (!paddleCustomerId) {
    paddleInstancePromise = promise;
  }

  return promise;
};
