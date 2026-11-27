// Constantes del mapa: vista inicial, límites del mapa base, créditos y fuentes externas.

export const INITIAL_VIEW = { center: [35.3, 31.8], zoom: 6.3 };
// bbox del mapa base (Tarea 4): [[oeste, sur], [este, norte]]
export const ATLAS_BOUNDS = [[-12, 10], [65, 48]];
export const CREDITS = 'OpenBible.info (CC BY 4.0) · Natural Earth · © colaboradores de OpenStreetMap (ODbL)';
export const RELIEF_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
export const DEFAULT_GLYPHS = '/glyphs/{fontstack}/{range}.pbf';
