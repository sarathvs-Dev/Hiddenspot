/**
 * HiddenSpot design tokens: the single source of truth for every visual value.
 * Personality: adventurous, calm, premium, modern, trustworthy, nature-focused.
 *
 * Rules:
 * - Apps never hard-code colours, sizes, radii, shadows or durations. They read them from here.
 * - `palette` holds raw colour scales. UI code should prefer `semanticColors`.
 * - Shadows are CSS box-shadow strings, which both browsers and React Native 0.76+ understand.
 */

export const palette = {
  forest50: '#EEF4F0',
  forest100: '#D6E5DB',
  forest200: '#ADCBB8',
  forest300: '#7FAA90',
  forest400: '#4F8668',
  forest500: '#2F6A4D',
  forest600: '#245640',
  forest700: '#1C4433',
  forest800: '#163527',
  forest900: '#0F241B',

  ivory50: '#FDFBF6',
  ivory100: '#FAF6EE',
  ivory200: '#F3EDE1',
  ivory300: '#E6DECD',

  sage50: '#F3F5EF',
  sage100: '#E7ECE2',
  sage200: '#D5DDCD',
  sage300: '#B9C5AF',
  sage400: '#97A68B',
  sage500: '#77876C',
  sage600: '#5D6B54',
  sage700: '#47533F',

  charcoal50: '#F5F5F4',
  charcoal100: '#ECEDEA',
  charcoal200: '#D6D8D4',
  charcoal300: '#B4B8B3',
  charcoal400: '#878D88',
  charcoal500: '#666D67',
  charcoal600: '#535A55',
  charcoal700: '#3F4541',
  charcoal800: '#2D322F',
  charcoal900: '#1F2321',

  amber50: '#FCF5E6',
  amber100: '#F8E6C2',
  amber300: '#EBC066',
  amber500: '#D9971F',
  amber600: '#B57A12',
  amber700: '#8C5D0D',
  amber800: '#6B470B',

  red50: '#FCEDEC',
  red100: '#F7D4D0',
  red500: '#C4402F',
  red600: '#A93526',
  red700: '#8A2B1F',

  blue50: '#EAF1F8',
  blue100: '#D3E2F0',
  blue600: '#2F5F8A',
  blue700: '#244A6C',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export type PaletteColor = keyof typeof palette;

/** Role-based colours. Components use these, so a palette change never needs a component change. */
export const semanticColors = {
  // Surfaces
  background: palette.ivory100,
  backgroundSubtle: palette.ivory200,
  surface: palette.white,
  surfaceSecondary: palette.sage100,
  surfaceSecondaryHover: palette.sage200,
  surfaceInverse: palette.forest900,
  overlay: 'rgba(15, 36, 27, 0.55)',
  imageScrim: 'rgba(15, 36, 27, 0.6)',
  glass: 'rgba(253, 251, 246, 0.2)',
  glassBorder: 'rgba(253, 251, 246, 0.5)',
  skeleton: palette.sage100,
  skeletonHighlight: palette.sage50,

  // Text
  textPrimary: palette.charcoal900,
  textSecondary: palette.charcoal600,
  textTertiary: palette.charcoal500,
  textInverse: palette.ivory50,
  textOnImage: palette.white,
  textLink: palette.forest600,

  // Borders
  border: palette.ivory300,
  borderStrong: palette.sage300,
  borderInput: palette.charcoal400,
  focusRing: palette.forest500,

  // Brand actions
  primary: palette.forest700,
  primaryHover: palette.forest800,
  primaryPressed: palette.forest900,
  onPrimary: palette.ivory50,
  primarySubtle: palette.forest50,
  onPrimarySubtle: palette.forest800,

  // Highlights and ratings
  highlight: palette.amber100,
  onHighlight: palette.amber800,
  highlightStrong: palette.amber500,
  rating: palette.amber500,

  // Feedback
  success: palette.forest600,
  successSubtle: palette.forest50,
  warning: palette.amber700,
  warningSubtle: palette.amber50,
  danger: palette.red600,
  dangerHover: palette.red700,
  dangerSubtle: palette.red50,
  info: palette.blue600,
  infoSubtle: palette.blue50,
  favorite: palette.red500,
} as const;

export type SemanticColor = keyof typeof semanticColors;

/* ------------------------------------------------------------------ */
/* Typography                                                          */
/* ------------------------------------------------------------------ */

/**
 * Font families with reliable fallbacks. Both fonts are bundled with the apps
 * (Fontsource on web, expo-google-fonts on mobile), so nothing is fetched from a CDN at runtime.
 * If a font fails to load, the fallback stack renders instead.
 */
export const fontFamilies = {
  display: {
    name: 'Fraunces',
    cssStack: "'Fraunces Variable', 'Fraunces', Georgia, 'Times New Roman', serif",
  },
  body: {
    name: 'Inter',
    cssStack:
      "'Inter Variable', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
} as const;

export type FontRole = keyof typeof fontFamilies;
export type FontWeight = 400 | 500 | 600 | 700;

export interface TypeStyle {
  family: FontRole;
  weight: FontWeight;
  /** Size in px on phones. */
  size: number;
  /** Optional larger size in px on wide screens. The web scales fluidly between the two. */
  maxSize?: number;
  /** Unitless line-height multiplier. */
  lineHeight: number;
  /** Letter spacing in em. */
  letterSpacing: number;
  transform?: 'uppercase';
}

export const typography = {
  display: {
    family: 'display',
    weight: 600,
    size: 38,
    maxSize: 64,
    lineHeight: 1.05,
    letterSpacing: -0.02,
  },
  h1: {
    family: 'display',
    weight: 600,
    size: 30,
    maxSize: 44,
    lineHeight: 1.12,
    letterSpacing: -0.015,
  },
  h2: {
    family: 'display',
    weight: 600,
    size: 24,
    maxSize: 30,
    lineHeight: 1.2,
    letterSpacing: -0.01,
  },
  h3: {
    family: 'body',
    weight: 600,
    size: 18,
    maxSize: 20,
    lineHeight: 1.3,
    letterSpacing: -0.005,
  },
  title: { family: 'body', weight: 600, size: 16, lineHeight: 1.35, letterSpacing: 0 },
  body: { family: 'body', weight: 400, size: 15, maxSize: 16, lineHeight: 1.6, letterSpacing: 0 },
  bodyStrong: {
    family: 'body',
    weight: 600,
    size: 15,
    maxSize: 16,
    lineHeight: 1.6,
    letterSpacing: 0,
  },
  bodySmall: { family: 'body', weight: 400, size: 13, lineHeight: 1.5, letterSpacing: 0 },
  label: { family: 'body', weight: 600, size: 13, lineHeight: 1.3, letterSpacing: 0.005 },
  button: { family: 'body', weight: 600, size: 15, lineHeight: 1.2, letterSpacing: 0.005 },
  caption: { family: 'body', weight: 500, size: 12, lineHeight: 1.4, letterSpacing: 0 },
  overline: {
    family: 'body',
    weight: 600,
    size: 11,
    lineHeight: 1.3,
    letterSpacing: 0.12,
    transform: 'uppercase',
  },
  helper: { family: 'body', weight: 400, size: 12, lineHeight: 1.45, letterSpacing: 0 },
} as const satisfies Record<string, TypeStyle>;

export type TypeVariant = keyof typeof typography;

/* ------------------------------------------------------------------ */
/* Spacing, shape, elevation                                           */
/* ------------------------------------------------------------------ */

/** 4px-based spacing scale. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  xxxxl: 64,
} as const;

export type SpacingToken = keyof typeof spacing;

export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const borderWidths = {
  none: 0,
  thin: 1,
  thick: 2,
  focus: 3,
} as const;

/** CSS box-shadow strings. Warm charcoal tint keeps shadows soft on ivory. */
export const shadows = {
  none: 'none',
  xs: '0px 1px 2px rgba(31, 35, 33, 0.06)',
  sm: '0px 2px 8px rgba(31, 35, 33, 0.08)',
  md: '0px 8px 24px rgba(31, 35, 33, 0.10)',
  lg: '0px 16px 40px rgba(31, 35, 33, 0.16)',
} as const;

export type ShadowToken = keyof typeof shadows;

export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type IconSize = keyof typeof iconSizes;

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

/** Durations in ms. Keep motion subtle; apps drop to `instant` when reduced motion is on. */
export const durations = {
  instant: 0,
  fast: 120,
  normal: 200,
  slow: 320,
  slower: 480,
} as const;

/** Cubic-bezier control points, usable by CSS and by React Native's Easing.bezier. */
export const easings = {
  standard: [0.2, 0, 0, 1],
  enter: [0, 0, 0.2, 1],
  exit: [0.4, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type EasingToken = keyof typeof easings;

export function cssEasing(name: EasingToken): string {
  return `cubic-bezier(${easings[name].join(', ')})`;
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const layout = {
  contentMaxWidth: 1200,
  readingMaxWidth: 680,
  headerHeight: 64,
  /** Minimum interactive size. 44 meets Apple HIG and WCAG 2.5.8. */
  touchTarget: 44,
  gutter: { mobile: 16, tablet: 24, desktop: 32 },
  bottomNavHeight: 64,
} as const;

/** Image aspect ratios as width / height. */
export const aspectRatios = {
  featured: 4 / 5,
  compact: 1,
  hero: 16 / 9,
  gallery: 4 / 3,
  wide: 3 / 2,
} as const;

export const zIndices = {
  base: 0,
  raised: 10,
  sticky: 20,
  header: 30,
  nav: 40,
  overlay: 50,
  modal: 60,
  toast: 70,
} as const;

export const opacities = {
  disabled: 0.45,
  pressed: 0.85,
  muted: 0.7,
} as const;

export const theme = {
  palette,
  semanticColors,
  fontFamilies,
  typography,
  spacing,
  radii,
  borderWidths,
  shadows,
  iconSizes,
  durations,
  easings,
  breakpoints,
  layout,
  aspectRatios,
  zIndices,
  opacities,
} as const;

export type Theme = typeof theme;
