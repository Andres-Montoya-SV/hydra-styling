import { expect, test } from "@playwright/test";
for (const theme of ["nocturne", "daylight"])
  for (const mobile of [false, true]) {
    test(`feedback ${theme} ${mobile ? "mobile" : "desktop"}`, async ({
      page,
    }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/#components/feedback");
      await expect(page.getByTestId("feedback-board")).toBeVisible({
        timeout: 15000,
      });
      if (theme === "daylight")
        await page.getByRole("button", { name: "Use light theme" }).click();
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByTestId("feedback-board")).toHaveScreenshot(
        `feedback-${theme}-${mobile ? "mobile" : "desktop"}.png`,
      );
    });
  }
test("Brazilian Portuguese composition", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-30T12:00:00Z"));
  await page.goto("/#components/consistency");
  await expect(page.getByTestId("consistency-board")).toBeVisible({
    timeout: 15000,
  });
  await page.getByLabel("Site language").selectOption("pt-BR");
  await expect(page.getByTestId("consistency-board")).toHaveScreenshot(
    "portuguese-consistency.png",
  );
});
test("notification queue in Brazilian Portuguese", async ({ page }) => {
  await page.goto("/#components/feedback");
  await expect(page.getByTestId("feedback-board")).toBeVisible({
    timeout: 15000,
  });
  await page.getByLabel("Site language").selectOption("pt-BR");
  await page.getByRole("button", { name: "Mostrar erro" }).click();
  await page.getByRole("button", { name: "Ação com desfazer" }).click();
  await expect(
    page.getByRole("region", { name: "Notificações" }),
  ).toHaveScreenshot("portuguese-notifications.png");
});
