# Roadmap

## Phase 1: foundation (this repository)

- [x] npm workspaces monorepo with mobile, web and shared packages
- [x] Shared types, mock JSON data, mock services, filtering, search, sorting and validation
- [x] Design tokens shared by both apps
- [x] Mobile: welcome, home, explore, saved, profile and place details screens
- [x] Web: responsive home, explore with URL filters, saved, place details and 404 pages
- [x] ESLint, Prettier, strict TypeScript, Vitest unit tests and a `validate` script
- [x] Design system: tokens, bundled fonts, components on both platforms, living reference pages
- [x] Demo data system: 41 Kerala places, typed service layer, validation, shared rules
- [x] Local persistence with localStorage and AsyncStorage, with corruption recovery
- [x] Mobile app: tabs, discovery, search with radius and sorting, map, details, reviews, add a spot
- [x] Web app: discover, explore with grid, list and optional map, details at `/places/:slug`,
      reviews, add a spot, saved, profile and a moderation demo at `/admin`

## Known gaps

- Addresses, opening hours and entry fees are not verified yet, so they are null.
- 8 real places still have no coordinates because the sources disagreed or only one existed.
- Photos are random placeholders, not photos of the real places.
- The profile is a fictional demo account. There is no sign-in.
- The `/admin` moderation page is a demo and is not protected.
- Uploaded photos are resized data URLs in local storage, which has a small size limit.
- The web map needs a tile provider, set with `VITE_MAP_TILE_URL`. Without it the map toggle is disabled.
- The Android map needs a Google Maps key for standalone builds.
- End-to-end flows were run in headless Chrome, but they are not checked into the repository.
  The mobile app has not been tested on a real device or emulator.
- No CI pipeline. The repository is not under git yet.

## Phase 2 candidates

The backend plan, with milestones and acceptance criteria, is in
[phase-2-backend-plan.md](phase-2-backend-plan.md).

- API-backed `HiddenSpotDataService` behind the existing interface
- Real authentication and user profiles
- Verified visitor information (hours, fees) from authoritative sources
- Map marker clustering
- Server-side moderation with real moderator accounts
- Component tests with React Testing Library and end-to-end tests with Playwright or Maestro
- CI that runs `npm run validate` and `npm run bundle:mobile`
