import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Vitral renders accessible controls in both themes with no horizontal overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of ["dashboard", "components"]) {
    await page.goto(`/#${route}`);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.locator(".hydra-theme")).toBeVisible();
    for (const theme of ["nocturne", "daylight"]) {
      const boundary = page.locator(".hydra-theme");
      if ((await boundary.getAttribute("data-hydra-theme")) !== theme)
        await page
          .getByRole("button", {
            name: theme === "daylight" ? "Use light theme" : "Use dark theme",
          })
          .click();
      // Finish actual running CSS transitions, rather than racing their contrast midpoint.
      await page.evaluate(async () => {
        await Promise.all(
          document
            .getAnimations()
            .filter(
              (a) => a.effect?.getComputedTiming().iterations !== Infinity,
            )
            .map((a) => a.finished.catch(() => {})),
        );
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    }
  }
  expect(errors).toEqual([]);
});

test("point graph retains positions, highlights search and traces relationships", async ({
  page,
}) => {
  await page.goto("/");
  const node = page.getByRole("button", {
    name: "example.com, domain",
    exact: true,
  });
  await expect(node).toBeVisible();
  await expect(page.locator(".hydra-node-dot")).toHaveCount(97);
  await node.focus();
  const before = await node.getAttribute("transform");
  await page.keyboard.press("ArrowRight");
  const after = await node.getAttribute("transform");
  expect(after).not.toBe(before);
  await page.keyboard.press("Enter");
  await expect(node).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText("example.com → has subdomain → api.example.com"),
  ).toBeVisible();
  await page.getByRole("searchbox", { name: "Find asset" }).fill("192.0.2.2");
  await expect(
    page.getByRole("status", { name: "Search results" }),
  ).toContainText("matching assets");
  await expect(page.locator(".hydra-node-dot")).toHaveCount(97);
  await page.getByRole("button", { name: "Zoom in" }).click();
  const dot = node.locator(".hydra-node-dot");
  await dot.scrollIntoViewIfNeeded();
  const box = (await dot.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 30,
    box.y + box.height / 2 + 20,
    { steps: 5 },
  );
  await page.mouse.up();
  const dropped = await node.getAttribute("transform");
  expect(dropped).not.toBe(after);
  await page.reload();
  await expect(node).toHaveAttribute("transform", dropped!);
});

test("theme preference survives reload and reduced motion disables theme interpolation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Use light theme" }).click();
  await expect(page.locator(".hydra-theme")).toHaveAttribute(
    "data-hydra-theme",
    "daylight",
  );
  expect(
    await page
      .locator(".hydra-theme")
      .evaluate((e) => getComputedStyle(e).transitionDuration),
  ).toBe("0s");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Use dark theme" }),
  ).toBeVisible();
  await expect(page.locator('[data-hydra-motion="on"]')).toHaveCount(0);
});

test("theme colors interpolate and the animation switch can disable the transition", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const boundary = page.locator(".hydra-theme");
  await expect(page.locator('[data-hydra-motion="on"]').first()).toBeVisible();
  const read = () =>
    boundary.evaluate((e) =>
      getComputedStyle(e).getPropertyValue("--hs-canvas"),
    );
  const before = await read();
  await page.getByRole("button", { name: "Use light theme" }).click();
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const during = await read();
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
  });
  const after = await read();
  expect(during).not.toBe(before);
  expect(during).not.toBe(after);
  await page.getByRole("switch", { name: "Animations" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("switch", { name: "Animations" })).not.toBeChecked();
  await page.getByRole("button", { name: "Use dark theme" }).click();
  expect(
    await boundary.evaluate((e) => getComputedStyle(e).transitionDuration),
  ).toBe("0s");
});
