import { useEffect, useRef, useState, type FormEvent } from "react";
import { collection, limit, onSnapshot, query, startAfter, type QueryDocumentSnapshot } from "firebase/firestore";
import type { UploadTask } from "firebase/storage";
import { useHydraAuth } from "./auth";
import {
  createOrganization,
  listOrganizationsPage,
  memberSchema,
  type OrganizationCursor,
  setOrganizationMember,
  useOrganization,
  type Organization,
  type OrganizationMember,
  type OrganizationRole,
} from "./organizations";
import { firebaseMessage } from "./services";
import {
  deleteOrganizationFile,
  listOrganizationFiles,
  readOrganizationFile,
  uploadOrganizationFile,
  validateUpload,
  FILE_TYPES,
  type OrganizationFile,
} from "./storage";
import { Field, Input, Select } from "../components/field";
import { Button } from "../components/button";
import { Alert, Progress } from "../components/feedback";
import { ResourceState } from "../components/resource-state";

export function OrganizationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (orgId: string) => void;
}) {
  const { services, user } = useHydraAuth();
  return (
    <OrganizationPickerContent
      key={`${services.app.name}:${user?.uid ?? ""}`}
      value={value}
      onChange={onChange}
    />
  );
}
function OrganizationPickerContent({
  value,
  onChange,
}: {
  value: string;
  onChange: (orgId: string) => void;
}) {
  const { services, user } = useHydraAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [created, setCreated] = useState<Organization>();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [cursor, setCursor] = useState<OrganizationCursor>();
  const [nextCursor, setNextCursor] = useState<OrganizationCursor>();
  useEffect(() => {
    let current = true;
    if (!cursor) setOrganizations([]);
    setNextCursor(undefined);
    setError("");
    if (!user?.emailVerified) return;
    setBusy(true);
    listOrganizationsPage(services, cursor)
      .then(
        (data) => {
          if (current) {
            setOrganizations(old => [...new Map([...old, ...data.organizations].map(org => [org.id,org])).values()]);
            setNextCursor(data.nextCursor);
          }
        },
        (e) => {
          if (current) setError(firebaseMessage(e));
        },
      )
      .finally(() => {
        if (current) setBusy(false);
      });
    return () => {
      current = false;
    };
  }, [services.db, user?.uid, user?.emailVerified, revision, cursor]);
  async function create(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const id = await createOrganization(services, name);
      setCreated({id, name:name.trim(), role:"owner"});
      setName("");
      setCursor(undefined);
      setRevision((n) => n + 1);
      onChange(id);
    } catch (e) {
      setError(firebaseMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-4">
      <Field label="Organization">
        <Select
          value={value}
          disabled={busy || !user?.emailVerified}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Choose an organization</option>
          {(created?.id === value && !organizations.some(org => org.id === created.id) ? [created,...organizations] : organizations).map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} · {org.role}
            </option>
          ))}
        </Select>
      </Field>
      {nextCursor && <Button variant="secondary" disabled={busy} onClick={() => setCursor(nextCursor)}>Load more organizations</Button>}
      <form onSubmit={create} className="flex flex-wrap items-end gap-3">
        <Field label="New organization">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
          />
        </Field>
        <Button type="submit" disabled={busy || !user?.emailVerified}>
          Create organization
        </Button>
      </form>
      {error && <Alert tone="danger">{error}</Alert>}
      <Button
        variant="ghost"
        disabled={busy}
        onClick={() => {setCursor(undefined);setRevision((n) => n + 1);}}
      >
        Refresh organizations
      </Button>
    </div>
  );
}

export function OrganizationMembers() {
  const {orgId,status} = useOrganization();
  const {services,user} = useHydraAuth();
  return <OrganizationMembersContent key={JSON.stringify([services.app.name,user?.uid,orgId,status])}/>;
}
function OrganizationMembersContent() {
  const { orgId, status, member } = useOrganization();
  const { services } = useHydraAuth();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [uid, setUid] = useState("");
  const [role, setRole] =
    useState<Exclude<OrganizationRole, "owner">>("viewer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pages, setPages] = useState<Array<QueryDocumentSnapshot | undefined>>([undefined]);
  const [next, setNext] = useState<QueryDocumentSnapshot>();
  const [loading, setLoading] = useState(true);
  const cursor = pages[pages.length - 1];
  useEffect(() => {
    let current = true;
    setLoading(true);
    setNext(undefined);
    setMembers([]);
    setError("");
    if (status !== "active") return;
    const stop = onSnapshot(
      query(
        collection(services.db, "organizations", orgId, "members"),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(50),
      ),
      (snap) => {
        if (!current) return;
        try {
          const parsed = snap.docs.map(d => memberSchema.parse(d.data()));
          if (parsed.some(m => m.orgId !== orgId)) throw new Error('Invalid membership');
          setMembers(parsed);
          setNext(snap.size === 50 ? snap.docs.at(-1) : undefined);
        } catch { setMembers([]); setNext(undefined); setError('Member data could not be validated.'); }
        setLoading(false);
      },
      (e) => {if(current){setError(firebaseMessage(e));setMembers([]);setNext(undefined);setLoading(false);}},
    );
    return () => {current = false;stop();};
  }, [orgId, status, services.db, cursor]);
  async function save(
    userId: string,
    memberRole: Exclude<OrganizationRole, "owner">,
    state: "active" | "suspended",
  ) {
    setBusy(true);
    setError("");
    try {
      await setOrganizationMember(services, orgId, userId, memberRole, state);
      setUid("");
    } catch (e) {
      setError(firebaseMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (status !== "active") return null;
  return (
    <section className="grid gap-4">
      <h3 className="font-display text-xl">Organization members</h3>
      <p className="text-sm text-hydra-muted">
        Owners grant access using an existing Firebase UID. Invitations by email
        require your trusted backend.
      </p>
      <ul className="divide-y divide-hydra-line">
        {members.map((m) => (
          <li
            key={m.userId}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <span className="break-all">
              {m.userId} · {m.role} · {m.status}
            </span>
            {member?.role === "owner" && m.role !== "owner" && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void save(
                    m.userId,
                    m.role as Exclude<OrganizationRole, "owner">,
                    m.status === "active" ? "suspended" : "active",
                  )
                }
              >
                {m.status === "active" ? "Suspend" : "Restore"} {m.userId}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={loading || pages.length === 1} onClick={() => setPages(p => p.slice(0,-1))}>Previous members</Button>
        <Button variant="secondary" disabled={loading || !next} onClick={() => setPages(p => [...p,next])}>Next members</Button>
        <Button variant="ghost" disabled={loading || pages.length === 1} onClick={() => setPages([undefined])}>First page</Button>
      </div>
      {loading && <ResourceState status="loading" message="Loading members…"/>}
      {member?.role === "owner" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save(uid, role, "active");
          }}
          className="grid gap-3 md:grid-cols-3"
        >
          <Field label="Member UID">
            <Input
              required
              pattern="[A-Za-z0-9_-]{1,128}"
              maxLength={128}
              value={uid}
              onChange={(e) => setUid(e.target.value)}
            />
          </Field>
          <Field label="Member role">
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
            >
              {["viewer", "analyst", "admin"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={busy}>
            Grant or update access
          </Button>
        </form>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
    </section>
  );
}

export function OrganizationFiles({ userId }: { userId?: string }) {
  const { user } = useHydraAuth();
  const { orgId, status, member } = useOrganization();
  if (!user || status !== "active" || !member)
    return (
      <ResourceState
        status="empty"
        message="Select an authorized organization to view files."
      />
    );
  return (
    <FilePanel
      key={JSON.stringify([orgId, user.uid, userId])}
      userId={userId ?? user.uid}
    />
  );
}
function FilePanel({ userId }: { userId: string }) {
  const { services, user } = useHydraAuth();
  const { orgId, member } = useOrganization();
  const [files, setFiles] = useState<OrganizationFile[]>([]);
  const [tokens, setTokens] = useState<Array<string | undefined>>([undefined]);
  const [next, setNext] = useState<string>();
  const [revision, setRevision] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [remove, setRemove] = useState<string | null>(null);
  const task = useRef<UploadTask | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      task.current?.cancel();
    };
  }, []);
  const token = tokens[tokens.length - 1];
  useEffect(() => {
    let current = true;
    setBusy(true);
    setError("");
    setFiles([]);
    listOrganizationFiles(services, orgId, userId, token)
      .then(
        (page) => {
          if (current) {
            setFiles(page.files);
            setNext(page.nextPageToken);
          }
        },
        (e) => {
          if (current) setError(firebaseMessage(e));
        },
      )
      .finally(() => {
        if (current) setBusy(false);
      });
    return () => {
      current = false;
    };
  }, [services.storage, orgId, userId, token, revision]);
  function refresh() {
    setTokens([undefined]);
    setRevision((n) => n + 1);
  }
  function upload() {
    if (!file || task.current) return;
    const invalid = validateUpload(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError("");
    setMessage("");
    try {
      const upload = uploadOrganizationFile(services, orgId, file);
      task.current = upload;
      setProgress(0);
      upload.on(
        "state_changed",
        (snapshot) => {
          if (alive.current)
            setProgress(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            );
        },
        (e) => {
          task.current = null;
          if (alive.current) {
            setProgress(null);
            setError(firebaseMessage(e));
          }
        },
        () => {
          task.current = null;
          if (alive.current) {
            setProgress(null);
            setFile(null);
            setMessage("File uploaded to this organization.");
            refresh();
          }
        },
      );
    } catch (e) {
      setError(firebaseMessage(e));
    }
  }
  async function download(entry: OrganizationFile) {
    setError("");
    try {
      const blob = await readOrganizationFile(services, orgId, entry.path);
      if (!alive.current) return;
      const url = URL.createObjectURL(
        new Blob([blob], { type: "application/octet-stream" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = entry.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      if (alive.current) setError(firebaseMessage(e));
    }
  }
  async function destroy(path: string) {
    setBusy(true);
    setError("");
    try {
      await deleteOrganizationFile(services, orgId, path);
      if (alive.current) {
        setRemove(null);
        refresh();
      }
    } catch (e) {
      if (alive.current) setError(firebaseMessage(e));
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  const canUpload = member?.role !== "viewer" && userId === user?.uid;
  return (
    <section className="grid gap-4">
      <h3 className="font-display text-xl">Organization files</h3>
      <p className="text-sm text-hydra-muted">
        Files are shared with active members of this organization. Showing
        uploads by {userId}.
      </p>
      {canUpload && (
        <div className="grid gap-3">
          <Field
            label="Choose evidence or report"
            hint="PDF, JSON, CSV, text, images, DOCX or XLSX. Maximum 25 MiB."
          >
            <Input
              type="file"
              accept={FILE_TYPES.join(",")}
              disabled={progress !== null}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Button disabled={!file || progress !== null} onClick={upload}>
            Upload file
          </Button>
        </div>
      )}
      {progress !== null && (
        <>
          <Progress value={progress} label="Upload progress" />
          <Button variant="secondary" onClick={() => task.current?.cancel()}>
            Cancel upload
          </Button>
        </>
      )}
      {busy && <ResourceState status="loading" message="Loading files…" />}
      {error && <Alert tone="danger">{error}</Alert>}
      {message && <Alert>{message}</Alert>}
      {!busy && !files.length && (
        <ResourceState status="empty" message="No files on this page." />
      )}
      <ul className="divide-y divide-hydra-line">
        {files.map((entry) => (
          <li
            key={entry.path}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <span className="break-all">
              {entry.name} · {Math.ceil(entry.size / 1024)} KiB
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => void download(entry)}>
                Download {entry.name}
              </Button>
              {(member?.role === "owner" ||
                member?.role === "admin" ||
                canUpload) && (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setRemove(entry.path)}
                >
                  Delete {entry.name}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {remove && (
        <Alert tone="warning" title="Delete this file?">
          <p>This permanently removes the selected object.</p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => void destroy(remove)}
            >
              Confirm deletion
            </Button>
            <Button variant="secondary" onClick={() => setRemove(null)}>
              Keep file
            </Button>
          </div>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={busy || tokens.length === 1}
          onClick={() => setTokens((t) => t.slice(0, -1))}
        >
          Previous files
        </Button>
        <Button
          variant="secondary"
          disabled={busy || !next}
          onClick={() => setTokens((t) => [...t, next])}
        >
          Next files
        </Button>
        <Button variant="ghost" disabled={busy} onClick={refresh}>
          Refresh files
        </Button>
      </div>
    </section>
  );
}
