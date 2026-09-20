import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(projectRoot, "src/electron/renderer");
const destination = resolve(projectRoot, "dist/electron/renderer");
const preloadSource = resolve(projectRoot, "src/electron/preload.cjs");
const preloadDestination = resolve(projectRoot, "dist/electron/preload.cjs");

await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
await cp(preloadSource, preloadDestination);
