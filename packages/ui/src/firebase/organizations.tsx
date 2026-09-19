import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { z } from "zod";
import { useHydraAuth } from "./auth";
import type { HydraFirebaseServices } from "./services";
import { ResourceState } from "../components/resource-state";

export const organizationRoles = [
  "owner",
  "admin",
  "analyst",
  "viewer",
] as const;
export type OrganizationRole = (typeof organizationRoles)[number];
export interface Organization {
  id: string;
  name: string;
  role: OrganizationRole;
}
const memberSchema = z.object({
  orgId: z.string(),
  userId: z.string(),
  role: z.enum(organizationRoles),
  status: z.enum(["active", "suspended"]),
});
export type OrganizationMember = z.infer<typeof memberSchema>;
export function safeSegment(value: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value))
    throw new Error("Invalid identifier.");
  return value;
}
export function requireCurrentUser(services: HydraFirebaseServices) {
  const user = services.auth.currentUser;
  if (!user || !user.emailVerified)
    throw new Error("A verified session is required.");
  return user;
}

export async function createOrganization(
  services: HydraFirebaseServices,
  name: string,
): Promise<string> {
  const user = requireCurrentUser(services);
  const clean = name.trim();
  if (!clean || clean.length > 80)
    throw new Error("Organization name must contain 1–80 characters.");
  const id = crypto.randomUUID();
  const org = doc(services.db, "organizations", id);
  await runTransaction(services.db, async (tx) => {
    tx.set(org, {
      name: clean,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    });
    tx.set(doc(org, "members", safeSegment(user.uid)), {
      orgId: id,
      userId: user.uid,
      role: "owner",
      status: "active",
      joinedAt: serverTimestamp(),
    });
  });
  return id;
}

export async function listOrganizations(
  services: HydraFirebaseServices,
): Promise<Organization[]> {
  const user = requireCurrentUser(services);
  const rows = await getDocs(
    query(
      collectionGroup(services.db, "members"),
      where("userId", "==", user.uid),
      limit(100),
    ),
  );
  const members = rows.docs
    .map((row) => memberSchema.parse(row.data()))
    .filter((m) => m.status === "active");
  return (
    await Promise.all(
      members.map(async (member) => {
        const snap = await getDoc(
          doc(services.db, "organizations", safeSegment(member.orgId)),
        );
        return snap.exists()
          ? { id: snap.id, name: String(snap.data().name), role: member.role }
          : null;
      }),
    )
  ).filter((org): org is Organization => org !== null);
}

/** Owners grant access to an existing UID. Email invitations require a trusted backend. */
export async function setOrganizationMember(
  services: HydraFirebaseServices,
  orgId: string,
  userId: string,
  role: Exclude<OrganizationRole, "owner">,
  status: "active" | "suspended" = "active",
) {
  requireCurrentUser(services);
  await setDoc(
    doc(
      services.db,
      "organizations",
      safeSegment(orgId),
      "members",
      safeSegment(userId),
    ),
    { orgId, userId, role, status, joinedAt: serverTimestamp() },
  );
}

type OrganizationState = {
  orgId: string;
  status: "loading" | "active" | "denied" | "error";
  member: OrganizationMember | null;
};
const Context = createContext<OrganizationState | null>(null);
export function OrganizationProvider({
  orgId,
  children,
}: {
  orgId: string;
  children: ReactNode;
}) {
  const { services, user, status } = useHydraAuth();
  const key = JSON.stringify([
    services.app.name,
    orgId,
    user?.uid,
    user?.emailVerified,
    status,
  ]);
  const [state, setState] = useState<
    OrganizationState & { key: string; db: HydraFirebaseServices["db"] | null }
  >({ key: "", db: null, orgId, status: "loading", member: null });
  useEffect(() => {
    let active = true;
    const update = (
      status: OrganizationState["status"],
      member: OrganizationMember | null = null,
    ) => {
      if (active) setState({ key, db: services.db, orgId, status, member });
    };
    if (!user || !user.emailVerified || !orgId) {
      update("denied");
      return;
    }
    let stop: () => void = () => {};
    try {
      stop = onSnapshot(
        doc(
          services.db,
          "organizations",
          safeSegment(orgId),
          "members",
          safeSegment(user.uid),
        ),
        (snap) => {
          const parsed = memberSchema.safeParse(snap.data());
          if (
            !parsed.success ||
            parsed.data.status !== "active" ||
            parsed.data.orgId !== orgId ||
            parsed.data.userId !== user.uid
          )
            update("denied");
          else update("active", parsed.data);
        },
        () => update("error"),
      );
    } catch {
      update("denied");
    }
    return () => {
      active = false;
      stop();
    };
  }, [key, services.db, orgId, user]);
  const value =
    state.key === key && state.db === services.db
      ? state
      : { orgId, status: "loading" as const, member: null };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useOrganization() {
  const value = useContext(Context);
  if (!value)
    throw new Error("Wrap organization content in OrganizationProvider.");
  return value;
}
export function RequireOrganization({
  children,
  roles = organizationRoles,
  fallback,
}: {
  children: ReactNode;
  roles?: readonly OrganizationRole[];
  fallback?: ReactNode;
}) {
  const { status, member } = useOrganization();
  if (status === "loading")
    return (
      <ResourceState status="loading" message="Checking organization access…" />
    );
  if (status === "error")
    return (
      <ResourceState
        status="error"
        message="Organization access could not be verified."
      />
    );
  if (status !== "active" || !member || !roles.includes(member.role))
    return (
      <>
        {fallback ?? (
          <ResourceState
            status="empty"
            message="You do not have access to this organization or action."
          />
        )}
      </>
    );
  return <>{children}</>;
}
