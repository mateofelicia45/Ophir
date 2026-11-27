import { describe, it, expect } from 'vitest';
import places from '@data/atlas/places.json';
import fichas from '@data/atlas/fichas.json';
import historia from '@data/atlas/historia.json';
import { buildAtlasDb } from './db.js';
import { refGroups, fichaVM, nearbyPlaces, fmtCoord, bearing, sourcesOf, candidateList, subtitleOf } from './ficha.js';

const db = buildAtlasDb({ places, fichas, historia });
const jer = db.byId.get('jerusalem');
const noPos = db.places.find((p) => !p.hasPos);

describe('fmtCoord / bearing', () => {
  it('formatea con hemisferio', () => {
    expect(fmtCoord(31.7767, 35.2345)).toBe('31.7767° N, 35.2345° E');
    expect(fmtCoord(-10, -20.5)).toBe('10.0000° S, 20.5000° O');
  });
  it('rumbo cardinal', () => {
    expect(bearing([0, 0], [0, 1])).toBe('N');
    expect(bearing([0, 0], [1, 0])).toBe('E');
    expect(bearing([0, 0], [-1, 0])).toBe('O');
  });
});

describe('refGroups', () => {
  it('agrupa por libro en orden de aparición, con referencia abrible', () => {
    const g = refGroups({ refs: [1001001, 1001002, 2003004] });
    expect(g).toHaveLength(2);
    expect(g[0].book).toBe('Éxodo');
    expect(g[0].items.map((i) => i.t)).toEqual(['1:1', '1:2']);
    expect(g[0].items[0].ref).toEqual({ b: 1, c1: 1, v1: 1, c2: 1, v2: 1 });
    expect(g[1].book).toBe('Levítico');
    expect(g[1].items[0].t).toBe('3:4');
  });
  it('sin menciones, lista vacía', () => {
    expect(refGroups({ refs: [] })).toEqual([]);
  });
});

describe('fichaVM', () => {
  it('Jerusalén: ficha completa', () => {
    const vm = fichaVM(db, jer);
    expect(vm.basic).toBe(false);
    expect(vm.keyRefs.some((r) => r.label === '2 Samuel 5:6-9' && r.ref)).toBe(true);
    expect(vm.hasEvents).toBe(true);
    expect(vm.hasPeople).toBe(true);
    expect(vm.testaments).toBe('Antiguo Testamento · Nuevo Testamento');
    expect(vm.periods).not.toBe('Sin asignar');
    expect(vm.mentions).toMatch(/versículos en \d+ libros/);
    expect(vm.coords).toMatch(/° N, .*° E$/);
  });
  it('lugar sin coordenadas', () => {
    const vm = fichaVM(db, noPos);
    expect(vm.hasPos).toBe(false);
    expect(vm.coords).toBe('Desconocidas');
    expect(vm.qNote).toMatch(/desconocido|coordenadas/i);
    expect(vm.cands).toEqual([]);
  });
  it('ficha básica: descripción generada y fuentes avisan', () => {
    const basic = db.places.find((p) => !p.curated && p.hasPos && p.refs.length > 0);
    const vm = fichaVM(db, basic);
    expect(vm.basic).toBe(true);
    expect(vm.desc).toMatch(/Ficha básica generada/);
    expect(vm.sources.some((s) => /básica/.test(s))).toBe(true);
  });
  it('recorridos del lugar con nombre', () => {
    const vm = fichaVM(db, db.byId.get('philippi'));
    expect(vm.routes.length).toBeGreaterThan(0);
    expect(vm.routes[0]).toEqual({ id: expect.any(String), name: expect.any(String) });
  });
  it('lista las menciones solo si son pocas, salvo que se pidan todas', () => {
    const many = db.places.find((p) => p.refs.length > 40);
    expect(fichaVM(db, many).canShowRefs).toBe(true);
    const few = db.places.find((p) => p.refs.length > 0 && p.refs.length <= 40);
    expect(fichaVM(db, few).canShowRefs).toBe(false);
  });
});

describe('candidateList', () => {
  it('solo con más de una propuesta, numeradas, y la primera está en el mapa', () => {
    const p = db.places.find((q) => q.candidates.filter((c) => c[3] === 'p' || c[3] === 'w').length > 2);
    const l = candidateList(p);
    expect(l.length).toBeGreaterThan(2);
    expect(l[0].tag).toBe('en el mapa');
    expect(l[0].no).toBe(1);
    expect(Number.isFinite(l[0].lon)).toBe(true);
  });
  it('una sola propuesta: sin lista', () => {
    const p = db.places.find((q) => q.candidates.filter((c) => c[3] === 'p' || c[3] === 'w').length === 1);
    expect(candidateList(p)).toEqual([]);
  });
});

describe('nearbyPlaces', () => {
  it('hasta 8 lugares ordenados por distancia, con km y rumbo', () => {
    const n = nearbyPlaces(db, jer);
    expect(n.length).toBeGreaterThan(0);
    expect(n.length).toBeLessThanOrEqual(8);
    expect(n.every((x) => x.id !== jer.id)).toBe(true);
    const km = n.map((x) => x.km);
    expect([...km].sort((a, b) => a - b)).toEqual(km);
    expect(n[0].d).toMatch(/^\d+(\.\d)? km (N|NE|E|SE|S|SO|O|NO)$/);
  });
  it('sin ubicación no hay cercanos', () => {
    expect(nearbyPlaces(db, noPos)).toEqual([]);
  });
});

describe('subtitleOf', () => {
  it('distingue homónimos con una pista', () => {
    const homs = db.places.filter((p) => /\s\d+$/.test(p.name));
    expect(homs.length).toBeGreaterThan(1);
    expect(homs.filter((p) => subtitleOf(p)).length).toBeGreaterThan(homs.length / 2);
  });
  it('no repite el nombre del lugar', () => {
    expect(subtitleOf(jer)).toBe('Montes de Judá');
  });
});

describe('sourcesOf', () => {
  it('incluye OpenBible y las obras citadas', () => {
    const s = sourcesOf(db, jer);
    expect(s[0]).toMatch(/OpenBible/);
    expect(s.length).toBeGreaterThan(1);
  });
});
