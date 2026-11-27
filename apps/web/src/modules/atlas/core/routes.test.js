import { describe, it, expect } from 'vitest';
import places from '@data/atlas/places.json';
import fichas from '@data/atlas/fichas.json';
import historia from '@data/atlas/historia.json';
import { buildAtlasDb } from './db.js';
import { routeToGeoJSON, measure } from './geo.js';
import { groupRoutesByPeriod, stopProgress, sliceLine, stepGeo, LEG_LABEL, easeOut } from './routes.js';

const db = buildAtlasDb({ places, fichas, historia });
const pablo2 = db.routes.find((r) => r.id === 'pablo2');

describe('groupRoutesByPeriod', () => {
  const groups = groupRoutesByPeriod(db);
  it('agrupa los 17 recorridos por período, en el orden cronológico de la base', () => {
    expect(groups.reduce((a, g) => a + g.routes.length, 0)).toBe(db.routes.length);
    const idx = groups.map((g) => db.periods.findIndex((p) => p.id === g.id));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
    expect(groups.every((g) => g.routes.length > 0)).toBe(true);
  });
  it('cada fila trae paradas, personajes y color', () => {
    const row = groups.flatMap((g) => g.routes).find((r) => r.id === 'pablo2');
    expect(row.stops).toBe(pablo2.stops.length);
    expect(row.colorIndex).toBe(pablo2.colorIndex);
    expect(Array.isArray(row.people)).toBe(true);
  });
  it('un recorrido sin período conocido va a un grupo final', () => {
    const fake = { ...db, routes: [{ id: 'x', name: 'X', periodId: 'nada', people: [], stops: [], colorIndex: 0 }] };
    const g = groupRoutesByPeriod(fake);
    expect(g).toHaveLength(1);
    expect(g[0].name).toBe('Otros');
  });
});

describe('stopProgress', () => {
  const prog = stopProgress(pablo2, db);
  it('una entrada por parada, con la distancia acumulada de measure', () => {
    expect(prog).toHaveLength(pablo2.stops.length);
    expect(prog[0].cumKm).toBe(0);
    const pts = pablo2.stops.map((s) => db.byId.get(s.placeId)).filter((p) => p && p.hasPos).map((p) => [p.lon, p.lat]);
    const total = measure(pts).totalKm;
    expect(prog[prog.length - 1].cumKm).toBeCloseTo(total, 6);
    expect(prog[prog.length - 1].cumDays).toBe(Math.ceil(total / 30));
  });
  it('las paradas sin posición se listan y no suman distancia', () => {
    const noPos = { stops: [
      { placeId: 'a' }, { placeId: null }, { placeId: 'b' }, { placeId: 'z' },
    ] };
    const fake = { byId: new Map([
      ['a', { hasPos: true, lon: 35, lat: 31 }],
      ['b', { hasPos: true, lon: 35, lat: 32 }],
      ['z', { hasPos: false, lon: 0, lat: 0 }],
    ]) };
    const p = stopProgress(noPos, fake);
    expect(p.map((x) => x.hasPos)).toEqual([true, false, true, false]);
    expect(p[1].cumKm).toBe(p[0].cumKm);
    expect(p[2].cumKm).toBeGreaterThan(100);
    expect(p[3].cumKm).toBe(p[2].cumKm);
    expect(p[2].legKm).toBeCloseTo(p[2].cumKm, 6);
    expect(p[3].legKm).toBe(0);
  });
});

describe('sliceLine', () => {
  const a = [0, 0];
  const b = [10, 20];
  it('t=0 es un punto, t=1 el tramo completo, en medio interpola', () => {
    expect(sliceLine([a, b], 0)).toEqual([a, a]);
    expect(sliceLine([a, b], 1)).toEqual([a, b]);
    expect(sliceLine([a, b], 0.5)).toEqual([a, [5, 10]]);
  });
  it('acota t', () => {
    expect(sliceLine([a, b], 2)).toEqual([a, b]);
    expect(sliceLine([a, b], -1)).toEqual([a, a]);
  });
  it('easeOut va de 0 a 1', () => {
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
  });
});

describe('stepGeo', () => {
  const geo = routeToGeoJSON(pablo2, db);
  const active = 4;
  const s = stepGeo(geo, active);
  it('los tramos posteriores a la parada activa quedan tenues y los anteriores no', () => {
    const f = (i) => s.legs.features.find((x) => x.properties.i === i);
    expect(f(2).properties.ahead).toBe(0);
    expect(f(6).properties.ahead).toBe(1);
  });
  it('el tramo activo va aparte (para animarlo) y conserva su tipo', () => {
    expect(s.legs.features.some((x) => x.properties.i === active)).toBe(false);
    expect(s.active.properties.i).toBe(active);
    expect(s.active.properties.leg).toBe(pablo2.stops[active].leg);
  });
  it('las paradas marcan la activa y las pendientes', () => {
    const n = (k) => s.stops.features.find((x) => x.properties.n === k).properties;
    expect(n(active + 1).act).toBe(1);
    expect(n(active + 2).ahead).toBe(1);
    expect(n(active).ahead).toBe(0);
  });
  it('sin parada activa (null) todo se dibuja normal', () => {
    const all = stepGeo(geo, null);
    expect(all.active).toBeNull();
    expect(all.legs.features).toHaveLength(geo.legs.features.length);
    expect(all.legs.features.every((x) => x.properties.ahead === 0)).toBe(true);
  });
  it('en la primera parada no hay tramo activo', () => {
    expect(stepGeo(geo, 0).active).toBeNull();
  });
});

describe('leyenda', () => {
  it('textos de tipo de tramo', () => {
    expect(LEG_LABEL.texto).toBe('según el texto');
    expect(LEG_LABEL.aprox).toBe('aproximado');
    expect(LEG_LABEL.hipotetico).toBe('hipotético');
  });
});
