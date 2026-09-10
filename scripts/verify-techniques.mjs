import { chromium } from "@playwright/test";
import process from "node:process";

const verificationUrl = process.env.VERIFY_URL ?? "http://127.0.0.1:4173/";
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(verificationUrl, { waitUntil: "domcontentloaded" });
  const startButton = page.getByRole("button", {
    name: /^(Start Strudel audio preview|Play|再生|Play Strudel Audio)$/i,
  });
  await startButton.click();
  await page.getByText("Audio playing").waitFor({ state: "visible", timeout: 15_000 });

  const result = await page.evaluate(async () => {
    const [{ techniques }, { defaultPreset }, { formatPlayableCode }, engine] = await Promise.all([
      import("/src/data/techniques.ts"),
      import("/src/data/presets.ts"),
      import("/src/lib/codegen.ts"),
      import("/src/audio/strudelEngine.ts"),
    ]);
    const failures = [];
    const startedAt = performance.now();

    for (const technique of techniques) {
      const rule = {
        ...technique,
        id: `verification-${technique.id}`,
        techniqueId: technique.id,
        enabled: true,
        needsTodo: false,
      };
      const code = formatPlayableCode([rule], defaultPreset);

      try {
        const didEvaluate = await engine.startStrudelAudio(code);

        if (!didEvaluate) {
          failures.push({ id: technique.id, message: "evaluation became stale" });
        }
      } catch (error) {
        failures.push({
          id: technique.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    engine.stopStrudelAudio();

    return {
      total: techniques.length,
      failures,
      elapsedMs: Math.round(performance.now() - startedAt),
    };
  });

  await page.getByRole("button", { name: /^(Stop Strudel audio preview|Stop|停止)$/i }).click();

  if (result.failures.length > 0) {
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`Verified ${result.total} technique snippets in ${result.elapsedMs}ms.`);
  }
} finally {
  await browser.close();
}
