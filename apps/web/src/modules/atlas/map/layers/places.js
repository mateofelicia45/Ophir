// Marcadores y nombres de lugares (con y sin agrupación). Sin React ni MapLibre.
import { FONTS } from '../palettes.js';
import { layerGroup } from './groups.js';
import { PIN_TYPES, fc, get, vis, labelHalo, typeColor, byImportance } from './shared.js';

const isPin = (f) => PIN_TYPES.includes(f.properties && f.properties.type);
export function splitPins(places) {
  return fc((places && places.features ? places.features : []).filter(isPin));
}

// Zoom mínimo de etiqueta por importancia (índice 0 = importancia 1), del prototipo (_render).
// Dentro de cada importancia, la última familia queda más arriba y gana las colisiones:
// las ciudades y sitios (marcadores) van al final para que Jerusalén no pierda ante «Río Jordán».
const LABEL_FAMILIES = [
  { key: 'nat', types: ['rio', 'desierto', 'valle', 'camino'], minz: [4.6, 6, 7.2, 8.4] },
  { key: 'region', types: ['region'], minz: [3.6, 5.2, 6.6, 8], maxzoom: 10.5 },
  { key: 'reino', types: ['reino'], minz: [2.6, 4.6, 6.2, 7.8], maxzoom: 9.5 },
  { key: 'mar', types: ['mar'], minz: [2.4, 5, 6.4, 7.8] },
  { key: 'pin', types: PIN_TYPES, minz: [3.4, 5.6, 7.1, 8.6] },
];

// Marcador de lugar: un disco SDF que se tiñe con icon-color; el borde es el halo.
// Va como capa symbol para que los marcadores entren en el cálculo de colisiones
// y las etiquetas no se dibujen encima de ellos.
export const MARKER_IMAGE = 'atlas-disc';
const MARKER_PX = 10; // radio en px de pantalla con icon-size 1
// Margen chico frente al radio: la caja de colisión es la imagen entera y no debe
// ser mucho mayor que el disco visible (si no, el propio nombre oculta su marcador).
const SDF_PAD = 6;
// Halo máximo (en px SDF de MapLibre, 32 niveles) que cabe en SDF_PAD con 28 niveles por px.
export const HALO_MAX = 4.2;
// Imagen SDF del disco (pixelRatio 2): borde en 192, 28 niveles por píxel de imagen.
export function markerImage() {
  const r = MARKER_PX * 2;
  const size = 2 * (r + SDF_PAD);
  const data = new Uint8Array(size * size * 4);
  const c = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
      const a = Math.max(0, Math.min(255, Math.round(192 - (d - r) * 28)));
      const i = (y * size + x) * 4;
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = a;
    }
  }
  return { width: size, height: size, data };
}

function labelLayers(P, labelsOn, notSel) {
  const out = [];
  const halo = labelHalo(P);
  // Más importante = más arriba en la pila = se coloca primero ante una colisión.
  for (let imp = 4; imp >= 1; imp--) {
    for (const fam of LABEL_FAMILIES) {
      const i = imp - 1;
      const base = {
        type: 'symbol',
        minzoom: fam.minz[i],
        filter: ['all', ['==', get('importance'), imp], notSel, ['==', get('dim'), 0], ['!=', get('foc'), 1],
          ['in', get('type'), ['literal', fam.types]]],
      };
      if (fam.maxzoom) base.maxzoom = fam.maxzoom;
      if (fam.key === 'pin') {
        const size = imp === 1 ? 13.5 : imp === 4 ? 11 : 12;
        out.push({
          ...base,
          id: `place-labels-${imp}`,
          source: 'pins',
          filter: ['all', ['!', ['has', 'point_count']], ...base.filter.slice(1)],
          layout: {
            visibility: vis(labelsOn),
            'text-field': get('name'),
            'text-font': imp === 1 ? FONTS.serifBold : FONTS.serif,
            'text-size': ['interpolate', ['linear'], ['zoom'], 5, size * 0.95, 10, size * 1.2],
            'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
            'text-radial-offset': 0.75,
            'text-justify': 'auto',
            'text-max-width': 9,
            'text-padding': 2,
          },
          paint: { 'text-color': imp === 4 ? P.ink2 : P.ink, ...halo },
        });
        continue;
      }
      const upper = fam.key === 'reino' || fam.key === 'region';
      const size = upper ? (imp === 1 ? 13 : fam.key === 'reino' ? 12 : 11) : (fam.key === 'mar' ? (imp === 1 ? 14.5 : 13) : (imp === 1 ? 14 : 12));
      out.push({
        ...base,
        id: `place-labels-${fam.key}-${imp}`,
        source: 'places',
        layout: {
          visibility: vis(labelsOn),
          'text-field': get('name'),
          'text-font': upper ? FONTS.serifBold : imp === 1 ? FONTS.serifBoldItalic : FONTS.serifItalic,
          'text-size': ['interpolate', ['linear'], ['zoom'], 4, size * 0.92, 10, size * 1.25],
          'text-transform': upper ? 'uppercase' : 'none',
          'text-letter-spacing': upper ? (fam.key === 'reino' ? 0.1 : 0.08) : fam.key === 'mar' ? 0.03 : 0.02,
          'text-max-width': upper ? 12 : 8,
          'text-padding': 4,
          // Un nombre de zona puede subir o bajar un poco para no tapar un marcador
          // principal (nunca al costado, donde parecería el nombre del punto).
          // Los mares, sobre el agua, pueden correrse también hacia los lados.
          'text-variable-anchor': fam.key === 'mar'
            ? ['center', 'top', 'bottom', 'right', 'left', 'top-right', 'bottom-right']
            : ['center', 'top', 'bottom'],
          'text-radial-offset': fam.key === 'mar' ? 1.2 : 0.6,
        },
        paint: { 'text-color': typeColor(P), ...halo },
      });
    }
  }
  return out;
}

export function clusterLayers(P) {
  return [
      {
        id: 'places-cluster', type: 'circle', source: 'pins', filter: ['has', 'point_count'],
        paint: {
          'circle-color': P.accent, 'circle-opacity': 0.92,
          'circle-radius': ['step', ['get', 'point_count'], 9, 10, 11, 50, 14],
          'circle-stroke-color': P.paper, 'circle-stroke-width': 1.5,
        },
      },
      {
        id: 'places-cluster-count', type: 'symbol', source: 'pins', filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': FONTS.sansMedium, 'text-size': 10.5, 'text-allow-overlap': true },
        paint: { 'text-color': P.accentInk },
      },
  ];
}

// Marcadores, nombres de lugar y selección, ya separados por bloque de apilado:
// circle (importancia 4), low (nombres comunes), major (importancia 3 y selección) y
// top (nombres principales, del foco y elegido, y sus marcadores).
export function placeLayers(P, { labelsOn, isSel, notSel }) {
  // Marcadores: tamaño por importancia, color por tipo; discutida, desconocida e isla van huecos.
  const isFoc = ['==', get('foc'), 1];
  const hollow = ['any', ['in', get('certainty'), ['literal', ['discutida', 'desconocida']]], ['==', get('type'), 'isla']];
  // Radio del marcador por zoom e importancia, como factor de icon-size.
  const k = (...r) => byImportance(...r.map((v) => +(v / MARKER_PX).toFixed(3)));
  // Los del foco, un poco más grandes (en el prototipo llevan un borde arcilla más grueso).
  const focScale = ['case', isFoc, 1.3, 1];
  // Radio (px) por importancia 1..4 en cada zoom de referencia.
  const RADII = [[4, [3.6, 2.8, 1.8, 1.1]], [7, [4.8, 3.9, 3, 2.2]], [9, [5.8, 5, 4.2, 3.4]], [12, [7, 6.2, 5.4, 4.6]]];
  const markerSize = ['interpolate', ['linear'], ['zoom'],
    ...RADII.flatMap(([z, r]) => [z, ['*', k(...r), focScale]])];
  // El halo del SDF se mide en unidades de la imagen (ancho / icon-size): si pasa de
  // HALO_MAX llega al borde de la imagen y el marcador se ve cuadrado. Se acota por tamaño.
  const haloWant = (z) => (z <= 5 ? ['case', isFoc, 1.3, hollow, 1.1, 0.8]
    : z <= 7 ? ['case', isFoc, 1.5, hollow, 1.4, 1] : ['case', isFoc, 1.7, hollow, 1.7, 1.2]);
  const markerHalo = ['interpolate', ['linear'], ['zoom'],
    ...RADII.flatMap(([z, r]) => [z, ['min', haloWant(z),
      ['*', byImportance(...r.map((v) => +(v / MARKER_PX * HALO_MAX).toFixed(3))), focScale]]])];
  const marker = (id, filter, block, always = false) => ({
    id, type: 'symbol', source: 'pins',
    filter: ['all', ['!', ['has', 'point_count']], filter],
    layout: {
      'icon-image': MARKER_IMAGE,
      'icon-size': markerSize,
      // Un marcador se oculta donde ya hay un nombre u otro marcador (al acercar el mapa
      // vuelve a aparecer), así nunca se dibuja a través de un nombre. Los importantes
      // reservan su lugar y los nombres menores los esquivan; los del foco se ven siempre.
      'icon-allow-overlap': always,
      'icon-ignore-placement': !block,
      'icon-padding': 0,
      'symbol-sort-key': get('importance'),
    },
    paint: {
      'icon-color': ['case', hollow, P.paper, typeColor(P)],
      'icon-halo-color': ['case', isFoc, P.clay, hollow, typeColor(P), P.paper],
      'icon-halo-width': markerHalo,
      'icon-opacity': ['case', ['==', get('dim'), 1], 0.26, ['==', get('certainty'), 'probable'], 0.75, 1],
    },
  });
  // Importancia 4: debajo de los nombres (se colocan después y ceden su lugar).
  // Importancia 3: encima de los nombres comunes, cede ante los principales.
  // Importancia 1-2 y el elegido (places-key): siempre visibles y colocados antes que
  // los nombres, que los esquivan con text-variable-anchor; cada nombre junto a su punto.
  const notFoc = ['!=', get('foc'), 1];
  const notSelM = ['!', isSel];
  const circle = marker('places-circle', ['all', ['==', get('importance'), 4], notFoc, notSelM], false);
  const majorLayers = [
    marker('places-major', ['all', ['==', get('importance'), 3], notFoc, notSelM], true),
    {
      id: 'places-selected', type: 'circle', source: 'places', filter: isSel,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 12, 10, 17],
        'circle-color': P.clay, 'circle-opacity': 0.14,
        'circle-stroke-color': P.clay, 'circle-stroke-width': 2.4,
      },
    },
  ];


  const halo = labelHalo(P);
  const placeLabels = labelLayers(P, labelsOn, notSel);
  const top = [
    // Encima de los marcadores y colocados antes que ellos: los nombres principales,
    // los del foco y el elegido nunca ceden su lugar.
    // Nombres de zona (mares, regiones, reinos): esquivan a los marcadores principales y
    // los menores (importancia 3 y 4) ceden ante ellos.
    // Prioridad de colocación (de menor a mayor): zonas 2-4, pin 2, zonas 1 (mares
    // principales), pin 1. Cada marcador principal conserva su nombre al lado.
    ...placeLabels.filter((l) => /^place-labels-[a-z]+-[234]$/.test(l.id)),
    ...placeLabels.filter((l) => l.id === 'place-labels-2'),
    ...placeLabels.filter((l) => /^place-labels-[a-z]+-1$/.test(l.id)),
    ...placeLabels.filter((l) => l.id === 'place-labels-1'),
    // Se coloca antes que todos los nombres: siempre se ve y ellos lo esquivan.
    marker('places-key', ['all', ['any', ['<=', get('importance'), 2], isSel], notFoc], true, true),
    {
      // Los lugares del foco (pasaje, personaje, recorrido) siempre llevan nombre, en arcilla.
      id: 'place-labels-foc', type: 'symbol', source: 'places', filter: ['all', ['==', get('foc'), 1], notSel],
      layout: {
        visibility: vis(labelsOn),
        'text-field': get('name'), 'text-font': FONTS.serifBold,
        'text-size': ['interpolate', ['linear'], ['zoom'], 5, 12.5, 10, 14.5],
        'text-variable-anchor': ['left', 'right', 'top', 'bottom'], 'text-radial-offset': 0.7,
        'text-justify': 'auto', 'text-max-width': 9, 'text-padding': 1,
      },
      paint: { 'text-color': P.clay, ...halo },
    },
    {
      // La selección siempre lleva nombre, aunque las etiquetas estén apagadas.
      id: 'place-labels-sel', type: 'symbol', source: 'places', filter: isSel,
      layout: {
        'text-field': get('name'), 'text-font': FONTS.serifBold, 'text-size': 14.5,
        'text-variable-anchor': ['left', 'right', 'top', 'bottom'], 'text-radial-offset': 1.1,
        'text-allow-overlap': true, 'text-max-width': 12,
      },
      paint: { 'text-color': P.ink, ...halo, 'text-halo-width': 2.8 },
    },
    // Último de su bloque: se coloca antes que todo y los nombres lo esquivan.
    marker('places-foc', isFoc, true, true),
  ];
  return { circle, low: placeLabels.filter((l) => layerGroup(l.id) === 'place-labels'), major: majorLayers, top };
}
