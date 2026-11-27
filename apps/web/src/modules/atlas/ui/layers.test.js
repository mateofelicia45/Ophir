import { describe, it, expect } from 'vitest';
import { typeOn, histOn, extraOn, territoryPeriods, hiddenTypes } from './layers.js';

describe('capas', () => {
  it('los tipos arrancan activos y los extras toman su valor por defecto', () => {
    expect(typeOn({}, 'ciudad')).toBe(true);
    expect(typeOn({ ciudad: false }, 'ciudad')).toBe(false);
    expect(extraOn({}, 'labels')).toBe(true);
    expect(extraOn({}, 'roads')).toBe(false);
    expect(extraOn({ labels: false }, 'labels')).toBe(false);
  });
  it('los territorios suman el período elegido y las capas históricas', () => {
    expect(territoryPeriods('', {})).toEqual(new Set());
    expect(territoryPeriods('a', { 'hist:b': true, 'hist:c': false })).toEqual(new Set(['a', 'b']));
    expect(histOn({ 'hist:b': true }, 'b')).toBe(true);
  });
  it('hiddenTypes ignora las capas históricas', () => {
    expect(hiddenTypes({ rio: false, ciudad: true, 'hist:x': false })).toEqual(new Set(['rio']));
  });
});
