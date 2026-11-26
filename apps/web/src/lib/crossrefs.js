import { findBook } from './references.js';

// Tipos de arista según DESIGN.md: cita directa, alusión temática,
// tipología, contraste doctrinal y eco litúrgico. Las aristas masivas
// de OpenBible no están tipificadas y se muestran como «Referencia».
export const REF_TYPES = [
  { id: 'cita_directa', label: 'Cita directa', color: '#e0be62' },
  { id: 'alusion', label: 'Alusión temática', color: '#6fb8e0' },
  { id: 'tipologia', label: 'Tipología', color: '#e07ba0' },
  { id: 'contraste', label: 'Contraste / tensión', color: '#cd5c5c' },
  { id: 'eco', label: 'Eco litúrgico', color: '#6fae5f' },
];

const TYPE_BY_ID = new Map(REF_TYPES.map((t) => [t.id, t]));

export function typeMeta(id) {
  return (
    TYPE_BY_ID.get(id) || { id, label: 'Referencia', color: '#7f95ad' }
  );
}

let baseIndex = null;
let typedIndex = null;

async function ensureLoaded() {
  if (baseIndex && typedIndex) return;
  const [baseMod, typedMod] = await Promise.all([
    import('@data/crossrefs/openbible.json'),
    import('@data/crossrefs/typed.json'),
  ]);

  // Índice bidireccional: A↔B se consulta desde cualquiera de los extremos.
  const base = new Map();
  for (const [f, t, votes] of baseMod.default.refs) {
    if (!base.has(f)) base.set(f, []);
    base.get(f).push({ to: t, votes });
    if (!base.has(t)) base.set(t, []);
    base.get(t).push({ to: f, votes });
  }

  const typed = new Map();
  for (const e of typedMod.default.edges) {
    if (!typed.has(e.f)) typed.set(e.f, []);
    typed.get(e.f).push({ to: e.t, type: e.type, note: e.note });
    if (!typed.has(e.t)) typed.set(e.t, []);
    typed.get(e.t).push({ to: e.f, type: e.type, note: e.note });
  }

  baseIndex = base;
  typedIndex = typed;
}

export async function loadCrossrefs() {
  await ensureLoaded();
}

// Conexiones para uno o varios nodos (ej. todos los versículos de un
// capítulo). Tipificadas primero; el resto ordenado por votos. Si una
// arista existe en ambas capas, conserva el tipo y suma los votos.
export function connectionsMulti(keys) {
  if (!baseIndex || !typedIndex) return [];
  const self = new Set(keys);
  const map = new Map();

  const consider = (to, extra) => {
    if (self.has(to)) return;
    let entry = map.get(to);
    if (!entry) {
      entry = { to };
      map.set(to, entry);
    }
    if (extra.type && !entry.type) {
      entry.type = extra.type;
      entry.note = extra.note;
    }
    if ((extra.votes ?? -1) > (entry.votes ?? -1)) {
      entry.votes = extra.votes;
    }
  };

  for (const k of keys) {
    for (const e of typedIndex.get(k) || []) {
      consider(e.to, { type: e.type, note: e.note });
    }
  }
  for (const k of keys) {
    for (const e of baseIndex.get(k) || []) {
      consider(e.to, { votes: e.votes });
    }
  }

  return [...map.values()].sort(
    (a, b) =>
      (b.type ? 1 : 0) - (a.type ? 1 : 0) || (b.votes || 0) - (a.votes || 0)
  );
}

export function connections(key) {
  return connectionsMulti([key]);
}

export function keyOf(bookId, chapter, verse) {
  return `${bookId}.${chapter}.${verse}`;
}

export function parseKey(key) {
  const m = String(key).match(/^([a-z0-9]+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  const book = findBook(m[1]);
  if (!book) return null;
  return { book, chapter: Number(m[2]), verse: Number(m[3]) };
}
