import { describe, it, expect } from 'vitest';
import places from '@data/atlas/places.json';
import fichas from '@data/atlas/fichas.json';
import historia from '@data/atlas/historia.json';
import { buildAtlasDb } from '../core/db.js';
import { exportMarkdown, exportCsv, exportGeoJSON, exportNotes, csvCell } from './exporters.js';

const db = buildAtlasDb({ places, fichas, historia });
const NOW = new Date('2026-01-02T03:04:05Z');

describe('exportMarkdown', () => {
  it('empieza con frontmatter y trae el título', () => {
    const md = exportMarkdown(db, ['jerusalem'], {}, { now: NOW });
    expect(md.startsWith('---\n')).toBe(true);
    expect(md).toContain('# Jerusalén');
    expect(md).toContain('## Fuentes');
  });
  it('incluye la nota personal del lugar', () => {
    const md = exportMarkdown(db, ['jerusalem'], { jerusalem: 'Ciudad del gran Rey' }, { now: NOW });
    expect(md).toContain('## Mis notas\n\nCiudad del gran Rey');
  });
  it('ignora ids que no existen', () => {
    expect(exportMarkdown(db, ['noexiste'], {})).toBe('');
  });
  it('un lugar con ficha básica y sin coordenadas no falla', () => {
    const p = db.places.find((x) => !x.curated && !x.hasPos);
    const md = exportMarkdown(db, [p.id], {}, { now: NOW });
    expect(md).toContain('desconocidas');
  });
});

describe('exportCsv', () => {
  it('tiene encabezado y una fila por lugar, con comillas donde hace falta', () => {
    const csv = exportCsv(db, ['jerusalem', 'dan']);
    const lines = csv.split('\n');
    expect(lines[0].startsWith('id,nombre,')).toBe(true);
    expect(lines).toHaveLength(3);
    expect(lines[1].startsWith('jerusalem,Jerusalén,')).toBe(true);
  });
  it('csvCell escapa comas, comillas y saltos', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('di "x"')).toBe('"di ""x"""');
    expect(csvCell(null)).toBe('');
  });
});

describe('exportGeoJSON', () => {
  it('es un FeatureCollection válido y salta los lugares sin coordenadas', () => {
    const unk = db.places.find((p) => !p.hasPos);
    const g = JSON.parse(exportGeoJSON(db, ['jerusalem', unk.id]));
    expect(g.type).toBe('FeatureCollection');
    expect(g.features).toHaveLength(1);
    expect(g.features[0].geometry.type).toBe('Point');
  });
});

describe('exportNotes', () => {
  it('guarda notas, favoritos y pendientes', () => {
    const j = JSON.parse(exportNotes({ notes: { a: 'x' }, favorites: ['a'], pending: ['b'] }, { now: NOW }));
    expect(j).toMatchObject({ atlas: 'Atlas Bíblico', notes: { a: 'x' }, fav: ['a'], pend: ['b'], exportado: NOW.toISOString() });
  });
});
