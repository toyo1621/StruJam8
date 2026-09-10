import { expect, test, type Page } from "@playwright/test";
import { concreteTechniqueRoutes } from "../src/data/routes";
import { getTechniqueById, getTechniquesByRoute } from "../src/data/techniques";

function livePads(page: Page) {
  return page.locator("footer.pad-dock button.live-pad");
}

function isStrudelRuntimeRequest(url: string) {
  return url.includes("@strudel_web") || /\/(?:dist|strudel-runtime)-[^/]+\.js(?:\?|$)/.test(url);
}

async function chooseBassBreakTechnique(page: Page) {
  const pads = livePads(page);
  await pads.filter({ hasText: "ベース" }).click();
  await pads.filter({ hasText: "崩す" }).click();
  await pads.filter({ hasText: "音を抜く" }).click();
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

function unverifiedTechniqueJamUrl() {
  const technique = getTechniqueById("bass-break-sometimes-rest");

  if (!technique) {
    throw new Error("Missing technique for TODO safety test");
  }

  const snapshot = {
    version: 1,
    selectedPresetId: "toy-house",
    rules: [{
      id: "e2e-unverified-snippet",
      targetId: technique.targetId,
      intentId: technique.intentId,
      techniqueId: technique.id,
      target: technique.target,
      intent: technique.intent,
      technique: technique.label,
      shortLabel: technique.shortLabel,
      strudelSnippet: technique.strudelSnippet,
      needsTodo: true,
      enabled: true,
    }],
  };

  return `./?jam=${encodeURIComponent(JSON.stringify(snapshot))}`;
}

const targetCoverageTechniqueIds = [
  "drums-dance-boost-kick",
  "bass-break-drop-notes",
  "chords-build-add-high-note",
  "keys-chill-soft-filter",
  "strings-widen-high-layer",
  "bells-random-sparse-hits",
  "guitar-forward-boost-gain",
  "voice-forward-boost-gain",
] as const;

const targetCoverageIds = ["drums", "bass", "chords", "keys", "strings", "bells", "guitar", "voice"];

function allTargetCoverageJamUrl() {
  const rules = targetCoverageTechniqueIds.map((techniqueId, index) => {
    const technique = getTechniqueById(techniqueId);

    if (!technique) {
      throw new Error(`Missing target coverage technique: ${techniqueId}`);
    }

    return {
      id: `e2e-target-coverage-${index}`,
      targetId: technique.targetId,
      intentId: technique.intentId,
      techniqueId: technique.id,
      target: technique.target,
      intent: technique.intent,
      technique: technique.label,
      shortLabel: technique.shortLabel,
      strudelSnippet: technique.strudelSnippet,
      playbackTransform: technique.playbackTransform,
      needsTodo: technique.needsTodo ?? false,
      enabled: true,
    };
  });

  const snapshot = {
    version: 1,
    selectedPresetId: "toy-house",
    rules,
  };

  return `./?jam=${encodeURIComponent(JSON.stringify(snapshot))}`;
}

function allConcreteRoutePlaybackSnapshot() {
  const rules = concreteTechniqueRoutes.map((route, index) => {
    const technique = getTechniquesByRoute(route.targetId, route.intentId).find(
      (candidate) => !candidate.needsTodo,
    );

    if (!technique) {
      throw new Error(`Missing verified technique for ${route.targetId}:${route.intentId}`);
    }

    return {
      id: `e2e-route-playback-${index}`,
      targetId: technique.targetId,
      intentId: technique.intentId,
      techniqueId: technique.id,
      target: technique.target,
      intent: technique.intent,
      technique: technique.label,
      shortLabel: technique.shortLabel,
      strudelSnippet: technique.strudelSnippet,
      playbackTransform: technique.playbackTransform,
      needsTodo: false,
      enabled: true,
    };
  });

  const snapshot = {
    version: 1,
    selectedPresetId: "toy-house",
    rules,
  };

  return snapshot;
}

const runtimeVerifiedTechniqueIds = [
  "drums-dance-ghost-echo",
  "drums-dance-swing",
  "drums-dance-tight-cut",
  "drums-build-fill-forward",
  "drums-build-pre-break-reverse",
  "keys-chill-thin-delay",
  "strings-widen-pan-sweep",
  "bells-random-glitter-echo",
  "bells-random-pan-drift",
  "guitar-forward-wide-pan",
  "voice-forward-tight-cut",
  "voice-forward-echo-call",
  "drums-remove-sometimes-silence",
  "chords-widen-pan-sway",
  "bass-remove-rest-sometimes",
  "chords-remove-rest-sometimes",
  "chords-break-rest-sometimes",
  "drums-random-rest-sometimes",
  "chords-random-rest-sometimes",
  "bass-widen-stereo-motion",
  "chords-dance-fill-cycle",
  "keys-forward-pan-motion",
  "guitar-dance-pan-sweep",
  "voice-random-rest",
  "bass-break-sometimes-rest",
  "chords-build-widen-range",
  "chords-build-arpeggio",
  "chords-dance-arpeggio",
] as const;

function runtimeVerifiedTechniquePlaybackSnapshot() {
  const rules = runtimeVerifiedTechniqueIds.map((techniqueId, index) => {
    const technique = getTechniqueById(techniqueId);

    if (!technique) {
      throw new Error(`Missing runtime-verified technique: ${techniqueId}`);
    }

    return {
      id: `e2e-runtime-verified-${index}`,
      targetId: technique.targetId,
      intentId: technique.intentId,
      techniqueId: technique.id,
      target: technique.target,
      intent: technique.intent,
      technique: technique.label,
      shortLabel: technique.shortLabel,
      strudelSnippet: technique.strudelSnippet,
      playbackTransform: technique.playbackTransform,
      needsTodo: false,
      enabled: true,
    };
  });

  return {
    version: 1,
    selectedPresetId: "toy-house" as const,
    rules,
  };
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

  test("connects rule detail selection to the matching generated code lines", async ({ page }) => {
    await page.goto("./");
    await chooseBassBreakTechnique(page);

    const rule = page.locator(".rule-block").filter({ hasText: "音を抜く" });
    await rule.getByRole("button", { name: "ベース ＞ 崩す ＞ 音を抜く の詳細を表示" }).click();

    const selectedCode = page.locator(".code-line.is-rule-selected");
    await expect(selectedCode).toHaveCount(2);
    await expect(selectedCode.filter({ hasText: ".degradeBy(0.2)" })).toHaveCount(1);
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

  test("loads the Indietronica preset and plays its original synth palette", async ({ page }) => {
    await page.goto("./");

    await page.getByLabel("Preset", { exact: true }).selectOption("indietronica");

    await expect(page.getByLabel("Preset", { exact: true })).toHaveValue("indietronica");
    await expect(page.getByLabel("Audible Strudel code")).toContainText('s("sbd ~ [~ sbd] ~")');
    await expect(page.getByText("原曲のメロディや録音は使用しません。", { exact: false })).toBeVisible();

    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio playing", { timeout: 15_000 });

    await page.getByRole("button", { name: "Stop Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio stopped");
  });

  test("shows unverified techniques as TODO without sending them to Play", async ({ page }) => {
    await page.goto(unverifiedTechniqueJamUrl());

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
    await expect(page.getByLabel("Audible Strudel code")).toHaveAttribute("data-location-map", "ready");
    await expect(page.getByLabel("Audible Strudel code")).toHaveAttribute(
      "data-source-location-count",
      /[1-9]/,
    );

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

  test("suspends the AudioContext on Stop and resumes it on the next Play", async ({ page }) => {
    await page.goto("./");

    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio playing", { timeout: 15_000 });

    await page.evaluate(async () => {
      const runtimeUrl = performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .find((name) =>
          name.includes("@strudel_web") || /\/(?:dist|strudel-runtime)-[^/]+\.js(?:\?|$)/.test(name),
        );

      if (!runtimeUrl) {
        throw new Error("Strudel runtime module was not loaded");
      }

      const runtimeChunk = await import(runtimeUrl);
      const runtime = [runtimeChunk.n, runtimeChunk.t, runtimeChunk].find(
        (candidate) =>
          candidate &&
          typeof candidate === "object" &&
          typeof candidate.getAudioContext === "function",
      ) ?? runtimeChunk;
      (window as Window & { __strujam8AudioContext?: AudioContext }).__strujam8AudioContext =
        runtime.getAudioContext?.();
    });

    await expect
      .poll(() => page.evaluate(() =>
        (window as Window & { __strujam8AudioContext?: AudioContext }).__strujam8AudioContext?.state ?? null,
      ))
      .toBe("running");

    await page.getByRole("button", { name: "Stop Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio stopped");
    await expect
      .poll(() => page.evaluate(() =>
        (window as Window & { __strujam8AudioContext?: AudioContext }).__strujam8AudioContext?.state ?? null,
      ), { timeout: 5_000 })
      .toBe("suspended");

    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio playing", { timeout: 15_000 });

    const replacementContext = await page.evaluate(async () => {
      const runtimeUrl = performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .find((name) =>
          name.includes("@strudel_web") || /\/(?:dist|strudel-runtime)-[^/]+\.js(?:\?|$)/.test(name),
        );

      if (!runtimeUrl) {
        throw new Error("Strudel runtime module was not loaded after restart");
      }

      const runtimeChunk = await import(runtimeUrl);
      const runtime = [runtimeChunk.n, runtimeChunk.t, runtimeChunk].find(
        (candidate) =>
          candidate &&
          typeof candidate === "object" &&
          typeof candidate.getAudioContext === "function",
      ) ?? runtimeChunk;
      const currentContext = runtime.getAudioContext?.();
      return {
        state: currentContext?.state ?? null,
        isSameContext: currentContext ===
          (window as Window & { __strujam8AudioContext?: AudioContext }).__strujam8AudioContext,
      };
    });

    expect(replacementContext).toEqual({ state: "running", isSameContext: true });

    await page.getByRole("button", { name: "Stop Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio stopped");
  });

  test("updates the running preview when a new technique is added", async ({ page }) => {
    await page.goto("./");

    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio playing", { timeout: 15_000 });

    await chooseBassBreakTechnique(page);

    await expect(page.getByLabel("Audible Strudel code")).toContainText(".degradeBy(0.2)");
    await expect(page.locator(".audio-status")).toHaveText("Audio playing");
    await expect(page.getByRole("button", { name: "Stop Strudel audio preview" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await page.getByRole("button", { name: "Stop Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio stopped");
  });

  test("marks the producing rule LIVE during playback", async ({ page }) => {
    await page.goto(allTargetCoverageJamUrl());
    await expect(page.locator(".rule-block")).toHaveCount(targetCoverageIds.length);

    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio playing", { timeout: 15_000 });
    await expect(page.getByLabel("Audible Strudel code")).toHaveAttribute("data-location-map", "ready");
    await expect
      .poll(() => page.locator('.rule-block[data-live="true"]').count(), { timeout: 10_000 })
      .toBeGreaterThan(0);

    await page.getByRole("button", { name: "Stop Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio stopped");
  });

  test("reaches every concrete route through the eight-pad UI", async ({ page }) => {
    await page.goto("./");

    const pads = livePads(page);

    for (const route of concreteTechniqueRoutes) {
      const firstTechnique = getTechniquesByRoute(route.targetId, route.intentId)[0];

      if (!firstTechnique) {
        throw new Error(`Missing technique for ${route.targetId}:${route.intentId}`);
      }

      await page.getByRole("button", { name: "HOME", exact: true }).click();
      await pads.filter({ hasText: route.target }).click();
      await pads.filter({ hasText: route.intent }).click();

      await expect(pads).toHaveCount(8);
      await pads.filter({ hasText: firstTechnique.label }).click();

      await expect(page.getByText(
        `${route.target} ＞ ${route.intent} ＞ ${firstTechnique.label}`,
        { exact: true },
      ).last()).toBeVisible();

      if (firstTechnique.needsTodo) {
        await expect(page.getByLabel("Audible Strudel code")).not.toContainText(firstTechnique.strudelSnippet);
      } else {
        await expect(page.getByLabel("Audible Strudel code")).toContainText(firstTechnique.strudelSnippet);
      }
    }
  });

  test("highlights runtime code locations across all eight target tracks", async ({ page }) => {
    await page.goto(allTargetCoverageJamUrl());

    await expect(page.locator(".rule-block")).toHaveCount(8);
    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio playing", { timeout: 15_000 });

    const seenTargetIds = await page.evaluate(async () => {
      const seen = new Set<string>();
      const startedAt = performance.now();

      while (performance.now() - startedAt < 15_000 && seen.size < 8) {
        document.querySelectorAll(".code-token.is-location-active").forEach((token) => {
          const targetId = token.closest<HTMLElement>("[data-target-id]")?.dataset.targetId;

          if (targetId) {
            seen.add(targetId);
          }
        });

        await new Promise((resolve) => window.setTimeout(resolve, 25));
      }

      return [...seen].sort();
    });

    expect(seenTargetIds).toEqual([...targetCoverageIds].sort());

    await page.getByRole("button", { name: "Stop Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio stopped");
  });

  test("plays one verified technique from every concrete route", async ({ page }) => {
    await page.addInitScript((snapshot) => {
      window.localStorage.setItem("strujam8:jam:v1", JSON.stringify(snapshot));
    }, allConcreteRoutePlaybackSnapshot());
    await page.goto("./");

    await expect(page.locator(".rule-block")).toHaveCount(concreteTechniqueRoutes.length);
    await expect(page.getByLabel("Audible Strudel code")).not.toContainText("TODO");

    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio playing", { timeout: 15_000 });
    await expect
      .poll(() => page.locator(".code-token.is-location-active").count(), { timeout: 15_000 })
      .toBeGreaterThan(0);

    await page.getByRole("button", { name: "Stop Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio stopped");
  });

  test("plays techniques verified against the installed Strudel runtime", async ({ page }) => {
    await page.addInitScript((snapshot) => {
      window.localStorage.setItem("strujam8:jam:v1", JSON.stringify(snapshot));
    }, runtimeVerifiedTechniquePlaybackSnapshot());
    await page.goto("./");

    await expect(page.locator(".rule-block")).toHaveCount(runtimeVerifiedTechniqueIds.length);
    await expect(page.getByLabel("Audible Strudel code")).not.toContainText("TODO");

    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio playing", { timeout: 15_000 });
    await expect
      .poll(() => page.locator(".code-token.is-location-active").count(), { timeout: 15_000 })
      .toBeGreaterThan(0);

    await page.getByRole("button", { name: "Stop Strudel audio preview" }).click();
    await expect(page.locator(".audio-status")).toHaveText("Audio stopped");
  });

  test("loads the Strudel runtime only after Play", async ({ page }) => {
    await page.goto("./");

    const getStrudelRuntimeResources = () =>
      page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter(
            (name) =>
              name.includes("@strudel_web") ||
              /\/(?:dist|strudel-runtime)-[^/]+\.js(?:\?|$)/.test(name),
          ),
      );

    await expect(getStrudelRuntimeResources()).resolves.toEqual([]);

    await page.getByRole("button", { name: "Start Strudel audio preview" }).click();
    await expect.poll(getStrudelRuntimeResources, { timeout: 15_000 }).not.toEqual([]);
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

  test("keeps the pad dock usable in a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("./");

    await expect(page.locator("footer.pad-dock button.live-pad")).toHaveCount(8);

    const layout = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    const minimumControlHeight = await page
      .locator(".transport-button, .navigation-controls button, .file-controls button, .copy-code-button, .live-pad")
      .evaluateAll((elements) => Math.min(...elements.map((element) => element.getBoundingClientRect().height)));

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect(minimumControlHeight).toBeGreaterThanOrEqual(44);
  });

  test("respects reduced-motion preferences", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");

    const transitionDuration = await page.locator("footer.pad-dock button.live-pad").first().evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    );

    expect(Number.parseFloat(transitionDuration)).toBeLessThanOrEqual(0.001);
  });
});
