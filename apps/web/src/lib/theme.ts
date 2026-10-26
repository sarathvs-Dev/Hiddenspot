import {
  borderWidths,
  breakpoints,
  buttonColors,
  buttonSizes,
  cssEasing,
  durations,
  easings,
  fontFamilies,
  iconButtonColors,
  iconButtonSizes,
  iconSizes,
  layout,
  opacities,
  palette,
  radii,
  semanticColors,
  shadows,
  spacing,
  toneColors,
  typography,
  zIndices,
  type EasingToken,
  type TypeStyle,
} from '@hiddenspot/shared';

const kebab = (value: string) => value.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const px = (value: number) => `${value}px`;
const rem = (value: number) => `${+(value / 16).toFixed(4)}rem`;

/** Fluid size between the phone size at 360px and the desktop size at 1200px viewport width. */
export function fluidSize(min: number, max: number, minViewport = 360, maxViewport = 1200): string {
  if (min === max) return rem(min);
  const slope = (max - min) / (maxViewport - minViewport);
  const intercept = min - slope * minViewport;
  return `clamp(${rem(min)}, ${rem(intercept)} + ${+(slope * 100).toFixed(4)}vw, ${rem(max)})`;
}

function typeVariables(name: string, style: TypeStyle): string[] {
  const size = style.maxSize ? fluidSize(style.size, style.maxSize) : rem(style.size);
  return [
    `--type-${kebab(name)}-family: var(--font-${style.family});`,
    `--type-${kebab(name)}-size: ${size};`,
    `--type-${kebab(name)}-weight: ${style.weight};`,
    `--type-${kebab(name)}-line-height: ${style.lineHeight};`,
    `--type-${kebab(name)}-tracking: ${style.letterSpacing}em;`,
  ];
}

function typeClass(name: string, style: TypeStyle): string {
  const v = `--type-${kebab(name)}`;
  return `.ds-type-${kebab(name)} { font-family: var(${v}-family); font-size: var(${v}-size); font-weight: var(${v}-weight); line-height: var(${v}-line-height); letter-spacing: var(${v}-tracking);${style.transform ? ` text-transform: ${style.transform};` : ''} }`;
}

/** Builds the complete token stylesheet from @hiddenspot/shared. */
export function buildThemeCss(): string {
  const vars: string[] = [];
  const add = (
    prefix: string,
    record: Record<string, string | number>,
    unit?: (v: number) => string,
  ) =>
    Object.entries(record).forEach(([key, value]) =>
      vars.push(
        `--${prefix}-${kebab(key)}: ${typeof value === 'number' && unit ? unit(value) : value};`,
      ),
    );

  add('palette', palette);
  add('color', semanticColors);
  add('space', spacing, px);
  add('radius', radii, px);
  add('border', borderWidths, px);
  add('shadow', shadows);
  add('icon', iconSizes, px);
  add('duration', durations, (v) => `${v}ms`);
  add('z', zIndices, String);
  add('opacity', opacities, String);
  add('breakpoint', breakpoints, px);
  Object.keys(easings).forEach((name) =>
    vars.push(`--ease-${name}: ${cssEasing(name as EasingToken)};`),
  );

  vars.push(`--font-display: ${fontFamilies.display.cssStack};`);
  vars.push(`--font-body: ${fontFamilies.body.cssStack};`);
  Object.entries(typography).forEach(([name, style]) => vars.push(...typeVariables(name, style)));

  vars.push(`--layout-content-max: ${px(layout.contentMaxWidth)};`);
  vars.push(`--layout-reading-max: ${px(layout.readingMaxWidth)};`);
  vars.push(`--layout-header-height: ${px(layout.headerHeight)};`);
  vars.push(`--layout-bottom-nav-height: ${px(layout.bottomNavHeight)};`);
  vars.push(`--touch-target: ${px(layout.touchTarget)};`);
  vars.push(`--gutter: ${px(layout.gutter.mobile)};`);

  Object.entries(buttonColors).forEach(([variant, c]) => {
    vars.push(`--button-${variant}-bg: ${c.background};`);
    vars.push(`--button-${variant}-bg-pressed: ${c.backgroundPressed};`);
    vars.push(`--button-${variant}-fg: ${c.foreground};`);
    vars.push(`--button-${variant}-border: ${c.border};`);
  });
  Object.entries(buttonSizes).forEach(([size, s]) => {
    vars.push(`--button-${size}-height: ${px(s.height)};`);
    vars.push(`--button-${size}-padding-x: ${px(s.paddingX)};`);
    vars.push(`--button-${size}-font-size: ${rem(s.fontSize)};`);
    vars.push(`--button-${size}-gap: ${px(s.gap)};`);
  });
  Object.entries(iconButtonColors).forEach(([variant, c]) => {
    vars.push(`--icon-button-${variant}-bg: ${c.background};`);
    vars.push(`--icon-button-${variant}-bg-pressed: ${c.backgroundPressed};`);
    vars.push(`--icon-button-${variant}-fg: ${c.foreground};`);
    vars.push(`--icon-button-${variant}-border: ${c.border};`);
  });
  add('icon-button-size', iconButtonSizes, px);
  Object.entries(toneColors).forEach(([tone, c]) => {
    vars.push(`--tone-${tone}-bg: ${c.background};`);
    vars.push(`--tone-${tone}-fg: ${c.foreground};`);
    vars.push(`--tone-${tone}-border: ${c.border};`);
    vars.push(`--tone-${tone}-accent: ${c.accent};`);
  });

  const reducedMotion = Object.keys(durations)
    .map((key) => `--duration-${kebab(key)}: 0ms;`)
    .join(' ');

  return [
    `:root { ${vars.join(' ')} }`,
    `@media (min-width: ${px(breakpoints.md)}) { :root { --gutter: ${px(layout.gutter.tablet)}; } }`,
    `@media (min-width: ${px(breakpoints.lg)}) { :root { --gutter: ${px(layout.gutter.desktop)}; } }`,
    `@media (prefers-reduced-motion: reduce) { :root { ${reducedMotion} } }`,
    ...Object.entries(typography).map(([name, style]) => typeClass(name, style)),
  ].join('\n');
}

/**
 * Injects the token stylesheet once, before the app renders. Using a <style> element
 * rather than inline properties lets media queries such as reduced motion override values.
 */
export function applyThemeVariables(doc: Document = document): void {
  const id = 'hiddenspot-theme';
  if (doc.getElementById(id)) return;
  const style = doc.createElement('style');
  style.id = id;
  style.textContent = buildThemeCss();
  doc.head.prepend(style);
}
