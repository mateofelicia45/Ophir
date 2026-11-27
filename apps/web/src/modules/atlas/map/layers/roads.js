// Caminos antiguos: trazo siempre punteado (son aproximados, DESIGN.md §5) y su nombre.
// `sel` es el camino abierto y `cmp` el que se compara con él: ambos se resaltan.
// Sin React ni MapLibre.
import { FONTS } from '../palettes.js';
import { get, vis, labelHalo } from './shared.js';

const picked = ['any', ['==', get('sel'), 1], ['==', get('cmp'), 1]];

export function roadLayers(P, on) {
  const color = ['case', ['==', get('sel'), 1], P.clay, ['==', get('cmp'), 1], P.accent, P['t-camino']];
  const width = (a, b, c, d) => ['interpolate', ['linear'], ['zoom'], 5, ['case', picked, a, b], 10, ['case', picked, c, d]];
  return [
    {
      id: 'roads', type: 'line', source: 'roads',
      layout: { visibility: vis(on), 'line-join': 'round' },
      paint: {
        'line-color': color,
        'line-width': width(3, 1.4, 4.4, 2.4),
        'line-opacity': ['case', picked, 1, 0.85],
        'line-dasharray': [4, 1.8, 0.9, 1.8],
      },
    },
  ];
}

export function roadLabelLayers(P, labelsOn, on) {
  const halo = labelHalo(P);
  return [
    {
      id: 'roads-label', type: 'symbol', source: 'roads', minzoom: 6.5,
      layout: {
        visibility: vis(labelsOn && on),
        'symbol-placement': 'line', 'symbol-spacing': 360,
        'text-field': get('name'), 'text-font': FONTS.serifItalic, 'text-size': ['case', picked, 12, 11],
      },
      paint: { 'text-color': ['case', ['==', get('sel'), 1], P.clay, ['==', get('cmp'), 1], P.accent, P['t-camino']], ...halo },
    },
  ];
}
