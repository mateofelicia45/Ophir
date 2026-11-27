// Foco del mapa: pasaje, personaje o recorrido. Portado de _focusPassage,
// _focusPerson, _focusRoute y _fitIds del prototipo. Capa pura.
import { norm, displayName } from './text.js';
import { parseRef, refLabel, refToCode } from './refs.js';
import { routesForChapter } from './filter.js';
import { plural, typeShort } from './labels.js';

// Lugares de una referencia, en el orden en que aparecen. Cuenta los versículos de
// OpenBible y, si no hay, los pasajes de la ficha que se superponen con la referencia.
export function placesForRef(db, r) {
  const lo = refToCode(r.b, r.c1, r.v1);
  const hi = refToCode(r.b, r.c2, r.v2);
  const out = [];
  db.places.forEach((p) => {
    const vs = p.refs.filter((x) => x >= lo && x <= hi);
    let inRange = false;
    if (!vs.length && p.curated && p.curated.refs) {
      inRange = p.curated.refs.some((s) => {
        const g = parseRef(s);
        return g && g.b === r.b && refToCode(g.b, g.c1, g.v1) <= hi && refToCode(g.b, g.c2, g.v2) >= lo;
      });
    }
    if (vs.length || inRange) out.push({ place: p, verses: vs });
  });
  const first = (it) => (it.verses.length ? it.verses[0] : Infinity);
  out.sort((a, b) => first(a) - first(b) || a.place.importance - b.place.importance);
  return out;
}

const verseList = (codes) => {
  const vv = codes.slice(0, 6).map((x) => Math.floor((x % 1e6) / 1e3) + ':' + (x % 1e3)).join(', ');
  return vv ? 'v. ' + vv + (codes.length > 6 ? '…' : '') : 'según la ficha del lugar';
};

export function passageFocus(db, ref) {
  const items = placesForRef(db, ref);
  const per = db.chapterPeriods.get(ref.b * 1000 + ref.c1);
  const period = per && per.length ? per[0] : '';
  const routes = routesForChapter(db, ref.b, ref.c1);
  return {
    kind: 'Pasaje',
    title: refLabel(ref),
    sub: items.length ? plural(items.length, 'lugar', 'lugares') + ' en el pasaje' : 'Ningún lugar nombrado en este pasaje',
    note: period && db.periodById[period] ? 'Período sugerido por el capítulo: ' + db.periodById[period].nombre + '.' : '',
    ref,
    chapter: { b: ref.b, c: ref.c1 },
    period,
    routeIds: routes.map((r) => r.id),
    placeIds: new Set(items.map((it) => it.place.id)),
    items: items.map((it, i) => ({ id: it.place.id, no: String(i + 1), name: displayName(it.place.name), sub: verseList(it.verses) })),
  };
}

export function personFocus(db, name) {
  const e = db.people.get(norm(name));
  if (!e) return null;
  const ps = [...e.placeIds].map((id) => db.byId.get(id)).filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const routes = db.routes.filter((r) => r.people.some((x) => norm(x) === norm(name)));
  return {
    kind: 'Personaje',
    title: e.name,
    sub: plural(ps.length, 'lugar vinculado', 'lugares vinculados'),
    note: routes.length
      ? 'Recorridos: ' + routes.map((r) => r.name).join(' · ') + '.'
      : 'Vínculos tomados de las fichas completas y de los recorridos.',
    routeIds: routes.map((r) => r.id),
    placeIds: new Set(ps.map((p) => p.id)),
    items: ps.map((p, i) => ({ id: p.id, no: String(i + 1), name: displayName(p.name), sub: typeShort(p.type) })),
  };
}

export function routeFocus(db, id) {
  const r = db.routes.find((x) => x.id === id);
  if (!r) return null;
  const stops = r.stops.filter((s) => s.placeId && db.byId.has(s.placeId));
  return {
    kind: 'Recorrido',
    title: r.name,
    sub: r.refsLabel || '',
    note: r.note || '',
    route: r.id,
    routeIds: [],
    placeIds: new Set(stops.map((s) => s.placeId)),
    items: stops.map((s, i) => ({ id: s.placeId, no: String(i + 1), name: displayName(db.byId.get(s.placeId).name), sub: s.ref || '' })),
  };
}

function extend(b, lon, lat) {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return b;
  if (!b) return [[lon, lat], [lon, lat]];
  return [[Math.min(b[0][0], lon), Math.min(b[0][1], lat)], [Math.max(b[1][0], lon), Math.max(b[1][1], lat)]];
}

// Encuadre de un conjunto de lugares. Ignora los que no tienen posición y los
// reinos, que tienen un punto representativo lejano. Un solo lugar → { center }.
export function cameraFor(db, ids) {
  let b = null;
  let n = 0;
  ids.forEach((id) => {
    const p = db.byId.get(id);
    if (!p || !p.hasPos || p.type === 'reino') return;
    b = extend(b, p.lon, p.lat);
    n++;
  });
  if (!b) return null;
  if (n === 1 || (b[0][0] === b[1][0] && b[0][1] === b[1][1])) return { center: b[0] };
  return { bounds: b };
}

// Encuadre de un período: sus territorios y las paradas de sus recorridos.
export function periodBounds(db, periodId) {
  let b = null;
  db.territories.filter((t) => t.periodId === periodId).forEach((t) => {
    t.rings.forEach((ring) => ring.forEach(([lon, lat]) => { b = extend(b, lon, lat); }));
  });
  db.routes.filter((r) => r.periodId === periodId).forEach((r) => r.stops.forEach((s) => {
    const p = s.placeId && db.byId.get(s.placeId);
    if (p && p.hasPos) b = extend(b, p.lon, p.lat);
  }));
  return b;
}
