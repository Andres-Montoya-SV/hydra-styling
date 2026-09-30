import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function openFoundations(page: Page) {
  await page.goto("/#components/foundations");
  await expect(page.getByRole("heading", { name: "One rhythm, across the workspace." })).toBeVisible();
}
async function height(element: Locator) {
  const box = await element.boundingBox();
  expect(box).not.toBeNull();
  return box!.height;
}
async function insideViewport(page: Page, element: Locator) {
  const box = await element.boundingBox(), viewport = page.viewportSize()!;
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(11);
  expect(box!.y).toBeGreaterThanOrEqual(11);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width - 11);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height - 11);
}
test("form labels, descriptions, readonly fields and password refs compose", async ({ page }) => {
  await openFoundations(page);
  const domain = page.getByRole("textbox", { name: "Authorized domain" });
  await page.locator('label[for="foundation-domain"]').click();
  await expect(domain).toBeFocused();
  await expect(domain).toHaveAccessibleDescription(
    "Use a hostname without a protocol. This preview shows a validation message. Only approved assets belong in scope.",
  );
  await expect(domain).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("textbox", { name: "Workspace ID" })).toHaveAttribute("readonly", "");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Access token", { exact: true })).toHaveAttribute("type", "text");
});
test("density aligns controls, preserves nested overrides and keeps busy button width", async ({ page }) => {
  await openFoundations(page);
  const medium = page.locator('[data-size-row="md"] .hydra-input');
  const comfortable = await height(medium);
  for (const density of ["compact", "comfortable"]) {
    await page.getByLabel("Workspace density").selectOption(density);
    for (const size of ["sm", "md", "lg"]) {
      const row = page.locator('[data-size-row="' + size + '"]');
      const inputHeight = await height(row.locator(".hydra-input"));
      expect(Math.abs(inputHeight - await height(row.locator("select")))).toBeLessThanOrEqual(1);
      expect(Math.abs(inputHeight - await height(row.getByRole("button", { name: "Inspect" })))).toBeLessThanOrEqual(1);
    }
    if (density === "compact") expect(await height(medium)).toBeLessThan(comfortable);
    expect(await height(page.getByLabel("Comfortable override").locator(".."))).toBe(comfortable);
  }
  const save = page.getByRole("button", { name: "Save configuration", exact: true });
  const width = (await save.boundingBox())!.width;
  await save.click();
  await expect(save).toBeDisabled();
  await expect(save).toHaveAttribute("aria-busy", "true");
  expect(Math.abs((await save.boundingBox())!.width - width)).toBeLessThan(1);
  await expect(page.getByRole("status").filter({ hasText: "Saving configuration" })).toBeAttached();
  await page.getByRole("button", { name: "Finish preview" }).click();
  await expect(save).toBeEnabled();
});
test("floating menus escape clipping, flip at screen edges and keep keyboard selection", async ({ page }) => {
  await openFoundations(page);
  const clip = page.getByTestId("foundation-clip");
  await clip.evaluate(element => Object.assign(element.style, {
    position: "fixed", right: "0", bottom: "0", width: "240px", zIndex: "10",
  }));
  const trigger = page.getByRole("button", { name: "Workspace actions" });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("menu", { name: "Workspace actions" });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute("data-hydra-floating", "top-layer");
  await expect(menu).toHaveAttribute("data-side", "top");
  await insideViewport(page, menu);
  expect(await menu.evaluate(element => {
    const box = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  })).toBe(true);
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Review evidence" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
test("nested menus and tooltips dismiss before their dialog and retain scoped theme tokens", async ({ page }) => {
  await openFoundations(page);
  await page.getByRole("button", { name: "Inspect in dialog" }).click();
  const dialog = page.getByRole("dialog", { name: "Workspace review" });
  const trigger = dialog.getByRole("button", { name: "Dialog actions" });
  await trigger.click();
  const menu = dialog.getByRole("menu");
  await expect(menu).toHaveAttribute("data-hydra-floating", "top-layer");
  await insideViewport(page, menu);
  expect(await menu.evaluate(element => element.closest("[data-hydra-theme]") !== null)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(trigger).toBeFocused();
  await dialog.getByRole("button", { name: "Dialog help" }).focus();
  await expect(dialog.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog.getByRole("tooltip")).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});
test("both themes keep the foundations accessible and constrained on the page", async ({ page }) => {
  await openFoundations(page);
  for (const theme of ["nocturne", "daylight"]) {
    await page.locator("[data-hydra-theme]").first().evaluate((element, value) => {
      element.setAttribute("data-hydra-theme", value);
    }, theme);
    const tooltipTrigger = page.getByRole("button", { name: "Scope help", exact: true });
    await tooltipTrigger.scrollIntoViewIfNeeded();
    await tooltipTrigger.focus();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    await insideViewport(page, tooltip);
    await page.keyboard.press("Escape");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
