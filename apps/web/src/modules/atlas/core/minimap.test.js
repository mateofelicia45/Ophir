import { describe, it, expect } from 'vitest';
import land from '@data/atlas/basemap/land.json';
import { MINI, toMini, fromMini, simplify, landPath, viewRect } from './minimap.js';

describe('minimapa', () => {
  it('toMini y fromMini son inversas', () => {
    const [x, y] = toMini([35.2, 31.8]);
    const [lon, lat] = fromMini(x, y);
    expect(lon).toBeCloseTo(35.2, 6);
    expect(lat).toBeCloseTo(31.8, 6);
  });

  it('las esquinas del área son las esquinas del dibujo', () => {
    expect(toMini([MINI.extent.w, MINI.extent.n])).toEqual([0, 0]);
    const [x, y] = toMini([MINI.extent.e, MINI.extent.s]);
    expect(x).toBeCloseTo(MINI.w, 6);
    expect(y).toBeCloseTo(MINI.h, 6);
  });

  it('simplify conserva los extremos y quita puntos alineados', () => {
    const out = simplify([[0, 0], [1, 0.001], [2, 0], [3, 2], [4, 0]], 0.05);
    expect(out[0]).toEqual([0, 0]);
    expect(out[out.length - 1]).toEqual([4, 0]);
    expect(out).toHaveLength(4);
  });

  it('landPath dibuja la tierra del área con pocos puntos', () => {
    const d = landPath(land);
    expect(d.startsWith('M')).toBe(true);
    expect(d.length).toBeGreaterThan(500);
    expect(d.length).toBeLessThan(40000);
  });

  it('viewRect queda dentro del dibujo y nunca es nulo', () => {
    const r = viewRect([[34, 30], [36, 33]]);
    expect(r.x).toBeGreaterThan(0);
    expect(r.x + r.w).toBeLessThanOrEqual(MINI.w);
    expect(r.w).toBeGreaterThan(0);
    const out = viewRect([[-12, 10], [65, 48]]);
    expect(out).toEqual({ x: 0, y: 0, w: MINI.w, h: MINI.h });
  });
});
