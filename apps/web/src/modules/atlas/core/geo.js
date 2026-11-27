// Conversión a GeoJSON y medición. Capa pura: sin React ni MapLibre.
import { displayName } from './text.js';

const R = 6371;
const rad = (d) => (d * Math.PI) / 180;

const fc = (features) => ({ type: 'FeatureCollection', features });
const pt = (c, properties) => ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: c } });

export function haversineKm(a, b) {
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function measure(points) {
  const legs = [];
  for (let i = 1; i < points.length; i++) legs.push(haversineKm(points[i - 1], points[i]));
  const totalKm = legs.reduce((a, v) => a + v, 0);
  return { legs, totalKm, days: totalKm > 0 ? Math.ceil(totalKm / 30) : 0 };
}

export function placesToGeoJSON(places, { selectedId, focusIds } = {}) {
  const focus = focusIds instanceof Set && focusIds.size > 0 ? focusIds : null;
  return fc(
    places.filter((p) => p.hasPos).map((p) => pt([p.lon, p.lat], {
      id: p.id,
      name: displayName(p.name),
      type: p.type,
      certainty: p.certainty,
      importance: p.importance,
      sel: p.id === selectedId ? 1 : 0,
      dim: focus && !focus.has(p.id) ? 1 : 0,
      foc: focus && focus.has(p.id) ? 1 : 0,
    })),
  );
}

// El tramo que llega a la parada de índice i (0-based en route.stops) lleva el
// `leg` de esa parada y `i`. Así «tramo 6» = el que llega a la 6.ª parada (índice 5).
// Las paradas sin posición se saltan: el tramo une la anterior ubicada con la siguiente.
export function routeToGeoJSON(route, db) {
  const legs = [];
  const stops = [];
  let prev = null;
  route.stops.forEach((s, i) => {
    const p = s.placeId != null ? db.byId.get(s.placeId) : null;
    if (!p || !p.hasPos) return;
    const c = [p.lon, p.lat];
    stops.push(pt(c, { n: i + 1, placeId: p.id }));
    if (prev) {
      legs.push({
        type: 'Feature',
        properties: { leg: s.leg, i },
        geometry: { type: 'LineString', coordinates: [prev, c] },
      });
    }
    prev = c;
  });
  return { legs: fc(legs), stops: fc(stops) };
}

const closeRing = (r) => {
  if (!r.length) return r;
  const a = r[0];
  const b = r[r.length - 1];
  return a[0] === b[0] && a[1] === b[1] ? r : [...r, a];
};

export function territoriesToGeoJSON(territories) {
  return fc(territories.map((t) => {
    const rings = t.rings.map(closeRing);
    const geometry = rings.length === 1
      ? { type: 'Polygon', coordinates: [rings[0]] }
      : { type: 'MultiPolygon', coordinates: rings.map((r) => [r]) };
    return {
      type: 'Feature',
      properties: { id: t.id, name: t.name, colorIndex: t.colorIndex, kind: t.kind },
      geometry,
    };
  }));
}

export function roadsToGeoJSON(roads) {
  return fc(roads.map((r) => {
    const properties = { id: r.id, name: r.nombre, aprox: !!r.aprox };
    if (r.relacion) properties.relacion = r.relacion;
    return { type: 'Feature', properties, geometry: { type: 'LineString', coordinates: r.coords } };
  }));
}
