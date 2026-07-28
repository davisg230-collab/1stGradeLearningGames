import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const clientDir = path.join(root, "dist", "client");
const outputDir = path.join(root, "firebase-public");
const workerPath = path.join(root, "dist", "server", "index.js");

const routes = [
  { path: "/", file: "index.html" },
  { path: "/skills", file: "skills.html" },
  { path: "/math", file: "math.html" },
];

async function renderRoute(worker, routePath) {
  const response = await worker.fetch(
    new Request(`https://firstgradelearninggames.web.app${routePath}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      passThroughOnException() {},
      waitUntil() {},
    },
  );

  if (!response.ok) {
    throw new Error(`Could not render ${routePath}: ${response.status}`);
  }

  return response.text();
}

await rm(outputDir, { force: true, recursive: true });
await mkdir(outputDir, { recursive: true });
await cp(clientDir, outputDir, { recursive: true });

const { default: worker } = await import(
  `${pathToFileURL(workerPath).href}?firebase=${Date.now()}`
);

for (const route of routes) {
  const html = await renderRoute(worker, route.path);
  await writeFile(path.join(outputDir, route.file), html);
}

await writeFile(
  path.join(outputDir, "404.html"),
  await renderRoute(worker, "/"),
);

console.log(`Exported ${routes.length} routes to ${outputDir}`);
