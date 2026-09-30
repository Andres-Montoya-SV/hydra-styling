import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function component(page: import("@playwright/test").Page, id: string) {
  await page.goto(`/#components/${id}`);
  const card = page.locator(`[data-component="${id}"]`);
  await expect(card).toBeVisible();
  return card.locator(".catalog-card-preview");
}

test("all 68 components are discoverable by category, search and direct link", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#components");
  await expect(page.locator("[data-component]")).toHaveCount(68);
  await page
    .getByRole("navigation", { name: "Component categories" })
    .getByRole("button", { name: /Data input/ })
    .click();
  await expect(page.locator("[data-component]")).toHaveCount(15);
  await page.getByRole("searchbox", { name: "Search components" }).fill("OTP");
  await expect(page.locator("[data-component]")).toHaveCount(1);
  await page
    .getByRole("heading", { name: "OTP", exact: true })
    .getByRole("link")
    .click();
  await expect(page).toHaveURL(/#components\/otp$/);
  await page.reload();
  await expect(page.locator('[data-component="otp"]')).toBeVisible();
  await page
    .getByRole("button", { name: "All components", exact: true })
    .click();
  await expect(page.locator("[data-component]")).toHaveCount(68);
  await page
    .getByRole("searchbox", { name: "Search components" })
    .fill("does-not-exist");
  await expect(
    page.getByRole("heading", { name: "No matching components" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator("[data-component]")).toHaveCount(68);
  expect(errors).toEqual([]);
});

test("native dialog and drawer contain focus, dismiss and restore the trigger", async ({
  page,
}) => {
  for (const [id, triggerName, title] of [
    ["modal", "Review scope", "Review authorized scope"],
    ["drawer", "Open workspace drawer", "Workspace navigation"],
  ]) {
    const card = await component(page, id);
    const trigger = card.getByRole("button", {
      name: triggerName,
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: title });
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(
        await dialog.evaluate((e) => e.contains(document.activeElement)),
      ).toBe(true);
    }
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});

test("dropdown keyboard actions and native grouped disclosures work", async ({
  page,
}) => {
  let card = await component(page, "dropdown");
  const trigger = card.getByRole("button", { name: "Asset actions" });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    card.getByRole("menuitem", { name: "Prepare report" }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    card.getByRole("menuitem", { name: "Inspect asset ID" }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    card.getByRole("menuitem", { name: "Prepare report" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(trigger).toBeFocused();
  await expect(card.getByRole("status")).toContainText("Report prepared");
  card = await component(page, "accordion");
  await card
    .locator("summary")
    .filter({ hasText: "What is in scope?" })
    .click();
  await expect(
    card.getByText("Only domains explicitly approved by your organization."),
  ).toBeVisible();
  await card
    .locator("summary")
    .filter({ hasText: "Where is the evidence?" })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    card.getByText("Every relationship links back to its observed source."),
  ).toBeVisible();
  await expect(
    card.getByText("Only domains explicitly approved by your organization."),
  ).not.toBeVisible();
});

test("calendar supports date selection and keyboard month boundaries", async ({
  page,
}) => {
  const card = await component(page, "calendar");
  const initial = card.getByRole("button", {
    name: "Wednesday, September 30, 2026",
  });
  await initial.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    card.getByRole("button", { name: "Thursday, October 1, 2026" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(card.getByRole("status")).toHaveText(
    "Selected date: 2026-10-01",
  );
  await page.keyboard.press("PageUp");
  await expect(
    card.getByRole("button", { name: "Tuesday, September 1, 2026" }),
  ).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(
    card.getByRole("button", { name: "Tuesday, September 1, 2026" }),
  ).toBeFocused();
  await expect(
    card.getByRole("button", { name: "Previous month" }),
  ).toBeDisabled();
});

test("forms preserve validation, OTP editing and native rating semantics", async ({
  page,
}) => {
  let card = await component(page, "validator");
  await card.getByRole("button", { name: "Validate email" }).click();
  await expect(
    card.getByRole("textbox", { name: "Report email" }),
  ).toBeFocused();
  await expect(card.getByRole("status")).not.toContainText("Valid email:");
  await card
    .getByRole("textbox", { name: "Report email" })
    .fill("analyst@example.com");
  await page.keyboard.press("Enter");
  await expect(card.getByRole("status")).toContainText(
    "Valid email: analyst@example.com",
  );
  card = await component(page, "otp");
  await card.getByRole("textbox", { name: "Verification code" }).fill("123456");
  await expect(card.getByRole("status")).toContainText("Code format is valid");
  await card.getByRole("textbox").press("Home");
  await page.keyboard.press("Delete");
  await expect(card.getByRole("textbox")).toHaveValue("23456");
  card = await component(page, "rating");
  await card.getByRole("radio", { name: "3 of 5" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(card.getByRole("radio", { name: "4 of 5" })).toBeChecked();
});

test("tabs, filter, carousel and tooltip can be used without a mouse", async ({
  page,
}) => {
  let card = await component(page, "tab");
  await card.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(card.getByRole("tabpanel")).toHaveText(
    "Certificate matches the approved domain.",
  );
  await page.keyboard.press("End");
  await expect(card.getByRole("tab", { name: "History" })).toBeFocused();
  card = await component(page, "filter");
  await card.getByRole("radio", { name: "High", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(card.getByRole("radio")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(card.getByRole("radio")).toHaveCount(3);
  card = await component(page, "carousel");
  await card.getByRole("button", { name: "Next slide" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    card.getByRole("group", { name: "2 of 3: Understand" }),
  ).toBeVisible();
  card = await component(page, "tooltip");
  const exportButton = card.getByRole("button", { name: "Export report" });
  await exportButton.focus();
  await expect(exportButton).toHaveAccessibleDescription(
    "Download a local JSON report",
  );
  await page.keyboard.press("Escape");
  await expect(card.getByRole("tooltip")).toHaveCount(0);
});

test("motion opt-out stops catalog effects and hover gallery remains touch operable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let card = await component(page, "text-rotate");
  await expect(card.getByText("Discover.", { exact: true })).toBeVisible();
  await expect(
    card.getByRole("button", { name: "Pause rotating text" }),
  ).toHaveCount(0);
  card = await component(page, "loading");
  expect(
    await card
      .locator(".hydra-loading-spinner")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  card = await component(page, "hover-gallery");
  await card.getByRole("button", { name: "Protect", exact: true }).click();
  await expect(
    card.getByText("Protect what matters.", { exact: true }),
  ).toBeVisible();
  await expect(
    card.getByRole("button", { name: "Protect", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
