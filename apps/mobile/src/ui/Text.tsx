import { breakpoints, semanticColors, typography, type TypeVariant } from '@hiddenspot/shared';
import {
  Text as NativeText,
  useWindowDimensions,
  type StyleProp,
  type TextProps as NativeTextProps,
  type TextStyle,
} from 'react-native';
import { fontFamilyFor, useFontsLoaded } from './fonts';

export type TextTone =
  'primary' | 'secondary' | 'tertiary' | 'inverse' | 'onImage' | 'brand' | 'danger' | 'highlight';

const TONE_COLORS: Record<TextTone, string> = {
  primary: semanticColors.textPrimary,
  secondary: semanticColors.textSecondary,
  tertiary: semanticColors.textTertiary,
  inverse: semanticColors.textInverse,
  onImage: semanticColors.textOnImage,
  brand: semanticColors.primary,
  danger: semanticColors.danger,
  highlight: semanticColors.onHighlight,
};

const HEADING_VARIANTS: TypeVariant[] = ['display', 'h1', 'h2', 'h3'];

/** Resolves a typography token into a React Native text style. */
export function useTypeStyle(variant: TypeVariant): TextStyle {
  const fontsLoaded = useFontsLoaded();
  const { width } = useWindowDimensions();
  const style = typography[variant];
  // Tablets use a size halfway to the desktop size, so text uses the extra room without shouting.
  const size =
    'maxSize' in style && width >= breakpoints.md
      ? Math.round((style.size + style.maxSize) / 2)
      : style.size;

  return {
    fontSize: size,
    lineHeight: Math.round(size * style.lineHeight),
    letterSpacing: style.letterSpacing * size,
    textTransform: 'transform' in style ? style.transform : undefined,
    ...(fontsLoaded
      ? { fontFamily: fontFamilyFor(style.family, style.weight) }
      : { fontWeight: String(style.weight) as TextStyle['fontWeight'] }),
  };
}

export interface TextProps extends NativeTextProps {
  variant?: TypeVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
}

/** All text uses a typography token. Headings are announced as headers by screen readers. */
export function Text({ variant = 'body', tone = 'primary', align, style, ...rest }: TextProps) {
  const typeStyle = useTypeStyle(variant);
  return (
    <NativeText
      accessibilityRole={HEADING_VARIANTS.includes(variant) ? 'header' : undefined}
      maxFontSizeMultiplier={variant === 'display' || variant === 'h1' ? 1.4 : 2}
      style={[typeStyle, { color: TONE_COLORS[tone], textAlign: align }, style]}
      {...rest}
    />
  );
}
