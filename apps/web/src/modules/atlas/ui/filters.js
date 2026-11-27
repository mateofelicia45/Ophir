// Filtros de la pestaña Explorar (el período vive aparte: lo comparte la barra superior).
export const EMPTY_FILTERS = { testament: '', book: '', type: '', cert: '', onlyCurated: false };

export function hasFilters(f, periodId) {
  return !!(f.testament || f.book !== '' || f.type || f.cert || f.onlyCurated || periodId);
}

