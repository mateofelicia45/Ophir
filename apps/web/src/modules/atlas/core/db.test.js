import { describe, it, expect } from 'vitest';
import places from '@data/atlas/places.json';
import fichas from '@data/atlas/fichas.json';
import historia from '@data/atlas/historia.json';
import { buildAtlasDb } from './db.js';

const db = buildAtlasDb({ places, fichas, historia });

describe('buildAtlasDb', () => {
  it('Jerusalén es segura e importancia 1', () => {
    const j = db.byOb.get('Jerusalem');
    expect(j.name).toBe('Jerusalén');
    expect(j.certainty).toBe('segura');
    expect(j.importance).toBe(1);
  });
  it('rutas: paradas completas y placeId válido', () => {
    expect(db.routes).toHaveLength(historia.rutas.length);
    db.routes.forEach((r, i) => {
      expect(r.stops).toHaveLength(historia.rutas[i].paradas.length);
      r.stops.forEach((s) => expect(db.byId.has(s.placeId)).toBe(true));
    });
  });
  it('lugar sin geometría es desconocido y sin posición', () => {
    const sin = db.places.filter((p) => !p.candidates.length && !p.polys.length && !p.lines.length);
    expect(sin.length).toBeGreaterThan(0);
    sin.forEach((p) => {
      expect(p.hasPos).toBe(false);
      expect(p.certainty).toBe('desconocida');
    });
    expect(db.stats.unknown).toBeGreaterThanOrEqual(sin.length);
  });
  it('capítulos de Génesis 12 pertenecen a patriarcas', () => {
    expect(db.chapterPeriods.get(0 * 1000 + 12)).toContain('patriarcas');
  });
  it('territorio sin c hereda anillos del lugar', () => {
    const t = historia.territorios.find((x) => x.ob && !x.c && !x.rings);
    const terr = db.territories.find((x) => x.id === t.id);
    const p = db.byOb.get(t.ob);
    if (p.polys.length) expect(terr.rings[0]).toEqual(p.polys[0].c);
    else {
      expect(terr.rings[0].length).toBeGreaterThan(8);
      const [lon, lat] = terr.rings[0][0];
      expect(Math.hypot(lon - p.lon, lat - p.lat)).toBeCloseTo(0.35, 2);
    }
  });
  it('todos los territorios del dato resuelven', () => {
    expect(db.territories).toHaveLength(historia.territorios.length);
  });
});
