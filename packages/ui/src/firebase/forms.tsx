import { useEffect, useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getIdToken,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { z } from "zod";
import { useHydraAuth } from "./auth";
import { firebaseMessage } from "./services";
import { safeSegment } from "./organizations";
import { Field, Input } from "../components/field";
import { Button } from "../components/button";
import { Alert } from "../components/feedback";
import { PasswordInput } from "../components/extended";
import { ResourceState } from "../components/resource-state";

export function AuthForm({
  mode = "sign-in",
  onSuccess,
}: {
  mode?: "sign-in" | "sign-up" | "reset-password";
  onSuccess?: () => void;
}) {
  const { services } = useHydraAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    setPassword("");
    setConfirmation("");
    setError("");
    setMessage("");
  }, [mode]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setMessage("");
    if (mode === "sign-up" && password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "reset-password") {
        try {
          await sendPasswordResetEmail(services.auth, email.trim());
        } catch (error) {
          if (
            !(
              error &&
              typeof error === "object" &&
              "code" in error &&
              ["auth/user-not-found", "auth/invalid-email"].includes(
                String(error.code),
              )
            )
          )
            throw error;
        }
        setMessage(
          "If this address has an account, a password reset email has been requested.",
        );
      } else if (mode === "sign-up") {
        const result = await createUserWithEmailAndPassword(
          services.auth,
          email.trim(),
          password,
        );
        try {
          await sendEmailVerification(result.user);
        } catch {
          setMessage(
            "Account created. Use the verification panel to request another email.",
          );
        }
        onSuccess?.();
      } else {
        await signInWithEmailAndPassword(services.auth, email.trim(), password);
        onSuccess?.();
      }
    } catch (error) {
      setError(firebaseMessage(error));
    } finally {
      setPassword("");
      setConfirmation("");
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-4" aria-label={mode}>
      <Field label="Email">
        <Input
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      {mode !== "reset-password" && (
        <Field label="Password">
          <PasswordInput
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            required
            minLength={mode === "sign-up" ? 12 : undefined}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      )}
      {mode === "sign-up" && (
        <Field label="Confirm password">
          <PasswordInput
            autoComplete="new-password"
            required
            maxLength={128}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </Field>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      {message && <Alert>{message}</Alert>}
      <Button type="submit" disabled={busy}>
        {busy
          ? "Please wait…"
          : mode === "sign-in"
            ? "Sign in"
            : mode === "sign-up"
              ? "Create account"
              : "Send reset email"}
      </Button>
    </form>
  );
}

export function EmailVerificationPanel() {
  const { user } = useHydraAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (!user) return null;
  async function run(refresh: boolean) {
    if (!user) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (refresh) {
        await reload(user);
        await getIdToken(user, true);
        setMessage(
          user.emailVerified ? "Email verified." : "Email is not verified yet.",
        );
      } else {
        await sendEmailVerification(user);
        setMessage("Verification email requested.");
      }
    } catch (e) {
      setError(firebaseMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-3">
      <p>
        {user.emailVerified
          ? "Email verified."
          : "Verify your email before accessing organizations."}
      </p>
      {!user.emailVerified && (
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void run(false)}>
            Send verification email
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void run(true)}
          >
            I verified my email
          </Button>
        </div>
      )}
      {message && <Alert>{message}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  username: z.string().regex(/^[A-Za-z0-9_.-]{3,32}$/),
});
export function ProfileForm() {
  const { services, user } = useHydraAuth();
  return <ProfileFields key={`${services.app.name}:${user?.uid ?? ""}`} />;
}
function ProfileFields() {
  const { services, user } = useHydraAuth();
  const [loaded, setLoaded] = useState("");
  const [displayName, setName] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setLoaded("");
    setError("");
    setSaved(false);
    if (!user) return;
    return onSnapshot(
      doc(services.db, "users", safeSegment(user.uid)),
      (snap) => {
        setName(String(snap.data()?.displayName ?? user.displayName ?? ""));
        setUsername(String(snap.data()?.username ?? ""));
        setLoaded(user.uid);
      },
      () => setError("Profile could not be loaded."),
    );
  }, [services.db, user?.uid]);
  if (!user)
    return (
      <ResourceState status="empty" message="Sign in to edit your profile." />
    );
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    setError("");
    setSaved(false);
    const result = profileSchema.safeParse({ displayName, username });
    if (!result.success) {
      setError(
        "Use a name of 1–80 characters and a username of 3–32 letters, numbers, dots, underscores or hyphens.",
      );
      return;
    }
    setBusy(true);
    try {
      await setDoc(doc(services.db, "users", safeSegment(user.uid)), {
        ...result.data,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
    } catch (e) {
      setError(firebaseMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} aria-label="Profile" className="grid gap-4">
      <Field label="Account email">
        <Input value={user.email ?? ""} readOnly />
      </Field>
      <Field label="Display name">
        <Input
          required
          maxLength={80}
          value={displayName}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field
        label="Username"
        hint="Display identifier; not a unique login name."
      >
        <Input
          required
          minLength={3}
          maxLength={32}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </Field>
      {error && <Alert tone="danger">{error}</Alert>}
      {saved && <Alert tone="success">Profile saved.</Alert>}
      <Button type="submit" disabled={busy || loaded !== user.uid}>
        Save profile
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const { services, user } = useHydraAuth();
  return <PasswordFields key={`${services.app.name}:${user?.uid ?? ""}`} />;
}
function PasswordFields() {
  const { user } = useHydraAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  if (!user?.providerData.some((p) => p.providerId === "password"))
    return (
      <ResourceState
        status="empty"
        message="Password changes are available for email/password accounts."
      />
    );
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user?.email || busy) return;
    setError("");
    setSaved(false);
    if (next !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, current),
      );
      await updatePassword(user, next);
      setSaved(true);
    } catch (e) {
      setError(firebaseMessage(e));
    } finally {
      setCurrent("");
      setNext("");
      setConfirm("");
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} aria-label="Change password" className="grid gap-4">
      <Field label="Current password">
        <PasswordInput
          required
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </Field>
      <Field label="New password">
        <PasswordInput
          required
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </Field>
      <Field label="Confirm new password">
        <PasswordInput
          required
          maxLength={128}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>
      {error && <Alert tone="danger">{error}</Alert>}
      {saved && <Alert tone="success">Password updated.</Alert>}
      <Button disabled={busy} type="submit">
        Change password
      </Button>
    </form>
  );
}

export function SignOutButton() {
  const { services } = useHydraAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await signOut(services.auth);
          } catch (e) {
            setError(firebaseMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Sign out
      </Button>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
