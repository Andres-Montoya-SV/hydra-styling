import {
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

export interface HydraFirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

/** Call explicitly at the app boundary. Importing the library does not initialize Firebase. */
export function initializeHydraFirebase(
  options: FirebaseOptions,
  name = "hydra",
): HydraFirebaseServices {
  if (
    !options.apiKey ||
    !options.projectId ||
    !options.appId ||
    !options.storageBucket
  )
    throw new Error(
      "Firebase apiKey, projectId, appId and storageBucket are required.",
    );
  const existing = getApps().find((app) => app.name === name);
  if (
    existing &&
    ["apiKey", "projectId", "appId", "storageBucket", "authDomain"].some(
      (key) =>
        existing.options[key as keyof FirebaseOptions] !==
        options[key as keyof FirebaseOptions],
    )
  )
    throw new Error(
      "Firebase app name is already associated with a different configuration.",
    );
  const app = existing ?? initializeApp(options, name);
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
}

export function firebaseMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  if (code === "auth/too-many-requests")
    return "Too many attempts. Please wait and try again.";
  if (
    code === "auth/weak-password" ||
    code === "auth/password-does-not-meet-requirements"
  )
    return "The password does not meet the configured password policy.";
  if (code === "auth/requires-recent-login")
    return "Sign in again before changing this setting.";
  if (code === "auth/network-request-failed")
    return "Connection failed. Please try again.";
  if (code === "permission-denied" || code === "storage/unauthorized")
    return "You do not have permission for this operation.";
  if (code === "storage/canceled") return "Upload cancelled.";
  return "The operation could not be completed. Check your details and try again.";
}
