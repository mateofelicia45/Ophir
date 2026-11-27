// Estado del recorrido paso a paso: parada activa, geometría repartida para el
// mapa, avance con ← / → y vuelo de cámara a cada parada.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { routeToGeoJSON } from '../core/geo.js';
import { stepGeo, stopProgress } from '../core/routes.js';

// Controles que ya usan las flechas: campos de texto, pestañas, deslizadores y radios.
const OWN_ARROWS = 'input,textarea,select,[role=tab],[role=tablist],[role=slider],[role=radio],[role=radiogroup],[contenteditable=""],[contenteditable=true]';
const typing = (el) => !!el && (el.isContentEditable || (el.closest && !!el.closest(OWN_ARROWS)));

export function useRouteStepper({ db, route, setFlyTo }) {
  const routeId = route ? route.id : null;
  // La parada vuelve a la primera al cambiar de recorrido (estado derivado en el render).
  const [state, setState] = useState({ routeId, step: 0 });
  if (state.routeId !== routeId) setState({ routeId, step: 0 });
  const step = state.routeId === routeId ? state.step : 0;
  const last = route ? route.stops.length - 1 : 0;

  const progress = useMemo(() => (route ? stopProgress(route, db) : []), [route, db]);
  const baseGeo = useMemo(() => (route ? routeToGeoJSON(route, db) : null), [route, db]);
  const geo = useMemo(() => (baseGeo ? stepGeo(baseGeo, step) : null), [baseGeo, step]);

  const goTo = useCallback((i) => {
    if (!route) return;
    const k = Math.max(0, Math.min(route.stops.length - 1, i));
    setState({ routeId: route.id, step: k });
    const p = route.stops[k].placeId != null ? db.byId.get(route.stops[k].placeId) : null;
    // Una parada sin coordenadas se muestra en el paso, pero la cámara no se mueve.
    if (p && p.hasPos) setFlyTo({ lon: p.lon, lat: p.lat, zoom: k > 0 ? 7 : 6 });
  }, [route, db, setFlyTo]);

  // La captura va primero: así las flechas no mueven además el mapa. El paso se lee
  // de una ref para no volver a registrar el listener en cada parada.
  const live = useRef({ step, goTo });
  useEffect(() => { live.current = { step, goTo }; });
  const active = !!route;
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || typing(e.target)) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      e.stopPropagation();
      live.current.goTo(live.current.step + (e.key === 'ArrowRight' ? 1 : -1));
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active]);

  return { step, last, progress, geo, goTo };
}
