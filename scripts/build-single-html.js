// scripts/build-single-html.js
// Bundles all ES modules + CSS into a single self-contained HTML file
// using esbuild's IIFE bundling. Output: dist/bidking-helper.html

import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const result = await build({
    entryPoints: [resolve(ROOT, 'ui/app.js')],
    bundle: true,
    format: 'iife',
    write: false,
    target: 'es2020',
  });
  const js = result.outputFiles[0].text;
  const css = await readFile(resolve(ROOT, 'styles.css'), 'utf8');
  const htmlTemplate = await readFile(resolve(ROOT, 'index.html'), 'utf8');

  const inlined = htmlTemplate
    .replace(/<link rel="stylesheet" href="styles\.css">/, `<style>\n${css}\n</style>`)
    .replace(/<script type="module" src="ui\/app\.js"><\/script>/, `<script>\n${js}\n</script>`);

  await mkdir(resolve(ROOT, 'dist'), { recursive: true });
  await writeFile(resolve(ROOT, 'dist/bidking-helper.html'), inlined, 'utf8');
  console.log('Built dist/bidking-helper.html (' + (inlined.length / 1024).toFixed(1) + ' KB)');
}

main().catch((e) => { console.error(e); process.exit(1); });
