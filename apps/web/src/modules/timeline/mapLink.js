// Enlace de la línea de tiempo al atlas: período del mapa de la era y lugares del evento.
export function eraOf(eras, year) {
  return eras.find((e) => year >= e.from && year < e.to) || eras[eras.length - 1];
}

// Devuelve '/atlas?periodo=…&lugar=…' con lo que haya, o null si no hay nada para mostrar.
export function mapLinkFor(event, eras) {
  const periodo = (eraOf(eras, event.year) || {}).periodo || null;
  const lugar = event.places && event.places.length ? event.places[0] : null;
  const q = new URLSearchParams();
  if (periodo) q.set('periodo', periodo);
  if (lugar) q.set('lugar', lugar);
  const s = q.toString();
  return s ? `/atlas?${s}` : null;
}
