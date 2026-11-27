// Estado del recorrido paso a paso: parada activa, geometría repartida para el
// mapa, avance con ← / → y vuelo de cámara a cada parada.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { routeToGeoJSON } from '../core/geo.js';
import { stepGeo, stopProgress } from '../core/routes.js';

const typing = (el) => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

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
    if (p && p.hasPos && k > 0) setFlyTo({ lon: p.lon, lat: p.lat, zoom: 7 });
    else if (p && p.hasPos) setFlyTo({ lon: p.lon, lat: p.lat, zoom: 6 });
  }, [route, db, setFlyTo]);

  // La captura va primero: así las flechas no mueven además el mapa.
  useEffect(() => {
    if (!route) return undefined;
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || typing(e.target)) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      e.stopPropagation();
      goTo(step + (e.key === 'ArrowRight' ? 1 : -1));
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [route, step, goTo]);

  return { step, last, progress, geo, goTo };
}
