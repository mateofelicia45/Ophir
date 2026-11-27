// Orientación en el mapa: límites visibles (almacén que lee el minimapa), «¿Dónde estoy?» y su aviso.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { locateOutcome, locateError } from '../core/locate.js';
import { createViewStore } from './viewStore.js';

const TOAST_MS = 7000;

export function useOrientation({ setFlyTo }) {
  const [viewStore] = useState(createViewStore);
  const [you, setYou] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef(0);

  const say = useCallback((text) => {
    setToast(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const locate = useCallback(() => {
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : null;
    if (!geo) { say(locateError('unsupported')); return; }
    const fail = (err) => { setBusy(false); say(locateError(err)); };
    setBusy(true);
    try {
      geo.getCurrentPosition((p) => {
        setBusy(false);
        const o = locateOutcome([p.coords.longitude, p.coords.latitude]);
        if (o.kind === 'inside') {
          setYou(o.pos);
          setFlyTo({ lon: o.pos[0], lat: o.pos[1], zoom: 9 });
          say('Ubicación encontrada: la marcamos en el mapa.');
        } else {
          setYou(null);
          say(o.text);
        }
      }, fail, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
    } catch (e) {
      fail(e);
    }
  }, [say, setFlyTo]);

  const youGeo = useMemo(() => (you
    ? { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: you } }] }
    : undefined), [you]);
  const center = useCallback(([lon, lat]) => setFlyTo({ lon, lat, keepZoom: true }), [setFlyTo]);

  return { viewStore, onView: viewStore.set, youGeo, locate, busy, toast, center };
}
