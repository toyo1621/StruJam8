import { expect, test, type Page } from "@playwright/test";

function livePads(page: Page) {
  return page.locator("footer.pad-dock button.live-pad");
}

function isStrudelRuntimeRequest(url: string) {
  return url.includes("@strudel_web") || /\/dist-[^/]+\.js(?:\?|$)/.test(url);
}

async function chooseBassBreakTechnique(page: Page) {
  const pads = livePads(page);
  await pads.filter({ hasText: "ベース" }).click();
  await pads.filter({ hasText: "崩す" }).click();
  await pads.filter({ hasText: "音を抜く" }).click();
}

async function chooseUnverifiedBassBreakTechnique(page: Page) {
  const pads = livePads(page);
  await pads.filter({ hasText: "ベース" }).click();
  await pads.filter({ hasText: "崩す" }).click();
  await pads.filter({ hasText: "たまに休む" }).click();
}

function invalidSnippetJamUrl() {
  const snapshot = {
    version: 1,
    selectedPresetId: "toy-house",
    rules: [
      {
        id: "e2e-invalid-snippet",
        targetId: "bass",
        intentId: "break",
        techniqueId: "e2e-invalid-snippet",
        target: "ベース",
        intent: "崩す",
        technique: "不正なsnippet",
        shortLabel: "Invalid",
        strudelSnippet: ".definitelyNotAStrudelFunction(1)",
        needsTodo: false,
        enabled: true,
      },
    ],
  };

  return `./?jam=${encodeURIComponent(JSON.stringify(snapshot))}`;
}

test.describe("StruJam8 browser flow", () => {
  test("navigates through the three pad levels and updates audible code", async ({ page }) => {
    await page.goto("./");

    await expect(page.getByRole("heading", { name: "STRUJAM8" })).toBeVisible();
    await chooseBassBreakTechnique(page);

    await expect(page.getByText("ベース ＞ 崩す ＞ 音を抜く", { exact: true }).first()).toBeVisible();
    await expect(page.getByLabel("Audible Strudel code")).toContainText(".degradeBy(0.2)");
    await expect(page.locator("footer.pad-dock button.live-pad")).toHaveCount(8);
  });

  test("resets added rules while keeping the current navigation context", async ({ page }) => {
    await page.goto("./");
    await chooseBassBreakTechnique(page);

    const code = page.getByLabel("Audible Strudel code");
    await expect(code).toContainText(".degradeBy(0.2)");

    await page.getByRole("button", { name: /^RESET:/ }).click();

    await expect(code).not.toContainText(".degradeBy(0.2)");
    await expect(page.getByText("ベース ＞ 崩す", { exact: true }).first()).toBeVisible();
  });

  test("offers a starter jam from the empty rule state", async ({ page }) => {
    await page.goto("./");

    await expect(page.getByRole("button", { name: "おすすめセットを試す" })).toBeVisible();
    await page.getByRole("button", { name: "おすすめセットを試す" }).click();

    await expect(page.locator(".rule-block")).toHaveCount(2);
    await expect(page.locator(".rule-block").filter({ hasText: "音を抜く" })).toBeVisible();
    await expect(page.locator(".rule-block").filter({ hasText: "高い音を足す" })).toBeVisible();

    const code = page.getByLabel("Audible Strudel code");
    await expect(code).toContainText(".degradeBy(0.2)");
    await expect(code).toContainText('.sometimes(add(note("12")))');

    await page.getByRole("button", { name: "UNDO", exact: true }).click();
    await expect(page.locator(".rule-block")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "おすすめセットを試す" })).toBeVisible();
  });

  test("shows unverified techniques as TODO without sending them to Play", async ({ page }) => {
    await page.goto("./");
    await chooseUnverifiedBassBreakTechnique(page);

    await expect(page.getByText("ベース ＞ 崩す ＞ たまに休む", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("TODO", { exact: true }).first()).toBeVisible();

    const code = page.getByLabel("Audible Strudel code");
    await expect(code).not.toContainText(".sometimes(silence)");
    await expect(code).not.toContainText("TODO");

    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio playing", { timeout: 15_000 });

    await page.getByRole("button", { name: "Stop Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio stopped");
  });

  test("recovers after a real invalid snippet evaluation failure", async ({ page }) => {
    await page.goto(invalidSnippetJamUrl());

    const code = page.getByLabel("Audible Strudel code");
    await expect(code).toContainText(".definitelyNotAStrudelFunction(1)");

    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio start failed. Retry available.", {
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Retry Strudel audio preview" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop Strudel audio preview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: /^RESET:/ }).click();
    await expect(code).not.toContainText(".definitelyNotAStrudelFunction(1)");

    await page.getByRole("button", { name: "Retry Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio playing", { timeout: 15_000 });

    await page.getByRole("button", { name: "Stop Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio stopped");
  });

  test("starts and stops the browser audio preview with live code highlighting", async ({ page }) => {
    await page.goto("./");

    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio playing", { timeout: 15_000 });

    await expect
      .poll(() => page.locator(".code-line.is-active").count(), { timeout: 10_000 })
      .toBeGreaterThan(0);
    await expect
      .poll(() => page.locator(".code-token.is-location-active").count(), { timeout: 10_000 })
      .toBeGreaterThan(0);

    await page.getByRole("button", { name: "Stop Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio stopped");
    await expect(page.getByRole("button", { name: "Stop Strudel audio preview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("loads the Strudel runtime only after Play", async ({ page }) => {
    await page.goto("./");

    const getScriptResources = () =>
      page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((name) => name.includes(".js")),
      );

    const initialScripts = new Set(await getScriptResources());

    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect
      .poll(
        async () => {
          const scriptsAfterPlay = await getScriptResources();
          return scriptsAfterPlay.some((script) => !initialScripts.has(script));
        },
        { timeout: 15_000 },
      )
      .toBe(true);
  });

  test("recovers in the browser after the audio runtime load fails", async ({ page }) => {
    let failNextRuntimeRequest = true;

    await page.route("**/*", async (route) => {
      if (failNextRuntimeRequest && isStrudelRuntimeRequest(route.request().url())) {
        failNextRuntimeRequest = false;
        await route.fulfill({
          status: 200,
          contentType: "application/javascript",
          body: 'throw new Error("forced Strudel runtime load failure");',
        });
        return;
      }

      await route.continue();
    });

    await page.goto("./");
    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio start failed. Retry available.", {
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Retry Strudel audio preview" })).toBeVisible();

    await page.getByRole("button", { name: "Retry Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio playing", { timeout: 15_000 });

    await page.getByRole("button", { name: "Stop Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio stopped");
  });

  test("keeps the main surfaces inside a tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("./");

    await expect(page.locator("footer.pad-dock button.live-pad")).toHaveCount(8);
    await expect(page.locator(".code-panel")).toBeVisible();

    const layout = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  });
});
