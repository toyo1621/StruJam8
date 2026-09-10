import { chromium } from "@playwright/test";
import process from "node:process";

const verificationUrl = process.env.VERIFY_URL ?? "http://127.0.0.1:4173/";
const settleMs = Number(process.env.HIGHLIGHT_SETTLE_MS ?? 500);
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(verificationUrl, { waitUntil: "domcontentloaded" });
  const startButton = page.getByRole("button", {
    name: /^(Start Strudel audio preview|Play|再生|Play Strudel Audio)$/i,
  });
  await startButton.click();
  await page.getByText("Audio playing").waitFor({ state: "visible", timeout: 15_000 });

  const result = await page.evaluate(async ({ settleMs: delay }) => {
    const [{ techniques }, { defaultPreset }, { formatPlayableCode }, engine] = await Promise.all([
      import("/src/data/techniques.ts"),
      import("/src/data/presets.ts"),
      import("/src/lib/codegen.ts"),
      import("/src/audio/strudelEngine.ts"),
    ]);
    const eventLocationCounts = new Map();
    const miniLocationCounts = new Map();
    const failures = [];
    let currentTechniqueId = null;

    const countLocations = (counts, locations) => {
      if (!currentTechniqueId || locations.length === 0) {
        return;
      }

      counts.set(currentTechniqueId, (counts.get(currentTechniqueId) ?? 0) + locations.length);
    };

    const onTrigger = (locations) => countLocations(eventLocationCounts, locations);
    const onMetadata = (locations) => countLocations(miniLocationCounts, locations);

    for (const technique of techniques) {
      const rule = {
        ...technique,
        id: `highlight-verification-${technique.id}`,
        techniqueId: technique.id,
        enabled: true,
        needsTodo: false,
      };
      const code = formatPlayableCode([rule], defaultPreset);

      currentTechniqueId = technique.id;

      try {
        const didEvaluate = await engine.startStrudelAudio(code, onTrigger, undefined, onMetadata);

        if (!didEvaluate) {
          failures.push({ id: technique.id, message: "evaluation became stale" });
        }

        await new Promise((resolve) => window.setTimeout(resolve, delay));
      } catch (error) {
        failures.push({
          id: technique.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    currentTechniqueId = null;
    engine.stopStrudelAudio();

    const eventLocationTechniqueIds = [...eventLocationCounts.keys()];
    const miniLocationTechniqueIds = [...miniLocationCounts.keys()];

    return {
      total: techniques.length,
      failures,
      eventLocationTechniqueCount: eventLocationTechniqueIds.length,
      miniLocationTechniqueCount: miniLocationTechniqueIds.length,
      eventLocationCoverage: `${eventLocationTechniqueIds.length}/${techniques.length}`,
      miniLocationCoverage: `${miniLocationTechniqueIds.length}/${techniques.length}`,
      missingEventLocationIds: techniques
        .map((technique) => technique.id)
        .filter((id) => !eventLocationCounts.has(id)),
      missingMiniLocationIds: techniques
        .map((technique) => technique.id)
        .filter((id) => !miniLocationCounts.has(id)),
    };
  }, { settleMs });

  await page.getByRole("button", { name: /^(Stop Strudel audio preview|Stop|停止)$/i }).click();

  console.log(JSON.stringify({ ...result, settleMs }, null, 2));

  if (
    result.failures.length > 0 ||
    result.miniLocationTechniqueCount !== result.total
  ) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
