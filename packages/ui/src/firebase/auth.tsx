import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import type { HydraFirebaseServices } from "./services";
import { ResourceState } from "../components/resource-state";

export type AuthState = {
  status: "loading" | "authenticated" | "anonymous" | "error";
  user: User | null;
};
const Context = createContext<
  (AuthState & { services: HydraFirebaseServices }) | null
>(null);

export function FirebaseProvider({
  services,
  children,
}: {
  services: HydraFirebaseServices;
  children: ReactNode;
}) {
  const [session, setSession] = useState<
    AuthState & { source: HydraFirebaseServices["auth"] | null }
  >({ source: null, status: "loading", user: null });
  useEffect(() => {
    let active = true;
    setSession({ source: services.auth, status: "loading", user: null });
    const unsubscribe = onIdTokenChanged(
      services.auth,
      (user) => {
        if (active)
          setSession({
            source: services.auth,
            status: user ? "authenticated" : "anonymous",
            user,
          });
      },
      () => {
        if (active)
          setSession({ source: services.auth, status: "error", user: null });
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [services.auth]);
  const state =
    session.source === services.auth
      ? session
      : { status: "loading" as const, user: null };
  return (
    <Context.Provider
      value={{ status: state.status, user: state.user, services }}
    >
      {children}
    </Context.Provider>
  );
}

export function useHydraAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("Wrap the application in FirebaseProvider.");
  return value;
}

export interface ProtectedProps {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
  requireVerifiedEmail?: boolean;
}
/** Presentation guard only. Firestore/Storage rules and your API enforce actual authorization. */
export function Protected({
  children,
  fallback,
  loading,
  requireVerifiedEmail = false,
}: ProtectedProps) {
  const { status, user } = useHydraAuth();
  if (status === "loading")
    return (
      <>
        {loading ?? (
          <ResourceState status="loading" message="Checking session…" />
        )}
      </>
    );
  if (status === "error")
    return (
      <ResourceState
        status="error"
        message="Session verification failed. Reload to try again."
      />
    );
  if (!user || (requireVerifiedEmail && !user.emailVerified))
    return (
      <>
        {fallback ?? (
          <ResourceState
            status="empty"
            message={
              user ? "Verify your email to continue." : "Sign in to continue."
            }
          />
        )}
      </>
    );
  return <>{children}</>;
}

export function PublicOnly({
  children,
  fallback = null,
  loading,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}) {
  const { status } = useHydraAuth();
  if (status === "loading")
    return (
      <>
        {loading ?? (
          <ResourceState status="loading" message="Checking session…" />
        )}
      </>
    );
  if (status === "error")
    return (
      <ResourceState
        status="error"
        message="Session verification failed. Reload to try again."
      />
    );
  return <>{status === "anonymous" ? children : fallback}</>;
}
