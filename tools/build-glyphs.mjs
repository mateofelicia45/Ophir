// Genera las tipografías del mapa de /atlas como glifos PBF (SDF) locales, para
// que MapLibre dibuje los nombres sin depender de un servidor de glifos.
// Uso (desde la raíz del repo): node tools/build-glyphs.mjs
// Fuentes: @fontsource/source-serif-4 y @fontsource/ibm-plex-sans (OFL 1.1).
// Salida: apps/web/public/glyphs/{fontstack}/{inicio}-{fin}.pbf
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
// El paquete solo exporta ESM: se resuelve a mano desde apps/web/node_modules.
const pkgDir = fileURLToPath(new URL('../apps/web/node_modules/maplibre-font-maker-node/', import.meta.url));
const { generateGlyphPbfFiles, range256 } = await import(pathToFileURL(join(pkgDir, 'dist/index.js')).href);

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(root, 'apps/web/public/glyphs');

const file = (pkg, name) => require.resolve(`@fontsource/${pkg}/files/${name}`);
// Cada familia de Fontsource viene partida por subconjunto: se combinan latin y
// latin-ext (el generador toma cada glifo del primer archivo que lo tenga).
const faces = (pkg, slug, style) => ['latin', 'latin-ext'].map((sub) => ({
  name: `${slug}-${sub}-${style}`,
  bytes: readFileSync(file(pkg, `${slug}-${sub}-${style}.woff2`)),
}));

const STACKS = [
  { fontstack: 'Source Serif 4 Regular', fonts: faces('source-serif-4', 'source-serif-4', '400-normal') },
  { fontstack: 'Source Serif 4 Italic', fonts: faces('source-serif-4', 'source-serif-4', '400-italic') },
  { fontstack: 'Source Serif 4 Semibold', fonts: faces('source-serif-4', 'source-serif-4', '600-normal') },
  { fontstack: 'Source Serif 4 Semibold Italic', fonts: faces('source-serif-4', 'source-serif-4', '600-italic') },
  { fontstack: 'IBM Plex Sans Regular', fonts: faces('ibm-plex-sans', 'ibm-plex-sans', '400-normal') },
  { fontstack: 'IBM Plex Sans Medium', fonts: faces('ibm-plex-sans', 'ibm-plex-sans', '500-normal') },
];
// Latín básico + Latín-1 (0-255), Latín extendido A/B (256-511): acentos del
// español y transliteraciones; y puntuación general (8192-8447): ’ “ ” – — …
const RANGES = [range256(0), range256(256), range256(8192)];

let total = 0;
for (const s of STACKS) {
  const dir = join(outDir, s.fontstack);
  rmSync(dir, { recursive: true, force: true });
  const files = await generateGlyphPbfFiles({ fontstack: s.fontstack, fonts: s.fonts, ranges: RANGES });
  for (const f of files) {
    const dest = join(outDir, f.filename);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, f.bytes);
    total += f.bytes.length;
  }
  console.log(`${s.fontstack}: ${files.length} archivos`);
}
console.log(`Total: ${(total / 1024).toFixed(1)} KB en ${outDir}`);
