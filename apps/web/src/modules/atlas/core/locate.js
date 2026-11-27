// «¿Dónde estoy?»: qué hacer con una posición y con los errores de geolocalización.
// Capa pura: sin navegador.
import { ATLAS_BOUNDS } from '../map/bounds.js';
import { haversineKm } from './geo.js';
import { bearing } from './ficha.js';

export const JERUSALEM = [35.2342, 31.7767];

const DIR_WORD = { N: 'norte', NE: 'noreste', E: 'este', SE: 'sureste', S: 'sur', SO: 'suroeste', O: 'oeste', NO: 'noroeste' };

export function inBounds([lon, lat], b = ATLAS_BOUNDS) {
  return lon >= b[0][0] && lon <= b[1][0] && lat >= b[0][1] && lat <= b[1][1];
}

// Puntos cardinales hacia los que mira `to` desde `from` (8 rumbos, en palabras).
export const directionWord = (from, to) => DIR_WORD[bearing(from, to)];

const ERRORS = {
  unsupported: 'Este navegador no puede mostrar tu ubicación.',
  denied: 'No tenemos permiso para ver tu ubicación. Puedes activarlo en los ajustes del navegador.',
  unavailable: 'No pudimos determinar tu ubicación. Prueba de nuevo en un momento.',
  timeout: 'Tardó demasiado en encontrar tu ubicación. Prueba de nuevo.',
};

const fmtKm = (km) => String(Math.round(km)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' km';

// Dentro del mapa se vuela a la posición; fuera, se dice a cuánto queda Jerusalén y hacia dónde.
export function locateOutcome(pos) {
  if (!Array.isArray(pos) || !Number.isFinite(pos[0]) || !Number.isFinite(pos[1])) return { kind: 'error', text: ERRORS.unavailable };
  if (inBounds(pos)) return { kind: 'inside', pos, text: 'Esta es tu ubicación.' };
  const km = haversineKm(pos, JERUSALEM);
  return { kind: 'outside', pos, km, text: `Jerusalén está a ${fmtKm(km)} de tu ubicación, hacia el ${directionWord(pos, JERUSALEM)}.` };
}

// GeolocationPositionError.code: 1 permiso denegado, 2 no disponible, 3 tiempo agotado.
export function locateError(err) {
  if (err === 'unsupported') return ERRORS.unsupported;
  const code = err && err.code;
  if (code === 1) return ERRORS.denied;
  if (code === 3) return ERRORS.timeout;
  return ERRORS.unavailable;
}
