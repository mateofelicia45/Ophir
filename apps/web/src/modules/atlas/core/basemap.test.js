import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../../../../../../packages/data/atlas/basemap/', import.meta.url));
const names = ['land', 'borders', 'lakes', 'rivers'];
const BBOX = { lon: [-12, 65], lat: [10, 48] };

function load(n) {
  return JSON.parse(readFileSync(dir + n + '.json', 'utf8'));
}
function* coords(c) {
  if (typeof c[0] === 'number') yield c;
  else for (const x of c) yield* coords(x);
}

describe('mapa base local', () => {
  it('los cuatro archivos existen', () => {
    for (const n of names) expect(existsSync(dir + n + '.json'), n).toBe(true);
  });
  it.each(names)('%s: FeatureCollection con coordenadas dentro del bbox', (n) => {
    const fc = load(n);
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features.length).toBeGreaterThan(0);
    for (const f of fc.features) {
      for (const [lon, lat] of coords(f.geometry.coordinates)) {
        expect(lon).toBeGreaterThanOrEqual(BBOX.lon[0]);
        expect(lon).toBeLessThanOrEqual(BBOX.lon[1]);
        expect(lat).toBeGreaterThanOrEqual(BBOX.lat[0]);
        expect(lat).toBeLessThanOrEqual(BBOX.lat[1]);
      }
    }
  });
  it('el tamaño sumado es menor a 2,5 MB', () => {
    const total = names.reduce((s, n) => s + statSync(dir + n + '.json').size, 0);
    expect(total).toBeLessThan(2.5 * 1024 * 1024);
  });
  it('lakes incluye los tres lagos con nombre en español', () => {
    const nm = load('lakes').features.map((f) => f.properties.name);
    expect(nm).toEqual(expect.arrayContaining(['Mar Muerto', 'Mar de Galilea', 'Lagos Amargos']));
  });
  it('rivers incluye el Jordán', () => {
    const nm = load('rivers').features.map((f) => f.properties.name);
    expect(nm).toContain('Jordán');
  });
});
