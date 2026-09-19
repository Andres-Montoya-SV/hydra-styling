import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  browserSessionPersistence,
  connectAuthEmulator,
  setPersistence,
  signOut,
} from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectStorageEmulator } from "firebase/storage";
import {
  HydraMark,
  Card,
  CardContent,
  ResourceState,
  MotionProvider, OceanBackground, SiteLoader,
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
  DeleteAccountForm,
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
  const { user,services } = useHydraAuth();
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
            <hr />
            <DeleteAccountForm onDeleteAccount={import.meta.env.VITE_ACCOUNT_DELETE_URL ? async token=>{
              const url=new URL(import.meta.env.VITE_ACCOUNT_DELETE_URL);
              if(url.protocol!=='https:'&&!(import.meta.env.DEV&&url.hostname==='localhost'))throw new Error('HTTPS is required.');
              const response=await fetch(url,{method:'DELETE',headers:{Authorization:`Bearer ${token}`},redirect:'error'});
              if(response.status!==200&&response.status!==204)throw new Error('Account deletion was not completed.');
              await signOut(services.auth);
            }:undefined}/>
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
    <main className="starter-shell"><OceanBackground/>
      <HydraMark wordmark className="starter-logo" />
      <PublicOnly loading={<SiteLoader label="Checking your session…"/>}>
        <Login />
      </PublicOnly>
      <Protected fallback={null} loading={null}>
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
  appRoot.render(
    <MotionProvider><div className="hydra-ocean-shell"><FirebaseProvider services={services}>
      <App />
    </FirebaseProvider></div></MotionProvider>,
  );
}
const appRoot=createRoot(document.getElementById('root')!);
appRoot.render(<MotionProvider><SiteLoader label="Preparing your workspace…"/></MotionProvider>);
void start().catch(() => {
  appRoot.render(
    <ResourceState
      status="error"
      message="Firebase could not start. Check your public web configuration and enabled services."
    />,
  );
});
