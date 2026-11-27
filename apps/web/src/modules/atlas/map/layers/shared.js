// Piezas comunes a los bloques de capas del estilo. Sin React ni MapLibre.

// Tipos que se dibujan con marcador (el resto son lugares de área: solo etiqueta).
export const PIN_TYPES = ['ciudad', 'sitio', 'montana', 'fuente', 'isla'];
export const TYPES = [...PIN_TYPES, 'rio', 'mar', 'desierto', 'valle', 'region', 'reino', 'camino'];

export const fc = (features = []) => ({ type: 'FeatureCollection', features });
export const get = (k) => ['get', k];
export const typeColor = (P) => ['match', get('type'), ...TYPES.flatMap((t) => [t, P['t-' + t]]), P['t-ciudad']];
export const territoryColor = (P) => ['match', get('colorIndex'), 1, P.c1, 2, P.c2, 3, P.c3, 4, P.c4, 5, P.c5, P.c1];
export const byImportance = (a, b, c, d) => ['match', get('importance'), 1, a, 2, b, 3, c, d];
export const vis = (on) => (on ? 'visible' : 'none');

// Halo opaco y sin desenfoque: lo que quede debajo de un nombre (marcadores, ríos)
// no se transparenta entre las letras.
export function labelHalo(P) {
  return { 'text-halo-color': P.paper, 'text-halo-width': 2.4, 'text-halo-blur': 0 };
}

// Tramos pendientes (los que vienen después de la parada activa) se dibujan tenues.
export const AHEAD_OPACITY = ['case', ['==', get('ahead'), 1], 0.35, 1];
export const AHEAD_NAME_OPACITY = ['case', ['==', get('ahead'), 1], 0.8, 1];
