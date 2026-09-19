import { after, before, beforeEach, test } from "node:test";
import { readFile } from "node:fs/promises";
import { strict as assert } from "node:assert";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  startAfter,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getMetadata,
  ref,
  updateMetadata,
  uploadBytes,
} from "firebase/storage";

let env;
const projectId = "demo-hydra-ui";
const member = (orgId, userId, role = "viewer", status = "active") => ({
  orgId,
  userId,
  role,
  status,
  joinedAt: serverTimestamp(),
});
const client = (uid, verified = true) =>
  env.authenticatedContext(uid, { email_verified: verified });
const path = (
  org = "a",
  uid = "analyst",
  id = "00000000-0000-4000-8000-000000000000",
) => `organizations/${org}/users/${uid}/files/${id}_report.txt`;
const metadata = (org = "a", uid = "analyst") => ({
  contentType: "text/plain",
  contentDisposition: 'attachment; filename="report.txt"',
  customMetadata: { orgId: org, ownerId: uid, originalName: "report.txt" },
});
before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: await readFile("packages/ui/firebase/firestore.rules", "utf8"),
    },
    storage: {
      rules: await readFile("packages/ui/firebase/storage.rules", "utf8"),
    },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "organizations/a"), {
      name: "A",
      ownerId: "owner",
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, "organizations/b"), {
      name: "B",
      ownerId: "outsider",
      createdAt: serverTimestamp(),
    });
    for (const [uid, role] of [
      ["owner", "owner"],
      ["admin", "admin"],
      ["analyst", "analyst"],
      ["viewer", "viewer"],
    ])
      await setDoc(
        doc(db, `organizations/a/members/${uid}`),
        member("a", uid, role),
      );
    await setDoc(
      doc(db, "organizations/b/members/outsider"),
      member("b", "outsider", "owner"),
    );
    await uploadBytes(
      ref(context.storage(), path()),
      new Uint8Array([1, 2, 3]),
      metadata(),
    );
  });
});
after(async () => {
  await env?.cleanup();
});

test("anonymous and unverified sessions cannot read organizations or files", async () => {
  for (const context of [
    env.unauthenticatedContext(),
    client("analyst", false),
  ]) {
    await assertFails(getDoc(doc(context.firestore(), "organizations/a")));
    await assertFails(getMetadata(ref(context.storage(), path())));
  }
});
test("active members read their organization, outsiders cannot", async () => {
  await assertSucceeds(
    getDoc(doc(client("viewer").firestore(), "organizations/a")),
  );
  await assertFails(
    getDoc(doc(client("outsider").firestore(), "organizations/a")),
  );
  await assertFails(getMetadata(ref(client("outsider").storage(), path())));
});
test("profile writes are private and reject passwords and role fields", async () => {
  const db = client("analyst").firestore();
  const data = {
    displayName: "Analyst",
    username: "analyst",
    updatedAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(doc(db, "users/analyst"), data));
  await assertFails(setDoc(doc(db, "users/other"), data));
  await assertFails(getDoc(doc(client("viewer").firestore(), "users/analyst")));
  await assertFails(
    setDoc(doc(db, "users/analyst"), { ...data, password: "never-store-this" }),
  );
  await assertFails(
    setDoc(doc(db, "users/analyst"), { ...data, role: "owner" }),
  );
});
test("organization bootstrap requires an atomic owner membership", async () => {
  const db = client("new-user").firestore();
  await assertFails(
    setDoc(doc(db, "organizations/new"), {
      name: "New",
      ownerId: "new-user",
      createdAt: serverTimestamp(),
    }),
  );
  const batch = writeBatch(db);
  batch.set(doc(db, "organizations/new"), {
    name: "New",
    ownerId: "new-user",
    createdAt: serverTimestamp(),
  });
  batch.set(
    doc(db, "organizations/new/members/new-user"),
    member("new", "new-user", "owner"),
  );
  await assertSucceeds(batch.commit());
  await assertSucceeds(getDoc(doc(db, "organizations/new")));
});
test("members cannot self-promote, self-enroll or rewrite organization ownership", async () => {
  const db = client("viewer").firestore();
  await assertFails(
    setDoc(
      doc(db, "organizations/a/members/viewer"),
      member("a", "viewer", "owner"),
    ),
  );
  await assertFails(
    setDoc(
      doc(db, "organizations/b/members/viewer"),
      member("b", "viewer", "admin"),
    ),
  );
  await assertFails(
    updateDoc(doc(db, "organizations/a"), { ownerId: "viewer" }),
  );
});
test("only the owner grants membership; the owner cannot be removed or demoted", async () => {
  const db = client("owner").firestore();
  await assertSucceeds(
    setDoc(
      doc(db, "organizations/a/members/new-user"),
      member("a", "new-user", "analyst"),
    ),
  );
  await assertFails(
    setDoc(
      doc(client("admin").firestore(), "organizations/a/members/new-user"),
      member("a", "new-user", "admin"),
    ),
  );
  await assertFails(
    setDoc(
      doc(db, "organizations/a/members/owner"),
      member("a", "owner", "viewer"),
    ),
  );
  await assertFails(deleteDoc(doc(db, "organizations/a/members/owner")));
  await assertFails(
    setDoc(
      doc(db, "organizations/a/members/new-user"),
      member("a", "new-user", "owner"),
    ),
  );
});
test("membership queries are constrained to self or own organization and bounded", async () => {
  const db = client("viewer").firestore();
  const result = await assertSucceeds(
    getDocs(
      query(
        collectionGroup(db, "members"),
        where("userId", "==", "viewer"),
        limit(100),
      ),
    ),
  );
  assert.equal(result.size, 1);
  await assertFails(getDocs(query(collectionGroup(db, "members"), limit(100))));
  await assertFails(
    getDocs(
      query(
        collectionGroup(db, "members"),
        where("userId", "==", "owner"),
        limit(100),
      ),
    ),
  );
  await assertSucceeds(
    getDocs(query(collection(db, "organizations/a/members"), limit(100))),
  );
  await assertFails(getDocs(collection(db, "organizations/a/members")));
});
test("analysts upload to their own prefix and active viewers may read shared files", async () => {
  const fresh = path("a", "analyst", "11111111-1111-4111-8111-111111111111");
  await assertSucceeds(
    uploadBytes(
      ref(client("analyst").storage(), fresh),
      new Uint8Array([1]),
      metadata(),
    ),
  );
  await assertSucceeds(getMetadata(ref(client("viewer").storage(), fresh)));
});
test("viewer uploads, forged owners and cross-organization writes are denied", async () => {
  await assertFails(
    uploadBytes(
      ref(client("viewer").storage(), path("a", "viewer")),
      new Uint8Array([1]),
      metadata("a", "viewer"),
    ),
  );
  await assertFails(
    uploadBytes(
      ref(client("analyst").storage(), path("a", "other")),
      new Uint8Array([1]),
      metadata("a", "other"),
    ),
  );
  await assertFails(
    uploadBytes(
      ref(client("analyst").storage(), path("b")),
      new Uint8Array([1]),
      metadata("b"),
    ),
  );
  await assertFails(
    uploadBytes(
      ref(
        client("analyst").storage(),
        path("a", "analyst", "22222222-2222-4222-8222-222222222222"),
      ),
      new Uint8Array([1]),
      metadata("a", "forged"),
    ),
  );
});
test("overwrites, metadata changes, executable MIME and oversized uploads are denied", async () => {
  const storage = client("analyst").storage();
  await assertFails(
    uploadBytes(ref(storage, path()), new Uint8Array([9]), metadata()),
  );
  await assertFails(
    updateMetadata(ref(storage, path()), {
      customMetadata: { firebaseStorageDownloadTokens: "public-token" },
    }),
  );
  const fresh = path("a", "analyst", "33333333-3333-4333-8333-333333333333");
  await assertFails(
    uploadBytes(ref(storage, fresh), new Uint8Array([1]), {
      ...metadata(),
      contentType: "text/html",
    }),
  );
  await assertFails(
    uploadBytes(
      ref(storage, fresh),
      new Uint8Array(25 * 1024 * 1024 + 1),
      metadata(),
    ),
  );
  await assertFails(
    uploadBytes(ref(storage, fresh), new Uint8Array([1]), {
      ...metadata(),
      customMetadata: {
        ...metadata().customMetadata,
        unexpectedField: "not-allowed",
      },
    }),
  );
});
test("suspension revokes reads and writes without waiting for a new auth token", async () => {
  const context = client("analyst");
  await assertSucceeds(getMetadata(ref(context.storage(), path())));
  await setDoc(
    doc(client("owner").firestore(), "organizations/a/members/analyst"),
    member("a", "analyst", "analyst", "suspended"),
  );
  await assertFails(getMetadata(ref(context.storage(), path())));
  await assertFails(getDoc(doc(context.firestore(), "organizations/a")));
});
test("viewer cannot delete, uploader and org administrators can", async () => {
  await assertFails(deleteObject(ref(client("viewer").storage(), path())));
  await assertSucceeds(deleteObject(ref(client("admin").storage(), path())));
});


test("cursor pagination traverses over 100 members and does not bypass tenant isolation", async () => {
  await env.withSecurityRulesDisabled(async context => {
    const db=context.firestore();const batch=writeBatch(db);
    for(let i=0;i<105;i++) {
      const uid=`page-${String(i).padStart(3,'0')}`;
      batch.set(doc(db,`organizations/a/members/${uid}`),member('a',uid));
    }
    await batch.commit();
  });
  const db=client('owner').firestore();const ids=[];let cursor;
  do {
    const page=await assertSucceeds(getDocs(query(collection(db,'organizations/a/members'),...(cursor?[startAfter(cursor)]:[]),limit(50))));
    ids.push(...page.docs.map(d=>d.id));cursor=page.size===50?page.docs.at(-1):undefined;
  } while(cursor);
  assert.equal(ids.length,109);assert.equal(new Set(ids).size,109);
  await assertFails(getDocs(query(collection(client('outsider').firestore(),'organizations/a/members'),limit(50))));
});
