import {
  deleteObject,
  getBlob,
  getMetadata,
  list,
  ref,
  uploadBytesResumable,
  type UploadTask,
} from "firebase/storage";
import type { HydraFirebaseServices } from "./services";
import { requireCurrentUser, safeSegment } from "./organizations";

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const FILE_TYPES = [
  "application/pdf",
  "application/json",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;
export function safeFileName(name: string): string {
  const value = name
    .normalize("NFKC")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(-120);
  return value || "file";
}
export function filePrefix(orgId: string, uid: string) {
  return `organizations/${safeSegment(orgId)}/users/${safeSegment(uid)}/files`;
}
export function validateUpload(
  file: Pick<File, "size" | "type">,
): string | null {
  if (file.size <= 0 || file.size > MAX_FILE_BYTES)
    return "Choose a nonempty file up to 25 MiB.";
  if (!FILE_TYPES.includes(file.type as (typeof FILE_TYPES)[number]))
    return "Unsupported file type. Use PDF, JSON, CSV, text, PNG, JPEG, WebP, DOCX or XLSX.";
  return null;
}
export interface OrganizationFile {
  path: string;
  name: string;
  size: number;
  contentType: string;
  createdAt: string;
}
export function uploadOrganizationFile(
  services: HydraFirebaseServices,
  orgId: string,
  file: File,
): UploadTask {
  const user = requireCurrentUser(services);
  const error = validateUpload(file);
  if (error) throw new Error(error);
  const name = safeFileName(file.name);
  const id = crypto.randomUUID();
  // Flat leaf allows bounded listing; UUID prevents accidental name collisions.
  const path = `${filePrefix(orgId, user.uid)}/${id}_${name}`;
  return uploadBytesResumable(ref(services.storage, path), file, {
    contentType: file.type,
    contentDisposition: `attachment; filename="${name}"`,
    customMetadata: { orgId, ownerId: user.uid, originalName: name },
  });
}
export async function listOrganizationFiles(
  services: HydraFirebaseServices,
  orgId: string,
  uid?: string,
  pageToken?: string,
) {
  const user = requireCurrentUser(services);
  const page = await list(
    ref(services.storage, filePrefix(orgId, uid ?? user.uid)),
    { maxResults: 20, pageToken },
  );
  const files = await Promise.all(
    page.items.map(async (item) => {
      const meta = await getMetadata(item);
      return {
        path: item.fullPath,
        name: safeFileName(meta.customMetadata?.originalName ?? item.name),
        size: meta.size,
        contentType: meta.contentType ?? "application/octet-stream",
        createdAt: meta.timeCreated,
      };
    }),
  );
  return { files, nextPageToken: page.nextPageToken };
}
function scopedReference(
  services: HydraFirebaseServices,
  orgId: string,
  path: string,
) {
  requireCurrentUser(services);
  if (
    !path.startsWith(`organizations/${safeSegment(orgId)}/users/`) ||
    !/^organizations\/[A-Za-z0-9_-]+\/users\/[A-Za-z0-9_-]+\/files\/[A-Za-z0-9._-]+$/.test(
      path,
    )
  )
    throw new Error("File path does not belong to this organization.");
  return ref(services.storage, path);
}
/** Uses authenticated SDK reads; never returns a persistent bearer download URL. */
export function readOrganizationFile(
  services: HydraFirebaseServices,
  orgId: string,
  path: string,
) {
  return getBlob(scopedReference(services, orgId, path), MAX_FILE_BYTES);
}
export function deleteOrganizationFile(
  services: HydraFirebaseServices,
  orgId: string,
  path: string,
) {
  return deleteObject(scopedReference(services, orgId, path));
}
