// Genera apps/web/src/modules/atlas/core/legacyIds.js: mapa de los ids del atlas
// viejo (packages/data/atlas/locations.json) a los ids de la base nueva.
// Uso (desde la raíz del repo): node tools/build-legacy-ids.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildAtlasDb } from '../apps/web/src/modules/atlas/core/db.js';
import { norm } from '../apps/web/src/modules/atlas/core/text.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const rd = (f) => JSON.parse(readFileSync(root + 'packages/data/atlas/' + f, 'utf8'));
const db = buildAtlasDb({ places: rd('places.json'), fichas: rd('fichas.json'), historia: rd('historia.json') });
const old = rd('locations.json');
const MAX_KM = 15;

function km(aLat, aLon, bLat, bLon) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad, dLon = (bLon - aLon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const byName = new Map();
db.places.forEach((p) => {
  [p.name, p.ob, ...p.alt].forEach((n) => {
    const k = norm(n);
    if (!k) return;
    if (!byName.has(k)) byName.set(k, new Set());
    byName.get(k).add(p);
  });
});

const dist = (o, p) => (p.hasPos ? km(o.latitude, o.longitude, p.lat, p.lon) : Infinity);
const map = {};
const unmatched = [];
for (const o of old) {
  let found = null;
  if (db.byId.has(o.id)) found = db.byId.get(o.id);
  if (!found) {
    const cands = [...(byName.get(norm(o.name)) || [])];
    if (cands.length === 1) found = cands[0];
    else if (cands.length > 1) {
      const best = cands.map((p) => [p, dist(o, p)]).sort((a, b) => a[1] - b[1])[0];
      if (best[1] <= MAX_KM) found = best[0];
    }
  }
  if (!found) {
    let best = [null, Infinity];
    for (const p of db.places) {
      const d = dist(o, p);
      if (d < best[1]) best = [p, d];
    }
    if (best[1] <= MAX_KM) found = best[0];
  }
  if (found) map[o.id] = found.id;
  else unmatched.push(`${o.id} (${o.name})`);
}

const body = Object.entries(map).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n');
writeFileSync(
  root + 'apps/web/src/modules/atlas/core/legacyIds.js',
  `// Generado por tools/build-legacy-ids.mjs. No editar a mano.\nexport const LEGACY_IDS = {\n${body}\n};\n`
);
console.log(`mapeados: ${Object.keys(map).length} de ${old.length}`);
console.log('sin match:', unmatched.length ? '\n' + unmatched.join('\n') : 'ninguno');
