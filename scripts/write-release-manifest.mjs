import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";

const commit = process.env.GITHUB_SHA;
if (!commit || !/^[a-f0-9]{40}$/.test(commit)) {
  throw new Error("A full GITHUB_SHA is required to identify the verified release");
}

const dist = new URL("../dist/", import.meta.url);
const files = ["index.html", ...(await readdir(new URL("assets/", dist)))
  .sort().map((name) => `assets/${name}`)];
const sha256 = {};
for (const file of files) {
  sha256[file] = createHash("sha256").update(await readFile(new URL(file, dist))).digest("hex");
}
await writeFile(new URL("release.json", dist), JSON.stringify({ commit, sha256 }, null, 2) + "\n");
