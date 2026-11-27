// Medición de distancias. Sin React ni MapLibre.
import { FONTS } from '../palettes.js';
import { get } from './shared.js';

export function measureLayers(P) {
  return [
    {
      id: 'measure-casing', type: 'line', source: 'measure', filter: ['==', ['geometry-type'], 'LineString'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': P.paper, 'line-opacity': 0.92, 'line-width': 7.5 },
    },
    {
      id: 'measure-line', type: 'line', source: 'measure', filter: ['==', ['geometry-type'], 'LineString'],
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: { 'line-color': P.accent, 'line-width': 3.5, 'line-dasharray': [4, 1.6] },
    },
    {
      id: 'measure-points', type: 'circle', source: 'measure', filter: ['==', get('kind'), 'v'],
      paint: { 'circle-radius': 8, 'circle-color': P.accent, 'circle-stroke-color': P.paper, 'circle-stroke-width': 2 },
    },
    {
      id: 'measure-num', type: 'symbol', source: 'measure', filter: ['==', get('kind'), 'v'],
      layout: {
        'text-field': ['to-string', get('n')], 'text-font': FONTS.sansMedium, 'text-size': 11,
        'text-allow-overlap': true, 'text-ignore-placement': true,
      },
      paint: { 'text-color': P.accentInk },
    },
    {
      id: 'measure-leg-label', type: 'symbol', source: 'measure', filter: ['==', get('kind'), 'leg'],
      layout: {
        'text-field': get('label'), 'text-font': FONTS.sansMedium, 'text-size': 12.5,
        'text-allow-overlap': true, 'text-ignore-placement': true, 'text-offset': [0, -1.1],
      },
      paint: { 'text-color': P.ink, 'text-halo-color': P.paper, 'text-halo-width': 2.6, 'text-halo-blur': 0 },
    },
  ];
}
