import { describe, it, expect } from 'vitest';
import places from '@data/atlas/places.json';
import fichas from '@data/atlas/fichas.json';
import historia from '@data/atlas/historia.json';

const nombres = new Set(places.places.map((p) => p.n));
const paradas = historia.rutas.flatMap((r) => r.paradas);

describe('datos del atlas', () => {
  it('every route stop ob exists in places', () => {
    const faltan = paradas.filter((s) => !nombres.has(s.ob)).map((s) => s.ob);
    expect(faltan).toEqual([]);
  });

  it('every territory ob exists', () => {
    const faltan = historia.territorios.filter((t) => t.ob && !nombres.has(t.ob)).map((t) => t.ob);
    expect(faltan).toEqual([]);
    const sinGeometria = historia.territorios.filter((t) => !t.ob && !t.c && !t.rings).map((t) => t.id);
    expect(sinGeometria).toEqual([]);
  });

  it('every ficha ob exists', () => {
    const faltan = fichas.fichas.filter((f) => !nombres.has(f.ob)).map((f) => f.ob);
    expect(faltan).toEqual([]);
  });

  it('counts', () => {
    expect(places.places).toHaveLength(1342);
    expect(fichas.fichas).toHaveLength(227);
    expect(historia.periodos).toHaveLength(12);
    expect(historia.rutas).toHaveLength(17);
    expect(historia.territorios).toHaveLength(61);
    expect(paradas).toHaveLength(180);
  });
});
