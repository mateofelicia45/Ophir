import { describe, it, expect } from 'vitest';
import { displayName, norm } from './text.js';

describe('displayName', () => {
  it('quita el sufijo numérico final de OpenBible', () => {
    expect(displayName('Monte Seir 1')).toBe('Monte Seir');
    expect(displayName('Belén 12')).toBe('Belén');
  });
  it('no toca números al principio ni nombres sin sufijo', () => {
    expect(displayName('1 Samuel')).toBe('1 Samuel');
    expect(displayName('Jerusalén')).toBe('Jerusalén');
    expect(displayName(null)).toBe('');
  });
});

describe('norm', () => {
  it('quita acentos y pasa a minúsculas', () => {
    expect(norm('  Jerusalén ')).toBe('jerusalen');
  });
});
