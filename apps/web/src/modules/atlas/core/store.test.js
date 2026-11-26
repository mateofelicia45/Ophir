import { describe, it, expect, afterEach } from 'vitest';
import { loadStore, saveStore } from './store.js';

const KEY = 'ophir.atlas.v1';
const orig = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
function stub(obj) {
  Object.defineProperty(globalThis, 'localStorage', { value: obj, configurable: true, writable: true });
}
function mem(initial = {}) {
  const m = { ...initial };
  return {
    data: m,
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
  };
}
const DEF = { v: 1, theme: 'dark', favorites: [], pending: [], notes: {}, history: [], layers: {}, extras: {} };

afterEach(() => {
  if (orig) Object.defineProperty(globalThis, 'localStorage', orig);
  else delete globalThis.localStorage;
});

describe('store', () => {
  it('sin datos: valores por defecto', () => {
    stub(mem());
    expect(loadStore()).toEqual(DEF);
  });
  it('sin localStorage: valores por defecto', () => {
    delete globalThis.localStorage;
    expect(loadStore()).toEqual(DEF);
  });
  it('localStorage que lanza: defaults y saveStore no lanza', () => {
    stub({ getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } });
    expect(loadStore()).toEqual(DEF);
    expect(() => saveStore({ ...DEF })).not.toThrow();
  });
  it('ida y vuelta y mezcla sobre defaults', () => {
    const ls = mem({ [KEY]: JSON.stringify({ v: 1, theme: 'light', favorites: ['a'] }) });
    stub(ls);
    const s = loadStore();
    expect(s.theme).toBe('light');
    expect(s.favorites).toEqual(['a']);
    expect(s.notes).toEqual({});
    saveStore({ ...s, pending: ['z'] });
    expect(loadStore().pending).toEqual(['z']);
  });
  it('JSON corrupto o v distinta: defaults', () => {
    stub(mem({ [KEY]: '{no json' }));
    expect(loadStore()).toEqual(DEF);
    stub(mem({ [KEY]: JSON.stringify({ v: 2, theme: 'light' }) }));
    expect(loadStore()).toEqual(DEF);
  });
  it('history nunca supera 30', () => {
    const h = Array.from({ length: 50 }, (_, i) => 'p' + i);
    const ls = mem({ [KEY]: JSON.stringify({ v: 1, history: h }) });
    stub(ls);
    const s = loadStore();
    expect(s.history).toHaveLength(30);
    expect(s.history[0]).toBe('p0');
    saveStore({ ...DEF, history: h });
    expect(JSON.parse(ls.data[KEY]).history).toHaveLength(30);
  });
  it('campos con tipo equivocado: se conserva el valor por defecto', () => {
    stub(mem({ [KEY]: JSON.stringify({
      v: 1, theme: 'pink', favorites: 'x', pending: null, notes: null, history: 5, layers: [1], extras: 'no',
    }) }));
    expect(loadStore()).toEqual(DEF);
    stub(mem({ [KEY]: JSON.stringify({ v: 1, favorites: ['a', 3, null], notes: { p: 'ok', q: 7 }, layers: { a: true, b: 'x' }, theme: 'light' }) }));
    const s = loadStore();
    expect(s.favorites).toEqual(['a']);
    expect(s.notes).toEqual({ p: 'ok' });
    expect(s.layers).toEqual({ a: true });
    expect(s.theme).toBe('light');
  });
});
