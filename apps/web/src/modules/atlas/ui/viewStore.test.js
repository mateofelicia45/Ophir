import { describe, it, expect, vi } from 'vitest';
import { createViewStore } from './viewStore.js';

const b = (w) => [[w, 30], [36, 33]];

describe('createViewStore', () => {
  it('guarda el último valor y avisa a los suscritos', () => {
    const s = createViewStore();
    const f = vi.fn();
    const off = s.subscribe(f);
    expect(s.get()).toBeNull();
    s.set(b(34));
    expect(s.get()).toEqual(b(34));
    expect(f).toHaveBeenCalledTimes(1);
    off();
    s.set(b(35));
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('no avisa si los límites no cambiaron y conserva la misma referencia', () => {
    const s = createViewStore();
    const f = vi.fn();
    s.subscribe(f);
    const first = b(34);
    s.set(first);
    s.set(b(34));
    expect(f).toHaveBeenCalledTimes(1);
    expect(s.get()).toBe(first);
  });

  it('sin suscritos, publicar no hace nada más', () => {
    const s = createViewStore();
    expect(() => s.set(b(1))).not.toThrow();
  });
});
