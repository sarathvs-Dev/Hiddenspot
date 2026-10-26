# HiddenSpot design system

HiddenSpot should feel adventurous, calm, premium, modern, trustworthy and nature-focused.
This document covers the tokens, components and rules that make both apps look and behave
the same.

**Living reference:** the web app serves every token and component at `/design-system`.
The mobile app has the same reference under **Profile → Design system**. Both pages render
the production components, so they never drift from the code.

## How it fits together

```
packages/shared/theme/tokens.ts       Raw values: palette, type, spacing, radii, shadows, motion…
packages/shared/theme/components.ts   Component specs: button variants and sizes, tones, avatars
packages/shared/content/copy.ts       Shared microcopy
packages/shared/react/                Toast, favorites and reference-location providers
        │
        ├── apps/web/src/lib/theme.ts → CSS variables and .ds-type-* classes, injected at startup
        │   apps/web/src/ui/          → React components with CSS modules
        │
        └── apps/mobile/src/ui/       → React Native components reading tokens directly
```

Each app implements its own components, because DOM and native views differ. Names, props,
variants, sizes, colours and copy are shared, so a `Button variant="secondary" size="sm"`
looks and behaves the same on both platforms.

## Rules

1. **Tokens only.** Never write a raw hex colour, pixel size, radius, shadow or duration in a
   component. Web code uses `var(--…)`. Mobile code imports from `@hiddenspot/shared`.
2. **Semantic colours first.** Use `semanticColors.primary`, not `palette.forest700`.
   Reach for the palette only for decorative accents.
3. **One primary action per view.** Everything else is secondary, outline or ghost.
4. **44px minimum touch targets.** Small buttons keep a 44px hit area through `hitSlop` on
   mobile and an invisible extension on web.
5. **Contrast is tested.** `packages/shared/tests/design-system.test.ts` fails if any text,
   button, badge, avatar, focus-ring or input-border pairing drops below WCAG 2.2 AA.
6. **Respect reduced motion.** Web durations become `0ms` under `prefers-reduced-motion`.
   Mobile components read `useReducedMotion()`.
7. **Microcopy lives in `copy.ts`.** Keep it short, specific and friendly.

## Colour

| Role              | Token                       | Value                  | Use                                      |
| ----------------- | --------------------------- | ---------------------- | ---------------------------------------- |
| Primary           | `primary`                   | forest 700 `#1C4433`   | Main actions, selected chips, active nav |
| Background        | `background`                | ivory 100 `#FAF6EE`    | Page background                          |
| Surface           | `surface`                   | white                  | Cards, inputs, dialogs                   |
| Secondary surface | `surfaceSecondary`          | sage 100 `#E7ECE2`     | Secondary buttons, stat panels           |
| Primary text      | `textPrimary`               | charcoal 900 `#1F2321` | Headings and body                        |
| Secondary text    | `textSecondary`             | charcoal 600 `#535A55` | Supporting text                          |
| Highlight         | `highlight` / `onHighlight` | amber 100 / amber 800  | Selected highlights, counts              |
| Rating            | `rating`                    | amber 500 `#D9971F`    | Stars                                    |
| Danger            | `danger`                    | red 600 `#A93526`      | Destructive actions, errors              |
| Focus             | `focusRing`                 | forest 500 `#2F6A4D`   | Keyboard focus outline                   |

Tones for badges, toasts and status labels are `neutral`, `brand`, `success`, `warning`,
`danger`, `info` and `highlight`. Each has background, foreground, border and accent colours
in `toneColors`.

## Typography

- **Fraunces** for display and section headings: expressive but restrained.
- **Inter** for titles, body, labels and helper text.
- Both are bundled: Fontsource on web, `@expo-google-fonts` on mobile. Nothing loads from a
  CDN. If a font fails, text falls back to Georgia or the system sans-serif.

| Variant     | Phone | Desktop | Font           | Use                     |
| ----------- | ----- | ------- | -------------- | ----------------------- |
| `display`   | 38    | 64      | Fraunces 600   | Hero headline           |
| `h1`        | 30    | 44      | Fraunces 600   | Page title              |
| `h2`        | 24    | 30      | Fraunces 600   | Section title           |
| `h3`        | 18    | 20      | Inter 600      | Subsection, card title  |
| `title`     | 16    | 16      | Inter 600      | List item title         |
| `body`      | 15    | 16      | Inter 400      | Paragraphs              |
| `bodySmall` | 13    | 13      | Inter 400      | Secondary details       |
| `label`     | 13    | 13      | Inter 600      | Form labels, chips      |
| `caption`   | 12    | 12      | Inter 500      | Metadata                |
| `overline`  | 11    | 11      | Inter 600 caps | Eyebrows above headings |
| `helper`    | 12    | 12      | Inter 400      | Hints and validation    |

On the web, sizes scale fluidly between 360px and 1200px viewports. On tablets, mobile uses
a size halfway between the phone and desktop values.

```tsx
<Text variant="h2">Featured hidden spots</Text>
<Text variant="body" tone="secondary">Hand-picked places with few crowds.</Text>
```

On the web, plain elements can also use the generated classes, such as `className="ds-type-h3"`.

## Spacing, shape and elevation

- **Spacing:** a 4px scale named `xxs` 2, `xs` 4, `sm` 8, `md` 12, `lg` 16, `xl` 24,
  `xxl` 32, `xxxl` 48, `xxxxl` 64.
- **Radii:** `sm` 8, `md` 12, `lg` 16, `xl` 24, `xxl` 32 and `pill`. Cards use `xl`.
  Inputs use `md`. Buttons and chips use `pill`.
- **Shadows:** `xs`, `sm`, `md` and `lg`, all warm and soft. They are CSS box-shadow strings,
  which React Native 0.76 and later also accepts.
- **Image ratios:** featured cards are 4:5, compact thumbnails 1:1, the gallery 4:3 and heroes 16:9.
- **Layout:** content is at most 1200px wide and reading text at most 680px. The gutter is
  16px on phones, 24px on tablets and 32px on desktop.

## Motion

| Token    | Duration | Use                                |
| -------- | -------- | ---------------------------------- |
| `fast`   | 120ms    | Hover, press                       |
| `normal` | 200ms    | Colour changes, exits              |
| `slow`   | 320ms    | Dialog and sheet entry, image fade |
| `slower` | 480ms    | Image zoom on hover                |

The easings are `standard`, `enter` and `exit`. All of them drop to zero when reduced motion
is on.

Every animation marks a change of state. None is decorative.

| Moment             | Web                                              | Mobile                                         |
| ------------------ | ------------------------------------------------ | ---------------------------------------------- |
| Changing page      | New page fades up. Keyed by path, not filters    | Stack slides from the right. Tabs cross-fade   |
| Results appearing  | Cards fade up; the first four are staggered 40ms | Cards fade in, with no movement or delay       |
| Dialogs and sheets | Open and close animate, including Escape         | Sheets slide up and down                       |
| Saving a place     | The heart pops once, only when saved             | The heart springs once, only when saved        |
| Gallery            | Each new photo fades in                          | Photos page natively                           |
| Submitting a form  | Button spinner, then the success icon scales in  | Button spinner, then the success icon fades in |
| Toasts             | Slide in                                         | Slide in                                       |
| Loading            | Skeleton shimmer                                 | Skeleton shimmer                               |

Animations use only opacity and transform, so they never cause layout shift. On the web, a
`prefers-reduced-motion` rule turns each one off. On mobile, `useReducedMotion` follows the
system Reduce Motion setting. No animation library is added: the web uses CSS, and mobile uses
React Native `Animated` with the native driver.

## Components

Web components come from `apps/web/src/ui`. Mobile components come from `apps/mobile/src/ui`.
Each folder has an index file, so import from there.

| Component                                                                            | Purpose                                                                    | Key props                                                                                                                                  |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`                                                                             | Actions                                                                    | `variant`: primary, secondary, outline, ghost or danger. `size`: sm, md or lg. Also `leadingIcon`, `trailingIcon`, `loading`, `fullWidth`. |
| `ButtonLink`, `ButtonAnchor`                                                         | Web only. Navigation styled as a button.                                   | Same as `Button`                                                                                                                           |
| `IconButton`                                                                         | Icon-only actions                                                          | `label` is required. `variant`: solid, soft, outline or glass.                                                                             |
| `SaveButton`                                                                         | Save toggle with toast and undo                                            | `placeId`, `placeName`                                                                                                                     |
| `SearchField`                                                                        | Search input with clear button                                             | `value` and `onChange` on web, `onChangeText` on mobile                                                                                    |
| `FilterChip`, `ChipGroup`, `CategoryChips`                                           | Toggle filters                                                             | `selected`, `count`. `layout` is scroll or wrap.                                                                                           |
| `CategoryIcon`                                                                       | Category glyph                                                             | `icon` takes a shared `CategoryIconKey`                                                                                                    |
| `PlaceCard`                                                                          | Destination card                                                           | `variant` is featured or compact. `distanceKm` is optional.                                                                                |
| `RatingIndicator`, `DistanceIndicator`                                               | Rating and distance                                                        | `appearance="badge"` for use on photos                                                                                                     |
| `SpotImage`                                                                          | Image with ratio, fade-in and fallback                                     | `ratio`, `fill`, `alt`                                                                                                                     |
| `ImageGallery`                                                                       | Thumbnails plus full-screen viewer                                         | `images`                                                                                                                                   |
| `SectionHeading`                                                                     | Eyebrow, title, description and action                                     | `size` is page, section or subsection                                                                                                      |
| `SiteHeader`, `BottomNav`                                                            | Web navigation                                                             | `items`                                                                                                                                    |
| `BottomNavIcon`, `bottomNavStyles`                                                   | Mobile tab bar                                                             | Used by the tabs layout                                                                                                                    |
| `Modal`, `BottomSheet`, `ConfirmDialog`                                              | Overlays                                                                   | `open`, `onClose`, `title`, `footer`. Web `Modal` also has `variant="lightbox"`.                                                           |
| `TextField`, `TextArea`, `SelectField`, `Checkbox`, `FormField`, `ValidationMessage` | Forms                                                                      | `label`, `hint`, `error`, `required`, `optional`                                                                                           |
| `Skeleton`, `PlaceCardSkeleton`, `LoadingRegion`                                     | Loading                                                                    | `shape`, `ratio`                                                                                                                           |
| `EmptyState`, `ErrorState`                                                           | Empty and failure views                                                    | `size` is page or inline                                                                                                                   |
| `ToastViewport` + `useToast()`                                                       | Feedback                                                                   | `showToast({ title, message, tone, action })`                                                                                              |
| `ReviewCard`, `Avatar`                                                               | Reviews                                                                    | Avatars fall back to coloured initials                                                                                                     |
| `Badge`, `StatusBadge`                                                               | Labels                                                                     | `tone`; `status` takes a `SubmissionStatus`                                                                                                |
| `Text`, `Icon`                                                                       | Primitives                                                                 | `variant`, `tone`; `size` takes an icon size token                                                                                         |
| `Screen`                                                                             | Mobile only. Screen wrapper with safe area, gutters and tab-bar clearance. | `withBottomNav`, `scroll`                                                                                                                  |

### Place cards

Every card shows the photo, name, category, location, rating with review count and a save
button. Distance appears only when a reference location is known. A card measures it from
`ReferenceLocationProvider`, or you can pass `distanceKm` directly. Phase 1 starts with no
reference location, so cards hide distance until one is set. The design-system page has a
demo toggle for it.

```tsx
<PlaceGrid>
  {places.map((place) => (
    <li key={place.id}>
      <PlaceCard place={place} />
    </li>
  ))}
</PlaceGrid>

<PlaceCard place={place} variant="compact" />
```

On the web, the whole card is clickable through a stretched link on the name. The save button
is a separate control, never nested inside the link.

### Overlays

- On the web, `Modal` uses the native `<dialog>` element. Focus stays inside, Escape closes it,
  the page behind becomes inert, and focus returns to the trigger.
- The `sheet` variant docks to the bottom on phones and becomes a centred dialog from 768px.
- On mobile, `Modal` and `BottomSheet` animate in, close with the Android back button and keep
  VoiceOver focus inside.

```tsx
<ConfirmDialog
  open={open}
  tone="danger"
  title={copy.confirm.clearSaved.title}
  message={copy.confirm.clearSaved.message}
  confirmLabel={copy.confirm.clearSaved.confirm}
  onCancel={close}
  onConfirm={clearAll}
/>
```

### Forms

Labels sit above fields and hints sit below. An error replaces the hint and is announced to
screen readers. Validators come from the shared package:

```ts
const errors = validateForm(values, {
  name: [required('Name')],
  email: [required('Email'), email],
  note: [optional(minLength('Description', 20))],
});
```

### Status labels

Demo submissions use `StatusBadge`. Labels, tones and explanations come from
`SUBMISSION_STATUS_META`.

| Status              | Label             | Tone      |
| ------------------- | ----------------- | --------- |
| `draft`             | Draft             | neutral   |
| `submitted`         | Pending review    | info      |
| `in_review`         | In review         | warning   |
| `changes_requested` | Changes requested | highlight |
| `approved`          | Approved          | success   |
| `rejected`          | Not accepted      | danger    |

## Responsive behaviour

- **Phones:** single column, a floating bottom navigation within thumb reach, filters in a
  bottom sheet, chip rows that scroll sideways, and fixed action bars on detail pages.
- **Tablets:** the web header navigation appears from 768px. Grids show two or three columns.
  Mobile lists use two columns and slightly larger type.
- **Desktop:** content is capped at 1200px. Explore shows a sticky filter sidebar from 1024px.
  Details pages show a sticky "Plan your visit" card.

## Adding a component

1. Add any new variants or colours to `packages/shared/theme/components.ts`, not to the component.
2. Build the web version in `apps/web/src/ui` with a CSS module that uses only `var(--…)` tokens.
3. Build the mobile version in `apps/mobile/src/ui` with the same name and props.
4. Export both from their `ui/index.ts` files.
5. Add an example to both design-system pages.
6. If the component introduces new colour pairings, add a contrast assertion to the tests.
