import { describe, expect, it } from 'vitest';
import {
  avatarColors,
  buttonColors,
  BUTTON_VARIANTS,
  semanticColors,
  toneColors,
  TONES,
  typography,
} from '../theme';
import { contrastRatio, hexToRgb, withAlpha } from '../utils/color';

const AA_TEXT = 4.5;
const AA_UI = 3;

describe('colour utilities', () => {
  it('parses short and long hex', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#1C4433')).toEqual({ r: 28, g: 68, b: 51 });
  });

  it('computes known contrast ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('adds alpha', () => {
    expect(withAlpha('#1C4433', 0.5)).toBe('rgba(28, 68, 51, 0.5)');
  });
});

describe('palette accessibility (WCAG 2.2 AA)', () => {
  const textOn = [
    semanticColors.background,
    semanticColors.surface,
    semanticColors.backgroundSubtle,
  ];

  it.each([
    ['textPrimary', semanticColors.textPrimary],
    ['textSecondary', semanticColors.textSecondary],
    ['textTertiary', semanticColors.textTertiary],
    ['textLink', semanticColors.textLink],
    ['primary', semanticColors.primary],
    ['danger', semanticColors.danger],
  ])('%s is readable on every light surface', (_name, colour) => {
    for (const background of textOn) {
      expect(contrastRatio(colour, background)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('text stays readable on the sage secondary surface', () => {
    expect(
      contrastRatio(semanticColors.textPrimary, semanticColors.surfaceSecondary),
    ).toBeGreaterThanOrEqual(AA_TEXT);
    expect(
      contrastRatio(semanticColors.textSecondary, semanticColors.surfaceSecondary),
    ).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(BUTTON_VARIANTS.filter((v) => buttonColors[v].background !== 'transparent'))(
    '%s button label meets AA',
    (variant) => {
      const { foreground, background, backgroundPressed } = buttonColors[variant];
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(foreground, backgroundPressed)).toBeGreaterThanOrEqual(AA_TEXT);
    },
  );

  it.each(TONES)('%s tone label meets AA', (tone) => {
    const { foreground, background } = toneColors[tone];
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('every avatar colour pair meets AA', () => {
    for (const pair of avatarColors) {
      expect(contrastRatio(pair.foreground, pair.background)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('focus ring is visible against backgrounds', () => {
    expect(
      contrastRatio(semanticColors.focusRing, semanticColors.background),
    ).toBeGreaterThanOrEqual(AA_UI);
    expect(contrastRatio(semanticColors.focusRing, semanticColors.surface)).toBeGreaterThanOrEqual(
      AA_UI,
    );
  });

  it('selected amber highlight is readable', () => {
    expect(
      contrastRatio(semanticColors.onHighlight, semanticColors.highlight),
    ).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('input borders are distinguishable from surfaces', () => {
    expect(
      contrastRatio(semanticColors.borderInput, semanticColors.surface),
    ).toBeGreaterThanOrEqual(AA_UI);
    expect(
      contrastRatio(semanticColors.borderInput, semanticColors.background),
    ).toBeGreaterThanOrEqual(AA_UI);
  });
});

describe('typography scale', () => {
  it('never goes below 11px and keeps body text at least 15px', () => {
    for (const style of Object.values(typography)) expect(style.size).toBeGreaterThanOrEqual(11);
    expect(typography.body.size).toBeGreaterThanOrEqual(15);
  });

  it('fluid sizes only grow', () => {
    for (const style of Object.values(typography)) {
      if ('maxSize' in style) expect(style.maxSize).toBeGreaterThanOrEqual(style.size);
    }
  });

  it('heading hierarchy decreases', () => {
    expect(typography.display.size).toBeGreaterThan(typography.h1.size);
    expect(typography.h1.size).toBeGreaterThan(typography.h2.size);
    expect(typography.h2.size).toBeGreaterThan(typography.h3.size);
    expect(typography.h3.size).toBeGreaterThan(typography.body.size);
  });
});
