// Interruptores de capas y opciones del mapa, guardados en store.layers y store.extras.
import { useCallback } from 'react';
import { histKey } from './layers.js';

export function useLayers(updateStore) {
  const set = useCallback((key, id, on) => updateStore((s) => ({ ...s, [key]: { ...s[key], [id]: on } })), [updateStore]);
  return {
    onType: useCallback((id, on) => set('layers', id, on), [set]),
    onHist: useCallback((periodId, on) => set('layers', histKey(periodId), on), [set]),
    onExtra: useCallback((id, on) => set('extras', id, on), [set]),
  };
}
