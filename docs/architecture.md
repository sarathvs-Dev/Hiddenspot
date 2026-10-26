# Architecture

## Goals

1. Two apps, one source of truth for business logic.
2. Phase 1 runs offline on mock data, with no backend, database or authentication.
3. Replacing mock data with a real API later must not touch screen code.

## Monorepo and dependency strategy

- **npm workspaces.** They need no extra tooling and Expo SDK 58 configures Metro for them
  automatically, so there is no custom `metro.config.js`.
- **One React version.** Expo SDK 58 pins React 19.3.0. The web app pins the same version and the
  root `overrides` field enforces it, so every package uses one copy of React.
- **Shared code ships as TypeScript source.** `@hiddenspot/shared` has no build step. Vite and Metro
  both compile it directly, so edits appear instantly in both apps.
- **Each app owns its UI dependencies.** Mobile uses Expo Router, `expo-image` and `@expo/vector-icons`.
  Web uses React Router and `lucide-react`. The shared package depends only on React as a peer.
- **Root-level tooling.** ESLint, Prettier and TypeScript live at the root, so rules are identical everywhere.

## Layers

```
 apps/mobile screens        apps/web pages
        │                         │
        └──── @hiddenspot/shared/react ────┐   HiddenSpotDataProvider, usePlaces,
                                           │   usePlace, useReviewsForPlace…
                  @hiddenspot/shared ──────┘
           types · services · utils · data · theme
```

| Layer    | Folder                     | Rule                                                                   |
| -------- | -------------------------- | ---------------------------------------------------------------------- |
| Types    | `packages/shared/types`    | Domain model and service interfaces. No runtime code beyond constants. |
| Data     | `packages/shared/data`     | Local JSON and category definitions.                                   |
| Services | `packages/shared/services` | Implement the interfaces. Only layer that touches data sources.        |
| Utils    | `packages/shared/utils`    | Pure functions: filter, search, sort, format, validate.                |
| Theme    | `packages/shared/theme`    | Design tokens consumed by both apps.                                   |
| React    | `packages/shared/react`    | Providers and hooks using only core React.                             |
| Apps     | `apps/*`                   | Platform UI and navigation. No business logic.                         |

ESLint blocks `react-native`, `react-dom`, Expo and React Router imports inside the shared package,
which keeps it platform-agnostic.

## Swapping mock services for a real API

UI code depends only on the `HiddenSpotDataService` interface and the shared hooks.
Each app builds its services once in `src/lib/services.ts` with `createServices()` and passes
them to `HiddenSpotDataProvider`. See [data.md](data.md) for the data model and rules.

To add a backend later:

1. Implement `HiddenSpotDataService` with `fetch`.
2. Run every response through the shared validators so bad data fails at the boundary.
3. Add an `'api'` mode to `createServices` that returns the new class.
4. Add an environment variable for the API base URL at that point, with an `.env.example` file.
5. Change the mode in each app's `src/lib/services.ts`.

This is not quite a drop-in swap. The interface still takes user ids from the client, includes
demo-only methods and loads the whole catalogue at once, and photos are stored as local
references. [phase-2-backend-plan.md](phase-2-backend-plan.md) lists every dependency, the
proposed API and the changes needed first.

## Design system

The brand is calm and nature-first: deep forest green for actions, warm ivory backgrounds,
charcoal text, sage secondary surfaces and amber highlights. See
[design-system.md](design-system.md) for the full reference.

- **Tokens** live in `packages/shared/theme/tokens.ts`. **Component specs** such as button
  variants, tones and avatar colours live in `packages/shared/theme/components.ts`.
- **Web** turns the tokens into CSS variables and typography classes at startup
  (`apps/web/src/lib/theme.ts`). Components in `apps/web/src/ui` use CSS modules that only
  reference those variables.
- **Mobile** components in `apps/mobile/src/ui` read the tokens directly.
- **Shared behaviour:** the toast queue, favorites with undo, the reference location for
  distances, form validators and microcopy are shared, so both apps behave the same.
- **Accessibility guardrails:** unit tests check WCAG AA contrast for every token pairing.

Category icons are stored as platform-neutral keys in the shared data. Each app maps the keys to
its own icon library.

## Navigation

| Screen          | Mobile route (Expo Router) | Web route (React Router) |
| --------------- | -------------------------- | ------------------------ |
| Welcome         | `/`                        | Merged into home hero    |
| Home / Discover | `/(tabs)/explore`          | `/`                      |
| Explore results | `/(tabs)/explore/search`   | `/explore`               |
| Map             | `/(tabs)/map`              | `/explore?view=map`      |
| Add a spot      | `/(tabs)/add`              | `/add`                   |
| Saved           | `/(tabs)/saved`            | `/saved`                 |
| Profile         | `/(tabs)/profile`          | `/profile`               |
| Place details   | `/place/[id]`              | `/places/:slug`          |
| Moderation demo | Not on mobile              | `/admin`                 |

Web place URLs use the readable slug, for example `/places/munroe-island`. The data service
accepts an id or a slug, and the page replaces an id URL with the slug URL.

The `/admin` page is a demonstration only. It has no sign-in and is not protected: anyone with
the link can open it. Its actions run as the fictional demo moderator against local demo data.
Real moderation needs server-side authentication and permission checks.

The add-a-spot form rules live in `packages/shared/utils/submissionForm.ts`, so web and
mobile validate the same way. The data service validates again on submit.

On the web, Explore filters live in the URL query string, so filtered views are shareable.
`sanitizePlaceQuery` and `serializePlaceQuery` convert between URL params and typed filters.

## Persistence in Phase 1

Seed JSON is read-only. Demo changes are stored as one JSON document on the device:
`localStorage` on web and AsyncStorage on mobile. This is local demo storage, not cloud sync.
See [data.md](data.md) for failure handling and reset.
