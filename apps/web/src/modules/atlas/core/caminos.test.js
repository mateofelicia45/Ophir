import { describe, it, expect } from 'vitest';
import caminos from '@data/atlas/caminos.json';
import { roadList, roadStats, roadBounds, relatedRoad, fmtDays, fmtKm } from './caminos.js';

const roads = roadList(caminos);
const get = (id) => roads.find((r) => r.id === id);

describe('caminos', () => {
  it('roadList tolera datos vacíos', () => {
    expect(roadList(null)).toEqual([]);
    expect(roadList({})).toEqual([]);
    expect(roads).toHaveLength(5);
  });

  it('el camino por Samaria es más corto que el del Jordán', () => {
    const s = roadStats(get('galilea-judea-samaria'));
    const j = roadStats(get('galilea-judea-jordan'));
    expect(s.km).toBeGreaterThan(90);
    expect(s.km).toBeLessThan(140);
    expect(j.km).toBeGreaterThan(s.km);
    expect(s.days).toBe(Math.ceil(s.km / 30));
    expect(j.days).toBeGreaterThanOrEqual(s.days);
  });

  it('roadBounds envuelve todas las coordenadas', () => {
    const r = get('via-maris');
    const [[w, s], [e, n]] = roadBounds(r);
    expect(r.coords.every(([x, y]) => x >= w && x <= e && y >= s && y <= n)).toBe(true);
  });

  it('relatedRoad devuelve la relación o null', () => {
    expect(relatedRoad(roads, get('galilea-judea-samaria')).id).toBe('galilea-judea-jordan');
    expect(relatedRoad(roads, get('via-maris'))).toBeNull();
    expect(relatedRoad(roads, null)).toBeNull();
  });

  it('formatos en español', () => {
    expect(fmtDays(1)).toBe('1 día');
    expect(fmtDays(4)).toBe('4 días');
    expect(fmtKm(1234)).toBe('1.234 km');
    expect(fmtKm(98)).toBe('98 km');
  });
});
