export interface Tier {
  name: 'Starter' | 'Pro' | 'Advanced'
  description: string
  features: string[]
  highlighted?: boolean
  priceId: { month: string; year: string }
}

/**
 * Edit this array to update tier names, descriptions, features, or Paddle price IDs.
 * Replace each priceId value with the IDs from your Paddle sandbox (or live) catalog.
 * Monthly price IDs typically look like: pri_01abc...
 * Yearly  price IDs typically look like: pri_01xyz...
 */

function priceId(envVar: string): string {
  const value = import.meta.env[envVar] as string | undefined
  if (!value && import.meta.env.DEV) {
    console.warn(
      `[Pricing] ${envVar} is not set. ` +
        'Add the Paddle price ID to your .env file and restart the dev server.',
    )
  }
  return value ?? ''
}
export const TIERS: Tier[] = [
  {
    name: 'Starter',
    description: 'Perfect for individuals and small projects.',
    features: [
      'Up to 100 conversions / month',
      'Standard formats (PDF, DOCX, PNG)',
      'Email support',
    ],
    priceId: {
      month: priceId('VITE_PADDLE_PRICE_STARTER_MONTH'),
      year: priceId('VITE_PADDLE_PRICE_STARTER_YEAR'),
    },
  },
  {
    name: 'Pro',
    description: 'For professionals who need more power and speed.',
    features: [
      'Up to 1 000 conversions / month',
      'All formats + OCR',
      'Priority email support',
      'API access',
    ],
    highlighted: true,
    priceId: {
      month: priceId('VITE_PADDLE_PRICE_PRO_MONTH'),
      year: priceId('VITE_PADDLE_PRICE_PRO_YEAR'),
    },
  },
  {
    name: 'Advanced',
    description: 'Unlimited usage for teams and businesses.',
    features: [
      'Unlimited conversions',
      'All formats + OCR + batch processing',
      'Dedicated support',
      'API access',
      'Team seats (up to 10)',
    ],
    priceId: {
      month: priceId('VITE_PADDLE_PRICE_ADVANCED_MONTH'),
      year: priceId('VITE_PADDLE_PRICE_ADVANCED_YEAR'),
    },
  },
]
