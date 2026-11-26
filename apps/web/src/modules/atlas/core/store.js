const KEY = 'ophir.atlas.v1';
const MAX_HISTORY = 30;

const defaults = () => ({
  v: 1, theme: 'dark', favorites: [], pending: [], notes: {}, history: [], layers: {}, extras: {},
});

const capped = (s) => (Array.isArray(s.history) && s.history.length > MAX_HISTORY
  ? { ...s, history: s.history.slice(0, MAX_HISTORY) }
  : s);

export function loadStore() {
  const base = defaults();
  try {
    const raw = globalThis.localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || saved.v !== 1) return base;
    return capped({ ...base, ...saved });
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
