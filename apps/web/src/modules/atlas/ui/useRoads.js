// Caminos antiguos: cuál está abierto, cuál se compara con él y el GeoJSON que resalta ambos.
import { useCallback, useMemo, useState } from 'react';
import caminos from '@data/atlas/caminos.json';
import { roadsToGeoJSON } from '../core/geo.js';
import { roadList, roadBounds, relatedRoad } from '../core/caminos.js';

const ROADS = roadList(caminos);

export function useRoads({ on, placeId, setPlaceId, openRight, setFitBounds }) {
  const [roadId, setRoadId] = useState(null);
  const [comparing, setComparing] = useState(false);
  const road = ROADS.find((r) => r.id === roadId) || null;
  const related = relatedRoad(ROADS, road);

  // Con la capa apagada o al elegir un lugar, el camino se cierra (se corrige durante el render).
  if (roadId && (!on || placeId)) setRoadId(null);

  const fit = useCallback((...rs) => {
    const bs = rs.map(roadBounds);
    const bounds = [
      [Math.min(...bs.map((b) => b[0][0])), Math.min(...bs.map((b) => b[0][1]))],
      [Math.max(...bs.map((b) => b[1][0])), Math.max(...bs.map((b) => b[1][1]))],
    ];
    setFitBounds({ bounds, padding: 90 });
  }, [setFitBounds]);

  const pick = useCallback((id) => {
    const r = ROADS.find((x) => x.id === id);
    if (!r) return;
    setRoadId(id);
    setComparing(false);
    setPlaceId(null);
    openRight(true);
    fit(r);
  }, [setPlaceId, openRight, fit]);

  const compare = useCallback(() => {
    if (!related) return;
    setComparing(true);
    fit(road, related);
  }, [road, related, fit]);

  const geo = useMemo(
    () => roadsToGeoJSON(ROADS, { selectedId: roadId, compareId: comparing && related ? related.id : null }),
    [roadId, comparing, related],
  );

  return {
    geo, pick, compare, road, related,
    comparing: comparing && !!related,
    stopCompare: useCallback(() => setComparing(false), []),
    close: useCallback(() => { setRoadId(null); setComparing(false); }, []),
  };
}
