// Nombres modernos de referencia (ciudades y países de hoy), tenues y siempre por
// debajo de los nombres bíblicos: van antes en la pila, así que ceden en cada colisión.
// Sin React ni MapLibre.
import { FONTS } from '../palettes.js';
import { get, vis, labelHalo } from './shared.js';
import { MARKER_IMAGE } from './places.js';

// Zoom mínimo por rango de ciudad (1 = grandes).
const CITY_MINZ = { 1: 3.6, 2: 5, 3: 6.4 };

export function modernLayers(P, on) {
  const halo = labelHalo(P);
  const layers = [
    {
      id: 'modern-countries', type: 'symbol', source: 'modern', minzoom: 3, maxzoom: 7.6,
      filter: ['==', get('kind'), 'country'],
      layout: {
        visibility: vis(on),
        'text-field': get('name'), 'text-font': FONTS.sans,
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 7, 13],
        'text-transform': 'uppercase', 'text-letter-spacing': 0.32, 'text-max-width': 7, 'text-padding': 8,
      },
      paint: { 'text-color': P.ink2, 'text-opacity': 0.45, ...halo },
    },
  ];
  for (const rank of [3, 2, 1]) {
    layers.push({
      id: `modern-cities-${rank}`, type: 'symbol', source: 'modern', minzoom: CITY_MINZ[rank],
      filter: ['all', ['==', get('kind'), 'city'], ['==', get('rank'), rank]],
      layout: {
        visibility: vis(on),
        'icon-image': MARKER_IMAGE, 'icon-size': 0.2, 'icon-padding': 0,
        'text-field': get('name'), 'text-font': FONTS.sans,
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 10, 12.5],
        'text-variable-anchor': ['left', 'right', 'bottom', 'top'], 'text-radial-offset': 0.55,
        'text-justify': 'auto', 'text-max-width': 8, 'text-padding': 2,
      },
      paint: {
        'icon-color': P.ink2, 'icon-opacity': 0.55,
        'text-color': P.ink2, 'text-opacity': 0.8, ...halo,
      },
    });
  }
  return layers;
}
