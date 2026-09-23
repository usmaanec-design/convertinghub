export interface CountryCode {
  name: string;
  dialCode: string;
  code: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { name: 'United States', dialCode: '+1', code: 'US', flag: '🇺🇸' },
  { name: 'United Kingdom', dialCode: '+44', code: 'GB', flag: '🇬🇧' },
  { name: 'Pakistan', dialCode: '+92', code: 'PK', flag: '🇵🇰' },
  { name: 'India', dialCode: '+91', code: 'IN', flag: '🇮🇳' },
  { name: 'United Arab Emirates', dialCode: '+971', code: 'AE', flag: '🇦🇪' },
  { name: 'Saudi Arabia', dialCode: '+966', code: 'SA', flag: '🇸🇦' },
  { name: 'Canada', dialCode: '+1', code: 'CA', flag: '🇨🇦' },
  { name: 'Australia', dialCode: '+61', code: 'AU', flag: '🇦🇺' },
  { name: 'Germany', dialCode: '+49', code: 'DE', flag: '🇩🇪' },
  { name: 'France', dialCode: '+33', code: 'FR', flag: '🇫🇷' },
  { name: 'Turkey', dialCode: '+90', code: 'TR', flag: '🇹🇷' },
  { name: 'Bangladesh', dialCode: '+880', code: 'BD', flag: '🇧🇩' },
  { name: 'Indonesia', dialCode: '+62', code: 'ID', flag: '🇮🇩' },
  { name: 'Malaysia', dialCode: '+60', code: 'MY', flag: '🇲🇾' },
  { name: 'Singapore', dialCode: '+65', code: 'SG', flag: '🇸🇬' },
  { name: 'Egypt', dialCode: '+20', code: 'EG', flag: '🇪🇬' },
  { name: 'Qatar', dialCode: '+974', code: 'QA', flag: '🇶🇦' },
  { name: 'Kuwait', dialCode: '+965', code: 'KW', flag: '🇰🇼' },
  { name: 'Oman', dialCode: '+968', code: 'OM', flag: '🇴🇲' },
  { name: 'Bahrain', dialCode: '+973', code: 'BH', flag: '🇧🇭' },
  { name: 'South Africa', dialCode: '+27', code: 'ZA', flag: '🇿🇦' },
  { name: 'Nigeria', dialCode: '+234', code: 'NG', flag: '🇳🇬' },
  { name: 'Brazil', dialCode: '+55', code: 'BR', flag: '🇧🇷' },
  { name: 'Mexico', dialCode: '+52', code: 'MX', flag: '🇲🇽' },
  { name: 'Spain', dialCode: '+34', code: 'ES', flag: '🇪🇸' },
  { name: 'Italy', dialCode: '+39', code: 'IT', flag: '🇮🇹' },
  { name: 'Netherlands', dialCode: '+31', code: 'NL', flag: '🇳🇱' },
  { name: 'Japan', dialCode: '+81', code: 'JP', flag: '🇯🇵' },
  { name: 'South Korea', dialCode: '+82', code: 'KR', flag: '🇰🇷' },
  { name: 'China', dialCode: '+86', code: 'CN', flag: '🇨🇳' }
];

export const DEFAULT_COUNTRY = COUNTRY_CODES[0]; // US
