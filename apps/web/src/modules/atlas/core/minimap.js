// Minimapa de orientación: proyección y trazado simplificado de la tierra. Capa pura.
export const MINI = { w: 160, h: 110, extent: { w: 6, e: 60, s: 12, n: 44 } };

const { extent: X } = MINI;
const sx = MINI.w / (X.e - X.w);
const sy = MINI.h / (X.n - X.s);

export const toMini = ([lon, lat]) => [(lon - X.w) * sx, (X.n - lat) * sy];
export const fromMini = (x, y) => [X.w + x / sx, X.n - y / sy];

// Douglas-Peucker sobre un anillo; `tol` en grados.
export function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const last = pts.length - 1;
  const closed = pts[0][0] === pts[last][0] && pts[0][1] === pts[last][1];
  // Un anillo cerrado tiene la misma punta en ambos extremos: se parte por la mitad.
  const mid = closed ? Math.floor(last / 2) : -1;
  if (closed) keep[mid] = 1;
  const stack = closed ? [[0, mid], [mid, last]] : [[0, last]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = 0;
    let idx = -1;
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / len;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

const touchesExtent = (ring) => ring.some(([lon, lat]) => lon >= X.w - 2 && lon <= X.e + 2 && lat >= X.s - 2 && lat <= X.n + 2);

// Path SVG de la tierra del área, con los anillos exteriores simplificados.
export function landPath(landFc, tol = 0.18) {
  const parts = [];
  for (const f of landFc.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) {
      const ring = poly[0];
      if (!touchesExtent(ring)) continue;
      const pts = simplify(ring, tol).map(toMini);
      if (pts.length < 3) continue;
      parts.push('M' + pts.map(([x, y]) => x.toFixed(1) + ' ' + y.toFixed(1)).join('L') + 'Z');
    }
  }
  return parts.join('');
}

// Rectángulo (en px del minimapa) de los límites visibles [[o, s], [e, n]], acotado al dibujo.
export function viewRect(bounds) {
  const [x1, y1] = toMini([bounds[0][0], bounds[1][1]]);
  const [x2, y2] = toMini([bounds[1][0], bounds[0][1]]);
  const x = Math.max(0, Math.min(x1, MINI.w));
  const y = Math.max(0, Math.min(y1, MINI.h));
  const r = Math.max(0, Math.min(x2, MINI.w));
  const b = Math.max(0, Math.min(y2, MINI.h));
  return { x, y, w: Math.max(2, r - x), h: Math.max(2, b - y) };
}
