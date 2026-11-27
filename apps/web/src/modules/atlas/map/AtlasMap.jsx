// Mapa de estudio del atlas: envuelve MapLibre. El mapa se crea una vez; los
// datos cambian con setData y el estilo (tema, extras, selección, color de ruta)
// con setStyle en modo diff, que solo aplica las diferencias.
import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre busca su worker junto a su propio módulo; con Vite (pre-empaquetado en
// dev, chunks con hash en build) hay que darle la URL del archivo emitido.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import land from '@data/atlas/basemap/land.json';
import borders from '@data/atlas/basemap/borders.json';
import lakes from '@data/atlas/basemap/lakes.json';
import rivers from '@data/atlas/basemap/rivers.json';
import { buildStyle, splitPins, markerImage, MARKER_IMAGE, INITIAL_VIEW, ATLAS_BOUNDS, CREDITS } from './mapStyle.js';

maplibregl.setWorkerUrl(workerUrl);

const BASEMAP = { land, borders, lakes, rivers };
const EMPTY = { type: 'FeatureCollection', features: [] };
const HIT_PAD = 6;
const ROAD_LAYERS = ['roads', 'roads-label'];

// MapLibre necesita una URL absoluta con los marcadores {fontstack}/{range} sin codificar.
function glyphsUrl() {
  const base = import.meta.env.BASE_URL || '/';
  const root = base.startsWith('/') ? window.location.origin + base : new URL(base, window.location.href).href;
  return root.replace(/\/?$/, '/') + 'glyphs/{fontstack}/{range}.pbf';
}

const reducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

const placeLayerIds = (map) => map.getStyle().layers
  .map((l) => l.id)
  .filter((id) => id === 'places-circle' || id === 'places-major' || id === 'places-foc' || id === 'places-selected' || id.startsWith('place-labels'));

export default function AtlasMap({
  theme = 'light',
  places = EMPTY,
  territories = EMPTY,
  routeGeo,
  roadsGeo = EMPTY,
  measureGeo = EMPTY,
  selectedId,
  focusBounds = null,
  extras,
  routeColor,
  relief = true,
  onSelectPlace,
  onSelectRoad,
  onMapClick,
  flyTo = null,
  fitBounds = null,
  className,
  style,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const reliefFailedRef = useRef(false);
  const firstStyle = useRef(true);
  const extrasKey = JSON.stringify({ labels: true, cluster: false, borders: false, ...extras });

  // Últimos valores de props, para los listeners creados una sola vez.
  const live = useRef({});
  live.current = {
    theme, places, territories, routeGeo, roadsGeo, measureGeo, selectedId, extrasKey, routeColor, relief,
    onSelectPlace, onSelectRoad, onMapClick,
  };

  const pendingRef = useRef(new Set());
  const sourceData = (id) => {
    const p = live.current;
    switch (id) {
      case 'places': return p.places || EMPTY;
      case 'pins': return splitPins(p.places || EMPTY);
      case 'territories': return p.territories || EMPTY;
      case 'roads': return p.roadsGeo || EMPTY;
      case 'route-legs': return (p.routeGeo && p.routeGeo.legs) || EMPTY;
      case 'route-stops': return (p.routeGeo && p.routeGeo.stops) || EMPTY;
      case 'measure': return p.measureGeo || EMPTY;
      default: return EMPTY;
    }
  };
  const flushPending = (map) => {
    for (const id of [...pendingRef.current]) {
      const src = map.getSource(id);
      if (!src) continue;
      src.setData(sourceData(id));
      pendingRef.current.delete(id);
    }
  };

  const currentStyle = () => {
    const p = live.current;
    return buildStyle({
      theme: p.theme,
      basemap: BASEMAP,
      // Sin conexión ni se intenta pedir el relieve.
      relief: p.relief && !reliefFailedRef.current && navigator.onLine !== false,
      extras: JSON.parse(p.extrasKey),
      routeColor: p.routeColor,
      selectedId: p.selectedId,
      glyphs: glyphsUrl(),
      data: {
        places: sourceData('places'),
        territories: sourceData('territories'),
        roads: sourceData('roads'),
        legs: sourceData('route-legs'),
        stops: sourceData('route-stops'),
        measure: sourceData('measure'),
      },
    });
  };

  // Creación y limpieza del mapa.
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: currentStyle(),
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      maxBounds: ATLAS_BOUNDS,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 120 }), 'bottom-left');
    map.addControl(new maplibregl.AttributionControl({ compact: false, customAttribution: CREDITS }), 'bottom-right');

    // El disco de los marcadores se genera aquí y se vuelve a dar si un cambio de estilo lo pide.
    map.on('styleimagemissing', (e) => {
      if (e.id === MARKER_IMAGE && !map.hasImage(MARKER_IMAGE)) map.addImage(MARKER_IMAGE, markerImage(), { sdf: true, pixelRatio: 2 });
    });

    // El relieve es online y opcional: si falla, se oculta sin llenar la consola.
    let warned = false;
    map.on('error', (e) => {
      if (e && e.sourceId === 'relief') {
        if (!reliefFailedRef.current) {
          reliefFailedRef.current = true;
          if (map.getLayer('hillshade')) map.setLayoutProperty('hillshade', 'visibility', 'none');
          if (map.getLayer('land')) map.setPaintProperty('land', 'fill-opacity', 1);
        }
        return;
      }
      if (!warned) {
        warned = true;
        console.warn('Atlas: error del mapa', e && e.error ? e.error.message : e);
      }
    });

    const hit = (point, layers) => {
      const ids = layers.filter((id) => map.getLayer(id));
      if (!ids.length) return [];
      return map.queryRenderedFeatures(
        [[point.x - HIT_PAD, point.y - HIT_PAD], [point.x + HIT_PAD, point.y + HIT_PAD]],
        { layers: ids },
      );
    };

    map.on('click', async (e) => {
      const cl = hit(e.point, ['places-cluster'])[0];
      if (cl) {
        try {
          const zoom = await map.getSource('pins').getClusterExpansionZoom(cl.properties.cluster_id);
          map.easeTo({ center: cl.geometry.coordinates, zoom, duration: reducedMotion() ? 0 : 500 });
        } catch {
          // el agrupamiento cambió mientras tanto: no hace falta hacer nada
        }
        return;
      }
      const p = live.current;
      const place = hit(e.point, placeLayerIds(map))[0];
      if (place) {
        if (p.onSelectPlace) p.onSelectPlace(place.properties.id);
        return;
      }
      const road = hit(e.point, ROAD_LAYERS)[0];
      if (road) {
        if (p.onSelectRoad) p.onSelectRoad(road.properties.id);
        return;
      }
      if (p.onMapClick) p.onMapClick([e.lngLat.lng, e.lngLat.lat]);
    });

    map.on('mousemove', (e) => {
      const over = hit(e.point, [...placeLayerIds(map), 'places-cluster', ...ROAD_LAYERS]).length > 0;
      map.getCanvas().style.cursor = over ? 'pointer' : '';
    });

    // Datos que llegaron antes de que existiera su fuente (carga inicial o setStyle).
    map.on('styledata', () => {
      if (pendingRef.current.size) flushPending(map);
    });

    mapRef.current = map;
    window.__atlasMap = map;
    return () => {
      mapRef.current = null;
      firstStyle.current = true;
      if (window.__atlasMap === map) delete window.__atlasMap;
      map.remove();
    };
    // El mapa se crea una vez; los cambios de props los aplican los efectos de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Estilo: tema, extras, selección, color de ruta y relieve. Los datos van
  // dentro del estilo (con los valores actuales), así que siguen ahí tras el cambio.
  useEffect(() => {
    if (firstStyle.current) {
      firstStyle.current = false;
      return;
    }
    const map = mapRef.current;
    if (map) map.setStyle(currentStyle(), { diff: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, extrasKey, selectedId, routeColor, relief]);

  // Datos: cada cambio marca sus fuentes como pendientes y se aplica con setData
  // en cuanto la fuente existe. Si todavía no existe (estilo cargando o recién
  // reemplazado), el listener de 'styledata' la vacía después. No se usa
  // isStyleLoaded(): es false mientras cualquier fuente carga teselas.
  const markDirty = (...ids) => {
    const map = mapRef.current;
    if (!map) return;
    for (const id of ids) pendingRef.current.add(id);
    flushPending(map);
  };
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => markDirty('places', 'pins'), [places]);
  useEffect(() => markDirty('territories'), [territories]);
  useEffect(() => markDirty('roads'), [roadsGeo]);
  useEffect(() => markDirty('route-legs', 'route-stops'), [routeGeo]);
  useEffect(() => markDirty('measure'), [measureGeo]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Cámara. Los efectos dependen de la identidad del objeto, no de su valor: el
  // padre pasa un objeto nuevo por cada pedido (p. ej. al volver a elegir el mismo
  // lugar después de mover el mapa) y lo conserva entre renders sin pedido nuevo.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTo || !Number.isFinite(flyTo.lon) || !Number.isFinite(flyTo.lat)) return;
    // El contenedor pudo cambiar de tamaño en el mismo render (p. ej. al cerrar un panel).
    map.resize();
    const zoom = Number.isFinite(flyTo.zoom) ? flyTo.zoom : Math.max(map.getZoom(), 8);
    if (reducedMotion()) map.jumpTo({ center: [flyTo.lon, flyTo.lat], zoom });
    else map.flyTo({ center: [flyTo.lon, flyTo.lat], zoom, essential: true });
  }, [flyTo]);

  useEffect(() => {
    const map = mapRef.current;
    // fitBounds acepta [[o, s], [e, n]] o { bounds, padding } (p. ej. para dejar libre
    // el lado que tapa un cartel).
    const req = fitBounds || focusBounds;
    if (!map || !req) return;
    const b = Array.isArray(req) ? req : req.bounds;
    if (!b) return;
    map.resize();
    const padding = (!Array.isArray(req) && req.padding) || 60;
    map.fitBounds(b, { padding, maxZoom: 9, duration: reducedMotion() ? 0 : 800 });
  }, [fitBounds, focusBounds]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
      role="region"
      aria-label="Mapa bíblico"
    />
  );
}
