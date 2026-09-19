# Hydra Firebase starter

Copy this directory into an empty application directory. Install the built Hydra
UI tarball (or its published version), copy `firebase.env.example` to `.env.local`,
fill your public Firebase configuration and run `npm run dev`. Copy
`gitignore.example` to `.gitignore` as well; npm does not ship dotfile gitignores.

Read `node_modules/@hydra-security/ui/firebase/README.md` for the role model,
production configuration, manual rule deployment, file restrictions and backend
responsibilities. Keep `.env.local` out of source control. Never use Admin SDK
credentials in the frontend.

`npm run build` typechecks and creates the Vite production bundle. The parent
library repository owns component and Firebase emulator rule tests. Run those
before updating the library or changing its rules; add application-specific tests
for your API integration and deployed account flows.

Emulator mode is development-only and uses `demo-hydra-ui`. Start Firebase Auth,
Firestore and Storage emulators with this directory's `firebase.json`, then set
`VITE_FIREBASE_EMULATORS=true` in `.env.local`. Production builds require real public
Firebase configuration. The starter does not deploy cloud resources automatically.
