// Ayudas de estudio sobre el mapa: caminos antiguos y orientación. Junta sus hooks para
// que la página solo reciba props ya armadas.
import { extraOn } from './layers.js';
import { useRoads } from './useRoads.js';
import { useOrientation } from './useOrientation.js';

export function useMapAids({ extras, placeId, setPlaceId, openRight, setFitBounds, setFlyTo }) {
  const roads = useRoads({ on: extraOn(extras, 'roads'), placeId, setPlaceId, openRight, setFitBounds });
  const orient = useOrientation({ setFlyTo });
  return {
    mini: extraOn(extras, 'minimap'),
    orient,
    closeRoad: roads.close,
    sheet: roads.road ? { ...roads, onCompare: roads.compare, onStopCompare: roads.stopCompare, onPick: roads.pick } : null,
    mapProps: { roadsGeo: roads.geo, onSelectRoad: roads.pick, youGeo: orient.youGeo, onView: orient.onView },
  };
}
