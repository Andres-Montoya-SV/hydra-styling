import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("scoped Spanish labels, validation and RTL keyboard navigation work together", async ({
  page,
}) => {
  await page.goto("/#components/consistency");
  const board = page.getByTestId("consistency-board");
  // This lazy page can take longer on a cold WebKit CI worker.
  await expect(board).toBeVisible({ timeout: 15000 });
  await page.getByLabel("Preview language").selectOption("es-SV");
  await page.getByLabel("Preview direction").selectOption("rtl");
  await expect(
    board.getByRole("button", { name: "Mostrar contraseña" }),
  ).toBeVisible();
  const tab = board.getByRole("tab", { name: "Resumen" });
  await tab.focus();
  await tab.press("ArrowLeft");
  await expect(board.getByRole("tab", { name: "Actividad" })).toBeFocused();
  const calendar = board.getByRole("group", {
    name: "Elegir fecha",
    exact: true,
  });
  await calendar.locator('[data-date="2026-09-14"]').focus();
  await page.keyboard.press("ArrowLeft");
  await expect(calendar.locator('[data-date="2026-09-15"]')).toBeFocused();
  await page.getByLabel("Preview state").selectOption("loading");
  await expect(
    board.getByRole("button", { name: "Guardar alcance" }),
  ).toBeDisabled();
  await expect(board.getByText("Cargando", { exact: true })).toBeAttached();
  await page.getByLabel("Preview state").selectOption("invalid");
  await expect(
    board.getByRole("textbox", { name: "Dominio autorizado" }),
  ).toHaveAttribute("aria-invalid", "true");
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
test("catalog detail exposes generated props and live density and language controls", async ({
  page,
}) => {
  await page.goto("/#components/pagination");
  const card = page.locator('[data-component="pagination"]');
  await expect(
    card.getByRole("heading", { name: "Props and defaults" }),
  ).toBeVisible();
  await expect(
    card.getByRole("region", { name: "Pagination props" }),
  ).toContainText("totalPages");
  await page.getByLabel("Component language").selectOption("es-SV");
  await expect(
    card.getByRole("button", { name: "Página siguiente" }),
  ).toBeVisible();
  const button = card.getByRole("button", { name: "Página 1", exact: true });
  const height = (await button.boundingBox())!.height;
  await page.getByLabel("Component density").selectOption("compact");
  expect((await button.boundingBox())!.height).toBeLessThan(height);
});
