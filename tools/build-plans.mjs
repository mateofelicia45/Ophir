// Genera los planes de lectura (Fase 13) a partir del canon secular.
// Distribuye los capítulos contiguos de cada plan en tramos lo más parejos
// posible entre los días; un día puede cruzar el límite entre dos libros.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'packages', 'data', 'plans');

const BOOKS = [
  ['gen', 'Génesis', 50],
  ['exo', 'Éxodo', 40],
  ['lev', 'Levítico', 27],
  ['num', 'Números', 36],
  ['deu', 'Deuteronomio', 34],
  ['jos', 'Josué', 24],
  ['jue', 'Jueces', 21],
  ['rut', 'Rut', 4],
  ['1sa', '1 Samuel', 31],
  ['2sa', '2 Samuel', 24],
  ['1ki', '1 Reyes', 22],
  ['2ki', '2 Reyes', 25],
  ['1ch', '1 Crónicas', 29],
  ['2ch', '2 Crónicas', 36],
  ['ezr', 'Esdras', 10],
  ['neh', 'Nehemías', 13],
  ['est', 'Ester', 10],
  ['job', 'Job', 42],
  ['psa', 'Salmos', 150],
  ['pro', 'Proverbios', 31],
  ['ecc', 'Eclesiastés', 12],
  ['sng', 'Cantares', 8],
  ['isa', 'Isaías', 66],
  ['jer', 'Jeremías', 52],
  ['lam', 'Lamentaciones', 5],
  ['ezk', 'Ezequiel', 48],
  ['dan', 'Daniel', 12],
  ['hos', 'Oseas', 14],
  ['jol', 'Joel', 3],
  ['amo', 'Amós', 9],
  ['oba', 'Obadías', 1],
  ['jon', 'Jonás', 4],
  ['mic', 'Miqueas', 7],
  ['nam', 'Nahúm', 3],
  ['hab', 'Habacuc', 3],
  ['zep', 'Sofonías', 3],
  ['hag', 'Hageo', 2],
  ['zec', 'Zacarías', 14],
  ['mal', 'Malaquías', 4],
  ['mat', 'Mateo', 28],
  ['mrk', 'Marcos', 16],
  ['luk', 'Lucas', 24],
  ['jhn', 'Juan', 21],
  ['act', 'Hechos', 28],
  ['rom', 'Romanos', 16],
  ['1co', '1 Corintios', 16],
  ['2co', '2 Corintios', 13],
  ['gal', 'Gálatas', 6],
  ['eph', 'Efesios', 6],
  ['php', 'Filipenses', 4],
  ['col', 'Colosenses', 4],
  ['1th', '1 Tesalonicenses', 5],
  ['2th', '2 Tesalonicenses', 3],
  ['1ti', '1 Timoteo', 6],
  ['2ti', '2 Timoteo', 4],
  ['tit', 'Tito', 3],
  ['phm', 'Filemón', 1],
  ['heb', 'Hebreos', 13],
  ['jas', 'Santiago', 5],
  ['1pe', '1 Pedro', 5],
  ['2pe', '2 Pedro', 3],
  ['1jn', '1 Juan', 5],
  ['2jn', '2 Juan', 1],
  ['3jn', '3 Juan', 1],
  ['jud', 'Judas', 1],
  ['rev', 'Apocalipsis', 22],
];

// Lista plana de {bookId, chapter} por id del plan.
const POOLS = {
  'one-year': BOOKS.map(([bookId, , chapters]) =>
    Array.from({ length: chapters }, (_, i) => ({ bookId, chapter: i + 1 }))
  ).flat(),
  'nt-90': BOOKS.filter(([id]) =>
      /^(mat|mrk|luk|jhn|act|rom|1co|2co|gal|eph|php|col|1th|2th|1ti|2ti|tit|phm|heb|jas|1pe|2pe|1jn|2jn|3jn|jud|rev)$/.test(id)
    )
    .map(([bookId, , chapters]) =>
      Array.from({ length: chapters }, (_, i) => ({ bookId, chapter: i + 1 }))
    )
    .flat(),
  'pentateuco-60': BOOKS.slice(0, 5)
    .map(([bookId, , chapters]) =>
      Array.from({ length: chapters }, (_, i) => ({ bookId, chapter: i + 1 }))
    )
    .flat(),
  'salmos-30': Array.from({ length: 150 }, (_, i) => ({ bookId: 'psa', chapter: i + 1 })),
};

// Reparte la pila en `days` tramos lo más parejos posible manteniendo el orden.
function partition(pool, days) {
  const n = pool.length;
  const out = [];
  for (let d = 0; d < days; d++) {
    const a = Math.floor((d * n) / days);
    const b = Math.floor(((d + 1) * n) / days);
    out.push(pool.slice(a, b));
  }
  return out;
}

const PLANS = [
  {
    id: 'one-year',
    name: 'La Biblia completa en un año',
    theme: 'secuencial',
    days: 365,
    desc:
      'Los 1.189 capítulos de la Biblia leídos de corrido, desde Génesis hasta Apocalipsis, en un año: unos tres capítulos por día.',
  },
  {
    id: 'nt-90',
    name: 'Nuevo Testamento en 90 días',
    theme: 'secuencial',
    days: 90,
    desc:
      'Los 260 capítulos del Nuevo Testamento en tres meses: dos o tres capítulos diarios a un ritmo sostenido.',
  },
  {
    id: 'pentateuco-60',
    name: 'Pentateuco en 60 días',
    theme: 'secuencial',
    days: 60,
    desc:
      'Génesis, Éxodo, Levítico, Números y Deuteronomio (187 capítulos) en dos meses: la formación del pueblo y del pacto.',
  },
  {
    id: 'salmos-30',
    name: 'Los Salmos en un mes',
    theme: 'poético',
    days: 30,
    desc:
      'Cultivo de oración y alabanza: los 150 salmos distribuidos en cinco por día durante treinta días.',
  },
];

mkdirSync(OUT, { recursive: true });
for (const p of PLANS) {
  const pool = POOLS[p.id];
  const days = partition(pool, p.days);
  const data = {
    id: p.id,
    name: p.name,
    theme: p.theme,
    days: p.days,
    desc: p.desc,
    daily: days.map((refs, i) => ({ d: i + 1, refs })),
  };
  const file = join(OUT, `${p.id}.json`);
  writeFileSync(file, JSON.stringify(data));
  const all = data.daily.flatMap((x) => x.refs).length;
  console.log(`${p.id}: ${data.days} días · ${all} capítulos → ${file}`);
}