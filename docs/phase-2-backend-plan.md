# Phase 2 backend integration plan

Status: proposal. Nothing in this document is implemented. Phase 1 stays a standalone demo
with no backend, no database and no real sign-in. The endpoints below are a design for review,
not a running API.

## 1. Summary

Phase 1 is in good shape for a backend. Every screen reads and writes data through one
interface, `HiddenSpotDataService`, and the shared React hooks. No app imports seed JSON or the
stored demo state directly. Business rules for search, sorting, ratings, forms and moderation
live in `packages/shared`, so web and mobile behave the same.

The interface still mixes in demo assumptions that a real server cannot accept. The four that
matter most:

1. **The client says who it is.** Reviews send `userId`, submissions send `submittedBy`, and
   moderation sends `actorId`. A server must take identity from the session instead.
2. **Demo-only methods sit on the main interface.** These are `resetDemoState`,
   `getStorageStatus` and `getDemoUsers`.
3. **The whole catalogue loads at once.** Filtering, search, radius and paging all run on the
   device.
4. **Photos are local references.** Web stores data URLs and mobile stores `file:` or `content:`
   URIs inside submissions. These cannot be uploaded or shared as they are.

The roadmap in section 11 fixes these first, while still in demo mode, then adds the backend
behind the same hooks.

## 2. What depends on the mock services today

### Data layer, in `packages/shared`

| Part                | File                                                | Role today                                                           |
| ------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| Service interface   | `types/service.ts`                                  | `HiddenSpotDataService`, the only data API the UI uses               |
| Mock implementation | `services/demoDataService.ts`                       | Seed JSON plus local demo state. Enforces all rules                  |
| Local persistence   | `services/demoStateStore.ts`, `services/storage.ts` | Saves demo changes and recovers from corrupt data                    |
| Composition root    | `services/createServices.ts`                        | Only `'demo'` mode exists                                            |
| Seed data           | `data/*.json`, `data/index.ts`                      | Places, categories, reviews, demo users, submissions, presets        |
| Errors              | `services/errors.ts`                                | `DemoDataError` with `VALIDATION`, `NOT_FOUND`, `FORBIDDEN` and more |

### Hooks and providers, in `packages/shared/react`

| Hook or provider                                            | Calls                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| `ServicesProvider`, `useDataService`, `useDataVersion`      | `subscribe`, `getVersion`                                               |
| `CatalogProvider`, `useCatalog`                             | `getCategories`                                                         |
| `SavedPlacesProvider`, `useSavedPlaceIds`                   | `getSavedPlaceIds`, `toggleSavedPlace`, `clearSavedPlaces`, `subscribe` |
| `usePlaces`, `usePlace`, `useRelatedPlaces`, `useDistricts` | `getPlaces`, `getPlaceById`, `getRelatedPlaces`, `getDistricts`         |
| `useReviewsForPlace`                                        | `getReviewsForPlace`                                                    |
| `useSubmissions`, `useSavedPlaces`                          | `getSubmissions`, `getSavedPlaces`                                      |
| `useCurrentUser`, `useDemoUsers`, `useStorageStatus`        | `getCurrentUser`, `getDemoUsers`, `getStorageStatus`                    |
| `useReferenceLocations`                                     | `getReferenceLocations`                                                 |

### Screens

| Screen         | Web                                                     | Mobile                                                   | Data used                                                     |
| -------------- | ------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| Home / Explore | `HomePage`, `ExplorePage`                               | `explore/index`, `explore/search`                        | places, catalogue, districts                                  |
| Map            | Explore map view                                        | `(tabs)/map`                                             | places                                                        |
| Place details  | `PlaceDetailsPage`                                      | `place/[id]`                                             | place, reviews, related places                                |
| Write a review | `ReviewDialog`                                          | `ReviewSheet`                                            | **`addDemoReview`** called directly                           |
| Add a spot     | `AddSpotPage`                                           | `(tabs)/add`                                             | **`addDemoSubmission`** called directly                       |
| Saved          | `SavedPage`                                             | `(tabs)/saved`                                           | saved places. Web also calls **`resetDemoState`**             |
| Profile        | `ProfilePage`                                           | `(tabs)/profile`                                         | current user, submissions, **`resetDemoState`**               |
| Moderation     | `AdminPage`                                             | none                                                     | all submissions, demo users, **`updateDemoSubmissionStatus`** |
| Shared UI      | `PlaceCard`, `SaveButton`, `CategoryChips`, `AppLayout` | `PlaceCard`, `EditorialCard`, `SaveButton`, `FilterChip` | catalogue, saved ids                                          |

Bold calls bypass the hooks and use the service directly.

### Outside the data service

| What                      | Where                                                       | Phase 2 note                                           |
| ------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| Reference location choice | web `lib/location.tsx`, mobile `lib/location.tsx`           | Stays on the device. Optionally synced as a preference |
| Preferences               | mobile `lib/preferences.tsx`                                | Candidate for synced user settings                     |
| Photo handling            | web `lib/images.ts` (data URLs), mobile image picker URIs   | Must become uploads (section 8)                        |
| Moderator choice          | `AdminPage` picks the first demo user with a moderator role | Must come from the signed-in session                   |
| Status rules in the UI    | `AdminPage` uses `SUBMISSION_TRANSITIONS` to show buttons   | Fine for display. The server must enforce them         |

## 3. Target service interface

Goal: screens keep using the same hooks. Only the composition root picks demo or API. JSON
formats, storage keys and HTTP details stay inside implementations.

Split the single interface into focused services. Remove identity from inputs, and move
demo-only tools out of the shared contract.

```ts
// Sketch for review. Not in the codebase yet.
interface Page<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}

interface CatalogService {
  listPlaces(query: PlaceQuery & { cursor?: string; limit?: number }): Promise<Page<Place>>;
  getPlace(idOrSlug: string): Promise<Place | null>;
  getRelatedPlaces(placeId: string, limit?: number): Promise<Place[]>;
  getCategories(): Promise<Category[]>;
  getDistricts(): Promise<string[]>;
  getReferenceLocations(): Promise<ReferenceLocationPreset[]>;
}

interface ReviewService {
  listReviews(placeId: string, cursor?: string): Promise<Page<ReviewWithAuthor>>;
  addReview(placeId: string, input: ReviewFormValues): Promise<ReviewWithAuthor>; // no userId
}

interface SavedPlacesService {
  listSavedPlaceIds(): Promise<string[]>;
  savePlace(placeId: string): Promise<void>; // idempotent
  unsavePlace(placeId: string): Promise<void>; // idempotent
}

interface SubmissionService {
  listMySubmissions(): Promise<Submission[]>;
  createSubmission(draft: PlaceDraftInput, options?: { asDraft?: boolean }): Promise<Submission>; // no submittedBy
  updateSubmission(
    id: string,
    draft: PlaceDraftInput,
    expectedVersion: number,
  ): Promise<Submission>;
  resubmit(id: string, expectedVersion: number): Promise<Submission>;
  requestImageUpload(file: { contentType: string; byteSize: number }): Promise<UploadTicket>;
}

interface ModerationService {
  listSubmissions(filter: {
    status?: SubmissionStatus;
    cursor?: string;
  }): Promise<Page<Submission>>;
  getStats(): Promise<ModerationStats>;
  transition(
    id: string,
    to: SubmissionStatus,
    note: string | null,
    expectedVersion: number,
  ): Promise<Submission>; // no actorId
}

interface SessionService {
  getSession(): Promise<Session | null>; // null when signed out
  signIn(method: SignInMethod): Promise<Session>;
  signOut(): Promise<void>;
  onChange(listener: (session: Session | null) => void): () => void;
}

/** Demo builds only. Never part of the API implementation. */
interface DemoTools {
  resetDemoState(): Promise<void>;
  getStorageStatus(): Promise<DemoStorageStatus>;
}
```

Rules for both implementations:

- **Validate every response at the boundary** with the shared validators, such as
  `validatePlace`. Bad data fails in the data layer, never in a screen.
- **One error type.** Replace `DemoDataError` with a `ServiceError` that keeps today's codes and
  adds `UNAUTHENTICATED`, `RATE_LIMITED`, `NETWORK` and `UNAVAILABLE`. Field errors keep the
  `issues` shape, so `reviewErrorsFromError` and `issuesToSubmissionErrors` keep working.
- **Change notification moves into a client cache.** Today one global version number refetches
  every query. With an API, a query cache should invalidate only the affected keys, such as
  saved ids after a save.
- **`sortPlaces` leaves the interface.** It stays as a pure shared utility.
- **The demo implementation keeps working.** It gains the new shape, so Phase 1 remains
  available for previews, tests and offline demos.

## 4. Proposed API operations

Versioned under `/v1`, JSON over HTTPS. "Public" means it works signed out. All writes need a
session. Errors use one body shape: `{ code, message, issues[] }`.

| Area        | Operation                                  | Proposed endpoint                                                                                          | Access    |
| ----------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | --------- |
| Places      | List with filters, sort, paging            | `GET /v1/places?query&categories&districts&minRating&withPhotos&maxDistanceKm&lat&lng&sortBy&cursor&limit` | Public    |
| Places      | Get one by id or slug                      | `GET /v1/places/{idOrSlug}`                                                                                | Public    |
| Places      | Related places                             | `GET /v1/places/{id}/related?limit`                                                                        | Public    |
| Catalogue   | Categories, districts, presets             | `GET /v1/categories`, `GET /v1/districts`, `GET /v1/reference-locations`                                   | Public    |
| Reviews     | List for a place                           | `GET /v1/places/{id}/reviews?cursor`                                                                       | Public    |
| Reviews     | Add                                        | `POST /v1/places/{id}/reviews`                                                                             | Signed in |
| Reviews     | Edit or delete own                         | `PATCH /v1/reviews/{id}`, `DELETE /v1/reviews/{id}`                                                        | Author    |
| Reviews     | Report                                     | `POST /v1/reviews/{id}/reports`                                                                            | Signed in |
| Saved       | List own                                   | `GET /v1/me/saved-places`                                                                                  | Signed in |
| Saved       | Save or unsave, idempotent                 | `PUT /v1/me/saved-places/{placeId}`, `DELETE /v1/me/saved-places/{placeId}`                                | Signed in |
| Saved       | Clear all                                  | `DELETE /v1/me/saved-places`                                                                               | Signed in |
| Submissions | List own                                   | `GET /v1/me/submissions`                                                                                   | Signed in |
| Submissions | Create, as draft or pending                | `POST /v1/submissions`                                                                                     | Signed in |
| Submissions | Edit a draft or one with changes requested | `PATCH /v1/submissions/{id}` with `expectedVersion`                                                        | Submitter |
| Submissions | Submit or resubmit                         | `POST /v1/submissions/{id}/submit`                                                                         | Submitter |
| Uploads     | Get a signed upload URL                    | `POST /v1/uploads`                                                                                         | Signed in |
| Moderation  | Queue with status filter                   | `GET /v1/moderation/submissions?status&cursor`                                                             | Moderator |
| Moderation  | One submission, with private photos        | `GET /v1/moderation/submissions/{id}`                                                                      | Moderator |
| Moderation  | Change status                              | `POST /v1/moderation/submissions/{id}/transitions` with `{ to, note, expectedVersion }`                    | Moderator |
| Moderation  | Statistics                                 | `GET /v1/moderation/stats`                                                                                 | Moderator |
| Moderation  | Audit history                              | `GET /v1/moderation/submissions/{id}/events`                                                               | Moderator |
| Account     | Profile and preferences                    | `GET /v1/me`, `PATCH /v1/me/preferences`                                                                   | Signed in |
| Account     | Export and delete account                  | `GET /v1/me/export`, `DELETE /v1/me`                                                                       | Signed in |

Query parameters reuse `serializePlaceQuery` and `sanitizePlaceQuery`, so web URLs, mobile
filters and API calls share one format.

## 5. What the database should store

| Table                            | Key fields and constraints                                                                                                                                                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`                          | id, display name, avatar, home district, role (`explorer`, `moderator`, `curator`), created and deleted timestamps                                                                                                                  |
| `user_identities`                | user id, auth provider, provider subject. Unique per provider and subject                                                                                                                                                           |
| `places`                         | Opaque id, unique slug, name, descriptions, district, state, country, address, location as a geography point (nullable), `location_precision`, hours, fee, best time, safety notes, `moderation_status`, created by, `is_synthetic` |
| `place_slug_history`             | Old slugs that redirect to the current one                                                                                                                                                                                          |
| `place_sources`                  | Provenance for verified facts, such as Wikipedia and OpenStreetMap, with retrieval date                                                                                                                                             |
| `categories`, `place_categories` | Ordered. The first category is primary                                                                                                                                                                                              |
| `place_images`                   | Storage key, width, height, alt text, credit, licence, order, status                                                                                                                                                                |
| `reviews`                        | place, author, rating (check 1 to 5), title, body, visit month, timestamps. Unique on place and author                                                                                                                              |
| `place_rating_summary`           | Review count and rating sum per place, updated in the same transaction as review writes                                                                                                                                             |
| `saved_places`                   | Primary key on user and place, plus `saved_at`                                                                                                                                                                                      |
| `submissions`                    | Submitter, status, draft fields, reviewer note, approved place id, `version` for optimistic locking                                                                                                                                 |
| `submission_images`              | Uploads attached to a submission. Private until approval                                                                                                                                                                            |
| `moderation_events`              | Append-only audit: submission, actor, from and to status, note, timestamp                                                                                                                                                           |
| `user_preferences`               | Default sort, reference location choice, onboarding done                                                                                                                                                                            |
| `reference_locations`            | The demo town presets, with sources                                                                                                                                                                                                 |

Not stored: demo state, storage status, computed distances and the "current demo user".

**Seed migration:**

- Import the real places, with their coordinates and sources.
- Do not import the synthetic "(demo)" places, the sample reviews or the fictional users as real
  data.
- Replace the picsum photos with licensed photos before launch.

## 6. Authentication and authorization

**Sign-in**

- Use a managed identity provider with OpenID Connect, offering email links plus Google and
  Apple. iOS requires Sign in with Apple when other social sign-ins are offered.
- Anyone can browse without signing in. Saving, reviewing and submitting require an account.

**Sessions and tokens**

- On web, keep tokens in secure, httpOnly, SameSite cookies through a small backend-for-frontend
  endpoint, never in `localStorage`.
- On mobile, keep the refresh token in `expo-secure-store`.
- Use short-lived access tokens and rotating refresh tokens.

**Roles**

- Roles live in the database and are read on the server for every request.
- Changing a role is a curator-only action and is written to an audit log.

| Action                                   | Signed out | Explorer | Moderator | Curator |
| ---------------------------------------- | :--------: | :------: | :-------: | :-----: |
| Browse approved places and reviews       |     ✓      |    ✓     |     ✓     |    ✓    |
| Save places, write reviews, submit spots |            |    ✓     |     ✓     |    ✓    |
| Edit or delete own reviews and drafts    |            |    ✓     |     ✓     |    ✓    |
| View the moderation queue, change status |            |          |     ✓     |    ✓    |
| Moderate own submission                  |            |          |           |         |
| Change roles, edit published places      |            |          |           |    ✓    |

**Account rights**

- Users can export their data and delete their account. Deletion removes saved places and
  anonymises reviews.
- The app stores need a working in-app account deletion option.

## 7. Enforcing moderation on the server

The `/admin` page in Phase 1 is a demonstration with no protection. Hiding a route or a button
never secures anything, because anyone can call an API directly. In Phase 2:

1. **Every moderation endpoint checks the caller on the server.** It verifies the session token,
   loads the user's role from the database, and returns 403 unless the user is a moderator or
   curator. The client never sends an actor id.
2. **The server owns the state machine.** Reuse the shared `SUBMISSION_TRANSITIONS` and
   `validateModerationNote` on the server, in Node, so the rules cannot drift. An invalid move
   returns 409, and a missing note returns 422.
3. **Writes are transactional and conflict-safe.**
   - A status change updates the submission, increments its `version` and writes a
     `moderation_events` row in one transaction.
   - Approval also creates the place and moves its photos to public in the same transaction.
   - A stale `expectedVersion` returns 409, so two moderators cannot both decide.
4. **No self-moderation.** A moderator cannot change the status of their own submission.
5. **Public reads filter on the server.** Place endpoints only ever return approved places, and
   unapproved photos are never publicly readable.
6. **Abuse controls.** Moderation and submission endpoints are rate-limited and logged.
7. **The UI follows the server.** The admin page shows actions based on the server's answer and
   handles 401 by signing in again and 403 by explaining that access is missing. It stays
   lazy-loaded and out of the main navigation for non-moderators. That is a usability choice,
   not security.
8. **Tested by a permission matrix.** Automated tests call every endpoint as signed out,
   explorer, moderator and curator, and check the expected status codes.

## 8. Image upload and storage

**Upload flow**

1. **Resize on the device.** Keep the web `resizeImageFile` approach, with a longest edge of
   2000 px. Add `expo-image-manipulator` on mobile. Large phone photos should never upload at
   full size.
2. **Request an upload.** The client calls `POST /v1/uploads` with type and size. The server
   checks limits and returns a short-lived, single-use signed URL to private object storage, such
   as S3, Cloudflare R2 or Google Cloud Storage.
3. **Upload and attach.** The client uploads straight to storage, then attaches the returned
   upload ids to the submission. The API never receives image bytes.
4. **Process on the server.**
   - Verify the real file type.
   - Strip all EXIF data from public images, especially GPS. Keep the original location only in
     private moderator metadata, if at all.
   - Create the sizes the UI uses: card, hero and full screen, in WebP or AVIF with a JPEG
     fallback.
   - Run an automated content scan.

**Limits and rights**

- At most 4 photos per submission, matching `MAX_SUBMISSION_PHOTOS`.
- At most 15 MB each before resizing.
- JPEG, PNG, WebP or HEIC only. HEIC is converted on the server.
- Users confirm they took the photo or hold the rights.
- Credit and licence are stored per image.

**Visibility and retention**

- Submission photos stay private until approval.
- Approved images are served through a CDN with long cache lifetimes and content-hashed keys.
- Photos from rejected submissions are deleted after a set period, such as 30 days.

**Accessibility**

- Alt text is required on published images.
- Moderators can edit it, and the submitter's caption is used as a starting point.

## 9. Syncing data across web and mobile

In Phase 1, each browser and device keeps its own demo state, and nothing syncs. In Phase 2,
the server is the source of truth for anything tied to an account.

| Data                         | Phase 2 home             | How it syncs                                                                                 |
| ---------------------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| Saved places                 | Server, per user         | Idempotent PUT and DELETE. Optimistic UI with rollback. Queued offline and replayed in order |
| Reviews, submissions         | Server                   | Online only. Clear retry if offline. Edits use `expectedVersion`                             |
| Preferences, location choice | Server, optional         | Last write wins, with an updated-at timestamp                                                |
| Catalogue                    | Server, cached on device | Cached with a short lifetime, refreshed when the app returns to the foreground               |

- **Freshness:** refetch user data when the app regains focus and after every write. Push
  updates or server-sent events can come later. They aren't needed for the first release.
- **First sign-in:** offer to import the device's saved places, because they reference real
  place ids. Do not import demo reviews or demo submissions. They were written as fictional
  users and may reference synthetic places.
- **Copy:** text such as "Saved on this device only" and "Demo profile, not signed in" must
  depend on the mode. Signed-out users in API mode should see "Sign in to save across devices".

## 10. Migration risks and current limitations

| Risk or limitation                                      | Impact                                                       | Mitigation                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Identity in inputs (`userId`, `submittedBy`, `actorId`) | Anyone could act as anyone                                   | Remove from the interface in milestone 0. The server derives identity from the session                     |
| Whole catalogue loaded, then filtered on the device     | Will not scale. Slow on mobile data                          | Server paging, full-text search and PostGIS radius queries                                                 |
| Search, sort and rating rules live in TypeScript        | A server rewrite could rank results differently from Phase 1 | Run the shared package on a Node server, or keep a contract test suite that both implementations must pass |
| `place.id` is `pl-` plus the slug                       | Renaming a place would change its id                         | Opaque ids from the server, slugs stored separately, with redirect history                                 |
| Slugs and ids generated on the client                   | Collisions between users                                     | The server generates them in a transaction                                                                 |
| Photos stored as data URLs or device URIs               | Cannot be migrated or shared                                 | Upload flow in section 8. Never migrate demo photos                                                        |
| One global change version                               | Every write refetches every query                            | A query cache with targeted invalidation                                                                   |
| `useAsync` has no retry, timeout or caching             | Poor behaviour on flaky networks                             | Adopt a query library, such as TanStack Query, inside the shared hooks                                     |
| Errors assume a local service                           | Network, auth and rate-limit failures have no UI yet         | Add `ServiceError` codes and shared messages for each                                                      |
| Ratings recomputed from all reviews on every read       | Too costly on a server                                       | `place_rating_summary`, updated transactionally                                                            |
| Client clock decides "future visit month"               | Wrong across time zones                                      | The server validates against its own date                                                                  |
| Seed reviews, users and "(demo)" places                 | Could leak into production as if real                        | Exclude them from the import. Keep them only in demo mode                                                  |
| Moderation exists only on web                           | Moderators cannot work on mobile                             | Acceptable at first. Revisit after launch                                                                  |
| Device-only settings and location choice                | Differ between devices                                       | Optional synced preferences                                                                                |
| Service tests target `DemoDataService` only             | No guarantee the API behaves the same                        | One contract test suite runs against both implementations                                                  |
| Unconfirmed visitor facts, null hours and fees          | Thin place pages                                             | Editorial process for curators to add sourced facts                                                        |

## 11. Roadmap

Each milestone keeps Phase 1 demo mode working and leaves `npm run validate` green.

| Milestone                             | Scope                                                                                                                                                                    | Acceptance criteria                                                                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **0. Interface refactor, no backend** | Split the services as in section 3. Remove identity from inputs. Add `Page<T>`, `ServiceError` and `DemoTools`. Hooks keep their signatures. Write a contract test suite | All current unit and browser tests pass unchanged. No screen imports demo-only methods except demo-mode UI. The contract suite passes against the demo implementation                                                                |
| **1. Read-only catalogue API**        | Database schema. Import verified places and sources. Public place and catalogue endpoints. `ApiCatalogService` behind an `'api'` mode chosen by an environment variable  | With the same fixture, Explore results, counts and order match demo mode for every sort and filter. Pages are cursor-based. Responses pass the shared validators. p95 latency under 300 ms for list queries                          |
| **2. Accounts**                       | Identity provider, sessions, `/v1/me`, sign-in screens, account deletion and export                                                                                      | Tokens are never in web `localStorage`. Mobile uses secure storage. Expired sessions refresh silently, and failures sign out cleanly. Deletion removes personal data                                                                 |
| **3. Saved places and reviews**       | Endpoints, optimistic saves, offline queue for saves, one-time import of local saves                                                                                     | A place saved on web appears on mobile after refocus. One review per user per place is enforced by a database constraint. Rating summaries match `withReviewStats` on the same data                                                  |
| **4. Submissions and photos**         | Submission endpoints, signed uploads, image processing, private storage                                                                                                  | Unapproved photos return 403 or 404 publicly. Public photos have no EXIF GPS. Limits are enforced on the server, not just the form                                                                                                   |
| **5. Server-enforced moderation**     | Moderation endpoints, role checks, transitions with versions, audit log, admin page on the API                                                                           | The permission matrix passes: explorers and signed-out users get 401 or 403 on every moderation endpoint called directly. Two simultaneous decisions on one submission give one success and one 409. Every decision has an audit row |
| **6. Launch hardening**               | Rate limits, monitoring, backups, privacy policy, licensed photos, mode-dependent copy                                                                                   | Restore from backup is tested. Error rates are alerted. No picsum images remain in production data. Demo mode remains available for previews                                                                                         |
