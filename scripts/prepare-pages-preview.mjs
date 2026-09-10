import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const distRoot = path.join(projectRoot, "dist");
const pagesRoot = path.join(distRoot, "StruJam8");

await rm(pagesRoot, { recursive: true, force: true });
await mkdir(pagesRoot, { recursive: true });
await cp(path.join(distRoot, "assets"), path.join(pagesRoot, "assets"), { recursive: true });
await cp(path.join(distRoot, "index.html"), path.join(pagesRoot, "index.html"));
