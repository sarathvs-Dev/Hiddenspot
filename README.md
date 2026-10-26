# HiddenSpot

HiddenSpot helps people discover hidden tourist destinations: waterfalls, quiet beaches, mountains,
forests, lakes, temples, churches, peaceful places and photoshoot locations.

This repository holds **Phase 1**: two frontend apps sharing one TypeScript core, running entirely
on local mock data. There is no backend, database or real authentication yet.

| Package              | Path              | Stack                                            |
| -------------------- | ----------------- | ------------------------------------------------ |
| `@hiddenspot/mobile` | `apps/mobile`     | Expo SDK 58, React Native 0.88, Expo Router      |
| `@hiddenspot/web`    | `apps/web`        | Vite 8, React 19, React Router 7                 |
| `@hiddenspot/shared` | `packages/shared` | Types, demo data, services, utils, tokens, hooks |

## Prerequisites

- **Node.js 20.19 or newer.** Node 22 LTS or 24 is recommended. See `.nvmrc`.
- **npm 10 or newer.** npm 8 crashes on this workspace. See [Troubleshooting](#troubleshooting).
- **For mobile:**
  - Expo Go for SDK 58 on a phone, or
  - Android Studio with an emulator, or
  - Xcode with a simulator (macOS only).

Check your versions:

```bash
node -v
npm -v
```

## Installation

Install everything once from the repository root. npm workspaces link the shared package into both apps.

```bash
npm install
```

No environment variables are required. Two optional ones turn on maps; see [Maps](#maps).

## Running the apps

Each app runs on its own. Run these commands from the repository root.

```bash
# Web app at http://localhost:5173
npm run dev:web

# Mobile: start Metro, then press a for Android, i for iOS, or scan the QR code with Expo Go
npm run dev:mobile
npm run android
npm run ios
```

You can also run them from inside each app folder:

```bash
cd apps/web && npm run dev
cd apps/mobile && npm start
```

## Quality checks

| Command                 | What it does                                                            |
| ----------------------- | ----------------------------------------------------------------------- |
| `npm run validate`      | Runs typecheck, lint, format check, tests and the web build in order    |
| `npm run typecheck`     | TypeScript in every workspace                                           |
| `npm run lint`          | ESLint for the whole monorepo                                           |
| `npm run lint:fix`      | ESLint with auto-fix                                                    |
| `npm run format`        | Prettier write                                                          |
| `npm run format:check`  | Prettier check                                                          |
| `npm test`              | Vitest unit tests for the shared package                                |
| `npm run build:web`     | Production web build into `apps/web/dist`                               |
| `npm run preview:web`   | Serves the production web build locally                                 |
| `npm run bundle:mobile` | Bundles the mobile app for Android and iOS with Metro, no device needed |
| `npm run doctor:mobile` | Runs `expo-doctor` to check native dependency versions                  |

## Project structure

```
HiddenSpot/
├─ apps/
│  ├─ mobile/                 Expo app
│  │  └─ src/
│  │     ├─ app/              Expo Router screens (file-based routes)
│  │     │  ├─ index.tsx      Welcome screen
│  │     │  ├─ (tabs)/        Home, Explore, Saved, Profile
│  │     │  ├─ place/[id].tsx Place details
│  │     │  └─ design-system.tsx  Living design-system reference
│  │     ├─ ui/               Design-system components for React Native
│  │     └─ lib/              Service wiring
│  └─ web/                    Vite app
│     └─ src/
│        ├─ pages/            Route components, including /design-system
│        ├─ ui/               Design-system components with CSS modules
│        ├─ components/       App shell (layout)
│        ├─ lib/              Service wiring, token-to-CSS generator, paths
│        └─ styles/           Global base CSS that reads token variables
├─ packages/
│  └─ shared/                 @hiddenspot/shared
│     ├─ types/               Domain types and service interfaces
│     ├─ data/                Seed JSON: places, categories, reviews, users, submissions
│     ├─ services/            Mock services and the createServices factory
│     ├─ utils/               Filtering, search, sorting, formatting, validation
│     ├─ theme/               Design tokens and component specs
│     ├─ content/             Shared microcopy
│     ├─ react/               Shared React providers and data hooks
│     └─ tests/               Vitest unit tests
├─ docs/                      Architecture, design system and roadmap
├─ eslint.config.js           One lint config for all packages
├─ tsconfig.base.json         Strict compiler defaults
└─ package.json               Workspaces and root scripts
```

Read [docs/architecture.md](docs/architecture.md) for the reasoning behind this layout. The proposed backend design for Phase 2 is in
[docs/phase-2-backend-plan.md](docs/phase-2-backend-plan.md). Nothing in it is implemented yet.

## Web app pages

| Page            | URL                     | What it does                                                           |
| --------------- | ----------------------- | ---------------------------------------------------------------------- |
| Discover        | `/`                     | Search, categories, featured, trending, newly added and collections    |
| Explore         | `/explore`              | Filters in the URL, radius, sorting, grid or list, optional map        |
| Place details   | `/places/munroe-island` | Gallery, visit info, safety notes, directions, reviews, related places |
| Add a spot      | `/add`                  | Validated form with photo previews. Submissions wait for review        |
| Saved           | `/saved`                | Saved places on this device                                            |
| Profile         | `/profile`              | Demo profile, your submissions, distance setting and demo reset        |
| Moderation demo | `/admin`                | Approve, reject or request changes on submissions                      |

**The moderation page is not secure.** It has no sign-in, and anyone with the link can open it.
It only changes demo data in your own browser.

## Maps

- **Web:** the map view on Explore is off until you set a tile provider. Copy
  `apps/web/.env.example` to `apps/web/.env` and set `VITE_MAP_TILE_URL` and
  `VITE_MAP_ATTRIBUTION`. Check the provider's usage terms first.
- **Mobile:** iOS, Expo Go and the web build work without a key. Standalone Android builds need
  `GOOGLE_MAPS_ANDROID_API_KEY`; see `apps/mobile/.env.example`. Without a map, the Map tab shows
  a list instead.
- Only places with a verified location appear on a map.

## Design system

Both apps share one design system: tokens, component specs and microcopy live in
`packages/shared`, and each app implements matching components in its `ui` folder.
Read [docs/design-system.md](docs/design-system.md) for the rules and component list.

- **Web reference:** run `npm run dev:web` and open http://localhost:5173/design-system.
- **Mobile reference:** open the app, go to **Profile**, then **Design system**.
- **Fonts:** Fraunces and Inter are bundled with both apps. No font CDN is used.

## Demo data

The apps use local seed JSON for 41 Kerala places, plus demo changes saved on the device.
Read [docs/data.md](docs/data.md) for the data model, business rules and persistence.

- **Local only:** saved places, demo reviews and demo submissions are stored in
  `localStorage` on web and AsyncStorage on mobile. This is not cloud sync.
- **Honest data:** coordinates are stored only when Wikipedia and OpenStreetMap agree, with both
  cited. Hours, fees and addresses are `null` until verified.
  Fictional entries end in "(demo)". Reviews are sample text and photos are placeholders.
- **Reset:** use "Reset demo data" on the web Profile or Saved page, or the mobile Profile screen.
- **Your location:** the device location is used only when you choose it. Otherwise distances
  are measured from a labelled demo location, such as "Kochi (demo location)".

After editing seed JSON, run:

```bash
npm test
```

## Troubleshooting

**`npm install` fails with "Cannot read properties of null (reading 'edgesOut')".**
An old global npm 8 is shadowing the npm that ships with Node. Node's npm launcher prefers a
copy in your global prefix folder. Upgrade it, then reinstall:

```bash
npm install -g npm@11
npm -v
npm install
```

**npm 8 ignores flags after `--`.** For example, `npm run dev:web -- --port 3000` starts Vite
with a wrong root folder on npm 8. Upgrading npm fixes it.

**Metro shows stale code or cannot resolve `@hiddenspot/shared`.**
Clear the cache and make sure you installed from the repository root:

```bash
cd apps/mobile
npx expo start --clear
```

**Expo Go says the project is incompatible.** Expo Go must support SDK 58. Update Expo Go,
or create a development build with `npx expo run:android` or `npx expo run:ios`.

**Duplicate React errors such as "Invalid hook call".** Only one React version may exist.
The root `overrides` field pins React 19.3.0 to match Expo SDK 58. Check with:

```bash
npm ls react
```

**Adding native mobile packages.** Use `npx expo install <package>` inside `apps/mobile` so Expo
picks SDK-compatible versions. If it fails to run npm, run `npm install` from the root afterwards.

**Port already in use.** Vite tries the next free port. For Metro, use `npx expo start --port 8082`.
