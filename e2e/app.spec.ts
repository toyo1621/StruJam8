import { expect, test, type Page } from "@playwright/test";

function livePads(page: Page) {
  return page.locator("footer.pad-dock button.live-pad");
}

async function chooseBassBreakTechnique(page: Page) {
  const pads = livePads(page);
  await pads.filter({ hasText: "ベース" }).click();
  await pads.filter({ hasText: "崩す" }).click();
  await pads.filter({ hasText: "音を抜く" }).click();
}

test.describe("StruJam8 browser flow", () => {
  test("navigates through the three pad levels and updates audible code", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "STRUJAM8" })).toBeVisible();
    await chooseBassBreakTechnique(page);

    await expect(page.getByText("ベース ＞ 崩す ＞ 音を抜く", { exact: true }).first()).toBeVisible();
    await expect(page.getByLabel("Audible Strudel code")).toContainText(".degradeBy(0.2)");
    await expect(page.locator("footer.pad-dock button.live-pad")).toHaveCount(8);
  });

  test("resets added rules while keeping the current navigation context", async ({ page }) => {
    await page.goto("/");
    await chooseBassBreakTechnique(page);

    const code = page.getByLabel("Audible Strudel code");
    await expect(code).toContainText(".degradeBy(0.2)");

    await page.getByRole("button", { name: /^RESET:/ }).click();

    await expect(code).not.toContainText(".degradeBy(0.2)");
    await expect(page.getByText("ベース ＞ 崩す", { exact: true }).first()).toBeVisible();
  });

  test("keeps the main surfaces inside a tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");

    await expect(page.locator("footer.pad-dock button.live-pad")).toHaveCount(8);
    await expect(page.locator(".code-panel")).toBeVisible();

    const layout = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  });
});
