import { describe, it, expect } from 'vitest';
import places from '@data/atlas/places.json';
import { inBounds, directionWord, locateOutcome, locateError, JERUSALEM } from './locate.js';

describe('locate', () => {
  it('JERUSALEM coincide con la posición del lugar en los datos', () => {
    const j = places.places.find((p) => p.id === 'jerusalem');
    expect(JERUSALEM).toEqual([j.c[0][0], j.c[0][1]]);
  });

  it('inBounds usa el bbox del mapa', () => {
    expect(inBounds([35.2, 31.8])).toBe(true);
    expect(inBounds([-58.4, -34.6])).toBe(false);
    expect(inBounds([-12, 10])).toBe(true);
    expect(inBounds([70, 31])).toBe(false);
  });

  it('directionWord da los 8 rumbos desde un punto', () => {
    const c = [0, 0];
    expect(directionWord(c, [0, 10])).toBe('norte');
    expect(directionWord(c, [10, 10])).toBe('noreste');
    expect(directionWord(c, [10, 0])).toBe('este');
    expect(directionWord(c, [10, -10])).toBe('sureste');
    expect(directionWord(c, [0, -10])).toBe('sur');
    expect(directionWord(c, [-10, -10])).toBe('suroeste');
    expect(directionWord(c, [-10, 0])).toBe('oeste');
    expect(directionWord(c, [-10, 10])).toBe('noroeste');
  });

  it('dentro del mapa: vuela', () => {
    expect(locateOutcome([35.0, 32.0]).kind).toBe('inside');
  });

  it('fuera del mapa: distancia a Jerusalén y rumbo desde el usuario', () => {
    const o = locateOutcome([-58.38, -34.6]); // Buenos Aires
    expect(o.kind).toBe('outside');
    expect(o.km).toBeGreaterThan(11500);
    expect(o.km).toBeLessThan(12500);
    expect(o.text).toMatch(/^Jerusalén está a 1\d\.\d{3} km de tu ubicación, hacia el (noreste|este)\.$/);
    expect(locateOutcome([35.2, 20]).kind).toBe('inside');
    expect(locateOutcome([35.2, 5]).text).toMatch(/hacia el norte\.$/);
  });

  it('una posición inválida no rompe', () => {
    expect(locateOutcome(null).kind).toBe('error');
    expect(locateOutcome([NaN, 1]).kind).toBe('error');
  });

  it('mensajes de error de geolocalización', () => {
    expect(locateError({ code: 1 })).toMatch(/permiso/);
    expect(locateError({ code: 2 })).toMatch(/No pudimos/);
    expect(locateError({ code: 3 })).toMatch(/Tardó/);
    expect(locateError('unsupported')).toMatch(/navegador/);
    expect(locateError(undefined)).toMatch(/No pudimos/);
  });
});
