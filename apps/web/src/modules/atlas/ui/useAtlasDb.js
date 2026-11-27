// Carga diferida de la base del atlas: los tres JSON van en chunks propios y se
// arma la base en memoria una sola vez por sesión.
import { useCallback, useEffect, useState } from 'react';
import { buildAtlasDb } from '../core/db.js';

let cached = null;

async function load() {
  if (cached) return cached;
  const [places, fichas, historia] = await Promise.all([
    import('@data/atlas/places.json'),
    import('@data/atlas/fichas.json'),
    import('@data/atlas/historia.json'),
  ]);
  cached = buildAtlasDb({ places: places.default, fichas: fichas.default, historia: historia.default });
  return cached;
}

export function useAtlasDb() {
  const [state, setState] = useState(() => ({ db: cached, error: null }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cached) return undefined;
    let alive = true;
    load().then(
      (db) => { if (alive) setState({ db, error: null }); },
      (e) => { if (alive) setState({ db: null, error: (e && e.message) || String(e) }); },
    );
    return () => { alive = false; };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ db: null, error: null });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}
