/** The 14 districts of Kerala, used to validate place and submission districts. */
export const KERALA_DISTRICTS = [
  'Alappuzha',
  'Ernakulam',
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thiruvananthapuram',
  'Thrissur',
  'Wayanad',
] as const;

export type KeralaDistrict = (typeof KERALA_DISTRICTS)[number];

export function isKeralaDistrict(value: string): value is KeralaDistrict {
  return (KERALA_DISTRICTS as readonly string[]).includes(value);
}
