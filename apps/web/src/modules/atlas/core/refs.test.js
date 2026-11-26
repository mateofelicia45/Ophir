import { describe, it, expect } from 'vitest';
import { parseRef, refLabel, refToCode, toOphirRef, BOOK_NAMES_ES } from './refs.js';

describe('refs', () => {
  it('parses Spanish abbreviations', () => {
    expect(parseRef('Hch 16')).toMatchObject({ b: 43, c1: 16 });
  });
  it('parses numbered books with verse', () => {
    expect(parseRef('1 Sam 17:4')).toMatchObject({ b: 8, c1: 17, v1: 4 });
  });
  it('parses English names', () => {
    expect(parseRef('Philippians 1')).toMatchObject({ b: 49 });
  });
  it('returns null for junk', () => {
    expect(parseRef('xyz')).toBeNull();
    expect(parseRef('')).toBeNull();
  });
  it('has 66 book names', () => {
    expect(BOOK_NAMES_ES).toHaveLength(66);
  });
  it('labels ranges', () => {
    expect(refLabel(parseRef('Génesis 11:31-32'))).toBe('Génesis 11:31-32');
    expect(refLabel(parseRef('Hch 16'))).toBe('Hechos 16');
  });
  it('encodes codes', () => {
    expect(refToCode(0, 12, 1)).toBe(12001);
    expect(refToCode(43, 16, 0)).toBe(43016000);
  });
  it('maps to Ophir book ids (OT and NT)', () => {
    expect(toOphirRef(parseRef('1 Sam 17:4'))).toEqual({ bookId: '1sa', chapter: 17, verseStart: 4, verseEnd: null });
    expect(toOphirRef(parseRef('Hch 16:6-10'))).toEqual({ bookId: 'act', chapter: 16, verseStart: 6, verseEnd: 10 });
    expect(toOphirRef(parseRef('Apocalipsis 1')).bookId).toBe('rev');
  });
});
