import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/#components/data-controls");
  await expect(page.getByRole("heading", { name: "From selection to investigation." })).toBeVisible({ timeout: 15_000 });
});
test("keyboard selection submits committed values and native reset restores defaults", async ({ page }) => {
  const team = page.getByRole("combobox", { name: "Owning team" });
  await team.fill("secu");
  // WebKit can fill an offscreen field without scrolling to it. Bring its
  // anchor into view before checking the popup, retaining the entered query.
  await team.scrollIntoViewIfNeeded();
  await expect(team).toBeInViewport();
  await expect(team).toHaveValue("secu");
  await expect(page.getByRole("listbox")).toHaveAttribute("data-hydra-floating", "top-layer");
  await team.press("Enter");
  await expect(team).toHaveValue("Security");
  const reviewers = page.getByRole("combobox", { name: "Reviewers" });
  await reviewers.fill("plat"); await reviewers.press("Enter"); await reviewers.press("Escape");
  const tags = page.getByRole("textbox", { name: "Labels" });
  await tags.fill("production"); await tags.press("Enter");
  await page.getByRole("button", { name: "Review settings", exact: true }).click();
  const submitted = page.getByRole("figure", { name: "Submitted values" });
  await expect(submitted).toContainText('"team": "security"');
  await expect(submitted).toContainText('"platform"');
  await expect(submitted).toContainText('"production"');
  await page.getByRole("button", { name: "Reset settings", exact: true }).click();
  await expect(team).toHaveValue("");
  await expect(page.getByRole("button", { name: "Remove production" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remove external" })).toBeVisible();
});
test("range validation and server-owned table states recover without losing the page", async ({ page }) => {
  const end = page.getByLabel("End date", { exact: true });
  await end.fill("2026-08-01");
  expect(await end.evaluate((e: HTMLInputElement) => e.checkValidity())).toBe(false);
  await end.fill("2026-09-30");
  expect(await end.evaluate((e: HTMLInputElement) => e.checkValidity())).toBe(true);
  const table = page.getByRole("group", { name: "Remote findings", exact: true });
  await table.getByRole("button", { name: "Next page" }).click();
  await expect(table.getByRole("rowheader").first()).toHaveText("asset-006.example.com");
  await page.getByRole("checkbox", { name: "Simulate loading" }).check();
  await expect(table).toHaveAttribute("aria-busy", "true");
  await expect(table.getByRole("button", { name: "Next page" })).toBeDisabled();
  await page.getByRole("checkbox", { name: "Simulate loading" }).uncheck();
  await page.getByRole("checkbox", { name: "Simulate error" }).check();
  await expect(table.getByRole("alert")).toBeVisible();
  await table.getByRole("button", { name: "Try again" }).click();
  await expect(table.getByRole("rowheader").first()).toHaveText("asset-006.example.com");
  await table.getByRole("button", { name: "Risk score" }).click();
  await expect(table.getByRole("status")).toContainText("Page 1 of 15");
});
test("selection persists across pages and both themes remain accessible without page overflow", async ({ page }) => {
  const table = page.getByRole("group", { name: "Asset inventory", exact: true });
  await table.getByRole("checkbox", { name: "Select this page" }).check();
  await table.getByRole("button", { name: "Next page" }).click();
  await table.getByRole("checkbox", { name: "Select asset-011.example.com" }).check();
  await expect(table.getByRole("status")).toContainText("11 selected");
  for (const theme of ["nocturne", "daylight"]) {
    // Start each theme audit at the same viewport. WebKit defers transitions
    // on offscreen navigation; painting it first makes the settled audit real.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    if (theme === "daylight") await page.getByRole("button", { name: "Use light theme" }).click();
    await expect(page.locator(".hydra-theme").first()).toHaveAttribute("data-hydra-theme", theme);
    // Audit the settled theme; an interpolated midpoint is intentionally transient.
    await page.evaluate(async () => {
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      await Promise.all(document.getAnimations()
        .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map(animation => animation.finished.catch(() => {})));
    });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
