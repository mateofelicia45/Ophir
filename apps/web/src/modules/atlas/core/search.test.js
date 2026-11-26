import { describe, it, expect } from 'vitest';
import places from '@data/atlas/places.json';
import fichas from '@data/atlas/fichas.json';
import historia from '@data/atlas/historia.json';
import { buildAtlasDb } from './db.js';
import { searchAtlas } from './search.js';
import { placesForChapter } from './filter.js';

const db = buildAtlasDb({ places, fichas, historia });

describe('searchAtlas', () => {
  it('jerusalen sin acento encuentra Jerusalén primero', () => {
    expect(searchAtlas(db, 'jerusalen')[0].label).toBe('Jerusalén');
  });
  it('grafía inglesa Philippi encuentra Filipos', () => {
    expect(searchAtlas(db, 'Philippi').map((r) => r.label)).toContain('Filipos');
  });
  it('hch 16 es un Pasaje y el capítulo incluye Filipos y Troas', () => {
    expect(searchAtlas(db, 'hch 16')[0].kind).toBe('Pasaje');
    const names = placesForChapter(db, 43, 16).map((p) => p.name);
    expect(names).toContain('Filipos');
    expect(names).toContain('Troas');
  });
  it('Pablo incluye Personaje y el recorrido pablo2', () => {
    const r = searchAtlas(db, 'Pablo');
    expect(r.some((x) => x.kind === 'Personaje')).toBe(true);
    expect(r.some((x) => x.kind === 'Recorrido' && x.action.id === 'pablo2')).toBe(true);
  });
  it('consulta vacía no devuelve nada', () => {
    expect(searchAtlas(db, '  ')).toEqual([]);
  });
});
