import { avatarColors } from '../theme/components';

/** "Maya Fernandes" becomes "MF"; a single name gives one letter. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Picks a stable colour pair for a user, so the same person always gets the same avatar colour. */
export function pickAvatarColors(seed: string): { background: string; foreground: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const pair = avatarColors[hash % avatarColors.length];
  if (!pair) throw new Error('avatarColors must not be empty');
  return pair;
}
