// Caminos antiguos: lectura de los datos y cifras de cada camino. Capa pura.
import { measure } from './geo.js';

export const WALK_KM_PER_DAY = 30;

export const roadList = (raw) => (raw && Array.isArray(raw.caminos) ? raw.caminos : []);

// Longitud medida sobre la línea dibujada (tramo a tramo, en línea recta entre
// vértices): es un mínimo, el camino real daba más vueltas. Los días salen de
// measure() (30 km por día).
export function roadStats(road) {
  const m = measure(road.coords);
  return { km: Math.round(m.totalKm), days: m.days };
}

export function roadBounds(road) {
  const lons = road.coords.map((c) => c[0]);
  const lats = road.coords.map((c) => c[1]);
  return [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]];
}

export const relatedRoad = (roads, road) => (road && road.relacion ? roads.find((r) => r.id === road.relacion) || null : null);

export const fmtDays = (d) => (d === 1 ? '1 día' : d + ' días');
export const fmtKm = (km) => String(km).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' km';
