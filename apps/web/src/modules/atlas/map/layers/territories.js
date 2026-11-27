// Territorios (relleno, contorno punteado) y su nombre. Sin React ni MapLibre.
import { FONTS } from '../palettes.js';
import { get, vis, labelHalo, territoryColor } from './shared.js';

export function territoryLayers(P) {
  return [
    {
      id: 'territories-fill', type: 'fill', source: 'territories',
      paint: { 'fill-color': territoryColor(P), 'fill-opacity': ['case', ['==', get('kind'), 'disc'], 0.06, 0.15] },
    },
    {
      id: 'territories-line', type: 'line', source: 'territories',
      filter: ['!=', get('kind'), 'disc'],
      layout: { 'line-join': 'round' },
      paint: { 'line-color': territoryColor(P), 'line-opacity': 0.95, 'line-width': 1.5, 'line-dasharray': [5, 2.5] },
    },
    {
      id: 'territories-line-disc', type: 'line', source: 'territories',
      filter: ['==', get('kind'), 'disc'],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': territoryColor(P), 'line-opacity': 0.95, 'line-width': 1.6, 'line-dasharray': [1.2, 2.5] },
    },
  ];
}

export function territoryLabelLayers(P, labelsOn) {
  const halo = labelHalo(P);
  return [
    {
      id: 'territories-label', type: 'symbol', source: 'territories',
      layout: {
        visibility: vis(labelsOn),
        'text-field': get('name'), 'text-font': FONTS.serifBoldItalic, 'text-size': 12.5, 'text-max-width': 10, 'text-padding': 6,
      },
      paint: { 'text-color': territoryColor(P), ...halo },
    },
  ];
}
