// Lógica pura de los recorridos paso a paso: agrupación por período, distancia
// acumulada por parada y geometría parcial para la animación. Sin React ni MapLibre.
import { haversineKm } from './geo.js';

export const LEG_LABEL = { inicio: 'punto de partida', texto: 'según el texto', aprox: 'aproximado', hipotetico: 'hipotético' };

// Agrupa los recorridos por período, en el orden cronológico de la base.
export function groupRoutesByPeriod(db) {
  const groups = db.periods.map((p) => ({ id: p.id, name: p.nombre, routes: [] }));
  const byId = new Map(groups.map((g) => [g.id, g]));
  const other = { id: '', name: 'Otros', routes: [] };
  db.routes.forEach((r) => {
    const row = { id: r.id, name: r.name, stops: r.stops.length, people: r.people, colorIndex: r.colorIndex };
    (byId.get(r.periodId) || other).routes.push(row);
  });
  const out = groups.filter((g) => g.routes.length);
  if (other.routes.length) out.push(other);
  return out;
}

// Por parada: posición, distancia del tramo y distancia acumulada (km y días a 30 km/día).
// Las paradas sin lugar o sin coordenadas se listan, pero no suman distancia.
export function stopProgress(route, db) {
  let prev = null;
  let cum = 0;
  return route.stops.map((s) => {
    const p = s.placeId != null ? db.byId.get(s.placeId) : null;
    const hasPos = !!(p && p.hasPos);
    let legKm = 0;
    if (hasPos) {
      const c = [p.lon, p.lat];
      if (prev) legKm = haversineKm(prev, c);
      prev = c;
      cum += legKm;
    }
    return { placeId: s.placeId, hasPos, legKm, cumKm: cum, cumDays: cum > 0 ? Math.ceil(cum / 30) : 0 };
  });
}

export const easeOut = (t) => 1 - (1 - t) ** 3;

// Tramo recortado a la fracción t (0..1) de su recorrido, interpolando.
export function sliceLine(coords, t) {
  const k = Math.min(1, Math.max(0, t));
  if (k >= 1) return coords;
  const lens = [];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const l = Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]);
    lens.push(l);
    total += l;
  }
  let left = total * k;
  const out = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    if (left >= lens[i - 1]) {
      out.push(coords[i]);
      left -= lens[i - 1];
    } else {
      const f = lens[i - 1] ? left / lens[i - 1] : 0;
      const a = coords[i - 1];
      const b = coords[i];
      out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
      break;
    }
  }
  return out.length > 1 ? out : [coords[0], coords[0]];
}

// Reparte la geometría del recorrido según la parada activa (índice en route.stops):
// tramos hasta la activa normales, posteriores tenues (`ahead`), y el tramo que llega
// a la activa aparte (`active`) para dibujarlo animado. active = null: todo normal.
export function stepGeo(geo, activeIdx) {
  const has = activeIdx != null;
  const legs = [];
  let active = null;
  geo.legs.features.forEach((f) => {
    const i = f.properties.i;
    if (has && i === activeIdx) {
      active = f;
      return;
    }
    legs.push({ ...f, properties: { ...f.properties, ahead: has && i > activeIdx ? 1 : 0 } });
  });
  const stops = geo.stops.features.map((f) => {
    const idx = f.properties.n - 1;
    return { ...f, properties: { ...f.properties, act: has && idx === activeIdx ? 1 : 0, ahead: has && idx > activeIdx ? 1 : 0 } };
  });
  return {
    legs: { type: 'FeatureCollection', features: legs },
    stops: { type: 'FeatureCollection', features: stops },
    active,
  };
}
