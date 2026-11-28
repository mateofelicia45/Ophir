import { describe, it, expect } from 'vitest';
import TIMELINE from '@data/timeline.json';
import PLACES from '@data/atlas/places.json';
import HISTORIA from '@data/atlas/historia.json';
import { mapLinkFor } from './mapLink.js';

const periodIds = new Set(HISTORIA.periodos.map((p) => p.id));
const placeIds = new Set(PLACES.places.map((p) => p.id));

describe('línea de tiempo y atlas', () => {
  it('cada era declara su período del mapa (un id real o null)', () => {
    for (const era of TIMELINE.eras) {
      expect('periodo' in era, era.id).toBe(true);
      expect(era.periodo === null || periodIds.has(era.periodo), era.id).toBe(true);
    }
  });

  it('los lugares de los eventos existen en el atlas', () => {
    for (const ev of TIMELINE.events) {
      for (const id of ev.places || []) expect(placeIds.has(id), `${ev.title}: ${id}`).toBe(true);
    }
  });

  it('el enlace al mapa usa lo que exista y es null si no hay nada', () => {
    const eras = [{ from: -100, to: 0, periodo: 'jesus' }, { from: 0, to: 100, periodo: null }];
    expect(mapLinkFor({ year: -5, places: ['nazareth'] }, eras)).toBe('/atlas?periodo=jesus&lugar=nazareth');
    expect(mapLinkFor({ year: -5 }, eras)).toBe('/atlas?periodo=jesus');
    expect(mapLinkFor({ year: 5, places: ['rome'] }, eras)).toBe('/atlas?lugar=rome');
    expect(mapLinkFor({ year: 5 }, eras)).toBeNull();
  });

  it('los eventos bíblicos con lugar claro tienen places', () => {
    expect(TIMELINE.events.filter((e) => e.places && e.places.length).length).toBeGreaterThanOrEqual(15);
  });
});
