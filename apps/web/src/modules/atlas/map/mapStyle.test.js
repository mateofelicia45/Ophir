import { describe, it, expect } from 'vitest';
import land from '@data/atlas/basemap/land.json';
import borders from '@data/atlas/basemap/borders.json';
import lakes from '@data/atlas/basemap/lakes.json';
import rivers from '@data/atlas/basemap/rivers.json';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { buildStyle, PALETTES, ATLAS_BOUNDS, INITIAL_VIEW, CREDITS, layerGroup, splitPins, markerImage, MARKER_IMAGE, HALO_MAX } from './mapStyle.js';

const basemap = { land, borders, lakes, rivers };
const ORDER = [
  'sea', 'hillshade', 'land', 'lakes', 'rivers', 'borders', 'territories-fill', 'territories-line',
  'roads', 'route-legs', 'places-cluster', 'places-circle', 'place-labels', 'places-major', 'place-labels-top', 'route-stops', 'measure',
];
const ids = (st) => st.layers.map((l) => l.id);
const groupsInOrder = (st) => {
  const out = [];
  for (const id of ids(st)) {
    const g = layerGroup(id);
    if (out[out.length - 1] !== g) out.push(g);
  }
  return out;
};
const isSubsequence = (sub, seq) => {
  let i = 0;
  for (const x of seq) if (x === sub[i]) i++;
  return i === sub.length;
};

describe('buildStyle', () => {
  const variants = [
    { theme: 'light', relief: true, extras: { borders: true, cluster: true, labels: true } },
    { theme: 'dark', relief: false, extras: { borders: false, cluster: false, labels: true } },
    { theme: 'light', relief: false, extras: {} },
  ];

  it.each(variants)('las capas siguen el orden pedido (%o)', (opts) => {
    const st = buildStyle({ ...opts, basemap });
    expect(st.version).toBe(8);
    const groups = groupsInOrder(st);
    // cada grupo aparece una sola vez, en un bloque contiguo
    expect(new Set(groups).size).toBe(groups.length);
    // y todos pertenecen a la lista, en ese orden
    for (const g of groups) expect(ORDER, g).toContain(g);
    expect(isSubsequence(groups, ORDER)).toBe(true);
    expect(st.layers[0]).toMatchObject({ id: 'sea', type: 'background' });
  });

  it.each(variants)('es una StyleSpecification válida para MapLibre (%o)', (opts) => {
    const st = buildStyle({ ...opts, basemap, theme: opts.theme });
    expect(validateStyleMin(st)).toEqual([]);
    expect(validateStyleMin(buildStyle({ ...opts, basemap, theme: 'dark' }))).toEqual([]);
  });

  it('con relief:true hay hillshade sobre una fuente raster-dem terrarium', () => {
    const st = buildStyle({ theme: 'light', basemap, relief: true });
    const hs = st.layers.find((l) => l.id === 'hillshade');
    expect(hs).toBeDefined();
    expect(hs.type).toBe('hillshade');
    const src = st.sources[hs.source];
    expect(src).toMatchObject({ type: 'raster-dem', encoding: 'terrarium', maxzoom: 12 });
    expect(src.tiles).toEqual(['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']);
    expect(ids(st).indexOf('hillshade')).toBeLessThan(ids(st).indexOf('land'));
    // el relieve se ve sobre la tierra y no sobre el fondo del mar
    const i = (id) => ids(st).indexOf(id);
    expect(i('relief-land-base')).toBeLessThan(i('hillshade'));
    expect(i('relief-sea-mask')).toBeGreaterThan(i('hillshade'));
    expect(i('relief-sea-mask')).toBeLessThan(i('land'));
    const mask = st.sources['sea-mask'].data;
    expect(mask.geometry.type).toBe('Polygon');
    // un anillo exterior (el bbox) y un agujero por cada polígono de tierra
    const nLand = land.features.reduce((n, f) => n + (f.geometry.type === 'Polygon' ? 1 : f.geometry.coordinates.length), 0);
    expect(mask.geometry.coordinates.length).toBe(1 + nLand);
  });

  it('con relief:false no existe hillshade ni la fuente de relieve', () => {
    const st = buildStyle({ theme: 'dark', basemap, relief: false });
    expect(st.layers.some((l) => l.type === 'hillshade' || l.id === 'hillshade')).toBe(false);
    expect(Object.values(st.sources).some((s) => s.type === 'raster-dem')).toBe(false);
    expect(ids(st).some((id) => id.startsWith('relief-'))).toBe(false);
    expect(st.layers.find((l) => l.id === 'land').paint['fill-opacity']).toBe(1);
  });

  it.each(['light', 'dark'])('tema %s: territorios y tramos aprox/hipotético siempre punteados', (theme) => {
    const st = buildStyle({ theme, basemap, relief: false });
    const terr = st.layers.filter((l) => l.id.startsWith('territories-line'));
    expect(terr.length).toBeGreaterThan(0);
    for (const l of terr) expect(l.paint['line-dasharray'], l.id).toBeDefined();
    const aprox = st.layers.find((l) => l.id === 'route-legs-aprox');
    const hipo = st.layers.find((l) => l.id === 'route-legs-hipotetico');
    expect(aprox.paint['line-dasharray']).toEqual([3, 2]);
    expect(hipo.paint['line-dasharray']).toEqual([0.5, 2.5]);
    expect(aprox.filter).toEqual(['==', ['get', 'leg'], 'aprox']);
    expect(hipo.filter).toEqual(['==', ['get', 'leg'], 'hipotetico']);
    // ninguna otra capa de tramos dibuja aprox o hipotético
    const solid = st.layers.filter((l) => l.id.startsWith('route-legs') && !l.paint['line-dasharray']);
    for (const l of solid) {
      const f = JSON.stringify(l.filter);
      expect(f, l.id).not.toContain('aprox');
      expect(f, l.id).not.toContain('hipotetico');
      expect(f, l.id).toContain('texto');
    }
  });

  it('los caminos antiguos y las fronteras también son punteados', () => {
    const st = buildStyle({ theme: 'light', basemap, relief: false });
    for (const id of ['roads', 'borders']) {
      const l = st.layers.find((x) => x.id === id);
      expect(l.paint['line-dasharray'], id).toBeDefined();
    }
  });

  it('las fronteras se ocultan salvo extras.borders', () => {
    const off = buildStyle({ theme: 'light', basemap, relief: false, extras: { borders: false } });
    const on = buildStyle({ theme: 'light', basemap, relief: false, extras: { borders: true } });
    expect(off.layers.find((l) => l.id === 'borders').layout.visibility).toBe('none');
    expect(on.layers.find((l) => l.id === 'borders').layout.visibility).toBe('visible');
  });

  it('el agrupamiento solo existe con extras.cluster', () => {
    const off = buildStyle({ theme: 'light', basemap, relief: false, extras: { cluster: false } });
    const on = buildStyle({ theme: 'light', basemap, relief: false, extras: { cluster: true } });
    expect(off.sources.pins.cluster).toBeFalsy();
    expect(off.layers.some((l) => l.id.startsWith('places-cluster'))).toBe(false);
    expect(on.sources.pins.cluster).toBe(true);
    expect(on.layers.some((l) => l.id === 'places-cluster')).toBe(true);
    // los lugares de área (reinos, mares…) no se agrupan
    expect(on.sources.places.cluster).toBeFalsy();
  });

  it('con extras.labels:false las etiquetas de lugar quedan ocultas', () => {
    const st = buildStyle({ theme: 'light', basemap, relief: false, extras: { labels: false } });
    const labels = st.layers.filter((l) => l.id.startsWith('place-labels') && l.id !== 'place-labels-sel');
    expect(labels.length).toBeGreaterThan(0);
    for (const l of labels) expect(l.layout.visibility, l.id).toBe('none');
  });

  it('las etiquetas de importancia 1 aparecen antes (menor minzoom) que las de 4', () => {
    const st = buildStyle({ theme: 'light', basemap, relief: false });
    const l1 = st.layers.find((l) => l.id === 'place-labels-1');
    const l4 = st.layers.find((l) => l.id === 'place-labels-4');
    expect(l1.minzoom ?? 0).toBeLessThan(l4.minzoom);
    // y se colocan primero: van más arriba en la pila
    expect(ids(st).indexOf('place-labels-1')).toBeGreaterThan(ids(st).indexOf('place-labels-4'));
  });

  it('usa los colores del prototipo para cada tema', () => {
    const light = buildStyle({ theme: 'light', basemap, relief: false });
    const dark = buildStyle({ theme: 'dark', basemap, relief: false });
    expect(light.layers[0].paint['background-color']).toBe('#CBD9E1');
    expect(dark.layers[0].paint['background-color']).toBe('#0F1A21');
    expect(light.layers.find((l) => l.id === 'land').paint['fill-color']).toBe(PALETTES.light.land);
    expect(dark.layers.find((l) => l.id === 'land').paint['fill-color']).toBe('#23292D');
  });

  it('con selectedId la selección se filtra por id; sin él, por la propiedad sel', () => {
    const a = buildStyle({ theme: 'light', basemap, relief: false });
    const b = buildStyle({ theme: 'light', basemap, relief: false, selectedId: 'jerusalem' });
    const f = (st, id) => st.layers.find((l) => l.id === id).filter;
    expect(f(a, 'places-selected')).toEqual(['==', ['get', 'sel'], 1]);
    expect(f(b, 'places-selected')).toEqual(['==', ['get', 'id'], 'jerusalem']);
    expect(f(b, 'place-labels-sel')).toEqual(['==', ['get', 'id'], 'jerusalem']);
    expect(JSON.stringify(f(b, 'place-labels-1'))).toContain('["!=",["get","id"],"jerusalem"]');
  });

  it('los marcadores son símbolos SDF: entran en las colisiones con los nombres', () => {
    const st = buildStyle({ basemap, theme: 'light' });
    const marks = st.layers.filter((l) => ['places-circle', 'places-major', 'places-foc'].includes(l.id));
    expect(marks).toHaveLength(3);
    for (const l of marks) {
      expect(l.type).toBe('symbol');
      expect(l.layout['icon-image']).toBe(MARKER_IMAGE);
    }
    const by = Object.fromEntries(marks.map((l) => [l.id, l.layout]));
    // nunca se dibujan a través de un nombre, salvo los del foco
    expect(by['places-circle']['icon-allow-overlap']).toBe(false);
    expect(by['places-major']['icon-allow-overlap']).toBe(false);
    expect(by['places-major']['icon-ignore-placement']).toBe(false);
    expect(by['places-foc']['icon-allow-overlap']).toBe(true);
    // los nombres principales y los del foco se colocan antes que los marcadores
    const order = ids(st);
    expect(order.indexOf('place-labels-1')).toBeGreaterThan(order.indexOf('places-major'));
    expect(order.indexOf('place-labels-4')).toBeLessThan(order.indexOf('places-major'));
  });

  it('los nombres llevan halo opaco y sin desenfoque, y poco espaciado', () => {
    const st = buildStyle({ basemap, theme: 'dark' });
    for (const l of st.layers.filter((x) => x.type === 'symbol' && x.paint && x.paint['text-halo-color'])) {
      expect(l.paint['text-halo-color'], l.id).toBe(PALETTES.dark.paper);
      expect(l.paint['text-halo-blur'], l.id).toBe(0);
      expect(l.paint['text-halo-width'], l.id).toBeGreaterThanOrEqual(2.4);
      const ls = l.layout['text-letter-spacing'];
      if (typeof ls === 'number') expect(ls, l.id).toBeLessThanOrEqual(0.1);
    }
  });

  it('markerImage es un disco SDF: opaco en el centro, transparente en las esquinas', () => {
    const img = markerImage();
    expect(img.data.length).toBe(img.width * img.height * 4);
    const alpha = (x, y) => img.data[(y * img.width + x) * 4 + 3];
    const c = img.width / 2;
    expect(alpha(c, c)).toBe(255);
    expect(alpha(0, 0)).toBe(0);
  });

  it('el halo del marcador nunca llega al borde de la imagen (no se ve cuadrado)', () => {
    const img = markerImage();
    const c = img.width / 2;
    // Umbral del halo en el shader SDF de MapLibre: (6 - ancho/icon-size) / 8.
    const threshold = ((6 - HALO_MAX) / 8) * 255;
    expect(img.data[(c * img.width) * 4 + 3]).toBeLessThan(threshold);
    const st = buildStyle({ basemap, theme: 'light' });
    for (const id of ['places-circle', 'places-major', 'places-foc']) {
      const w = st.layers.find((l) => l.id === id).paint['icon-halo-width'];
      for (let i = 4; i < w.length; i += 2) expect(w[i][0], id).toBe('min');
    }
  });

  it('los lugares del foco llevan etiqueta propia en arcilla', () => {
    const st = buildStyle({ basemap, theme: 'light' });
    const l = st.layers.find((x) => x.id === 'place-labels-foc');
    expect(l.filter).toContainEqual(['==', ['get', 'foc'], 1]);
    expect(l.paint['text-color']).toBe(PALETTES.light.clay);
  });
  it('el color de la ruta activa se recibe por parámetro', () => {
    const st = buildStyle({ theme: 'light', basemap, relief: false, routeColor: '#123456' });
    const legs = st.layers.filter((l) => l.id.startsWith('route-legs'));
    for (const l of legs) expect(l.paint['line-color'], l.id).toBe('#123456');
  });

  it('las fuentes del mapa base son locales y los glifos se sirven desde la app', () => {
    const st = buildStyle({ theme: 'light', basemap, relief: false, glyphs: '/base/glyphs/{fontstack}/{range}.pbf' });
    expect(st.glyphs).toBe('/base/glyphs/{fontstack}/{range}.pbf');
    for (const k of ['land', 'borders', 'lakes', 'rivers']) {
      expect(st.sources[k]).toMatchObject({ type: 'geojson', data: basemap[k] });
    }
    const st2 = buildStyle({ theme: 'light', basemap, relief: false });
    expect(st2.glyphs).toBe('/glyphs/{fontstack}/{range}.pbf');
    // ninguna URL externa salvo el relieve
    const json = JSON.stringify(st2);
    expect(json).not.toMatch(/https?:\/\//);
  });

  it('todas las capas de texto usan tipografías generadas en public/glyphs', async () => {
    const { existsSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const dir = fileURLToPath(new URL('../../../../public/glyphs/', import.meta.url));
    const st = buildStyle({ theme: 'dark', basemap, relief: true, extras: { cluster: true } });
    const fonts = new Set();
    for (const l of st.layers) if (l.type === 'symbol' && l.layout['text-font']) for (const f of l.layout['text-font']) fonts.add(f);
    expect(fonts.size).toBeGreaterThan(0);
    for (const f of fonts) {
      expect(existsSync(`${dir}${f}/0-255.pbf`), f).toBe(true);
      expect(existsSync(`${dir}${f}/256-511.pbf`), f).toBe(true);
      expect(existsSync(`${dir}${f}/8192-8447.pbf`), f).toBe(true);
    }
  });

  it('las fuentes de datos dinámicos existen vacías por defecto', () => {
    const st = buildStyle({ theme: 'light', basemap, relief: false });
    for (const k of ['places', 'pins', 'territories', 'roads', 'route-legs', 'route-stops', 'measure']) {
      expect(st.sources[k], k).toMatchObject({ type: 'geojson' });
      expect(st.sources[k].data.type, k).toBe('FeatureCollection');
    }
  });

  it('acepta datos iniciales para las fuentes dinámicas', () => {
    const pt = (id, type) => ({ type: 'Feature', properties: { id, type, importance: 1, sel: 0, dim: 0 }, geometry: { type: 'Point', coordinates: [35, 31] } });
    const places = { type: 'FeatureCollection', features: [pt('jerusalem', 'ciudad'), pt('judea', 'region')] };
    const st = buildStyle({ theme: 'light', basemap, relief: false, data: { places } });
    expect(st.sources.places.data).toBe(places);
    // los marcadores solo llevan los tipos puntuales
    expect(st.sources.pins.data.features.map((f) => f.properties.id)).toEqual(['jerusalem']);
    expect(splitPins(places).features.map((f) => f.properties.id)).toEqual(['jerusalem']);
  });
});

describe('constantes del mapa', () => {
  it('vista inicial y límites', () => {
    expect(INITIAL_VIEW).toEqual({ center: [35.3, 31.8], zoom: 6.3 });
    expect(ATLAS_BOUNDS).toEqual([[-12, 10], [65, 48]]);
  });
  it('créditos', () => {
    expect(CREDITS).toBe('OpenBible.info (CC BY 4.0) · Natural Earth · © colaboradores de OpenStreetMap (ODbL)');
  });
  it('las dos paletas tienen las mismas claves', () => {
    expect(Object.keys(PALETTES.dark).sort()).toEqual(Object.keys(PALETTES.light).sort());
  });
});
