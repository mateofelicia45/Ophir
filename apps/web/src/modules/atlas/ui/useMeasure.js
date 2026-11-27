// Modo «Medir»: la lista de puntos, el GeoJSON de la polilínea y el resumen.
// Un clic en un lugar lo agrega; un clic en el mapa vacío agrega un punto suelto.
// Esc o el botón cierran el modo y borran la medición.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { measure, measureToGeoJSON } from '../core/geo.js';
import { displayName } from '../core/text.js';

export function useMeasure() {
  const [on, setOn] = useState(false);
  const [points, setPoints] = useState([]);

  const close = useCallback(() => { setOn(false); setPoints([]); }, []);
  const toggle = useCallback(() => { setOn((v) => !v); setPoints([]); }, []);
  const addPlace = useCallback((p) => {
    if (!p || !p.hasPos) return;
    setPoints((a) => [...a, { lon: p.lon, lat: p.lat, name: displayName(p.name) }]);
  }, []);
  const addPoint = useCallback(([lon, lat]) => {
    setPoints((a) => [...a, { lon, lat, name: 'Punto en el mapa' }]);
  }, []);
  const undo = useCallback(() => setPoints((a) => a.slice(0, -1)), []);
  const clear = useCallback(() => setPoints([]), []);

  useEffect(() => {
    if (!on) return undefined;
    const h = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const t = e.target;
      if (t && t.closest && t.closest('input, textarea, select, [contenteditable]')) return;
      close();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [on, close]);

  const geo = useMemo(
    () => (on ? measureToGeoJSON(points.map((p) => [p.lon, p.lat])) : undefined),
    [on, points],
  );
  const summary = useMemo(() => measure(points.map((p) => [p.lon, p.lat])), [points]);

  return { on, points, geo, summary, toggle, close, addPlace, addPoint, undo, clear };
}
