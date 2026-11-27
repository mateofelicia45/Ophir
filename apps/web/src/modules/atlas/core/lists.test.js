import { describe, it, expect } from 'vitest';
import places from '@data/atlas/places.json';
import fichas from '@data/atlas/fichas.json';
import historia from '@data/atlas/historia.json';
import { buildAtlasDb } from './db.js';
import { listOf, toggleList, pushHistory } from './lists.js';

const db = buildAtlasDb({ places, fichas, historia });

describe('listOf', () => {
  it('ignora ids que no existen y arma nombre y subtítulo', () => {
    const l = listOf(db, ['jerusalem', 'noexiste']);
    expect(l).toHaveLength(1);
    expect(l[0]).toMatchObject({ id: 'jerusalem', name: 'Jerusalén', sub: 'Ciudad' });
  });
});

describe('toggleList', () => {
  it('agrega al principio y quita si ya estaba, sin mutar', () => {
    const s = { favorites: ['a'] };
    const s2 = toggleList(s, 'favorites', 'b');
    expect(s2.favorites).toEqual(['b', 'a']);
    expect(s.favorites).toEqual(['a']);
    expect(toggleList(s2, 'favorites', 'a').favorites).toEqual(['b']);
  });
});

describe('pushHistory', () => {
  it('pone el último consultado primero, sin repetir, con tope de 30', () => {
    let s = { history: [] };
    for (let i = 0; i < 35; i++) s = pushHistory(s, 'p' + i);
    s = pushHistory(s, 'p20');
    expect(s.history[0]).toBe('p20');
    expect(s.history).toHaveLength(30);
    expect(s.history.filter((x) => x === 'p20')).toHaveLength(1);
  });
});
