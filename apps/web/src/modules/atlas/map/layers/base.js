// Mar, relieve, tierra, lagos, ríos y fronteras. Sin React ni MapLibre.
import { ATLAS_BOUNDS } from '../bounds.js';
import { FONTS } from '../palettes.js';
import { get, vis, labelHalo } from './shared.js';

// Máscara del mar: el bbox con un agujero por cada polígono de tierra. Va sobre
// el relieve para que la sombra del fondo marino no ensucie el mar.
const maskCache = new WeakMap();
export function seaMask(landFc) {
  if (maskCache.has(landFc)) return maskCache.get(landFc);
  const [[w, s], [e, n]] = ATLAS_BOUNDS;
  const rings = [[[w - 1, s - 1], [e + 1, s - 1], [e + 1, n + 1], [w - 1, n + 1], [w - 1, s - 1]]];
  for (const f of landFc.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const p of polys) rings.push(p[0]);
  }
  const mask = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: rings } };
  maskCache.set(landFc, mask);
  return mask;
}

export function baseLayers(P, { theme, relief, borders }) {
  const layers = [{ id: 'sea', type: 'background', paint: { 'background-color': P.sea } }];

  if (relief) {
    // Base opaca de tierra bajo la sombra: así la capa `land` (semitransparente
    // con relieve) no toma el color del mar.
    layers.push({ id: 'relief-land-base', type: 'fill', source: 'land', paint: { 'fill-color': P.land } });
    layers.push({
      id: 'hillshade', type: 'hillshade', source: 'relief',
      paint: {
        'hillshade-exaggeration': theme === 'dark' ? 0.35 : 0.55,
        'hillshade-shadow-color': P.hsShadow,
        'hillshade-highlight-color': P.hsHighlight,
        'hillshade-accent-color': P.hsAccent,
      },
    });
    layers.push({ id: 'relief-sea-mask', type: 'fill', source: 'sea-mask', paint: { 'fill-color': P.sea } });
  }

  layers.push(
    // Con relieve, la tierra deja ver la sombra que queda debajo.
    { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': P.land, 'fill-opacity': relief ? 0.45 : 1 } },
    { id: 'land-coast', type: 'line', source: 'land', paint: { 'line-color': P.coast, 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 10, 1.2] } },
    { id: 'lakes', type: 'fill', source: 'lakes', paint: { 'fill-color': P.lake, 'fill-outline-color': P.coast } },
    {
      id: 'rivers', type: 'line', source: 'rivers',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': P.river, 'line-opacity': 0.9, 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.8, 8, 1.4, 12, 2.4] },
    },
    {
      id: 'borders', type: 'line', source: 'borders',
      layout: { visibility: vis(borders), 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': P.border, 'line-width': 1, 'line-opacity': 0.9, 'line-dasharray': [1, 3.2] },
    },
  );
  return layers;
}

export function riverLabelLayers(P, labelsOn) {
  const halo = labelHalo(P);
  return [
    {
      id: 'river-labels', type: 'symbol', source: 'rivers', minzoom: 7,
      layout: {
        visibility: vis(labelsOn),
        'symbol-placement': 'line', 'symbol-spacing': 420,
        'text-field': get('name'), 'text-font': FONTS.serifItalic, 'text-size': 11.5, 'text-letter-spacing': 0.06,
      },
      paint: { 'text-color': P['t-rio'], ...halo },
    },
  ];
}
