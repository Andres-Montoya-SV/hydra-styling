// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, DocumentCard, Field, Input, Progress } from "./index";

describe("Hydra UI", () => {
  it("renders an accessible labeled input", () => {
    render(<Field label="Target" hint="Domain, IP, or CIDR"><Input placeholder="example.com" /></Field>);
    expect(screen.getByLabelText("Target")).toHaveAttribute("placeholder", "example.com");
    expect(screen.getByText("Domain, IP, or CIDR")).toBeInTheDocument();
  });

  it("uses button semantics by default", () => {
    render(<Button>Run scan</Button>);
    expect(screen.getByRole("button", { name: "Run scan" })).toHaveAttribute("type", "button");
  });

  it("clamps progress values", () => {
    render(<Progress value={130} label="Scan" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("describes documents without relying on color", () => {
    render(<DocumentCard name="surface-report.pdf" kind="pdf" meta="2.4 MB" />);
    expect(screen.getAllByText("PDF")).toHaveLength(2);
    expect(screen.getByText("surface-report.pdf")).toBeInTheDocument();
  });
});
