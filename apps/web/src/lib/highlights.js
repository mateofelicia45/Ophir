import { load, save } from './storage';
import { syncData } from './sync';

// Resaltados por referencia canónica (independientes de la versión):
// { "rom.8.29": { c: "dorado" }, ... }
let state = load('highlights', {});
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getHighlightMap() {
  return state;
}

export function getHighlight(bookId, chapter, verse) {
  return state[`${bookId}.${chapter}.${verse}`] || null;
}

export function setHighlight(bookId, chapter, verse, hl) {
  const ref = `${bookId}.${chapter}.${verse}`;
  if (hl) state[ref] = hl;
  else delete state[ref];
  save('highlights', state);
  emit();
  syncData().catch(e => console.error("Background sync failed", e));
}

export function countByColor() {
  const counts = {};
  for (const { c } of Object.values(state)) {
    counts[c] = (counts[c] || 0) + 1;
  }
  return counts;
}
