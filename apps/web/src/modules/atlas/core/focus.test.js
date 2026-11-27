import { describe, it, expect } from 'vitest';
import places from '@data/atlas/places.json';
import fichas from '@data/atlas/fichas.json';
import historia from '@data/atlas/historia.json';
import { buildAtlasDb } from './db.js';
import { parseRef } from './refs.js';
import { passageFocus, personFocus, routeFocus, cameraFor, periodBounds, placesForRef } from './focus.js';

const db = buildAtlasDb({ places, fichas, historia });

describe('passageFocus', () => {
  it('«hch 16» enfoca Filipos y sugiere un período', () => {
    const f = passageFocus(db, parseRef('hch 16'));
    expect(f.title).toBe('Hechos 16');
    expect(f.placeIds.has('philippi')).toBe(true);
    expect(f.chapter).toEqual({ b: 43, c: 16 });
    expect(f.items[0].no).toBe('1');
    expect(f.items.find((it) => it.id === 'philippi').sub).toMatch(/^v\. 16:12/);
  });
  it('un versículo acota los lugares', () => {
    const all = placesForRef(db, parseRef('hch 16'));
    const one = placesForRef(db, parseRef('hch 16:12'));
    expect(one.length).toBeLessThan(all.length);
    expect(one.some((it) => it.place.id === 'philippi')).toBe(true);
  });
});

describe('personFocus y routeFocus', () => {
  it('Pablo tiene lugares y recorridos', () => {
    const f = personFocus(db, 'pablo');
    expect(f.placeIds.size).toBeGreaterThan(5);
    expect(f.routeIds.length).toBeGreaterThan(0);
    expect(personFocus(db, 'nadie')).toBeNull();
  });
  it('un recorrido enumera sus paradas', () => {
    const f = routeFocus(db, 'pablo2');
    expect(f.items.length).toBeGreaterThan(3);
    expect(f.placeIds.has('philippi')).toBe(true);
    expect(routeFocus(db, 'noexiste')).toBeNull();
  });
});

describe('cameraFor y periodBounds', () => {
  it('ignora lugares sin posición y devuelve centro para uno solo', () => {
    const sinPos = db.places.find((p) => !p.hasPos);
    expect(cameraFor(db, [sinPos.id])).toBeNull();
    expect(cameraFor(db, ['jerusalem', sinPos.id]).center).toEqual([db.byId.get('jerusalem').lon, db.byId.get('jerusalem').lat]);
    expect(cameraFor(db, ['jerusalem', 'philippi']).bounds).toHaveLength(2);
  });
  it('un período con territorios tiene encuadre', () => {
    const b = periodBounds(db, 'pablo');
    expect(b[0][0]).toBeLessThan(b[1][0]);
  });
});
