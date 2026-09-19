# Ocean surfaces and account screens

`framer-motion@13.4.0` powers card hover, ambient ocean layers and the loader.
Existing Anime.js entrance/input effects remain compatible. Wrap the application
in `MotionProvider`; its switch, parent opt-out and OS reduced-motion preference
control the effects. Content is usable without animation. Cards keep the same DOM
and forwarded ref, and only mouse hover lifts them. Static content keeps its normal
cursor; links and actionable controls use pointer; disabled controls use not-allowed.

```tsx
<MotionProvider enabled={animationsEnabled}>
  <div className="hydra-ocean-shell">
    <OceanBackground />
    <Suspense fallback={<SiteLoader />}><Application /></Suspense>
  </div>
</MotionProvider>
```

The backdrop is decorative and cannot intercept input. Glass surfaces have an
opaque fallback, retain theme tokens and drop effects for printing. The showcase
loads its main screen lazily, displaying the loader for actual chunk loading.
The Firebase starter displays it while initializing services. No artificial delay
is added. The Account screen offers an explicitly labeled visual preview; its
forms never create accounts or persist credentials.

SVG plate rectangles and technology badges are removed from the static assets
and generated data URLs. The original Hydra logo and folk illustration geometry
are preserved. Interface icons use a CSS mask with currentColor for contrast in
both themes; illustrated motifs remain full-color images. The importer produces
the same background-free treatment for future imports.

## Real account operations

The Firebase starter retains real AuthForm login/register/reset and ProfileForm
editing. DeleteAccountForm requires a deliberate DELETE confirmation, current
password reauthentication and a fresh ID token before invoking `onDeleteAccount`.
Without that callback the form is disabled. The starter can connect it through
the optional public `VITE_ACCOUNT_DELETE_URL` configuration (HTTPS in production).

That endpoint must verify the token and recent authentication server-side, derive
the UID from the token, block or transfer organization ownership, remove private
profile/files/memberships according to retention policy, and delete the Auth
account. It must be idempotent and return success only after deletion completes;
an asynchronous job needs its own status workflow instead of returning 202 to this
starter. The client signs out after success. Errors never display a success state.
Tokens/passwords are not logged or persisted by these components.

This repo does not deploy a deletion backend. Calling Firebase `deleteUser` alone
would leave organization data or ownership orphaned, so it is intentionally not
used as a substitute for that service. Non-password providers need a corresponding
reauthentication UI; the form explicitly disables unsupported providers.
