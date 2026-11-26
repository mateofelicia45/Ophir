import { describe, it, expect } from 'vitest';
import places from '@data/atlas/places.json';
import fichas from '@data/atlas/fichas.json';
import historia from '@data/atlas/historia.json';
import { buildAtlasDb } from './db.js';
import { filterPlaces, routesForChapter } from './filter.js';

const db = buildAtlasDb({ places, fichas, historia });
const base = { testament: '', book: null, periodId: '', types: new Set(), focus: null };

describe('filterPlaces', () => {
  it('NT no devuelve Ur', () => {
    const r = filterPlaces(db, { ...base, testament: 'NT' });
    expect(r.length).toBeGreaterThan(0);
    expect(r.some((p) => p.ob === 'Ur')).toBe(false);
  });
  it('ordena por importancia', () => {
    const r = filterPlaces(db, base);
    for (let i = 1; i < r.length; i++) expect(r[i].importance).toBeGreaterThanOrEqual(r[i - 1].importance);
  });
  it('focus limita a los ids', () => {
    const j = db.byOb.get('Jerusalem');
    const r = filterPlaces(db, { ...base, focus: { placeIds: new Set([j.id]) } });
    expect(r.map((p) => p.id)).toEqual([j.id]);
  });
});

describe('routesForChapter', () => {
  it('Juan 4 incluye jesus', () => {
    expect(routesForChapter(db, 42, 4).map((r) => r.id)).toContain('jesus');
  });
});
