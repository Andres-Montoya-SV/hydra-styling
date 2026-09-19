import { it, expect } from "vitest";
import {
  filePrefix,
  safeFileName,
  validateUpload,
  MAX_FILE_BYTES,
} from "./firebase/storage";
import { safeSegment } from "./firebase/organizations";
it("scopes file paths to organization and user IDs", () => {
  expect(filePrefix("org-a", "alice")).toBe(
    "organizations/org-a/users/alice/files",
  );
});
it.each(["../other", "a/b", "", "a%2fb", "a\\b"])(
  "rejects path traversal and invalid identifiers: %s",
  (id) => {
    expect(() => safeSegment(id)).toThrow();
  },
);
it("normalizes filenames without slashes, quotes or control characters", () => {
  expect(safeFileName('../../report"\n.pdf')).toMatch(/^[A-Za-z0-9._-]+$/);
  expect(safeFileName("")).toBe("file");
  expect(safeFileName("a".repeat(500)).length).toBeLessThanOrEqual(120);
});
it("checks file size and MIME before starting an upload", () => {
  expect(validateUpload({ size: 1, type: "application/pdf" })).toBeNull();
  expect(validateUpload({ size: 0, type: "text/plain" })).not.toBeNull();
  expect(
    validateUpload({ size: MAX_FILE_BYTES + 1, type: "text/plain" }),
  ).not.toBeNull();
  expect(validateUpload({ size: 12, type: "image/svg+xml" })).not.toBeNull();
  expect(validateUpload({ size: 12, type: "text/html" })).not.toBeNull();
});
