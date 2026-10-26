/** Letters that Unicode NFD does not split into a base letter plus accent. */
const SPECIAL_LETTERS: Record<string, string> = {
  ð: 'd',
  þ: 'th',
  æ: 'ae',
  ø: 'o',
  œ: 'oe',
  ß: 'ss',
  ł: 'l',
  đ: 'd',
  ı: 'i',
};

/** Lowercases, trims and strips accents so "Búðir" matches "budir". */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ðþæøœßłđı]/g, (char) => SPECIAL_LETTERS[char] ?? char)
    .trim();
}

/** Splits a search query into normalized, non-empty terms. */
export function tokenize(query: string): string[] {
  return normalizeText(query).split(/\s+/).filter(Boolean);
}
