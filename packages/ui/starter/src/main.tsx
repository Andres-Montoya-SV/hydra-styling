import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  browserSessionPersistence,
  connectAuthEmulator,
  setPersistence,
} from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectStorageEmulator } from "firebase/storage";
import {
  HydraMark,
  Card,
  CardContent,
  ResourceState,
} from "@hydra-security/ui";
import {
  initializeHydraFirebase,
  FirebaseProvider,
  Protected,
  PublicOnly,
  AuthForm,
  EmailVerificationPanel,
  SignOutButton,
  ProfileForm,
  ChangePasswordForm,
  OrganizationPicker,
  OrganizationProvider,
  RequireOrganization,
  OrganizationFiles,
  OrganizationMembers,
  useHydraAuth,
} from "@hydra-security/ui/firebase";
import "@hydra-security/ui/styles.css";
import "./style.css";

function Login() {
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "reset-password">(
    "sign-in",
  );
  return (
    <Card>
      <CardContent>
        <h1>Hydra Security</h1>
        <nav className="starter-tabs" aria-label="Account access">
          {(["sign-in", "sign-up", "reset-password"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
            >
              {value.replaceAll("-", " ")}
            </button>
          ))}
        </nav>
        <AuthForm key={mode} mode={mode} />
      </CardContent>
    </Card>
  );
}
function Workspace() {
  const [orgId, setOrgId] = useState("");
  return (
    <>
      <OrganizationPicker value={orgId} onChange={setOrgId} />
      {orgId && (
        <OrganizationProvider orgId={orgId}>
          <RequireOrganization>
            <Card>
              <CardContent>
                <OrganizationFiles />
                <OrganizationMembers />
              </CardContent>
            </Card>
          </RequireOrganization>
        </OrganizationProvider>
      )}
    </>
  );
}
function Account() {
  const { user } = useHydraAuth();
  return (
    <div key={user?.uid} className="starter-grid">
      <div className="starter-bar">
        <p>{user?.email}</p>
        <SignOutButton />
      </div>
      <EmailVerificationPanel />
      <details>
        <summary>Profile and account security</summary>
        <Card>
          <CardContent>
            <ProfileForm />
            <hr />
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </details>
      <Protected requireVerifiedEmail>
        <Workspace />
      </Protected>
    </div>
  );
}
function App() {
  return (
    <main className="starter-shell">
      <HydraMark wordmark className="starter-logo" />
      <PublicOnly>
        <Login />
      </PublicOnly>
      <Protected fallback={null}>
        <Account />
      </Protected>
    </main>
  );
}

async function start() {
  const local =
    import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATORS === "true";
  const projectId = local
    ? "demo-hydra-ui"
    : import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const services = initializeHydraFirebase({
    projectId,
    apiKey: local ? "demo-key" : import.meta.env.VITE_FIREBASE_API_KEY,
    appId: local ? "demo-app" : import.meta.env.VITE_FIREBASE_APP_ID,
    authDomain: local ? "localhost" : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    storageBucket: local
      ? "demo-hydra-ui.appspot.com"
      : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  });
  if (local) {
    connectAuthEmulator(services.auth, "http://127.0.0.1:9099");
    connectFirestoreEmulator(services.db, "127.0.0.1", 8080);
    connectStorageEmulator(services.storage, "127.0.0.1", 9199);
  }
  await setPersistence(services.auth, browserSessionPersistence);
  createRoot(document.getElementById("root")!).render(
    <FirebaseProvider services={services}>
      <App />
    </FirebaseProvider>,
  );
}
void start().catch(() => {
  createRoot(document.getElementById("root")!).render(
    <ResourceState
      status="error"
      message="Firebase could not start. Check your public web configuration and enabled services."
    />,
  );
});
