// Registro de devocionales de dominio público.
const FILES = import.meta.glob('@data/devotional/*.json');

export const DEVOTIONALS = [
  {
    id: 'spurgeon',
    abbr: 'Spurgeon',
    name: 'C. H. Spurgeon — Mañana y Noche',
    lang: 'en',
  },
];

const cache = new Map();

export async function loadDevotional(id) {
  if (cache.has(id)) return cache.get(id);
  const path = Object.keys(FILES).find((k) => k.endsWith(`/${id}.json`));
  if (!path) return null;
  const mod = await FILES[path]();
  cache.set(id, mod.default);
  return mod.default;
}