// Estilo MapLibre del atlas. Capa pura: arma la StyleSpecification a partir del
// mapa base local y de los colores del prototipo. Sin React ni MapLibre.
import { ATLAS_BOUNDS, INITIAL_VIEW, CREDITS, RELIEF_TILES, DEFAULT_GLYPHS } from './bounds.js';
import { FONTS, PALETTES } from './palettes.js';
import { fc, get, PIN_TYPES } from './layers/shared.js';
import { layerGroup } from './layers/groups.js';
import { baseLayers, riverLabelLayers, seaMask } from './layers/base.js';
import { territoryLayers, territoryLabelLayers } from './layers/territories.js';
import { roadLayers, roadLabelLayers } from './layers/roads.js';
import { routeLegLayers, routeStopLayers } from './layers/routes.js';
import { measureLayers } from './layers/measure.js';
import { modernLayers } from './layers/modern.js';
import { youLayers } from './layers/you.js';
import { splitPins, clusterLayers, placeLayers, markerImage, MARKER_IMAGE, HALO_MAX } from './layers/places.js';

export {
  ATLAS_BOUNDS, INITIAL_VIEW, CREDITS, RELIEF_TILES, DEFAULT_GLYPHS,
  FONTS, PALETTES, PIN_TYPES, layerGroup, seaMask, splitPins, markerImage, MARKER_IMAGE, HALO_MAX,
};

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
  const ex = { labels: true, cluster: false, borders: false, roads: false, modern: false, ...extras };
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
    modern: { type: 'geojson', data: data.modern || fc() },
    you: { type: 'geojson', data: data.you || fc() },
    'route-legs': { type: 'geojson', data: data.legs || fc() },
    'route-stops': { type: 'geojson', data: data.stops || fc() },
    'route-anim': { type: 'geojson', data: data.anim || fc() },
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

  const layers = [
    ...baseLayers(P, { theme, relief, borders: ex.borders }),
    ...territoryLayers(P),
    ...roadLayers(P, ex.roads),
    ...routeLegLayers(legColor),
  ];
  if (ex.cluster) layers.push(...clusterLayers(P));

  const pl = placeLayers(P, { labelsOn: ex.labels, isSel, notSel });
  layers.push(
    ...modernLayers(P, ex.modern),
    pl.circle,
    ...riverLabelLayers(P, ex.labels),
    ...roadLabelLayers(P, ex.labels, ex.roads),
    ...territoryLabelLayers(P, ex.labels),
    ...pl.low,
    ...pl.major,
    ...pl.top,
    ...routeStopLayers(P, legColor, ex.labels),
    ...measureLayers(P),
    ...youLayers(P),
  );

  // Las paradas del recorrido abierto (`rs`) las dibujan sus propias capas: sin marcador
  // ni nombre duplicado debajo del disco numerado.
  const notStop = ['!=', get('rs'), 1];
  for (const l of layers) {
    if ((l.source === 'places' || l.source === 'pins') && l.id !== 'places-selected' && !l.id.startsWith('places-cluster')) {
      if (!l.filter) l.filter = notStop;
      else l.filter = l.filter[0] === 'all' ? [...l.filter, notStop] : ['all', l.filter, notStop];
    }
  }

  return { version: 8, name: `Ophir atlas (${theme})`, glyphs, sources, layers };
}
