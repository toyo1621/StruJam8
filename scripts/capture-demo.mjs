import { chromium } from "@playwright/test";
import { mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import process from "node:process";

const demoUrl = process.env.DEMO_URL ?? "http://127.0.0.1:4173/";
const frameDirectory = "/tmp/strujam8-demo-frames";
const outputPath = "docs/assets/strujam8-demo.gif";

function runFfmpeg() {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-framerate",
      "1",
      "-i",
      `${frameDirectory}/frame-%02d.png`,
      "-vf",
      "fps=1,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=sierra2_4a",
      "-loop",
      "0",
      outputPath,
    ]);

    let errorOutput = "";
    ffmpeg.stderr.on("data", (chunk) => {
      errorOutput += chunk.toString();
    });
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (exitCode) => {
      if (exitCode === 0) {
        resolve();
        return;
      }

      reject(new Error(`ffmpeg failed with exit code ${exitCode}: ${errorOutput}`));
    });
  });
}

await rm(frameDirectory, { recursive: true, force: true });
await mkdir(frameDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

await context.addInitScript(() => {
  localStorage.removeItem("strujam8:jam:v1");
});

const page = await context.newPage();
await page.goto(demoUrl, { waitUntil: "networkidle" });

let frameNumber = 1;
async function capture() {
  await page.waitForTimeout(900);
  await page.screenshot({
    path: `${frameDirectory}/frame-${String(frameNumber).padStart(2, "0")}.png`,
  });
  frameNumber += 1;
}

const livePads = () => page.locator("footer.pad-dock button.live-pad");

await capture();
await livePads().filter({ hasText: "ベース" }).click();
await capture();
await livePads().filter({ hasText: "崩す" }).click();
await capture();
await livePads().filter({ hasText: "音を抜く" }).click();
await capture();
await livePads().filter({ hasText: "歪ませる" }).click();
await capture();
await page
  .locator(".rule-block")
  .filter({ hasText: "音を抜く" })
  .getByRole("button", { name: "ベース ＞ 崩す ＞ 音を抜く の詳細を表示" })
  .click();
await capture();
await page.getByLabel("Preset", { exact: true }).selectOption("neon-dub");
await capture();

await browser.close();
await runFfmpeg();
await rm(frameDirectory, { recursive: true, force: true });

console.log(`Captured ${outputPath} from ${demoUrl}`);
