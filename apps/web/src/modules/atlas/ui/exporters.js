// Exportadores del estudio (puros: devuelven un string). Port de _exportMd,
// _exportCsv, _exportGeo y _exportNotes del prototipo. Los lugares se pasan como
// objetos de la base o como ids.
import { fichaVM, fmtCoord, candidateList } from '../core/ficha.js';
import { displayName } from '../core/text.js';
import { BOOK_NAMES_ES } from '../core/refs.js';
import { Q_SHORT, typeShort } from '../core/labels.js';

const resolve = (db, list) => (list || [])
  .map((x) => (typeof x === 'string' ? db.byId.get(x) : x))
  .filter(Boolean);

export function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const periodNames = (db, p) => Array.from(p.periods).map((x) => (db.periodById[x] ? db.periodById[x].nombre : x));
const yamlStr = (s) => JSON.stringify(String(s));

// Ficha en Markdown con frontmatter compatible con Obsidian. Varios lugares se
// concatenan, cada uno con su propio frontmatter.
export function exportMarkdown(db, ids, notes = {}, { now = new Date() } = {}) {
  const date = now.toLocaleDateString('es');
  return resolve(db, ids).map((p) => {
    const f = p.curated;
    const vm = fichaVM(db, p);
    const L = ['---'];
    L.push('id: ' + yamlStr(p.id), 'nombre: ' + yamlStr(vm.name), 'tipo: ' + p.type, 'certeza: ' + p.certainty);
    if (p.hasPos) L.push('latitud: ' + p.lat, 'longitud: ' + p.lon);
    L.push('tags: [atlas-biblico, ' + p.type + ']', '---', '');
    L.push('# ' + vm.name, '');
    L.push('- **Tipo:** ' + typeShort(p.type));
    L.push('- **Certeza:** ' + Q_SHORT[p.certainty] + (f && f.notaCerteza ? ' — ' + f.notaCerteza : ''));
    if (vm.variants.length) L.push('- **Otros nombres:** ' + vm.variants.join('; '));
    L.push('- **Nombre en OpenBible (ESV):** ' + p.ob);
    if (f && f.moderno) L.push('- **Nombre moderno:** ' + f.moderno);
    L.push('- **Coordenadas:** ' + (p.hasPos ? fmtCoord(p.lat, p.lon) + (p.approxPos ? ' (posición representativa)' : '') : 'desconocidas'));
    if (f && f.region) L.push('- **Región:** ' + f.region);
    L.push('- **Períodos:** ' + periodNames(db, p).join(', '), '');
    if (f) {
      L.push('## Descripción', '', f.descripcion || '', '');
      if (f.contexto) L.push('## Contexto', '', f.contexto, '');
      if (vm.events.length) { L.push('## Acontecimientos', ''); vm.events.forEach((e) => L.push('- ' + e)); L.push(''); }
      if (vm.people.length) L.push('## Personajes', '', vm.people.join(', '), '');
      if (f.refs && f.refs.length) { L.push('## Referencias clave', ''); f.refs.forEach((r) => L.push('- ' + r)); L.push(''); }
    }
    const cands = candidateList(p);
    if (cands.length) { L.push('## Propuestas de identificación', ''); cands.forEach((c) => L.push('- ' + c.label + ' — ' + c.coords)); L.push(''); }
    if (vm.nRefs) {
      L.push('## Menciones (OpenBible)', '');
      L.push(vm.groups.map((g) => '**' + g.book + '** ' + g.items.map((i) => i.t).join(', ')).join('  \n'), '');
    }
    L.push('## Fuentes', '');
    vm.sources.forEach((s) => L.push('- ' + s));
    L.push('');
    const note = notes && notes[p.id];
    if (note) L.push('## Mis notas', '', note, '');
    L.push('_Exportado desde Atlas Bíblico, ' + date + '._', '');
    return L.join('\n');
  }).join('\n');
}

const CSV_HEAD = ['id', 'nombre', 'nombre_openbible', 'tipo', 'certeza', 'ficha', 'latitud', 'longitud', 'posicion_representativa', 'propuestas', 'nombre_moderno', 'region', 'menciones', 'libros', 'periodos'];

export function exportCsv(db, places) {
  const lines = [CSV_HEAD.join(',')];
  resolve(db, places).forEach((p) => {
    const f = p.curated;
    lines.push([
      p.id, displayName(p.name), p.ob, p.type, p.certainty, f ? 'completa' : 'basica',
      p.hasPos ? p.lat : '', p.hasPos ? p.lon : '', p.approxPos ? 'si' : 'no',
      p.candidates.filter((c) => c[3] === 'p' || c[3] === 'w').length,
      f ? f.moderno : '', f ? f.region : '', p.refs.length,
      Array.from(p.books).sort((a, b) => a - b).map((b) => BOOK_NAMES_ES[b]).join(' | '),
      periodNames(db, p).join(' | '),
    ].map(csvCell).join(','));
  });
  return lines.join('\n');
}

export function exportGeoJSON(db, places) {
  const features = resolve(db, places).filter((p) => p.hasPos).map((p) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
    properties: {
      id: p.id,
      nombre: displayName(p.name),
      nombre_openbible: p.ob,
      tipo: p.type,
      certeza: p.certainty,
      ficha: p.curated ? 'completa' : 'basica',
      moderno: p.curated ? p.curated.moderno || null : null,
      menciones: p.refs.length,
      propuestas: p.candidates.length,
    },
  }));
  return JSON.stringify({ type: 'FeatureCollection', features }, null, 1);
}

export function exportNotes(store, { now = new Date() } = {}) {
  return JSON.stringify({
    atlas: 'Atlas Bíblico',
    exportado: now.toISOString(),
    notes: store.notes || {},
    fav: store.favorites || [],
    pend: store.pending || [],
  }, null, 1);
}
