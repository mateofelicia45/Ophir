// Reglas puras de las capas del panel (sin React).
// Claves de store.layers: id de tipo («ciudad») para las capas geográficas y
// «hist:<período>» para las históricas. Una capa sin clave está activa solo si es
// un tipo; las históricas arrancan apagadas.
export const EXTRAS = [
  { id: 'labels', label: 'Etiquetas de nombres', def: true },
  { id: 'cluster', label: 'Agrupar lugares cercanos', def: false },
  { id: 'borders', label: 'Fronteras políticas modernas (orientativas)', def: false },
  { id: 'roads', label: 'Caminos antiguos', def: false },
  { id: 'modern', label: 'Nombres modernos', def: false },
  { id: 'minimap', label: 'Minimapa de orientación', def: true },
];

export const typeOn = (layers, id) => !layers || layers[id] !== false;
export const histKey = (periodId) => 'hist:' + periodId;
export const histOn = (layers, periodId) => !!(layers && layers[histKey(periodId)]);
export const extraOn = (extras, id) => {
  const x = EXTRAS.find((e) => e.id === id);
  return extras && typeof extras[id] === 'boolean' ? extras[id] : !!(x && x.def);
};

// Una sola fuente de verdad para los territorios del mapa: los del período elegido
// en el selector (que además filtra los lugares) más los de cada capa histórica
// encendida. Así las dos vías se suman y nunca se pisan.
export function territoryPeriods(periodId, layers) {
  const out = new Set();
  if (periodId) out.add(periodId);
  Object.keys(layers || {}).forEach((k) => {
    if (k.startsWith('hist:') && layers[k]) out.add(k.slice(5));
  });
  return out;
}

export const hiddenTypes = (layers) => new Set(
  Object.keys(layers || {}).filter((k) => !k.startsWith('hist:') && layers[k] === false),
);
