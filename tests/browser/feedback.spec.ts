import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function open(page: Page) {
  await page.goto("/#components/feedback");
  await expect(page.getByTestId("feedback-board")).toBeVisible({
    timeout: 15000,
  });
}

test("site language persists, local overrides inherit or replace it, and edits survive translation", async ({
  page,
}) => {
  await page.goto("/#components/consistency");
  const board = page.getByTestId("consistency-board");
  await expect(board).toBeVisible({ timeout: 15000 });
  await board
    .getByRole("textbox", { name: "Authorized domain", exact: true })
    .fill("customer.example");
  await page
    .getByRole("combobox", { name: "Site language" })
    .selectOption("pt-BR");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(
    board.getByRole("textbox", { name: "Domínio autorizado" }),
  ).toHaveValue("customer.example");
  await expect(
    board.getByRole("button", { name: "Mostrar senha" }),
  ).toBeVisible();
  await page.getByLabel("Idioma da prévia").selectOption("es-SV");
  await expect(
    board.getByRole("textbox", { name: "Dominio autorizado" }),
  ).toHaveValue("customer.example");
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Idioma do site" }),
  ).toHaveValue("pt-BR");
  await expect(
    board.getByRole("button", { name: "Mostrar senha" }),
  ).toBeVisible();
  await page.goto("/#components/pagination");
  const card = page.locator('[data-component="pagination"]');
  await expect(
    card.getByRole("button", { name: "Próxima página" }),
  ).toBeVisible();
  await page.getByLabel("Idioma do componente").selectOption("en-US");
  await expect(card.getByRole("button", { name: "Next page" })).toBeVisible();
  await page
    .getByRole("combobox", { name: "Idioma do site" })
    .selectOption("es-SV");
  await expect(card.getByRole("button", { name: "Next page" })).toBeVisible();
  await page.getByLabel("Idioma del componente").selectOption("");
  await expect(
    card.getByRole("button", { name: "Página siguiente" }),
  ).toBeVisible();
});

test("native alert dialog focuses cancel, contains focus, ignores backdrop and dismisses nested popover first", async ({
  page,
}) => {
  await open(page);
  const trigger = page.getByRole("button", {
    name: "Remove demo scope",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("alertdialog", { name: "Remove this scope?" });
  await expect(
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeFocused();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await page.mouse.click(2, 2);
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Inspect scope" }).click();
  const popover = dialog.getByRole("dialog", { name: "Scope details" });
  await expect(popover).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(popover).not.toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Inspect scope" }),
  ).toBeFocused();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("popover accepts edits without moving focus on every keystroke and restores its trigger", async ({
  page,
}) => {
  await open(page);
  const trigger = page.getByRole("button", { name: "Edit label", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Label settings" });
  const field = dialog.getByRole("textbox", { name: "Label", exact: true });
  await expect(field).toBeFocused();
  await field.fill("important");
  await field.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Save label" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(
    page.getByRole("region", { name: "Notifications" }),
  ).toContainText("Label saved: important");
  await page.getByRole("button", { name: "Clear notifications" }).click();
  await trigger.click();
  await page.getByRole("heading", { name: "Contextual popover" }).click();
  await expect(dialog).not.toBeVisible();
});

test("notifications handle async rejection, undo and loading updates without page errors or focus theft", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page);
  const viewport = page.getByRole("region", { name: "Notifications" });
  const emit = page.getByRole("button", { name: "Failing action" });
  await emit.click();
  // Safari does not focus buttons on pointer activation; keyboard focus remains untouched.
  await emit.focus();
  await viewport.getByRole("button", { name: "Try action" }).click();
  await expect(viewport.getByRole("alert")).toContainText("could not");
  await expect(
    viewport.getByRole("button", { name: "Try action" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Clear notifications" }).click();
  await page.getByRole("button", { name: "Action with undo" }).click();
  await viewport.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(viewport).toContainText("Demo item restored.");
  await page.getByRole("button", { name: "Clear notifications" }).click();
  const save = page.getByRole("button", { name: "Simulate save" });
  await save.focus();
  await save.press("Enter");
  await expect(save).toBeFocused();
  await expect(viewport).toContainText("Saving preferences…");
  await expect(viewport).toContainText("Preferences saved.");
  await expect(viewport.locator("li")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("translated feedback is accessible in both themes without horizontal overflow", async ({
  page,
}) => {
  await open(page);
  for (const locale of ["en-US", "es-SV", "pt-BR"]) {
    await page.locator(".showcase-language select").selectOption(locale);
    for (const theme of ["nocturne", "daylight"]) {
      // WebKit defers painting offscreen navigation. Start from the same viewport.
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      if (
        (await page
          .locator(".hydra-theme")
          .first()
          .getAttribute("data-hydra-theme")) !== theme
      )
        await page.locator("button:has(.hydra-theme-toggle-label)").click();
      await expect(page.locator(".hydra-theme").first()).toHaveAttribute(
        "data-hydra-theme",
        theme,
      );
      // Wait for actual registered-property transitions, not a wall-clock estimate.
      await page.evaluate(async () => {
        // Child color transitions can be retargeted while theme tokens interpolate.
        for (let pass = 0; pass < 10; pass++) {
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          const active = document
            .getAnimations()
            .filter(
              (animation) =>
                (animation.playState === "running" || animation.pending) &&
                animation.effect?.getComputedTiming().iterations !== Infinity,
            );
          if (!active.length) return;
          await Promise.all(
            active.map((animation) => animation.finished.catch(() => {})),
          );
        }
        throw new Error(
          "Theme transitions did not settle before the contrast audit.",
        );
      });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
    }
  }
});
