export interface Tier {
  id: string;
  name: 'Starter' | 'Pro' | 'Business';
  type: 'free' | 'paid' | 'contact';
  description: string;
  features: string[];
  priceId?: string;
  isPopular?: boolean;
}

export const BUSINESS_EMAIL = 'it.expert.usmaan@gmail.com';

export const PRICING_TIERS: Tier[] = [
  {
    id: 'starter',
    name: 'Starter',
    type: 'free',
    description: 'Free forever for all standard file conversion tools.',
    features: [
      '100% Unlimited free conversions on all standard tools',
      'Word to PDF, Merge, Split, Images & more FREE',
      'No account or credit card required',
      'PDF to Word requires Pro plan',
      'PDF to Excel requires Pro plan'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    type: 'paid',
    description: 'Ideal for professionals needing PDF to Word and PDF to Excel conversion.',
    features: [
      'PDF to Word Converter (.docx)',
      'PDF to Excel Converter (.xlsx)',
      'Unlimited conversions for all tools',
      'High-speed priority processing',
      'Ad-free experience & priority support'
    ],
    priceId:
      import.meta.env.VITE_PADDLE_PRO_PRICE_ID ||
      'pri_01m0cd4qfb3dbfrfh5swnqy198',
    isPopular: true
  },
  {
    id: 'business',
    name: 'Business',
    type: 'contact',
    description: 'For enterprise & teams requiring custom limits, workflows & dedicated support.',
    features: [
      'Everything in Pro plan',
      'Custom conversion limits & tailored workflows',
      'Ultra-fast dedicated server processing',
      'API access & webhook integration options',
      'Dedicated account manager & SLA'
    ]
  }
];
