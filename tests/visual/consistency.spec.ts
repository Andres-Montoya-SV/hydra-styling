import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, theme: string) {
  await page.clock.setFixedTime(new Date("2026-09-30T12:00:00Z"));
  await page.goto("/#components/consistency");
  await expect(page.getByTestId("consistency-board")).toBeVisible();
  if (theme === "daylight")
    await page.getByRole("button", { name: "Use light theme" }).click();
  await page.evaluate(() => document.fonts.ready);
}
for (const theme of ["nocturne", "daylight"]) {
  for (const density of ["comfortable", "compact"])
    test(`${theme} ${density} desktop`, async ({ page }) => {
      await open(page, theme);
      await page.getByLabel("Preview density").selectOption(density);
      await expect(page.getByTestId("consistency-board")).toHaveScreenshot(
        `${theme}-${density}-desktop.png`,
      );
    });
  test(`${theme} mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, theme);
    await expect(page.getByTestId("consistency-board")).toHaveScreenshot(
      `${theme}-mobile.png`,
    );
  });
}
for (const state of [
  "invalid",
  "disabled",
  "readonly",
  "loading",
  "empty",
  "error",
])
  test(`state ${state}`, async ({ page }) => {
    await open(page, "daylight");
    await page.getByLabel("Preview state").selectOption(state);
    await expect(page.getByTestId("consistency-board")).toHaveScreenshot(
      `state-${state}.png`,
    );
  });
test("Spanish, RTL and an open native popover", async ({ page }) => {
  await open(page, "nocturne");
  await page.getByLabel("Preview language").selectOption("es-SV");
  await page.getByLabel("Preview direction").selectOption("rtl");
  const board = page.getByTestId("consistency-board");
  await board.scrollIntoViewIfNeeded();
  await board.getByRole("combobox", { name: "Equipo", exact: true }).fill("r");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(board).toHaveScreenshot("spanish-rtl-popover.png");
});
