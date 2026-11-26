// Genera la geografía base local (sin red) del mapa de /atlas.
// Uso (desde la raíz del repo): node tools/build-basemap.mjs
// Fuentes: Natural Earth 10m vía world-atlas (tierra, fronteras) y OpenBible
// (lagos y ríos, desde packages/data/atlas/places.json).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { feature, mesh } = require('topojson-client');
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-10m.json'), 'utf8'));
const root = fileURLToPath(new URL('..', import.meta.url));
const places = JSON.parse(readFileSync(root + 'packages/data/atlas/places.json', 'utf8')).places;
const outDir = root + 'packages/data/atlas/basemap/';

const [W, E] = [-12, 65];
const [S, N] = [10, 48];
const r3 = (v) => Math.round(v * 1000) / 1000;

// --- Recorte de polígonos: Sutherland–Hodgman contra el rectángulo ---
const edges = [
  { inside: (p) => p[0] >= W, cut: (a, b) => [W, a[1] + ((b[1] - a[1]) * (W - a[0])) / (b[0] - a[0])] },
  { inside: (p) => p[0] <= E, cut: (a, b) => [E, a[1] + ((b[1] - a[1]) * (E - a[0])) / (b[0] - a[0])] },
  { inside: (p) => p[1] >= S, cut: (a, b) => [a[0] + ((b[0] - a[0]) * (S - a[1])) / (b[1] - a[1]), S] },
  { inside: (p) => p[1] <= N, cut: (a, b) => [a[0] + ((b[0] - a[0]) * (N - a[1])) / (b[1] - a[1]), N] },
];

function clipRing(ring) {
  let pts = ring.slice(0, -1); // sin el punto de cierre repetido
  for (const e of edges) {
    if (!pts.length) break;
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const cur = pts[i];
      const prev = pts[(i + pts.length - 1) % pts.length];
      const ci = e.inside(cur);
      const pi = e.inside(prev);
      if (ci) {
        if (!pi) out.push(e.cut(prev, cur));
        out.push(cur);
      } else if (pi) out.push(e.cut(prev, cur));
    }
    pts = out;
  }
  const rounded = [];
  for (const p of pts) {
    const q = [r3(p[0]), r3(p[1])];
    const l = rounded[rounded.length - 1];
    if (!l || l[0] !== q[0] || l[1] !== q[1]) rounded.push(q);
  }
  const f = rounded[0], l = rounded[rounded.length - 1];
  if (rounded.length > 1 && f[0] === l[0] && f[1] === l[1]) rounded.pop();
  if (rounded.length < 3) return null;
  return [...rounded, rounded[0]];
}

function clipPolygon(rings) {
  const outer = clipRing(rings[0]);
  if (!outer) return null;
  const holes = rings.slice(1).map(clipRing).filter(Boolean);
  return [outer, ...holes];
}

// --- Recorte de líneas: Liang–Barsky por segmento, partiendo en tramos ---
function clipSegment(a, b) {
  let t0 = 0, t1 = 1;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  for (const [p, q] of [[-dx, a[0] - W], [dx, E - a[0]], [-dy, a[1] - S], [dy, N - a[1]]]) {
    if (p === 0) { if (q < 0) return null; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return null; if (t > t0) t0 = t; }
    else { if (t < t0) return null; if (t < t1) t1 = t; }
  }
  return [[a[0] + t0 * dx, a[1] + t0 * dy], [a[0] + t1 * dx, a[1] + t1 * dy]];
}

function clipLine(line) {
  const parts = [];
  let cur = null;
  for (let i = 0; i < line.length - 1; i++) {
    const s = clipSegment(line[i], line[i + 1]);
    if (!s) { cur = null; continue; }
    const [p, q] = s.map((v) => [r3(v[0]), r3(v[1])]);
    const startsNew = !cur || cur[cur.length - 1][0] !== p[0] || cur[cur.length - 1][1] !== p[1];
    if (startsNew) { cur = [p]; parts.push(cur); }
    const l = cur[cur.length - 1];
    if (l[0] !== q[0] || l[1] !== q[1]) cur.push(q);
  }
  return parts.filter((p) => p.length >= 2);
}

function clipGeometry(geom) {
  if (!geom) return null;
  if (geom.type === 'Polygon') {
    const p = clipPolygon(geom.coordinates);
    return p && { type: 'Polygon', coordinates: p };
  }
  if (geom.type === 'MultiPolygon') {
    const ps = geom.coordinates.map(clipPolygon).filter(Boolean);
    return ps.length ? { type: 'MultiPolygon', coordinates: ps } : null;
  }
  if (geom.type === 'LineString' || geom.type === 'MultiLineString') {
    const lines = geom.type === 'LineString' ? [geom.coordinates] : geom.coordinates;
    const parts = lines.flatMap(clipLine);
    if (!parts.length) return null;
    return parts.length === 1 ? { type: 'LineString', coordinates: parts[0] } : { type: 'MultiLineString', coordinates: parts };
  }
  return null;
}

const fc = (features) => ({ type: 'FeatureCollection', features });
const feat = (geometry, properties = {}) => ({ type: 'Feature', properties, geometry });
const flatFeatures = (obj) => (obj.type === 'FeatureCollection' ? obj.features : [obj]);

// --- tierra y fronteras ---
const land = fc(flatFeatures(feature(topo, topo.objects.land)).map((f) => feat(clipGeometry(f.geometry))).filter((f) => f.geometry));
const borders = fc([feat(clipGeometry(mesh(topo, topo.objects.countries, (a, b) => a !== b)))].filter((f) => f.geometry));

// --- lagos: polígonos de OpenBible ---
const byId = (id) => places.find((p) => p.id === id);
const lakeDefs = [
  { name: 'Mar Muerto', id: 'salt-sea', idx: 0 }, // OpenBible: «Salt Sea» (alt. Dead Sea)
  { name: 'Mar de Galilea', id: 'sea-of-galilee', idx: 0 },
  // «Bitter Lakes» no tiene ficha propia: es el primer polígono de Red Sea 1
  // (el que cubre 32,30–32,57 E, 30,16–30,41 N; coincide con el punto «Bitter Lakes»).
  { name: 'Lagos Amargos', id: 'red-sea-1', idx: 0 },
];
const lakes = fc(
  lakeDefs.map(({ name, id, idx }) => {
    const ring = byId(id).g[idx].c;
    const closed = ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring : [...ring, ring[0]];
    return feat(clipGeometry({ type: 'Polygon', coordinates: [closed] }), { name });
  }),
);

// --- ríos: líneas de OpenBible (sin Gihon ni Pishon, son especulativos) ---
const riverDefs = [
  ['Jordan', 'Jordán'], ['Nile', 'Nilo'], ['Euphrates', 'Éufrates'], ['Tigris', 'Tigris'],
  ['Arnon', 'Arnón'], ['Jabbok', 'Jaboc'], ['Kishon', 'Cisón'], ['Zered', 'Zered'],
  ['Kidron', 'Cedrón'], ['Abana', 'Abana'], ['Pharpar', 'Farfar'], ['Chebar', 'Quebar'],
  ['Habor', 'Habor'], ['Ulai', 'Ulai'], ['Besor', 'Besor'], ['Me-jarkon', 'Yarcón'],
  ['Brook of Egypt', 'Torrente de Egipto'],
];
const skipped = [];
const riverFeatures = [];
for (const [en, es] of riverDefs) {
  const p = places.find((x) => x.n === en && x.t === 'rio');
  if (!p || !p.l?.length) { skipped.push(en); continue; }
  const g = clipGeometry({ type: 'MultiLineString', coordinates: p.l.map((l) => l.c) });
  if (g) riverFeatures.push(feat(g, { name: es }));
  else skipped.push(en);
}
const rivers = fc(riverFeatures);

mkdirSync(outDir, { recursive: true });
for (const [name, data] of Object.entries({ land, borders, lakes, rivers })) {
  const s = JSON.stringify(data);
  writeFileSync(outDir + name + '.json', s);
  console.log(`${name}.json  ${s.length} B  gzip ${gzipSync(s).length} B  (${data.features.length} features)`);
}
if (skipped.length) console.log('Sin líneas, omitidos:', skipped.join(', '));
