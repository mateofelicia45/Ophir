const KEY = 'ophir.atlas.v1';
const MAX_HISTORY = 30;

const defaults = () => ({
  v: 1, theme: 'dark', favorites: [], pending: [], notes: {}, history: [], layers: {}, extras: {},
});

const capped = (s) => (Array.isArray(s.history) && s.history.length > MAX_HISTORY
  ? { ...s, history: s.history.slice(0, MAX_HISTORY) }
  : s);

const isRecord = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const strings = (x) => x.filter((e) => typeof e === 'string');
const boolRecord = (x) => Object.fromEntries(Object.entries(x).filter(([, v]) => typeof v === 'boolean'));
const noteRecord = (x) => Object.fromEntries(Object.entries(x).filter(([, v]) => typeof v === 'string'));

// Valida campo por campo: un valor de tipo equivocado se descarta y queda el de por defecto.
function sanitize(saved, base) {
  const out = { ...base };
  if (saved.theme === 'dark' || saved.theme === 'light') out.theme = saved.theme;
  ['favorites', 'pending', 'history'].forEach((k) => {
    if (Array.isArray(saved[k])) out[k] = strings(saved[k]);
  });
  if (isRecord(saved.notes)) out.notes = noteRecord(saved.notes);
  ['layers', 'extras'].forEach((k) => {
    if (isRecord(saved[k])) out[k] = boolRecord(saved[k]);
  });
  return out;
}

export function loadStore() {
  const base = defaults();
  try {
    const raw = globalThis.localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    if (!isRecord(saved) || saved.v !== 1) return base;
    return capped(sanitize(saved, base));
  } catch {
    return base;
  }
}

export function saveStore(s) {
  try {
    globalThis.localStorage.setItem(KEY, JSON.stringify(capped(s)));
  } catch {
    /* sin almacenamiento: se ignora */
  }
}
