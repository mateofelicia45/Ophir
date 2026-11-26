import { describe, it, expect } from 'vitest';
import places from '@data/atlas/places.json';
import fichas from '@data/atlas/fichas.json';
import historia from '@data/atlas/historia.json';
import { buildAtlasDb } from './db.js';
import { parseAtlasParams, toAtlasSearch } from './urlState.js';
import { LEGACY_IDS } from './legacyIds.js';

const db = buildAtlasDb({ places, fichas, historia });
const vacio = { placeId: null, routeId: null, periodId: '', chapter: null };

describe('parseAtlasParams', () => {
  it('?cap=jhn.4 -> {b:42,c:4}', () => {
    expect(parseAtlasParams('?cap=jhn.4', db).chapter).toEqual({ b: 42, c: 4 });
    expect(parseAtlasParams('cap=jhn.4', db).chapter).toEqual({ b: 42, c: 4 });
  });
  it('lugar con id nuevo o viejo', () => {
    expect(parseAtlasParams('?lugar=jerusalem', db).placeId).toBe('jerusalem');
    expect(parseAtlasParams('?lugar=belen', db).placeId).toBe(LEGACY_IDS.belen);
    expect(db.byId.has(LEGACY_IDS.belen)).toBe(true);
  });
  it('ruta y periodo válidos', () => {
    const r = db.routes[0].id;
    const p = Object.keys(db.periodById)[0];
    const s = parseAtlasParams(`?ruta=${r}&periodo=${p}`, db);
    expect(s.routeId).toBe(r);
    expect(s.periodId).toBe(p);
  });
  it('URL inválida: todo vacío y sin lanzar', () => {
    expect(parseAtlasParams('?lugar=noexiste&cap=xyz.99&periodo=foo&ruta=nada', db)).toEqual(vacio);
    expect(parseAtlasParams('', db)).toEqual(vacio);
    expect(parseAtlasParams(undefined, db)).toEqual(vacio);
    expect(parseAtlasParams('?lugar=%E0%A4%A&cap=jhn.99', db)).toEqual(vacio);
    expect(parseAtlasParams('?cap=jhn.0', db).chapter).toBeNull();
    expect(parseAtlasParams('?cap=jhn.4.5', db).chapter).toBeNull();
    expect(parseAtlasParams('?cap=jhn.1.5', db).chapter).toBeNull();
  });
});

describe('toAtlasSearch', () => {
  it('vacío -> cadena vacía', () => {
    expect(toAtlasSearch(vacio)).toBe('');
  });
  it('solo emite lo no vacío, en orden', () => {
    expect(toAtlasSearch({ placeId: 'jerusalem', routeId: 'r1', periodId: 'p1', chapter: { b: 42, c: 4 } }))
      .toBe('?lugar=jerusalem&ruta=r1&periodo=p1&cap=jhn.4');
    expect(toAtlasSearch({ ...vacio, periodId: 'p1' })).toBe('?periodo=p1');
  });
  it('ida y vuelta', () => {
    const st = { placeId: 'jerusalem', routeId: db.routes[0].id, periodId: Object.keys(db.periodById)[0], chapter: { b: 0, c: 12 } };
    expect(parseAtlasParams(toAtlasSearch(st), db)).toEqual(st);
  });
});
