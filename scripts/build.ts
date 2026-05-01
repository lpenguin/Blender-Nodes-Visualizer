import { build } from "bun";
import { readFileSync, writeFileSync } from "node:fs";

const outdir = "dist";

await build({
  entrypoints: ["./src/index.tsx"],
  outdir,
  target: "browser",
  minify: true,
  sourcemap: "external",
});

const html = readFileSync("index.html", "utf-8")
  .replace(
    /<script type="module" src="\.\/src\/index\.tsx"><\/script>/,
    '<script type="module" src="./index.js"></script>'
  )
  .replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/, "")
  .replace(
    '<link rel="stylesheet" href="/index.css">',
    '<style>body{margin:0}</style>'
  );
writeFileSync(`${outdir}/index.html`, html);
