export interface Country {
  id: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  btcRate: number; // local currency per 1 BTC
  rateFormatted: string;
  universities: string[];
}

export const COUNTRIES: Country[] = [
  {
    id: 'rwanda',
    name: 'Rwanda (Kigali)',
    flag: '🇷🇼',
    currency: 'RWF',
    currencySymbol: 'FRw ',
    btcRate: 138500000,
    rateFormatted: 'FRw 138.5M',
    universities: [
      'Carnegie Mellon University Africa (CMU-Africa)',
      'University of Rwanda (UR) - Kigali Campus',
      'African Leadership University (ALU) - Rwanda',
      'Adventist University of Central Africa (AUCA)',
      'Kigali Independent University (ULK)',
    ],
  },
  {
    id: 'kenya',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh ',
    btcRate: 12500000,
    rateFormatted: 'KSh 12.5M',
    universities: [
      'University of Nairobi (UoN)',
      'Kenyatta University (KU)',
      'Strathmore University',
    ],
  },
  {
    id: 'nigeria',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    currencySymbol: '₦',
    btcRate: 83620000,
    rateFormatted: '₦83.6M',
    universities: [
      'University of Lagos (UNILAG)',
      'Covenant University',
      'University of Ibadan (UI)',
      'Ahmadu Bello University (ABU)',
    ],
  },
  {
    id: 'ghana',
    name: 'Ghana',
    flag: '🇬🇭',
    currency: 'GHS',
    currencySymbol: 'GH₵',
    btcRate: 1520000,
    rateFormatted: 'GH₵1.52M',
    universities: [
      'University of Ghana (UG)',
      'KNUST, Ghana',
    ],
  },
];

export const ALL_UNIVERSITIES = COUNTRIES.flatMap((c) => c.universities);

export function getCountryConfig(countryNameOrId?: string): Country {
  if (!countryNameOrId) return COUNTRIES[0]; // Default Rwanda/Kigali
  const match = COUNTRIES.find(
    (c) =>
      c.id.toLowerCase() === countryNameOrId.toLowerCase() ||
      c.name.toLowerCase().includes(countryNameOrId.toLowerCase()) ||
      countryNameOrId.toLowerCase().includes(c.id.toLowerCase())
  );
  return match || COUNTRIES[0];
}

export function getUniversitiesForCountry(countryNameOrId: string): string[] {
  const country = getCountryConfig(countryNameOrId);
  return country ? country.universities : ALL_UNIVERSITIES;
}
