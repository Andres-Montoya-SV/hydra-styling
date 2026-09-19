// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { FirebaseProvider } from "./firebase/auth";
import { AuthForm, ChangePasswordForm } from "./firebase/forms";
import type { HydraFirebaseServices } from "./firebase/services";
const mocks = vi.hoisted(() => ({
  listener: null as null | ((user: unknown) => void),
  signIn: vi.fn(),
  signUp: vi.fn(),
  reset: vi.fn(),
  reauth: vi.fn(),
  update: vi.fn(),
  verify: vi.fn(),
}));
vi.mock("firebase/auth", () => ({
  onIdTokenChanged: vi.fn((_auth, next) => {
    mocks.listener = next;
    return () => {};
  }),
  signInWithEmailAndPassword: mocks.signIn,
  createUserWithEmailAndPassword: mocks.signUp,
  sendPasswordResetEmail: mocks.reset,
  reauthenticateWithCredential: mocks.reauth,
  updatePassword: mocks.update,
  sendEmailVerification: mocks.verify,
  EmailAuthProvider: {
    credential: (email: string, password: string) => ({ email, password }),
  },
}));
const services = {
  app: { name: "test" },
  auth: {},
  db: {},
  storage: {},
} as unknown as HydraFirebaseServices;
const user = {
  uid: "alice",
  email: "alice@example.com",
  emailVerified: true,
  providerData: [{ providerId: "password" }],
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.signIn.mockResolvedValue({ user });
  mocks.reset.mockResolvedValue(undefined);
  mocks.reauth.mockResolvedValue({ user });
  mocks.update.mockResolvedValue(undefined);
});
afterEach(cleanup);
it("uses Firebase email/password sign-in and clears password after failure", async () => {
  mocks.signIn.mockRejectedValue({ code: "auth/invalid-credential" });
  render(
    <FirebaseProvider services={services}>
      <AuthForm />
    </FirebaseProvider>,
  );
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "alice@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "wrong-password" },
  });
  fireEvent.submit(screen.getByRole("form", { name: "sign-in" }));
  await screen.findByRole("alert");
  expect(mocks.signIn).toHaveBeenCalledWith(
    services.auth,
    "alice@example.com",
    "wrong-password",
  );
  expect(screen.getByLabelText("Password")).toHaveValue("");
});
it("does not create an account when password confirmation differs", () => {
  render(
    <FirebaseProvider services={services}>
      <AuthForm mode="sign-up" />
    </FirebaseProvider>,
  );
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "long-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "different" },
  });
  fireEvent.submit(screen.getByRole("form", { name: "sign-up" }));
  expect(mocks.signUp).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("do not match");
});
it("uses the same reset response for nonexistent accounts", async () => {
  mocks.reset.mockRejectedValue({ code: "auth/user-not-found" });
  render(
    <FirebaseProvider services={services}>
      <AuthForm mode="reset-password" />
    </FirebaseProvider>,
  );
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "unknown@example.com" },
  });
  fireEvent.submit(screen.getByRole("form", { name: "reset-password" }));
  expect(
    await screen.findByText(/If this address has an account/),
  ).toBeInTheDocument();
  expect(screen.queryByRole("alert")).toBeNull();
});
it("reauthenticates before updating a password", async () => {
  render(
    <FirebaseProvider services={services}>
      <ChangePasswordForm />
    </FirebaseProvider>,
  );
  act(() => mocks.listener!(user));
  fireEvent.change(screen.getByLabelText("Current password"), {
    target: { value: "old-password" },
  });
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: "new-long-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: "new-long-password" },
  });
  fireEvent.submit(screen.getByRole("form", { name: "Change password" }));
  await waitFor(() =>
    expect(mocks.update).toHaveBeenCalledWith(user, "new-long-password"),
  );
  expect(mocks.reauth.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.update.mock.invocationCallOrder[0],
  );
  expect(screen.getByLabelText("Current password")).toHaveValue("");
});
it("does not update a password when reauthentication fails", async () => {
  mocks.reauth.mockRejectedValue({ code: "auth/invalid-credential" });
  render(
    <FirebaseProvider services={services}>
      <ChangePasswordForm />
    </FirebaseProvider>,
  );
  act(() => mocks.listener!(user));
  fireEvent.change(screen.getByLabelText("Current password"), {
    target: { value: "wrong" },
  });
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: "new-long-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: "new-long-password" },
  });
  fireEvent.submit(screen.getByRole("form", { name: "Change password" }));
  await screen.findByRole("alert");
  expect(mocks.update).not.toHaveBeenCalled();
  expect(screen.getByLabelText("New password")).toHaveValue("");
});
