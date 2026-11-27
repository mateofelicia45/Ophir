// Estilo MapLibre del atlas. Capa pura: arma la StyleSpecification a partir del
// mapa base local y de los colores del prototipo. Sin React ni MapLibre.

export const INITIAL_VIEW = { center: [35.3, 31.8], zoom: 6.3 };
// bbox del mapa base (Tarea 4): [[oeste, sur], [este, norte]]
export const ATLAS_BOUNDS = [[-12, 10], [65, 48]];
export const CREDITS = 'OpenBible.info (CC BY 4.0) · Natural Earth · © colaboradores de OpenStreetMap (ODbL)';
export const RELIEF_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
export const DEFAULT_GLYPHS = '/glyphs/{fontstack}/{range}.pbf';

// Tipografías servidas como glifos locales (tools/build-glyphs.mjs).
export const FONTS = {
  serif: ['Source Serif 4 Regular'],
  serifItalic: ['Source Serif 4 Italic'],
  serifBold: ['Source Serif 4 Semibold'],
  serifBoldItalic: ['Source Serif 4 Semibold Italic'],
  sans: ['IBM Plex Sans Regular'],
  sansMedium: ['IBM Plex Sans Medium'],
};

// Variables CSS del prototipo (docs/prototipos/atlas-biblico/Main.dc.html, .app y .app.dark).
export const PALETTES = {
  light: {
    paper: '#FBFAF7', ink: '#1D2327', ink2: '#465056', accent: '#1F5C7A', accentInk: '#FFFFFF', clay: '#A3452A',
    sea: '#CBD9E1', land: '#F4F1E9', coast: '#93A9B6', lake: '#BCD0DB', border: '#857F75', river: '#4A82A8',
    halo: 'rgba(251,250,247,.92)',
    't-ciudad': '#22292E', 't-sitio': '#A3452A', 't-montana': '#7A4F2C', 't-fuente': '#2A6A92', 't-isla': '#0E7470',
    't-rio': '#2A6A92', 't-mar': '#2F6488', 't-desierto': '#86600F', 't-valle': '#3E6C2C', 't-region': '#5F4785',
    't-reino': '#5F4785', 't-camino': '#87553D',
    c1: '#B4672F', c2: '#3F77A0', c3: '#6E8E36', c4: '#8E5A88', c5: '#A88627',
    r0: '#B4532F', r1: '#2E6C9E', r2: '#5E7F22', r3: '#874C98', r4: '#A87C12', r5: '#227F78', r6: '#A23C60', r7: '#55606B',
    hsShadow: '#4A3B2A', hsHighlight: '#FFFFFF', hsAccent: '#6B5A45',
  },
  dark: {
    paper: '#161A1D', ink: '#E8E6E0', ink2: '#BCC0BE', accent: '#86BCD6', accentInk: '#0E1417', clay: '#E39273',
    sea: '#0F1A21', land: '#23292D', coast: '#3F5665', lake: '#13222B', border: '#8A8781', river: '#5592B8',
    halo: 'rgba(22,26,29,.9)',
    't-ciudad': '#ECEAE4', 't-sitio': '#E39273', 't-montana': '#D1A57E', 't-fuente': '#74B6DC', 't-isla': '#5CC6C1',
    't-rio': '#74B6DC', 't-mar': '#7DB3D6', 't-desierto': '#DDB75C', 't-valle': '#93C47D', 't-region': '#BBA5DE',
    't-reino': '#BBA5DE', 't-camino': '#D3A288',
    c1: '#D08A55', c2: '#6FA3CB', c3: '#9BBE61', c4: '#BE86B8', c5: '#D6B653',
    r0: '#E0805C', r1: '#6EA8D6', r2: '#A3C463', r3: '#C08AD3', r4: '#E0B545', r5: '#5CC2B8', r6: '#E07CA0', r7: '#A9B4BE',
    hsShadow: '#000000', hsHighlight: '#8FA3AE', hsAccent: '#1B2226',
  },
};

// Tipos que se dibujan con marcador (el resto son lugares de área: solo etiqueta).
export const PIN_TYPES = ['ciudad', 'sitio', 'montana', 'fuente', 'isla'];
const TYPES = [...PIN_TYPES, 'rio', 'mar', 'desierto', 'valle', 'region', 'reino', 'camino'];

const fc = (features = []) => ({ type: 'FeatureCollection', features });
const isPin = (f) => PIN_TYPES.includes(f.properties && f.properties.type);
export function splitPins(places) {
  return fc((places && places.features ? places.features : []).filter(isPin));
}

// Bloques de capas, de abajo hacia arriba. layerGroup dice a qué bloque pertenece una capa.
const GROUPS = [
  ['sea', ['sea']],
  ['hillshade', ['relief-land-base', 'hillshade', 'relief-sea-mask']],
  ['land', ['land', 'land-coast']],
  ['lakes', ['lakes']],
  ['rivers', ['rivers']],
  ['borders', ['borders']],
  ['territories-fill', ['territories-fill']],
  ['territories-line', ['territories-line', 'territories-line-disc']],
  ['roads', ['roads']],
  ['route-legs', ['route-legs-texto', 'route-legs-aprox', 'route-legs-hipotetico']],
  ['places-cluster', ['places-cluster', 'places-cluster-count']],
  ['places-circle', ['places-circle']],
  ['places-major', ['places-major', 'places-selected']],
  ['place-labels-top', ['places-key', 'place-labels-foc', 'place-labels-sel', 'places-foc']],
  ['route-stops', ['route-stops', 'route-stops-num']],
  ['measure', ['measure-line', 'measure-points']],
];
const GROUP_OF = new Map(GROUPS.flatMap(([g, list]) => list.map((id) => [id, g])));
export function layerGroup(id) {
  if (GROUP_OF.has(id)) return GROUP_OF.get(id);
  // Nombres de pin de los marcadores principales (importancia 1-2) y todos los nombres de zona (mares, regiones...).
  if (/^place-labels-[12]$/.test(id) || /^place-labels-[a-z]+-\d$/.test(id)) return 'place-labels-top';
  if (id.startsWith('place-labels') || id === 'river-labels' || id === 'roads-label' || id === 'territories-label') return 'place-labels';
  return null;
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

const get = (k) => ['get', k];
const typeColor = (P) => ['match', get('type'), ...TYPES.flatMap((t) => [t, P['t-' + t]]), P['t-ciudad']];
const territoryColor = (P) => ['match', get('colorIndex'), 1, P.c1, 2, P.c2, 3, P.c3, 4, P.c4, 5, P.c5, P.c1];
const byImportance = (a, b, c, d) => ['match', get('importance'), 1, a, 2, b, 3, c, d];
const vis = (on) => (on ? 'visible' : 'none');

// Halo opaco y sin desenfoque: lo que quede debajo de un nombre (marcadores, ríos)
// no se transparenta entre las letras.
function labelHalo(P) {
  return { 'text-halo-color': P.paper, 'text-halo-width': 2.4, 'text-halo-blur': 0 };
}

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

export function buildStyle({
  theme = 'light',
  basemap,
  relief = false,
  extras = {},
  routeColor,
  selectedId,
  glyphs = DEFAULT_GLYPHS,
  data = {},
} = {}) {
  const P = PALETTES[theme] || PALETTES.light;
  const ex = { labels: true, cluster: false, borders: false, ...extras };
  const legColor = routeColor || P.r0;
  const places = data.places || fc();
  // Con selectedId la selección no depende de que la propiedad `sel` esté al día.
  const hasSel = selectedId !== undefined && selectedId !== null;
  const isSel = hasSel ? ['==', get('id'), selectedId] : ['==', get('sel'), 1];
  const notSel = hasSel ? ['!=', get('id'), selectedId] : ['==', get('sel'), 0];

  const sources = {
    land: { type: 'geojson', data: basemap.land },
    lakes: { type: 'geojson', data: basemap.lakes },
    rivers: { type: 'geojson', data: basemap.rivers || fc() },
    borders: { type: 'geojson', data: basemap.borders },
    territories: { type: 'geojson', data: data.territories || fc() },
    roads: { type: 'geojson', data: data.roads || fc() },
    'route-legs': { type: 'geojson', data: data.legs || fc() },
    'route-stops': { type: 'geojson', data: data.stops || fc() },
    places: { type: 'geojson', data: places },
    pins: ex.cluster
      ? { type: 'geojson', data: splitPins(places), cluster: true, clusterRadius: 38, clusterMaxZoom: 7 }
      : { type: 'geojson', data: splitPins(places) },
    measure: { type: 'geojson', data: data.measure || fc() },
  };
  if (relief) {
    sources.relief = { type: 'raster-dem', tiles: [RELIEF_TILES], encoding: 'terrarium', tileSize: 256, maxzoom: 12 };
    sources['sea-mask'] = { type: 'geojson', data: seaMask(basemap.land) };
  }

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
      layout: { visibility: vis(ex.borders), 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': P.border, 'line-width': 1, 'line-opacity': 0.9, 'line-dasharray': [1, 3.2] },
    },
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
    {
      id: 'roads', type: 'line', source: 'roads',
      layout: { 'line-join': 'round' },
      paint: { 'line-color': P['t-camino'], 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1.4, 10, 2.4], 'line-dasharray': [4, 1.8, 0.9, 1.8] },
    },
    {
      id: 'route-legs-texto', type: 'line', source: 'route-legs',
      filter: ['in', get('leg'), ['literal', ['texto', 'inicio']]],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': legColor, 'line-width': 2.6 },
    },
    {
      id: 'route-legs-aprox', type: 'line', source: 'route-legs',
      filter: ['==', get('leg'), 'aprox'],
      layout: { 'line-join': 'round' },
      paint: { 'line-color': legColor, 'line-width': 2.6, 'line-dasharray': [3, 2] },
    },
    {
      id: 'route-legs-hipotetico', type: 'line', source: 'route-legs',
      filter: ['==', get('leg'), 'hipotetico'],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': legColor, 'line-width': 2.6, 'line-dasharray': [0.5, 2.5] },
    },
  );

  if (ex.cluster) {
    layers.push(
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
    );
  }

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
  layers.push(marker('places-circle', ['all', ['==', get('importance'), 4], notFoc, notSelM], false));
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
  const placeLabels = labelLayers(P, ex.labels, notSel);
  layers.push(
    {
      id: 'river-labels', type: 'symbol', source: 'rivers', minzoom: 7,
      layout: {
        visibility: vis(ex.labels),
        'symbol-placement': 'line', 'symbol-spacing': 420,
        'text-field': get('name'), 'text-font': FONTS.serifItalic, 'text-size': 11.5, 'text-letter-spacing': 0.06,
      },
      paint: { 'text-color': P['t-rio'], ...halo },
    },
    {
      id: 'roads-label', type: 'symbol', source: 'roads', minzoom: 6.5,
      layout: {
        visibility: vis(ex.labels),
        'symbol-placement': 'line', 'symbol-spacing': 360,
        'text-field': get('name'), 'text-font': FONTS.serifItalic, 'text-size': 11,
      },
      paint: { 'text-color': P['t-camino'], ...halo },
    },
    {
      id: 'territories-label', type: 'symbol', source: 'territories',
      layout: {
        visibility: vis(ex.labels),
        'text-field': get('name'), 'text-font': FONTS.serifBoldItalic, 'text-size': 12.5, 'text-max-width': 10, 'text-padding': 6,
      },
      paint: { 'text-color': territoryColor(P), ...halo },
    },
    ...placeLabels.filter((l) => layerGroup(l.id) === 'place-labels'),
    ...majorLayers,
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
        visibility: vis(ex.labels),
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
    {
      id: 'route-stops', type: 'circle', source: 'route-stops',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 7, 10, 9],
        'circle-color': legColor, 'circle-stroke-color': P.paper, 'circle-stroke-width': 1.5,
      },
    },
    {
      id: 'route-stops-num', type: 'symbol', source: 'route-stops',
      layout: {
        'text-field': ['to-string', get('n')], 'text-font': FONTS.sansMedium, 'text-size': 10.5,
        'text-allow-overlap': true, 'text-ignore-placement': true,
      },
      paint: { 'text-color': '#FFFFFF' },
    },
    {
      id: 'measure-line', type: 'line', source: 'measure', filter: ['==', ['geometry-type'], 'LineString'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': P.ink, 'line-width': 2, 'line-dasharray': [2, 1.5] },
    },
    {
      id: 'measure-points', type: 'circle', source: 'measure', filter: ['==', ['geometry-type'], 'Point'],
      paint: { 'circle-radius': 4.5, 'circle-color': P.paper, 'circle-stroke-color': P.ink, 'circle-stroke-width': 2 },
    },
  );

  return { version: 8, name: `Ophir atlas (${theme})`, glyphs, sources, layers };
}
