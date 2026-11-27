// Listas del almacén (favoritos, pendientes, historial). Portado de _listOf y _toggleList.
import { displayName } from './text.js';
import { typeShort } from './labels.js';

export function listOf(db, ids) {
  return (ids || [])
    .map((id) => db.byId.get(id))
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      name: displayName(p.name),
      type: p.type,
      sub: typeShort(p.type) + (p.curated ? '' : ' · ficha básica'),
    }));
}

// Devuelve un almacén nuevo con `id` agregado al principio de store[key], o quitado si ya estaba.
export function toggleList(store, key, id) {
  if (!id) return store;
  const a = Array.isArray(store[key]) ? store[key] : [];
  const next = a.includes(id) ? a.filter((x) => x !== id) : [id, ...a];
  return { ...store, [key]: next };
}

// Agrega `id` al principio del historial, sin repetidos.
export function pushHistory(store, id) {
  if (!id) return store;
  const h = (store.history || []).filter((x) => x !== id);
  return { ...store, history: [id, ...h].slice(0, 30) };
}

// Listas de la pestaña Estudio para revisar la base: lugares de identificación
// discutida que ya tienen ficha, fichas básicas con más menciones (las primeras
// `limit`) y lugares sin coordenadas.
export function verifyLists(db, limit = 40) {
  const byRefs = (a, b) => b.refs.length - a.refs.length;
  return {
    discussed: db.places.filter((p) => p.certainty === 'discutida' && p.curated).sort(byRefs).slice(0, limit),
    basic: db.places.filter((p) => !p.curated).sort(byRefs).slice(0, limit),
    unlocated: db.places.filter((p) => !p.hasPos),
  };
}
