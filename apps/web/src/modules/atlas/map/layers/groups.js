// Bloques de capas, de abajo hacia arriba. layerGroup dice a qué bloque pertenece una capa.
export const GROUPS = [
  ['sea', ['sea']],
  ['hillshade', ['relief-land-base', 'hillshade', 'relief-sea-mask']],
  ['land', ['land', 'land-coast']],
  ['lakes', ['lakes']],
  ['rivers', ['rivers']],
  ['borders', ['borders']],
  ['territories-fill', ['territories-fill']],
  ['territories-line', ['territories-line', 'territories-line-disc']],
  ['roads', ['roads']],
  ['route-legs', ['route-legs-texto', 'route-legs-aprox', 'route-legs-hipotetico', 'route-anim-texto', 'route-anim-aprox', 'route-anim-hipotetico']],
  ['places-cluster', ['places-cluster', 'places-cluster-count']],
  ['places-circle', ['places-circle']],
  ['places-major', ['places-major', 'places-selected']],
  ['place-labels-top', ['places-key', 'place-labels-foc', 'place-labels-sel', 'places-foc']],
  ['route-stops', ['route-stops', 'route-stop-active', 'route-stops-name', 'route-stops-num']],
  ['measure', ['measure-casing', 'measure-line', 'measure-points', 'measure-num', 'measure-leg-label']],
];
const GROUP_OF = new Map(GROUPS.flatMap(([g, list]) => list.map((id) => [id, g])));
export function layerGroup(id) {
  if (GROUP_OF.has(id)) return GROUP_OF.get(id);
  // Nombres de pin de los marcadores principales (importancia 1-2) y todos los nombres de zona (mares, regiones...).
  if (/^place-labels-[12]$/.test(id) || /^place-labels-[a-z]+-\d$/.test(id)) return 'place-labels-top';
  if (id.startsWith('place-labels') || id === 'river-labels' || id === 'roads-label' || id === 'territories-label') return 'place-labels';
  return null;
}
