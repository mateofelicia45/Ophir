// Caminos antiguos: trazo siempre punteado (aproximado) y su nombre. Sin React ni MapLibre.
import { FONTS } from '../palettes.js';
import { get, vis, labelHalo } from './shared.js';

export function roadLayers(P) {
  return [
    {
      id: 'roads', type: 'line', source: 'roads',
      layout: { 'line-join': 'round' },
      paint: { 'line-color': P['t-camino'], 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1.4, 10, 2.4], 'line-dasharray': [4, 1.8, 0.9, 1.8] },
    },
  ];
}

export function roadLabelLayers(P, labelsOn) {
  const halo = labelHalo(P);
  return [
    {
      id: 'roads-label', type: 'symbol', source: 'roads', minzoom: 6.5,
      layout: {
        visibility: vis(labelsOn),
        'symbol-placement': 'line', 'symbol-spacing': 360,
        'text-field': get('name'), 'text-font': FONTS.serifItalic, 'text-size': 11,
      },
      paint: { 'text-color': P['t-camino'], ...halo },
    },
  ];
}
