import { describe, it, expect } from 'vitest';
import places from '@data/atlas/places.json';
import fichas from '@data/atlas/fichas.json';
import caminos from '@data/atlas/caminos.json';
import modernos from '@data/atlas/modernos.json';
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

import { parseRef } from './refs.js';

describe('referencias de paradas', () => {
  it('every stop ref parses', () => {
    const malas = paradas.filter((s) => !parseRef(s.ref)).map((s) => s.ref);
    expect(malas).toEqual([]);
  });
});

// Mismo bbox del mapa base.
const inBox = ([lon, lat]) => lon >= -12 && lon <= 65 && lat >= 10 && lat <= 48;

describe('caminos antiguos', () => {
  const list = caminos.caminos;
  const ids = new Set(list.map((c) => c.id));
  const periodos = new Set(historia.periodos.map((p) => p.id));

  it('hay cinco caminos con ids únicos', () => {
    expect(list.map((c) => c.id).sort()).toEqual(['camino-cresta', 'camino-del-rey', 'galilea-judea-jordan', 'galilea-judea-samaria', 'via-maris']);
    expect(ids.size).toBe(list.length);
  });

  it.each(list.map((c) => [c.id, c]))('%s: coordenadas dentro del mapa, aproximado y con nota', (id, c) => {
    expect(c.coords.length).toBeGreaterThanOrEqual(2);
    expect(c.coords.filter(inBox).length).toBe(c.coords.length);
    expect(c.aprox).toBe(true);
    expect(c.nota.length).toBeGreaterThan(40);
    expect(c.periodos.length).toBeGreaterThan(0);
    expect(c.periodos.filter((p) => !periodos.has(p))).toEqual([]);
  });

  it('todas las referencias se pueden leer', () => {
    const malas = list.flatMap((c) => c.refs).filter((r) => !parseRef(r));
    expect(malas).toEqual([]);
  });

  it('relacion apunta a un camino que existe y es recíproca', () => {
    for (const c of list.filter((x) => x.relacion)) {
      expect(ids.has(c.relacion)).toBe(true);
      expect(list.find((o) => o.id === c.relacion).relacion).toBe(c.id);
    }
  });

  it('los dos caminos de Galilea a Jerusalén parten y llegan a los mismos lugares', () => {
    const a = list.find((c) => c.id === 'galilea-judea-jordan').coords;
    const b = list.find((c) => c.id === 'galilea-judea-samaria').coords;
    expect(a[0]).toEqual(b[0]);
    expect(a[a.length - 1]).toEqual(b[b.length - 1]);
  });

  it('la nota de Samaria no afirma que los judíos nunca la cruzaban', () => {
    const txt = list.map((c) => c.nota).join(' ');
    expect(txt).not.toMatch(/nunca/i);
    expect(txt).toMatch(/algunos peregrinos/);
    expect(txt).toMatch(/Antigüedades 20\.118/);
  });

  it('la nota de Samaria concilia los tres días de Josefo con los 30 km por día del atlas', () => {
    const n = list.find((c) => c.id === 'galilea-judea-samaria').nota;
    expect(n).toMatch(/Vida 269/);
    expect(n).toMatch(/30 km por día/);
    expect(n).toMatch(/unos 4/);
  });
});

describe('nombres modernos', () => {
  it('ciudades y países dentro del mapa, con nombre', () => {
    expect(modernos.ciudades.length).toBeGreaterThanOrEqual(25);
    expect(modernos.paises.length).toBeGreaterThanOrEqual(10);
    for (const m of [...modernos.ciudades, ...modernos.paises]) {
      expect(m.n.length).toBeGreaterThan(1);
      expect(inBox(m.c)).toBe(true);
    }
    expect(modernos.ciudades.every((c) => [1, 2, 3].includes(c.r))).toBe(true);
  });
});
