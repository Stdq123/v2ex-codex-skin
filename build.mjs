import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL(".", import.meta.url);
const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const userscriptUrl = "https://raw.githubusercontent.com/Stdq123/v2ex-codex-skin/main/dist/v2ex-codex.user.js";
const licenses = await Promise.all(["bootstrap-icons", "inter"].map(name =>
  readFile(new URL(`src/assets/${name}.LICENSE`, root), "utf8"),
));

const metadata = `// ==UserScript==
// @name         V2EX · Codex 桌面皮肤
// @namespace    https://v2ex.com/
// @version      ${pkg.version}
// @description  将 V2EX 的话题列表、节点与帖子页面换成 Codex 工作区风格
// @match        https://v2ex.com/*
// @match        https://*.v2ex.com/*
// @updateURL    ${userscriptUrl}
// @downloadURL  ${userscriptUrl}
// @grant        none
// @run-at       document-start
// ==/UserScript==`;

async function bundle(entry, header) {
  const result = await build({
    absWorkingDir: fileURLToPath(root),
    entryPoints: [entry],
    bundle: true,
    charset: "utf8",
    target: ["chrome120", "firefox121", "safari17"],
    format: "iife",
    write: false,
    loader: { ".css": "text", ".woff2": "dataurl" },
    banner: header ? { js: header } : undefined,
    footer: { js: `/*\nBootstrap Icons\n${licenses[0].trim()}\n\nInter\n${licenses[1].trim()}\n*/` },
  });
  return result.outputFiles[0].text;
}

const [userscript, demo] = await Promise.all([
  bundle("src/live.js", metadata),
  bundle("src/preview.js"),
]);
const dist = new URL("dist/", root);
await mkdir(dist, { recursive: true });
await Promise.all([
  writeFile(new URL("v2ex-codex.user.js", dist), userscript),
  writeFile(new URL("preview.html", dist), `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>V2EX · Codex</title>
</head>
<body>
  <script>${demo.replace(/<\/script/gi, "<\\/script")}</script>
</body>
</html>\n`),
]);
