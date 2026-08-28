export interface Country {
  id: string;
  name: string;
  flag: string;
  universities: string[];
}

export const COUNTRIES: Country[] = [
  {
    id: 'rwanda',
    name: 'Rwanda (Kigali)',
    flag: '🇷🇼',
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
    universities: [
      'University of Ghana (UG)',
      'KNUST, Ghana',
    ],
  },
];

export const ALL_UNIVERSITIES = COUNTRIES.flatMap((c) => c.universities);

export function getUniversitiesForCountry(countryNameOrId: string): string[] {
  const match = COUNTRIES.find(
    (c) =>
      c.id.toLowerCase() === countryNameOrId.toLowerCase() ||
      c.name.toLowerCase().includes(countryNameOrId.toLowerCase()),
  );
  return match ? match.universities : ALL_UNIVERSITIES;
}
