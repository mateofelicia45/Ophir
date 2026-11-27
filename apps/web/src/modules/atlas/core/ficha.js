// Modelo de vista de la ficha del lugar (puro, sin React). Port de _fichaVM y
// _refGroups del prototipo, con referencias que abre el Lector de Ophir.
import { BOOK_NAMES_ES, parseRef } from './refs.js';
import { Q_SHORT, Q_LABEL, plural } from './labels.js';
import { haversineKm } from './geo.js';
import { displayName } from './text.js';

export const REFS_COLLAPSE = 40;
export const NEAR_MAX_KM = 30;

export function fmtCoord(lat, lon) {
  return Math.abs(lat).toFixed(4) + '° ' + (lat >= 0 ? 'N' : 'S') + ', ' + Math.abs(lon).toFixed(4) + '° ' + (lon >= 0 ? 'E' : 'O');
}

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
// Rumbo cardinal de a hacia b; ambos son [lon, lat].
export function bearing(a, b) {
  const t = Math.PI / 180;
  const y = Math.sin((b[0] - a[0]) * t) * Math.cos(b[1] * t);
  const x = Math.cos(a[1] * t) * Math.sin(b[1] * t) - Math.sin(a[1] * t) * Math.cos(b[1] * t) * Math.cos((b[0] - a[0]) * t);
  const br = ((Math.atan2(y, x) / t) + 360) % 360;
  return DIRS[Math.round(br / 45) % 8];
}

// Menciones agrupadas por libro, en orden de aparición. Cada item lleva la
// referencia lista para abrir en el Lector.
export function refGroups(p) {
  const g = new Map();
  p.refs.forEach((code) => {
    const b = Math.floor(code / 1e6);
    const c = Math.floor((code % 1e6) / 1e3);
    const v = code % 1000;
    if (!g.has(b)) g.set(b, []);
    g.get(b).push({ t: c + ':' + v, ref: { b, c1: c, v1: v, c2: c, v2: v } });
  });
  return Array.from(g, ([b, items]) => ({ book: BOOK_NAMES_ES[b], items }));
}

const isPoint = (c) => c[3] === 'p' || c[3] === 'w';

// Propuestas de identificación (más de una); la primera es la que usa el mapa.
export function candidateList(p) {
  const pts = p.candidates.filter(isPoint);
  if (pts.length < 2) return [];
  return pts.map((c, j) => ({
    no: j + 1,
    label: (c[2] || 'Propuesta sin nombre') + (c[4] ? ' (identificado con ' + c[4] + ')' : ''),
    coords: fmtCoord(c[1], c[0]),
    lon: c[0],
    lat: c[1],
    tag: j === 0 ? 'en el mapa' : '',
  }));
}

export function nearbyPlaces(db, p) {
  if (!p.hasPos) return [];
  const here = [p.lon, p.lat];
  const out = [];
  db.places.forEach((q) => {
    if (q === p || !q.hasPos || q.approxPos) return;
    const km = haversineKm(here, [q.lon, q.lat]);
    if (km < NEAR_MAX_KM && km > 0.05) out.push({ q, km });
  });
  out.sort((a, b) => a.km - b.km);
  return out.slice(0, 8).map(({ q, km }) => ({
    id: q.id,
    name: displayName(q.name),
    type: q.type,
    sub: (q.curated ? '' : 'Ficha básica · ') + Q_SHORT[q.certainty],
    km,
    d: (km < 10 ? km.toFixed(1) : String(Math.round(km))) + ' km ' + bearing(here, [q.lon, q.lat]),
  }));
}

// Pista bajo el nombre para distinguir homónimos (el sufijo numérico no se muestra).
export function subtitleOf(p) {
  const f = p.curated;
  const own = displayName(p.name).toLowerCase();
  const first = (t) => t.split(/[,(·]/)[0].trim();
  const cands = [];
  if (f && f.moderno) cands.push(first(f.moderno));
  if (f && f.region) cands.push(first(f.region));
  const pt = p.candidates.find(isPoint);
  if (pt && pt[2]) cands.push(pt[2]);
  if (p.ob) cands.push(displayName(p.ob));
  return cands.find((c) => c && c.toLowerCase() !== own) || '';
}

export function sourcesOf(db, p) {
  const f = p.curated;
  const fu = db.fuentes || {};
  const out = ['Coordenadas, propuestas y versículos: ' + (fu.OB || 'OpenBible.info')];
  if (f && f.fuentes) f.fuentes.forEach((c) => { if (c !== 'OB' && fu[c]) out.push('Obra de referencia: ' + fu[c]); });
  if (!f) out.push('Ficha básica generada automáticamente: el tipo y la certeza no se han revisado a mano.');
  return out;
}

function certaintyNote(p, pts) {
  const f = p.curated;
  if (f && f.notaCerteza) return f.notaCerteza;
  if (!p.hasPos) return 'No hay coordenadas registradas: el emplazamiento es desconocido.';
  if (p.certainty === 'discutida') return 'Existen ' + pts.length + ' propuestas de identificación. El mapa usa la primera registrada en OpenBible; ninguna se presenta como confirmada.';
  if (p.approxPos) return 'La posición es un punto representativo de una zona, no un emplazamiento exacto.';
  if (f) return 'Identificación aceptada en las obras de referencia citadas.';
  return 'OpenBible registra una sola propuesta; esta ficha básica aún no se ha verificado para el atlas.';
}

export function fichaVM(db, p) {
  const f = p.curated;
  const pts = p.candidates.filter(isPoint);
  const periods = Array.from(p.periods)
    .sort((a, b) => (db.periodById[a] ? db.periodById[a].i : 99) - (db.periodById[b] ? db.periodById[b].i : 99))
    .map((x) => (db.periodById[x] ? db.periodById[x].nombre : x));
  const nbp = f && f.nombresPeriodo
    ? Object.keys(f.nombresPeriodo).map((k) => ({ per: db.periodById[k] ? db.periodById[k].nombre : k, name: f.nombresPeriodo[k] }))
    : [];
  const nRefs = p.refs.length;
  const booksList = Array.from(p.books).sort((a, b) => a - b);
  const keyRefs = f && f.refs ? f.refs.map((label) => ({ label, ref: parseRef(label) })) : [];
  const desc = f
    ? f.descripcion
    : 'Ficha básica generada a partir de OpenBible.info: el lugar aparece nombrado en ' + plural(nRefs, 'versículo', 'versículos')
      + (booksList.length ? ' (' + booksList.slice(0, 6).map((b) => BOOK_NAMES_ES[b]).join(', ') + (booksList.length > 6 ? '…' : '') + ')' : '')
      + '. Aún no tiene descripción redactada; consulta los pasajes y las propuestas de identificación.';
  return {
    name: displayName(p.name),
    subtitle: subtitleOf(p),
    basic: !f,
    sourceName: p.ob,
    variants: f ? (f.variantes || []) : p.alt,
    modern: f && f.moderno ? f.moderno : (pts.length === 1 && pts[0][2] ? pts[0][2] + ' (según OpenBible)' : 'No indicado'),
    hasPos: p.hasPos,
    coords: p.hasPos ? fmtCoord(p.lat, p.lon) + (p.approxPos ? ' · zona' : '') : 'Desconocidas',
    coordsCopy: p.hasPos ? p.lat.toFixed(5) + ', ' + p.lon.toFixed(5) : '',
    region: f && f.region ? f.region : 'Sin redactar (ficha básica)',
    testaments: [p.at ? 'Antiguo Testamento' : '', p.nt ? 'Nuevo Testamento' : ''].filter(Boolean).join(' · ') || '—',
    periods: periods.length ? periods.join(' · ') : 'Sin asignar',
    mentions: plural(nRefs, 'versículo', 'versículos') + ' en ' + plural(p.books.size, 'libro', 'libros'),
    nRefs,
    qLabel: Q_LABEL[p.certainty],
    qNote: certaintyNote(p, pts),
    cands: candidateList(p),
    nbp,
    desc,
    ctx: f && f.contexto ? f.contexto : '',
    hasEvents: !!(f && f.eventos && f.eventos.length),
    events: f && f.eventos ? f.eventos : [],
    hasPeople: !!(f && f.personajes && f.personajes.length),
    people: f && f.personajes ? f.personajes : [],
    keyRefs,
    hasKeyRefs: keyRefs.length > 0,
    refsCopy: f && f.refs ? f.refs.join('; ') : '',
    canShowRefs: nRefs > REFS_COLLAPSE,
    groups: refGroups(p),
    routes: p.routeIds.map((id) => db.routes.find((r) => r.id === id)).filter(Boolean).map((r) => ({ id: r.id, name: r.name })),
    near: nearbyPlaces(db, p),
    sources: sourcesOf(db, p),
  };
}
