import { BOOKS } from '../../../lib/references.js';
import { LEGACY_IDS } from './legacyIds.js';

const EMPTY = () => ({ placeId: null, routeId: null, periodId: '', chapter: null });

function parseChapter(v) {
  if (typeof v !== 'string') return null;
  const m = v.match(/^([a-z0-9]+)\.(\d+)$/i);
  if (!m) return null;
  const b = BOOKS.findIndex((x) => x.id === m[1].toLowerCase());
  const c = Number(m[2]);
  if (b < 0 || c < 1 || c > BOOKS[b].chapters) return null;
  return { b, c };
}

export function parseAtlasParams(search, db) {
  const out = EMPTY();
  try {
    const q = new URLSearchParams(typeof search === 'string' ? search.replace(/^\?/, '') : '');
    const lugar = q.get('lugar');
    if (lugar) {
      if (db.byId.has(lugar)) out.placeId = lugar;
      else if (Object.prototype.hasOwnProperty.call(LEGACY_IDS, lugar) && db.byId.has(LEGACY_IDS[lugar])) {
        out.placeId = LEGACY_IDS[lugar];
      }
    }
    const ruta = q.get('ruta');
    if (ruta && db.routes.some((r) => r.id === ruta)) out.routeId = ruta;
    const periodo = q.get('periodo');
    if (periodo && Object.prototype.hasOwnProperty.call(db.periodById, periodo)) out.periodId = periodo;
    out.chapter = parseChapter(q.get('cap'));
  } catch {
    return EMPTY();
  }
  return out;
}

export function toAtlasSearch(state) {
  const q = new URLSearchParams();
  const s = state || {};
  if (s.placeId) q.set('lugar', s.placeId);
  if (s.routeId) q.set('ruta', s.routeId);
  if (s.periodId) q.set('periodo', s.periodId);
  if (s.chapter && BOOKS[s.chapter.b]) q.set('cap', `${BOOKS[s.chapter.b].id}.${s.chapter.c}`);
  const str = q.toString();
  return str ? '?' + str : '';
}
