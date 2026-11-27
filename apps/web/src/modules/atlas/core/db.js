import { norm } from './text.js';
import { parseRef } from './refs.js';

function esName(n, map) {
  if (map[n]) return map[n];
  const m = n.match(/^(.*)\s(\d+)$/);
  if (m && map[m[1]]) return map[m[1]] + ' ' + m[2];
  return n;
}

function circle(lon, lat, r = 0.35, n = 48) {
  const ring = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    ring.push([+(lon + r * Math.cos(a)).toFixed(4), +(lat + r * Math.sin(a)).toFixed(4)]);
  }
  ring.push(ring[0]);
  return ring;
}

export function buildAtlasDb({ places, fichas, historia }) {
  const periods = (historia.periodos || []).map((p, i) => ({ ...p, i }));
  const periodById = {};
  periods.forEach((p) => { periodById[p.id] = p; });

  const chapterPeriods = new Map();
  (historia.capitulos || []).forEach(([b, c1, c2, ids]) => {
    for (let c = c1; c <= c2; c++) {
      const k = b * 1000 + c;
      chapterPeriods.set(k, (chapterPeriods.get(k) || []).concat(ids));
    }
  });

  const fichaByOb = new Map();
  (fichas.fichas || []).forEach((f) => fichaByOb.set(f.ob, f));
  const nombres = fichas.nombres || {};

  const people = new Map();
  const addPerson = (name, id) => {
    const key = norm(name);
    if (!key) return;
    let e = people.get(key);
    if (!e) {
      e = { name, placeIds: new Set() };
      people.set(key, e);
    }
    e.placeIds.add(id);
  };

  const out = [];
  const byId = new Map();
  const byOb = new Map();

  places.places.forEach((r) => {
    const f = fichaByOb.get(r.n) || null;
    const refs = r.r ? r.r.split(',').map((s) => { const a = s.split('.'); return +a[0] * 1e6 + +a[1] * 1e3 + +a[2]; }) : [];
    const books = new Set();
    const periodsSet = new Set();
    let at = false;
    let nt = false;
    refs.forEach((code) => {
      const b = Math.floor(code / 1e6);
      const c = Math.floor((code % 1e6) / 1e3);
      books.add(b);
      if (b < 39) at = true; else nt = true;
      const ps = chapterPeriods.get(b * 1000 + c);
      if (ps) ps.forEach((x) => periodsSet.add(x));
    });
    if (f && f.periodos) f.periodos.forEach((x) => periodsSet.add(x));
    if (f && f.refs) {
      f.refs.forEach((x) => {
        const pr = parseRef(x);
        if (pr) {
          books.add(pr.b);
          if (pr.b < 39) at = true; else nt = true;
        }
      });
    }

    const candidates = r.c || [];
    const polys = r.g || [];
    const lines = r.l || [];
    const p = {
      id: r.id,
      ob: r.n,
      name: f ? f.nombre : esName(r.n, nombres),
      alt: r.alt || [],
      type: (f && f.tipo) || r.t,
      certainty: (f && f.certeza) || r.q,
      curated: f,
      refs,
      books,
      at,
      nt,
      periods: periodsSet,
      hasPos: false,
      approxPos: false,
      candidates,
      polys,
      lines,
      importance: 4,
      routeIds: [],
    };
    const c0 = candidates[0];
    if (c0) {
      p.lon = c0[0]; p.lat = c0[1]; p.hasPos = true;
    } else if (polys.length && polys[0].c && polys[0].c.length) {
      const cc = polys[0].c;
      p.lon = cc.reduce((a, v) => a + v[0], 0) / cc.length;
      p.lat = cc.reduce((a, v) => a + v[1], 0) / cc.length;
      p.hasPos = true; p.approxPos = true;
    } else if (lines.length && lines[0].c.length) {
      const mid = lines[0].c[Math.floor(lines[0].c.length / 2)];
      p.lon = mid[0]; p.lat = mid[1]; p.hasPos = true; p.approxPos = true;
    }
    if (!p.hasPos) p.certainty = 'desconocida';
    p.importance = f && f.imp ? f.imp : refs.length > 150 ? 1 : refs.length > 30 ? 2 : refs.length > 6 ? 3 : 4;

    out.push(p);
    byId.set(p.id, p);
    byOb.set(p.ob, p);
    if (f && f.personajes) f.personajes.forEach((nm) => addPerson(nm, p.id));
  });

  const routes = (historia.rutas || []).map((ru, i) => {
    const stops = ru.paradas.map((s) => {
      const p = byOb.get(s.ob);
      return { placeId: p ? p.id : null, ref: s.ref, note: s.nota, leg: s.tramo };
    });
    stops.forEach((s) => {
      const p = s.placeId && byId.get(s.placeId);
      if (!p) return;
      if (!p.routeIds.includes(ru.id)) p.routeIds.push(ru.id);
      if (ru.periodo) p.periods.add(ru.periodo);
    });
    (ru.personajes || []).forEach((nm) => stops.forEach((s) => s.placeId && addPerson(nm, s.placeId)));
    return {
      id: ru.id,
      name: ru.nombre,
      periodId: ru.periodo,
      people: ru.personajes || [],
      refsLabel: ru.refs,
      summary: ru.resumen,
      note: ru.nota,
      colorIndex: i % 8,
      stops,
    };
  });

  const territories = [];
  (historia.territorios || []).forEach((t) => {
    let rings = null;
    if (t.c) rings = [t.c];
    else if (t.rings) rings = t.rings;
    else if (t.ob) {
      const p = byOb.get(t.ob);
      if (p && p.polys.length && p.polys[0].c) rings = [p.polys[0].c];
      else if (p && p.hasPos) rings = [circle(p.lon, p.lat)];
    }
    if (!rings) return;
    territories.push({
      id: t.id,
      periodId: t.periodo,
      name: t.nombre,
      colorIndex: t.color,
      note: t.nota,
      kind: t.tipo === 'discutida' ? 'disc' : 'solid',
      rings,
    });
  });

  return {
    places: out,
    byId,
    byOb,
    periods,
    periodById,
    fuentes: fichas.fuentes || {},
    chapterPeriods,
    routes,
    territories,
    people,
    stats: {
      total: out.length,
      curated: out.filter((p) => p.curated).length,
      withPos: out.filter((p) => p.hasPos).length,
      disputed: out.filter((p) => p.certainty === 'discutida').length,
      unknown: out.filter((p) => p.certainty === 'desconocida').length,
    },
  };
}

