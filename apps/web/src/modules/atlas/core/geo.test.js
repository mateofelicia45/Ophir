import { describe, it, expect } from 'vitest';
import places from '@data/atlas/places.json';
import fichas from '@data/atlas/fichas.json';
import historia from '@data/atlas/historia.json';
import { buildAtlasDb } from './db.js';
import {
  placesToGeoJSON, routeToGeoJSON, territoriesToGeoJSON, roadsToGeoJSON, haversineKm, measure,
} from './geo.js';

const db = buildAtlasDb({ places, fichas, historia });
const pos = (ob) => { const p = db.byOb.get(ob); return [p.lon, p.lat]; };

describe('haversineKm / measure', () => {
  it('Jerusalén → Belén está entre 8 y 10 km', () => {
    const d = haversineKm(pos('Jerusalem'), pos('Bethlehem 1'));
    expect(d).toBeGreaterThan(8);
    expect(d).toBeLessThan(10);
  });
  it('Dan → Beerseba suma entre 220 y 250 km y los días son ceil(total/30)', () => {
    const m = measure([pos('Dan'), pos('Beersheba 1')]);
    expect(m.totalKm).toBeGreaterThan(220);
    expect(m.totalKm).toBeLessThan(250);
    expect(m.days).toBe(Math.ceil(m.totalKm / 30));
    expect(m.legs).toHaveLength(1);
  });
  it('sin tramos: 0 km y 0 días', () => {
    expect(measure([pos('Dan')])).toEqual({ legs: [], totalKm: 0, days: 0 });
  });
});

describe('placesToGeoJSON', () => {
  it('omite lugares sin posición y marca sel/dim', () => {
    const fc = placesToGeoJSON(db.places, { selectedId: db.places[0].id, focusIds: new Set(['x']) });
    expect(fc.features.length).toBe(db.places.filter((p) => p.hasPos).length);
    const f = fc.features.find((x) => x.properties.id === db.places[0].id);
    if (f) expect(f.properties.sel).toBe(1);
    expect(fc.features.every((x) => x.properties.dim === 1)).toBe(true);
  });
  it('marca foc en los lugares del foco', () => {
    const fc = placesToGeoJSON(db.places, { focusIds: new Set(['jerusalem']) });
    const j = fc.features.find((x) => x.properties.id === 'jerusalem');
    expect(j.properties).toMatchObject({ foc: 1, dim: 0 });
    expect(fc.features.filter((x) => x.properties.foc === 1)).toHaveLength(1);
  });
  it('sin focusIds nada se atenúa', () => {
    const fc = placesToGeoJSON(db.places, {});
    expect(fc.features.every((x) => x.properties.dim === 0 && x.properties.sel === 0)).toBe(true);
  });
});

describe('routeToGeoJSON', () => {
  const abraham = db.routes.find((r) => r.id === 'abraham');
  it('el tramo 6 (parada índice 5, hacia Egipto) es hipotético', () => {
    const { legs } = routeToGeoJSON(abraham, db);
    expect(legs.features.find((f) => f.properties.i === 5).properties.leg).toBe('hipotetico');
  });
  it('las paradas llevan n 1-based y solo las ubicadas', () => {
    const { stops } = routeToGeoJSON(abraham, db);
    expect(stops.features[0].properties.n).toBe(1);
    expect(stops.features.length).toBeLessThanOrEqual(abraham.stops.length);
  });
  it('salta paradas sin posición uniendo las ubicadas', () => {
    const fake = { id: 'f', stops: [
      { placeId: db.byOb.get('Dan').id, leg: 'inicio' },
      { placeId: null, leg: 'texto' },
      { placeId: db.byOb.get('Beersheba 1').id, leg: 'aprox' },
    ] };
    const { legs, stops } = routeToGeoJSON(fake, db);
    expect(legs.features).toHaveLength(1);
    expect(legs.features[0].properties).toMatchObject({ leg: 'aprox', i: 2 });
    expect(stops.features.map((f) => f.properties.n)).toEqual([1, 3]);
  });
});

describe('territoriesToGeoJSON', () => {
  it('cierra anillos abiertos', () => {
    const fc = territoriesToGeoJSON([{ id: 't', name: 'T', colorIndex: 2, kind: 'disc', rings: [[[0, 0], [1, 0], [1, 1]]] }]);
    const ring = fc.features[0].geometry.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(fc.features[0].geometry.type).toBe('Polygon');
    expect(fc.features[0].properties).toMatchObject({ id: 't', name: 'T', colorIndex: 2, kind: 'disc' });
  });
  it('todos los territorios de la base se convierten', () => {
    expect(territoriesToGeoJSON(db.territories).features).toHaveLength(db.territories.length);
  });
});

describe('roadsToGeoJSON', () => {
  it('genera LineString con id, name y aprox', () => {
    const fc = roadsToGeoJSON([{ id: 'r1', nombre: 'Vía', periodos: [], nota: '', refs: [], relacion: 'x', aprox: true, coords: [[0, 0], [1, 1]] }]);
    expect(fc.features[0].geometry.type).toBe('LineString');
    expect(fc.features[0].properties).toMatchObject({ id: 'r1', name: 'Vía', aprox: true, relacion: 'x' });
  });
});

describe('placesToGeoJSON: nombres', () => {
  it('quita el sufijo numérico de OpenBible en la etiqueta', () => {
    const fc = placesToGeoJSON([{ id: 'x', name: 'Monte Seir 1', type: 'montana', certainty: 'segura', importance: 3, lon: 35, lat: 30, hasPos: true }]);
    expect(fc.features[0].properties.name).toBe('Monte Seir');
  });
});
