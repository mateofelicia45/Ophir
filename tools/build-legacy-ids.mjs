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
// Un match por nombre solo vale si el lugar nuevo queda a <= MAX_KM de las
// coordenadas viejas. No hay fallback por cercanía sola: era la fuente de
// falsos positivos (ej. babilonia -> addon).
const MAX_KM = 50;

// Casos revisados a mano: id viejo -> id nuevo. Se aceptan aunque las
// coordenadas viejas estén lejos (el test los exime del límite de distancia).
const OVERRIDES = {
  babilonia: 'babylon-1',
  'egipto-tierra': 'egypt',
  succoth: 'succoth-1',
  gilgal: 'gilgal-1',
  'templo-jerusalen': 'jerusalem',
  'puerta-oro': 'jerusalem',
  'valle-cedron': 'kidron',
  peniel: 'penuel',
  hiba: 'hobah',
  arbel: 'arbela',
  etiopia: 'ethiopia',
  samaria: 'samaria-1',
  cesarea: 'caesarea',
  jerico: 'jericho-1',
  'mar-muerto': 'salt-sea',
  jezreel: 'jezreel-2',
  etam: 'etam-2',
  filadelfia: 'philadelphia',
  'pi-hahirot': 'pi-hahiroth',
  'etion-geber': 'ezion-geber',
  mara: 'marah',
  galacia: 'galatia',
  'manantial-gihon': 'gihon-2',
  'egipto-arroyo-egipto': 'brook-of-egypt',
  'bosra-edom': 'bozrah-1',
  petra: 'sela-1',
  'el-profeta': 'mount-tabor',
  'dan-springs': 'dan',
};

// Ids viejos sin equivalente razonable en la base nueva: se omiten.
const DENY = new Set(['judah', 'masada', 'elusa', 'encampo', 'bosor', 'eden-jardin', 'lo-debar', 'bosra', 'arbela', 'uz', 'amasia', 'pella', 'persepolis']);

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
  if (DENY.has(o.id)) { unmatched.push(`${o.id} (${o.name}) [denegado]`); continue; }
  let found = null;
  if (OVERRIDES[o.id]) {
    found = db.byId.get(OVERRIDES[o.id]);
    if (!found) throw new Error(`override inexistente: ${o.id} -> ${OVERRIDES[o.id]}`);
  } else {
    // Nombre completo, o con el paréntesis quitado / su contenido como alias
    // (ej. «Jope (Jaffa)» -> «Jope», «Jaffa»).
    const names = [o.name, o.name.replace(/\s*\(.*\)\s*/, ''), (o.name.match(/\(([^)]*)\)/) || [])[1]]
      .filter(Boolean).map(norm);
    const cands = new Set();
    names.forEach((n) => (byName.get(n) || new Set()).forEach((p) => cands.add(p)));
    // Un id viejo que ya es id nuevo tiene prioridad sobre otros candidatos.
    const same = db.byId.get(o.id);
    if (same && dist(o, same) <= MAX_KM) found = same;
    else {
      const best = [...cands].map((p) => [p, dist(o, p)]).sort((x, y) => x[1] - y[1])[0];
      if (best && best[1] <= MAX_KM) found = best[0];
    }
  }
  if (found) map[o.id] = found.id;
  else unmatched.push(`${o.id} (${o.name})`);
}

const body = Object.entries(map).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n');
writeFileSync(
  root + 'apps/web/src/modules/atlas/core/legacyIds.js',
  `// Generado por tools/build-legacy-ids.mjs. No editar a mano.\nexport const LEGACY_IDS = {\n${body}\n};\n\n// Ids viejos mapeados a mano (exentos del límite de distancia en los tests).\nexport const LEGACY_OVERRIDES = ${JSON.stringify(Object.keys(OVERRIDES))};\n`
);
console.log(`mapeados: ${Object.keys(map).length} de ${old.length}`);
console.log('sin match:', unmatched.length ? '\n' + unmatched.join('\n') : 'ninguno');
