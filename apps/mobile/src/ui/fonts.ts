import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import type { FontRole, FontWeight } from '@hiddenspot/shared';
import { createContext, useContext } from 'react';

/**
 * Font files bundled with the app. They are packaged by Metro, so nothing is
 * downloaded at runtime. Each weight is its own family name, which is how
 * React Native selects weights for custom fonts.
 */
export const FONT_ASSETS = {
  Fraunces_600SemiBold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} as const;

type LoadedFamily = keyof typeof FONT_ASSETS;

const FAMILY_BY_ROLE: Record<FontRole, Record<FontWeight, LoadedFamily>> = {
  display: {
    400: 'Fraunces_600SemiBold',
    500: 'Fraunces_600SemiBold',
    600: 'Fraunces_600SemiBold',
    700: 'Fraunces_600SemiBold',
  },
  body: {
    400: 'Inter_400Regular',
    500: 'Inter_500Medium',
    600: 'Inter_600SemiBold',
    700: 'Inter_700Bold',
  },
};

export function fontFamilyFor(role: FontRole, weight: FontWeight): LoadedFamily {
  return FAMILY_BY_ROLE[role][weight];
}

/** True once the bundled fonts are ready. When false, Text falls back to the system font. */
export const FontsLoadedContext = createContext(false);

export function useFontsLoaded(): boolean {
  return useContext(FontsLoadedContext);
}
