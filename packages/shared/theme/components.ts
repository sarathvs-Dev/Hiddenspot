/**
 * Component-level specifications shared by web and mobile. Each app implements the
 * component natively, but variants, sizes and tones come from here so they always match.
 */
import { palette, semanticColors, type IconSize } from './tokens';

/* ---------------- Buttons ---------------- */

export const BUTTON_VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export interface ButtonColors {
  background: string;
  backgroundPressed: string;
  foreground: string;
  border: string;
}

export const buttonColors: Record<ButtonVariant, ButtonColors> = {
  primary: {
    background: semanticColors.primary,
    backgroundPressed: semanticColors.primaryHover,
    foreground: semanticColors.onPrimary,
    border: semanticColors.primary,
  },
  secondary: {
    background: semanticColors.surfaceSecondary,
    backgroundPressed: semanticColors.surfaceSecondaryHover,
    foreground: semanticColors.onPrimarySubtle,
    border: semanticColors.surfaceSecondary,
  },
  outline: {
    background: 'transparent',
    backgroundPressed: semanticColors.primarySubtle,
    foreground: semanticColors.primary,
    border: semanticColors.borderStrong,
  },
  ghost: {
    background: 'transparent',
    backgroundPressed: semanticColors.surfaceSecondary,
    foreground: semanticColors.primary,
    border: 'transparent',
  },
  danger: {
    background: semanticColors.danger,
    backgroundPressed: semanticColors.dangerHover,
    foreground: palette.white,
    border: semanticColors.danger,
  },
};

export interface ButtonSizeSpec {
  height: number;
  paddingX: number;
  fontSize: number;
  icon: IconSize;
  gap: number;
}

/** `sm` is visually 36px; apps extend its hit area to the 44px touch target. */
export const buttonSizes: Record<ButtonSize, ButtonSizeSpec> = {
  sm: { height: 36, paddingX: 14, fontSize: 13, icon: 'sm', gap: 6 },
  md: { height: 44, paddingX: 20, fontSize: 15, icon: 'md', gap: 8 },
  lg: { height: 52, paddingX: 26, fontSize: 16, icon: 'md', gap: 10 },
};

/* ---------------- Icon buttons ---------------- */

export const ICON_BUTTON_VARIANTS = ['solid', 'soft', 'outline', 'glass'] as const;
export type IconButtonVariant = (typeof ICON_BUTTON_VARIANTS)[number];

export const iconButtonColors: Record<IconButtonVariant, ButtonColors> = {
  solid: buttonColors.primary,
  soft: {
    background: semanticColors.surfaceSecondary,
    backgroundPressed: semanticColors.surfaceSecondaryHover,
    foreground: semanticColors.textPrimary,
    border: semanticColors.surfaceSecondary,
  },
  outline: {
    background: semanticColors.surface,
    backgroundPressed: semanticColors.surfaceSecondary,
    foreground: semanticColors.textPrimary,
    border: semanticColors.border,
  },
  glass: {
    background: semanticColors.glass,
    backgroundPressed: 'rgba(253, 251, 246, 0.32)',
    foreground: semanticColors.textOnImage,
    border: semanticColors.glassBorder,
  },
};

export const iconButtonSizes = { sm: 36, md: 44, lg: 52 } as const;
export type IconButtonSize = keyof typeof iconButtonSizes;

/* ---------------- Tones: badges, toasts, status labels ---------------- */

export const TONES = [
  'neutral',
  'brand',
  'success',
  'warning',
  'danger',
  'info',
  'highlight',
] as const;
export type Tone = (typeof TONES)[number];

export interface ToneColors {
  background: string;
  foreground: string;
  border: string;
  /** Solid accent for icons, dots and toast stripes. */
  accent: string;
}

export const toneColors: Record<Tone, ToneColors> = {
  neutral: {
    background: palette.charcoal100,
    foreground: palette.charcoal800,
    border: palette.charcoal200,
    accent: palette.charcoal500,
  },
  brand: {
    background: semanticColors.primarySubtle,
    foreground: semanticColors.onPrimarySubtle,
    border: palette.forest100,
    accent: semanticColors.primary,
  },
  success: {
    background: semanticColors.successSubtle,
    foreground: palette.forest800,
    border: palette.forest100,
    accent: semanticColors.success,
  },
  warning: {
    background: semanticColors.warningSubtle,
    foreground: palette.amber800,
    border: palette.amber100,
    accent: palette.amber600,
  },
  danger: {
    background: semanticColors.dangerSubtle,
    foreground: palette.red700,
    border: palette.red100,
    accent: semanticColors.danger,
  },
  info: {
    background: semanticColors.infoSubtle,
    foreground: palette.blue700,
    border: palette.blue100,
    accent: semanticColors.info,
  },
  highlight: {
    background: semanticColors.highlight,
    foreground: semanticColors.onHighlight,
    border: palette.amber300,
    accent: semanticColors.highlightStrong,
  },
};

/* ---------------- Avatars ---------------- */

/** Background and text pairs for initials avatars. All pairs pass WCAG AA. */
export const avatarColors: readonly { background: string; foreground: string }[] = [
  { background: palette.forest100, foreground: palette.forest800 },
  { background: palette.sage200, foreground: palette.sage700 },
  { background: palette.amber100, foreground: palette.amber800 },
  { background: palette.blue100, foreground: palette.blue700 },
  { background: palette.ivory300, foreground: palette.charcoal800 },
];

export const avatarSizes = { sm: 32, md: 40, lg: 56, xl: 80 } as const;
export type AvatarSize = keyof typeof avatarSizes;
