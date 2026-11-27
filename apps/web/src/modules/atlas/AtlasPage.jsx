// Página del atlas: mapa de estudio MapLibre con búsqueda, filtros y paneles.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-600.css';
import '../../styles/atlas.css';
import { useAtlasDb } from './ui/useAtlasDb.js';
import { useAtlasLayout, focusPadding } from './ui/useAtlasLayout.js';
import TopBar from './ui/TopBar.jsx';
import LeftPanel from './ui/LeftPanel.jsx';
import RightPanel from './ui/RightPanel.jsx';
import FocusCard from './ui/FocusCard.jsx';
import RouteStepper from './ui/RouteStepper.jsx';
import Legend from './ui/Legend.jsx';
import MeasureCard from './ui/MeasureCard.jsx';
import { useMeasure } from './ui/useMeasure.js';
import { useLayers } from './ui/useLayers.js';
import { hiddenTypes, territoryPeriods } from './ui/layers.js';
import { useRouteStepper } from './ui/useRouteStepper.js';
import { EMPTY_FILTERS } from './ui/filters.js';
import { filterPlaces } from './core/filter.js';
import { placesToGeoJSON, territoriesToGeoJSON } from './core/geo.js';
import { parseAtlasParams, toAtlasSearch } from './core/urlState.js';
import { loadStore, saveStore } from './core/store.js';
import { pushHistory } from './core/lists.js';
import { parseRef, toOphirRef } from './core/refs.js';
import { passageFocus, personFocus, routeFocus, cameraFor, periodBounds } from './core/focus.js';
import { PALETTES } from './map/mapStyle.js';
import { useOpenParsedRef } from '../../hooks/useOpenParsedRef.js';

const AtlasMap = lazy(() => import('./map/AtlasMap.jsx'));
// Caminos antiguos: vacío hasta que la Tarea 12 aporte los datos.
const NO_ROADS = { type: 'FeatureCollection', features: [] };

export default function AtlasPage() {
  const { db, error, retry } = useAtlasDb();
  const [searchParams, setSearchParams] = useSearchParams();
  const openParsedRef = useOpenParsedRef();

  const [store, setStore] = useState(loadStore);
  const rootRef = useRef(null);
  const layout = useAtlasLayout(rootRef);
  const { narrow, single, left: leftOpen, right: rightOpen, openLeft, openRight, mapWidth } = layout;
  const [tab, setTab] = useState('explorar');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [periodId, setPeriodId] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [routeId, setRouteId] = useState(null);
  const [focus, setFocus] = useState(null);
  // Pedidos de cámara: un objeto nuevo por pedido (contrato de AtlasMap).
  const [flyTo, setFlyTo] = useState(null);
  const [fitBounds, setFitBounds] = useState(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const measure = useMeasure();

  const updateStore = useCallback((fn) => {
    setStore((s) => {
      const next = fn(s);
      saveStore(next);
      return next;
    });
  }, []);
  const theme = store.theme;
  const layerActions = useLayers(updateStore);

  // ---- Acciones ----
  // Encuadre de un foco: deja libre a la izquierda el cartel del foco, según el
  // ancho real que tendrá el mapa.
  const frame = useCallback((cam, mapW) => {
    if (!cam) return;
    const pad = focusPadding(mapW);
    const d = 0.25;
    const bounds = cam.center
      ? [[cam.center[0] - d, cam.center[1] - d], [cam.center[0] + d, cam.center[1] + d]]
      : cam.bounds;
    setFitBounds({ bounds, padding: pad });
  }, []);

  const selectPlace = useCallback((id, { fly = true } = {}) => {
    const p = db && db.byId.get(id);
    if (!p) return;
    setSelectedId(id);
    openRight(true);
    updateStore((s) => pushHistory(s, id));
    // Un lugar sin coordenadas se elige igual, pero no se vuela a 0,0.
    if (fly && p.hasPos) setFlyTo({ lon: p.lon, lat: p.lat });
  }, [db, openRight, updateStore]);

  const choosePeriod = useCallback((id, fit = true) => {
    setPeriodId(id || '');
    if (fit && id && db) {
      const b = periodBounds(db, id);
      if (b) setFitBounds(b);
    }
  }, [db]);

  const applyFocus = useCallback((f) => {
    if (!f) return;
    setFocus(f);
    if (f.kind !== 'Recorrido') setRouteId(null);
    // Sin lugar elegido, el panel derecho solo muestra la bienvenida: se cierra para dar lugar al mapa.
    const nextLeft = narrow ? false : leftOpen;
    const nextRight = selectedId ? rightOpen : false;
    if (narrow) openLeft(false);
    if (!selectedId) openRight(false);
    frame(cameraFor(db, [...f.placeIds]), mapWidth(nextLeft, nextRight));
  }, [db, frame, narrow, selectedId, leftOpen, rightOpen, openLeft, openRight, mapWidth]);

  const focusPassage = useCallback((ref) => {
    if (db && ref) applyFocus(passageFocus(db, ref));
  }, [db, applyFocus]);

  const focusRoute = useCallback((id) => {
    const f = db && routeFocus(db, id);
    if (!f) return;
    setRouteId(id);
    setTab('rutas');
    applyFocus(f);
  }, [db, applyFocus]);

  const runAction = useCallback((a) => {
    if (!a || !db) return;
    switch (a.type) {
      case 'place': selectPlace(a.id); break;
      case 'passage': focusPassage(a.ref || parseRef(a.text)); break;
      case 'person': applyFocus(personFocus(db, a.id)); break;
      case 'period': choosePeriod(a.id); break;
      case 'route': focusRoute(a.id); break;
      default: break;
    }
  }, [db, selectPlace, focusPassage, applyFocus, choosePeriod, focusRoute]);

  const clearFocus = useCallback(() => {
    setFocus(null);
    setRouteId(null);
  }, []);

  const flyToCoords = useCallback((lon, lat) => setFlyTo({ lon, lat, zoom: 10 }), []);

  const readPassage = useCallback((ref) => openParsedRef(toOphirRef(ref)), [openParsedRef]);

  // ---- URL ----
  // Se lee una vez, en cuanto está la base (durante el render, patrón de React para
  // derivar estado); desde entonces el estado manda y la URL lo refleja.
  const [urlReady, setUrlReady] = useState(false);
  if (db && layout.width && !urlReady) {
    setUrlReady(true);
    const st = parseAtlasParams(searchParams.toString(), db);
    if (st.periodId) choosePeriod(st.periodId, !st.placeId && !st.routeId && !st.chapter);
    if (st.chapter) focusPassage({ b: st.chapter.b, c1: st.chapter.c, v1: 0, c2: st.chapter.c, v2: 999 });
    if (st.routeId) focusRoute(st.routeId);
    if (st.placeId) {
      const p = db.byId.get(st.placeId);
      setSelectedId(st.placeId);
      openRight(true);
      if (p.hasPos) setFlyTo({ lon: p.lon, lat: p.lat, zoom: 8 });
    }
  }

  const urlSearch = toAtlasSearch({
    placeId: selectedId,
    routeId,
    periodId,
    chapter: focus && focus.kind === 'Pasaje' ? focus.chapter : null,
  });
  useEffect(() => {
    if (!urlReady) return;
    const cur = searchParams.toString();
    if (urlSearch.replace(/^\?/, '') !== cur) setSearchParams(urlSearch, { replace: true });
  }, [urlReady, urlSearch, searchParams, setSearchParams]);

  // ---- Datos del mapa (memorizados: la identidad dispara setData) ----
  const filtered = useMemo(() => {
    if (!db) return [];
    const types = filters.type ? new Set([filters.type]) : new Set();
    const hidden = hiddenTypes(store.layers);
    return filterPlaces(db, { testament: filters.testament, book: filters.book, periodId, types })
      .filter((p) => !hidden.has(p.type))
      .filter((p) => (!filters.cert || p.certainty === filters.cert) && (!filters.onlyCurated || p.curated));
  }, [db, filters, periodId, store.layers]);

  const routeStopIds = useMemo(() => {
    const r = db && routeId ? db.routes.find((x) => x.id === routeId) : null;
    return r ? new Set(r.stops.map((x) => x.placeId).filter(Boolean)) : null;
  }, [db, routeId]);

  const placesGeo = useMemo(() => {
    if (!db) return undefined;
    // Los lugares del foco y el elegido se ven aunque los filtros los excluyan.
    const ids = new Set(filtered.map((p) => p.id));
    const extra = [];
    const add = (id) => {
      if (id && !ids.has(id) && db.byId.has(id)) { ids.add(id); extra.push(db.byId.get(id)); }
    };
    if (focus) focus.placeIds.forEach(add);
    add(selectedId);
    return placesToGeoJSON(filtered.concat(extra), { selectedId, focusIds: focus ? focus.placeIds : null, routeIds: routeStopIds });
  }, [db, filtered, focus, selectedId, routeStopIds]);

  // Territorios: el período elegido y las capas históricas encendidas se suman (ui/layers.js).
  const territoriesGeo = useMemo(() => {
    if (!db) return undefined;
    const ids = territoryPeriods(periodId, store.layers);
    return territoriesToGeoJSON(db.territories.filter((t) => ids.has(t.periodId)));
  }, [db, periodId, store.layers]);
  const route = db && routeId ? db.routes.find((r) => r.id === routeId) : null;
  const stepper = useRouteStepper({ db, route, setFlyTo });
  const routeGeo = stepper.geo || undefined;
  const routeColor = route ? (PALETTES[theme] || PALETTES.light)['r' + route.colorIndex] : undefined;
  const extras = store.extras;

  // En modo Medir un lugar se suma a la medición en vez de abrir la ficha.
  const { on: measuring, addPlace, addPoint } = measure;
  const onMapSelect = useCallback((id) => {
    if (measuring) addPlace(db && db.byId.get(id));
    else selectPlace(id, { fly: false });
  }, [measuring, addPlace, db, selectPlace]);

  const selected = db && selectedId ? db.byId.get(selectedId) : null;
  const cls = ['atlas-app', theme === 'dark' ? 'dark' : '', leftOpen ? 'lo' : '', rightOpen ? 'ro' : ''].filter(Boolean).join(' ');

  return (
    <div className={cls} ref={rootRef}>
      <TopBar
        db={db}
        theme={theme}
        onTheme={() => updateStore((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))}
        periodId={periodId}
        onPeriod={(v) => choosePeriod(v)}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onToggleLeft={() => openLeft(!leftOpen)}
        onToggleRight={() => openRight(!rightOpen)}
        onAction={runAction}
        measuring={measuring}
        onMeasure={measure.toggle}
      />
      <div className="body">
        {narrow && leftOpen && (
          <button type="button" className="scrim" onClick={() => openLeft(false)} aria-label="Cerrar el panel" />
        )}
        {db && (
          <LeftPanel
            tab={tab}
            onTab={setTab}
            explore={{
              db,
              places: filtered,
              filters,
              onFilters: setFilters,
              periodId,
              onPeriod: (v) => choosePeriod(v),
              onSelect: (id) => selectPlace(id),
              onPerson: (name) => applyFocus(personFocus(db, name)),
              onClear: () => { setFilters(EMPTY_FILTERS); setPeriodId(''); },
            }}
            layers={{
              db,
              layers: store.layers,
              extras: store.extras,
              periodId,
              ...layerActions,
            }}
            study={{
              db,
              store,
              filtered,
              selectedId,
              onSelect: (id) => selectPlace(id),
            }}
            routes={{
              db,
              routeId,
              step: stepper.step,
              onOpen: focusRoute,
              onStep: stepper.goTo,
              onClose: clearFocus,
              onReadRef: readPassage,
            }}
          />
        )}
        <main className="mapwrap">
          <Suspense fallback={null}>
            <AtlasMap
              theme={theme}
              places={placesGeo}
              territories={territoriesGeo}
              routeGeo={routeGeo}
              routeLeg={routeGeo ? routeGeo.active : null}
              routeColor={routeColor}
              selectedId={selectedId}
              extras={extras}
              roadsGeo={NO_ROADS}
              measureGeo={measure.geo}
              onSelectPlace={onMapSelect}
              onMapClick={measuring ? addPoint : undefined}
              flyTo={flyTo}
              fitBounds={fitBounds}
            />
          </Suspense>
          <Legend open={legendOpen} onToggle={() => setLegendOpen((v) => !v)} />
          {measuring && (
            <MeasureCard points={measure.points} summary={measure.summary} onUndo={measure.undo}
              onClear={measure.clear} onClose={measure.close} />
          )}
          {db && route && (
            <RouteStepper
              db={db}
              route={route}
              step={stepper.step}
              progress={stepper.progress}
              onStep={stepper.goTo}
              onClose={clearFocus}
              onReadRef={readPassage}
            />
          )}
          {db && focus && focus.kind !== 'Recorrido' && (
            <FocusCard
              focus={focus}
              db={db}
              periodId={periodId}
              onClose={clearFocus}
              onSelect={(id) => selectPlace(id)}
              onPeriod={(id) => choosePeriod(id, false)}
              onRoute={focusRoute}
              onReadPassage={readPassage}
            />
          )}
          {!db && !error && (
            <div className="state mui" role="status">
              <div className="spin" aria-hidden="true" />
              <p style={{ margin: 0 }}><b>Cargando la base geográfica…</b></p>
            </div>
          )}
          {error && (
            <div className="state mui" role="alert">
              <p style={{ margin: 0 }}><b>No se pudieron cargar los datos del atlas.</b></p>
              <p className="muted sm" style={{ margin: 0 }}>{error}</p>
              <button type="button" className="btn" onClick={retry}>Reintentar</button>
            </div>
          )}
        </main>
        {db && (
          <RightPanel
            db={db}
            place={selected}
            onClose={() => {
              setSelectedId(null);
              // En celular o con un solo panel, cerrar la ficha devuelve el lugar al mapa o a Explorar.
              if (narrow) openRight(false);
              else if (single) { openRight(false); openLeft(true); }
            }}
            onAction={runAction}
            store={store}
            onUpdateStore={updateStore}
            onSelectPlace={selectPlace}
            onFlyTo={flyToCoords}
            onReadRef={readPassage}
          />
        )}
      </div>
    </div>
  );
}
