// Tramos de recorrido y paradas numeradas. Sin React ni MapLibre.
import { FONTS } from '../palettes.js';
import { get, vis, labelHalo, AHEAD_OPACITY, AHEAD_NAME_OPACITY } from './shared.js';

// Las tres capas de un origen de tramos. Aproximado e hipotético siempre punteados
// (DESIGN.md §5); solo texto/inicio van con trazo continuo.
function legLayers(source, color) {
  return [
    {
      id: source + '-texto', type: 'line', source,
      filter: ['in', get('leg'), ['literal', ['texto', 'inicio']]],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': color, 'line-width': 2.6, 'line-opacity': AHEAD_OPACITY },
    },
    {
      id: source + '-aprox', type: 'line', source,
      filter: ['==', get('leg'), 'aprox'],
      layout: { 'line-join': 'round' },
      paint: { 'line-color': color, 'line-width': 2.6, 'line-dasharray': [3, 2], 'line-opacity': AHEAD_OPACITY },
    },
    {
      id: source + '-hipotetico', type: 'line', source,
      filter: ['==', get('leg'), 'hipotetico'],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': color, 'line-width': 2.6, 'line-dasharray': [0.5, 2.5], 'line-opacity': AHEAD_OPACITY },
    },
  ];
}

export function routeLegLayers(legColor) {
  return [...legLayers('route-legs', legColor), ...legLayers('route-anim', legColor)];
}

export function routeStopLayers(P, legColor, labelsOn) {
  const halo = labelHalo(P);
  return [
    {
      // Pendientes: disco opaco del color del papel con borde del recorrido; llegadas: relleno sólido.
      id: 'route-stops', type: 'circle', source: 'route-stops',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 7, 10, 9],
        'circle-color': ['case', ['==', get('ahead'), 1], P.paper, legColor],
        'circle-stroke-color': ['case', ['==', get('ahead'), 1], legColor, P.paper],
        'circle-stroke-width': ['case', ['==', get('ahead'), 1], 1.6, 1.5],
      },
    },
    {
      id: 'route-stops-name', type: 'symbol', source: 'route-stops',
      layout: {
        visibility: vis(labelsOn),
        'text-field': get('name'), 'text-font': FONTS.serifBold,
        'text-size': ['interpolate', ['linear'], ['zoom'], 5, 12, 10, 14],
        'text-variable-anchor': ['left', 'right', 'top', 'bottom'], 'text-radial-offset': 1.05,
        'text-justify': 'auto', 'text-max-width': 9, 'text-padding': 2,
      },
      paint: { 'text-color': P.ink, ...halo, 'text-opacity': AHEAD_NAME_OPACITY },
    },
    {
      id: 'route-stop-active', type: 'circle', source: 'route-stops', filter: ['==', get('act'), 1],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 12, 10, 15],
        'circle-color': legColor, 'circle-opacity': 0.22,
        'circle-stroke-color': legColor, 'circle-stroke-width': 2,
      },
    },
    {
      id: 'route-stops-num', type: 'symbol', source: 'route-stops',
      layout: {
        'text-field': ['to-string', get('n')], 'text-font': FONTS.sansMedium, 'text-size': 10.5,
        'text-allow-overlap': true, 'text-ignore-placement': true,
      },
      paint: { 'text-color': ['case', ['==', get('ahead'), 1], legColor, '#FFFFFF'] },
    },
  ];
}
