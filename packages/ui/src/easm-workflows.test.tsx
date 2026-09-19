// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import { FindingReviewForm, ScanJobList } from "./components/easm-workflows";
afterEach(cleanup);
it("requires a review note for state changes and awaits persistence", async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <FindingReviewForm
      value={{ findingId: "f1", status: "open", assignee: "", note: "" }}
      onSave={save}
    />,
  );
  fireEvent.change(screen.getByLabelText("Disposition"), {
    target: { value: "resolved" },
  });
  fireEvent.submit(screen.getByRole("form", { name: "Finding review" }));
  expect(save).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Explain the status change",
  );
  fireEvent.change(screen.getByLabelText("Review note"), {
    target: { value: "Retested and fixed" },
  });
  fireEvent.submit(screen.getByRole("form", { name: "Finding review" }));
  await waitFor(() =>
    expect(screen.getByText("Review saved.")).toBeInTheDocument(),
  );
  expect(save).toHaveBeenCalledWith({
    findingId: "f1",
    status: "resolved",
    assignee: "",
    note: "Retested and fixed",
  });
});
it("preserves review drafts after persistence fails", async () => {
  render(
    <FindingReviewForm
      value={{
        findingId: "f1",
        status: "open",
        assignee: "",
        note: "evidence",
      }}
      onSave={async () => {
        throw new Error("offline");
      }}
    />,
  );
  fireEvent.submit(screen.getByRole("form", { name: "Finding review" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "draft is preserved",
  );
  expect(screen.getByLabelText("Review note")).toHaveValue("evidence");
});
it("requests cancellation without falsely claiming a job stopped", async () => {
  const cancel = vi.fn().mockResolvedValue(undefined);
  render(
    <ScanJobList
      jobs={[
        { id: "j1", target: "example.com", status: "running" },
        { id: "j2", target: "other.example", status: "partial" },
      ]}
      onCancel={cancel}
    />,
  );
  expect(
    screen.getAllByRole("button", { name: "Request cancellation" }),
  ).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Request cancellation" }));
  await waitFor(() => expect(cancel).toHaveBeenCalledWith("j1"));
  expect(screen.getByText("running")).toBeInTheDocument();
  expect(screen.queryByText("cancelled")).toBeNull();
});
