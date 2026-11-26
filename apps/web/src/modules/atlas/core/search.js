import { norm } from './text.js';
import { parseRef, refLabel, refToCode } from './refs.js';

const plural = (n, s, p) => n + ' ' + (n === 1 ? s : p);

function passageCount(db, r) {
  const lo = refToCode(r.b, r.c1, r.v1);
  const hi = refToCode(r.b, r.c2, r.v2);
  return db.places.filter((p) => p.refs.some((x) => x >= lo && x <= hi)).length;
}

function wordStart(hay, nq) {
  return (' ' + hay).indexOf(' ' + nq) >= 0;
}

export function searchAtlas(db, q, limit = 12) {
  const nq = norm(q);
  if (!nq) return [];
  const out = [];
  const ref = parseRef(q);
  if (ref) {
    out.push({
      kind: 'Pasaje',
      label: refLabel(ref),
      sub: plural(passageCount(db, ref), 'lugar', 'lugares'),
      action: { type: 'passage', ref },
    });
  }
  if (nq.length >= 2) {
    [...db.people.entries()]
      .filter(([key]) => wordStart(key, nq))
      .slice(0, 4)
      .forEach(([, e]) => out.push({
        kind: 'Personaje', label: e.name, sub: plural(e.placeIds.size, 'lugar', 'lugares'),
        action: { type: 'person', id: e.name },
      }));
    db.routes.filter((r) => norm(r.name).includes(nq)).slice(0, 3).forEach((r) => out.push({
      kind: 'Recorrido', label: r.name, sub: plural(r.stops.length, 'parada', 'paradas'),
      action: { type: 'route', id: r.id },
    }));
    db.periods.filter((p) => norm(p.nombre).includes(nq)).slice(0, 2).forEach((p) => out.push({
      kind: 'Período', label: p.nombre, sub: p.fechas,
      action: { type: 'period', id: p.id },
    }));
  }
  const scored = [];
  db.places.forEach((p) => {
    const name = norm(p.name);
    const ob = norm(p.ob);
    const alt = norm((p.alt || []).join(' '));
    const mod = norm((p.curated && p.curated.moderno) || '');
    let s = 0;
    if (name === nq || ob === nq) s = 1000;
    else if (name.startsWith(nq) || ob.startsWith(nq)) s = 700;
    else if (wordStart(name, nq) || wordStart(ob, nq)) s = 520;
    else if (nq.length >= 3 && (name.includes(nq) || ob.includes(nq))) s = 360;
    if (!s && nq.length >= 2) {
      if (wordStart(alt, nq)) s = 300;
      else if (nq.length >= 3 && alt.includes(nq)) s = 200;
      else if (nq.length >= 3 && mod.includes(nq)) s = 150;
    }
    if (s) scored.push({ p, s: s + (p.curated ? 60 : 0) + (5 - p.importance) * 14 });
  });
  scored.sort((a, b) => b.s - a.s);
  scored.slice(0, 12).forEach(({ p }) => {
    const f = p.curated;
    out.push({
      kind: 'Lugar',
      label: p.name,
      sub: f ? (f.moderno || '').split(/[,(·]/)[0] : (p.name !== p.ob ? p.ob : plural(p.refs.length, 'mención', 'menciones')),
      action: { type: 'place', id: p.id },
    });
  });
  return out.slice(0, Math.max(limit, 0) || 12);
}
