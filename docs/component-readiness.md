# Component integration guide

The showcase is an interface catalog. Account previews do not send credentials or mutate accounts. The Firebase starter is the functional example.

| Area | Components / location | States to handle in a consuming app |
| --- | --- | --- |
| Actions and forms | Button, Field, Input, PasswordInput, Select; showcase Components | Required/invalid values, disabled submission, busy, server errors, keyboard focus |
| Surfaces | Card and variants; showcase dashboard | Loading skeleton or SiteLoader, empty ResourceState, failed ResourceState, narrow viewport |
| Animation | MotionProvider, Motion, OceanBackground | Enabled, explicit disabled, OS reduced motion, hidden tab |
| Recovery | ErrorBoundary around the router/lazy screens | Render failure, rejected lazy import, explicit retry, full reload |
| Identity | AuthForm, ProfileForm, ChangePasswordForm | Anonymous, loading, rejected credentials, signed in, unsupported provider |
| Access | Protected, PublicOnly, RequireOrganization | Loading, unverified email, denied membership, role restrictions, session change |
| Memberships | OrganizationPicker, OrganizationMembers | First/next/previous page, suspended member, malformed data, request failure |
| Files | OrganizationFiles | Progress, cancellation, invalid MIME/size, paginated listing, confirmed deletion |
| Account deletion | DeleteAccountForm | No backend, reauthentication, confirmation, rejected request, confirmed completion |
| EASM data | Inventory, map, runs, evidence components | Validate incoming payloads, partial results, stale data, no results, retry |

## App shell

```tsx
<ErrorBoundary onError={(error, info) => reportSanitizedError(error, info)}>
  <MotionProvider enabled={userPreferences.animations}>
    <Suspense fallback={<SiteLoader />}>
      <FirebaseProvider services={services}>
        <Protected><Workspace /></Protected>
      </FirebaseProvider>
    </Suspense>
  </MotionProvider>
</ErrorBoundary>
```

`ErrorBoundary` catches render and lazy import failures; catch asynchronous API/event-handler failures separately. Retrying a rejected `React.lazy` import can reuse its cached failure, so the fallback also offers an explicit reload. Reporting is opt-in: sanitize diagnostics before sending them to any telemetry service.

## Pagination

`listOrganizationsPage(services, cursor?)` returns `{organizations, nextCursor}`. It reads at most 50 memberships per request. Suspended entries are filtered, so a page can be empty **and still have a next cursor**. Continue based on the cursor, not the number of returned organizations. Keep snapshots in memory and discard them when the user or Firebase app changes. The compatibility `listOrganizations` helper retains its 100-membership ceiling.

OrganizationPicker accumulates pages with “Load more organizations”; refresh restarts the list. OrganizationMembers displays 50 rows with next/previous controls and resets on organization/session changes. A full final page may require one extra empty-page fetch. Concurrent membership changes can shift page boundaries; return to the first page to refresh the traversal. Firestore rules remain authoritative for every request.

## Motion and accessibility

Anime.js owns entry/focus effects; Framer Motion owns card hover and ocean transforms. Avoid animating the same transform on one DOM node with both engines. The shared provider stops effects for hidden documents, reduced-motion preferences and explicit opt-out; it cleans up listeners and animations. Ocean effects remain decorative and cannot intercept input. Keep the ocean background mounted only once per app shell.

The browser suite runs desktop and narrow-screen Chromium, scans all four account previews in dark/light themes with axe, submits by keyboard, verifies reduced motion and exercises the real Firebase emulator starter. Automated axe scans are not a complete accessibility audit; still review focus order, screen-reader announcements and glass backgrounds manually. See [Playwright accessibility guidance](https://playwright.dev/docs/accessibility-testing).

## Commands

```sh
npm ci --ignore-scripts
npm run setup:firebase
npx --no-install playwright install --with-deps chromium
npm run check
```

Use Node 24 and Java 21. `check` builds the library/showcase/starter, runs component tests, Firebase compatibility/rule tests, browser tests and a clean packed-package consumer build. `test:integration` starts isolated demo-project emulators and runs rules before browser tests. `test:browser` alone expects emulators already running and the showcase already built. No production Firebase project is used.
