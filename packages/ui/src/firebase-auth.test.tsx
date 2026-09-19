// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { FirebaseProvider, Protected, PublicOnly } from "./firebase/auth";
import {
  OrganizationProvider,
  RequireOrganization,
} from "./firebase/organizations";
import type { HydraFirebaseServices } from "./firebase/services";
const mocks = vi.hoisted(() => ({
  auth: null as null | ((user: unknown) => void),
  authError: null as null | (() => void),
  members: [] as Array<(snap: unknown) => void>,
  stop: vi.fn(),
}));
vi.mock("firebase/auth", () => ({
  onIdTokenChanged: vi.fn((_auth, next, error) => {
    mocks.auth = next;
    mocks.authError = error;
    return mocks.stop;
  }),
}));
vi.mock("firebase/firestore", () => ({
  doc: vi.fn((...args) => args.slice(1).join("/")),
  onSnapshot: vi.fn((_ref, next) => {
    mocks.members.push(next);
    return mocks.stop;
  }),
}));
const services = {
  app: { name: "test" },
  auth: {},
  db: {},
  storage: {},
} as unknown as HydraFirebaseServices;
const user = { uid: "alice", emailVerified: true };
beforeEach(() => {
  mocks.auth = null;
  mocks.members = [];
  mocks.stop.mockClear();
});
afterEach(cleanup);
function session(value: unknown) {
  act(() => mocks.auth!(value));
}
function membership(value: unknown, index = mocks.members.length - 1) {
  act(() => mocks.members[index]({ data: () => value }));
}

it("does not mount protected children while loading or signed out", () => {
  const mount = vi.fn();
  function Secret() {
    mount();
    return <p>Secret</p>;
  }
  render(
    <FirebaseProvider services={services}>
      <Protected fallback={<p>Sign in</p>}>
        <Secret />
      </Protected>
    </FirebaseProvider>,
  );
  expect(mount).not.toHaveBeenCalled();
  session(null);
  expect(screen.getByText("Sign in")).toBeInTheDocument();
  expect(mount).not.toHaveBeenCalled();
  session(user);
  expect(screen.getByText("Secret")).toBeInTheDocument();
  session(null);
  expect(screen.queryByText("Secret")).not.toBeInTheDocument();
});
it("fails closed on authentication errors and unsubscribes", () => {
  const { unmount } = render(
    <FirebaseProvider services={services}>
      <Protected>
        <p>Secret</p>
      </Protected>
    </FirebaseProvider>,
  );
  act(() => mocks.authError!());
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Session verification failed",
  );
  expect(screen.queryByText("Secret")).toBeNull();
  unmount();
  expect(mocks.stop).toHaveBeenCalled();
});
it("separates anonymous pages from verified-email access", () => {
  render(
    <FirebaseProvider services={services}>
      <PublicOnly>
        <p>Login form</p>
      </PublicOnly>
      <Protected requireVerifiedEmail>
        <p>Verified content</p>
      </Protected>
    </FirebaseProvider>,
  );
  session(null);
  expect(screen.getByText("Login form")).toBeInTheDocument();
  session({ ...user, emailVerified: false });
  expect(screen.queryByText("Login form")).toBeNull();
  expect(screen.queryByText("Verified content")).toBeNull();
  session(user);
  expect(screen.getByText("Verified content")).toBeInTheDocument();
});
it("requires an active membership and allowed role; suspension removes content", () => {
  render(
    <FirebaseProvider services={services}>
      <OrganizationProvider orgId="a">
        <RequireOrganization roles={["owner", "admin"]}>
          <p>Manage members</p>
        </RequireOrganization>
      </OrganizationProvider>
    </FirebaseProvider>,
  );
  session(user);
  membership({ orgId: "a", userId: "alice", role: "viewer", status: "active" });
  expect(screen.queryByText("Manage members")).toBeNull();
  membership({ orgId: "a", userId: "alice", role: "admin", status: "active" });
  expect(screen.getByText("Manage members")).toBeInTheDocument();
  membership({
    orgId: "a",
    userId: "alice",
    role: "admin",
    status: "suspended",
  });
  expect(screen.queryByText("Manage members")).toBeNull();
});
it("never reuses membership while switching organizations or on late old responses", () => {
  const app = (orgId: string) => (
    <FirebaseProvider services={services}>
      <OrganizationProvider orgId={orgId}>
        <RequireOrganization>
          <p>Workspace {orgId}</p>
        </RequireOrganization>
      </OrganizationProvider>
    </FirebaseProvider>
  );
  const { rerender } = render(app("a"));
  session(user);
  membership({ orgId: "a", userId: "alice", role: "viewer", status: "active" });
  expect(screen.getByText("Workspace a")).toBeInTheDocument();
  rerender(app("b"));
  expect(screen.queryByText("Workspace b")).toBeNull();
  membership(
    { orgId: "a", userId: "alice", role: "owner", status: "active" },
    0,
  );
  expect(screen.queryByText("Workspace b")).toBeNull();
  membership({ orgId: "b", userId: "alice", role: "viewer", status: "active" });
  expect(screen.getByText("Workspace b")).toBeInTheDocument();
});
it("rejects mismatched membership identity", () => {
  render(
    <FirebaseProvider services={services}>
      <OrganizationProvider orgId="a">
        <RequireOrganization>
          <p>Secret</p>
        </RequireOrganization>
      </OrganizationProvider>
    </FirebaseProvider>,
  );
  session(user);
  membership({ orgId: "a", userId: "bob", role: "owner", status: "active" });
  expect(screen.queryByText("Secret")).toBeNull();
});
