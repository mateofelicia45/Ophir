// Registro de diccionarios bíblicos e índices temáticos.
// Diccionarios: packages/data/dictionaries/<id>.json  (entradas: nombre -> [defs])
// Temáticos:    packages/data/naves/<id>.json         (topics: [{slug,name,sub}])
const DICT_FILES = import.meta.glob('@data/dictionaries/*.json');
const TOPIC_FILES = import.meta.glob('@data/naves/*.json');

export const DICTIONARIES = [
  {
    id: 'easton',
    abbr: 'Easton',
    name: "Easton's Bible Dictionary",
    lang: 'en',
  },
  {
    id: 'smith',
    abbr: 'Smith',
    name: "Smith's Bible Dictionary",
    lang: 'en',
  },
];

export const TOPICAL_SOURCES = [
  {
    id: 'naves',
    abbr: 'Nave',
    name: "Nave's Topical Bible",
    lang: 'en',
  },
];

const cache = new Map();

export async function loadDictionary(id) {
  if (cache.has(id)) return cache.get(id);
  const path = Object.keys(DICT_FILES).find((k) => k.endsWith(`/${id}.json`));
  if (!path) return null;
  const mod = await DICT_FILES[path]();
  cache.set(id, mod.default);
  return mod.default;
}

export async function loadTopics(id) {
  const key = `topics:${id}`;
  if (cache.has(key)) return cache.get(key);
  const path = Object.keys(TOPIC_FILES).find((k) => k.endsWith(`/${id}.json`));
  if (!path) return null;
  const mod = await TOPIC_FILES[path]();
  cache.set(key, mod.default);
  return mod.default;
}
