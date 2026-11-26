// Registro de comentarios bíblicos de dominio público.
// Un archivo JSON por libro en packages/data/commentaries/<id>/<book>.json
const FILES = {
  mhc: import.meta.glob('@data/commentaries/mhc/*.json'),
};

export const COMMENTARIES = [
  { id: 'mhc', abbr: 'MH', name: 'Matthew Henry — Completa', lang: 'en' },
];

const cache = new Map();

// Devuelve el JSON del libro pedido, o null si no existe.
export async function loadCommentaryBook(id, bookId) {
  const key = `${id}/${bookId}`;
  if (cache.has(key)) return cache.get(key);
  const mods = FILES[id];
  if (!mods) return null;
  const path = Object.keys(mods).find((k) => k.endsWith(`/${bookId}.json`));
  if (!path) return null;
  const mod = await mods[path]();
  cache.set(key, mod.default);
  return mod.default;
}
