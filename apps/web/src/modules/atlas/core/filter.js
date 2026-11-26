import { parseRef, refToCode } from './refs.js';

export function filterPlaces(db, { testament = '', book = null, periodId = '', types = new Set(), focus = null } = {}) {
  const hasBook = book !== null && book !== undefined && book !== '';
  return db.places
    .filter((p) => {
      if (focus && !focus.placeIds.has(p.id)) return false;
      if (testament === 'AT' && !p.at) return false;
      if (testament === 'NT' && !p.nt) return false;
      if (hasBook && !p.books.has(+book)) return false;
      if (periodId && !p.periods.has(periodId)) return false;
      if (types && types.size && !types.has(p.type)) return false;
      return true;
    })
    .sort((a, b) => a.importance - b.importance || a.name.localeCompare(b.name, 'es'));
}

export function placesForChapter(db, b, c) {
  const lo = refToCode(b, c, 0);
  const hi = refToCode(b, c, 999);
  return db.places.filter((p) => p.refs.some((r) => r >= lo && r <= hi));
}

export function routesForChapter(db, b, c) {
  return db.routes.filter((r) =>
    r.stops.some((s) => {
      const pr = parseRef(s.ref);
      return pr && pr.b === b && pr.c1 <= c && c <= pr.c2;
    }));
}
