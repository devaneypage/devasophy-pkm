import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const manifestPath = path.join(projectRoot, "dist/public/.vite/manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const appSource = await readFile(path.join(projectRoot, "client/src/App.tsx"), "utf8");

const lazyRouteDeclarations = [...appSource.matchAll(/lazy\(\(\) => import\("\.\/pages\//g)].length;
if (lazyRouteDeclarations !== 15) {
  throw new Error(`Expected 15 lazy page declarations in App.tsx; found ${lazyRouteDeclarations}`);
}

const entry = Object.values(manifest).find((record) => record.isEntry);
if (!entry) throw new Error("Vite manifest did not contain an application entry");

const dynamicImports = entry.dynamicImports ?? [];
if (dynamicImports.length !== lazyRouteDeclarations) {
  throw new Error(
    `Expected ${lazyRouteDeclarations} route imports in the Vite entry; found ${dynamicImports.length}`
  );
}

const nonDynamicImports = dynamicImports.filter((key) => !manifest[key]?.isDynamicEntry);
if (nonDynamicImports.length > 0) {
  throw new Error(`Route imports were not emitted as dynamic entries: ${nonDynamicImports.join(", ")}`);
}

const entryPath = path.join(projectRoot, "dist/public", entry.file);
const entryBytes = (await stat(entryPath)).size;
const maximumEntryBytes = 1_200_000;
if (entryBytes > maximumEntryBytes) {
  throw new Error(`Initial entry bundle is ${entryBytes} bytes; limit is ${maximumEntryBytes} bytes`);
}

console.log(JSON.stringify({
  lazyRouteDeclarations,
  dynamicRouteImports: dynamicImports.length,
  emittedDynamicChunks: new Set(dynamicImports.map((key) => manifest[key].file)).size,
  initialEntryFile: entry.file,
  initialEntryBytes: entryBytes,
  previousInitialEntryBytes: 2_037_171,
  reductionBytes: 2_037_171 - entryBytes,
  reductionPercent: Number((((2_037_171 - entryBytes) / 2_037_171) * 100).toFixed(1)),
}, null, 2));
