// Genera packages/data/atlas/caminos.json: los caminos antiguos de /atlas.
// Uso (desde la raíz del repo): node tools/build-caminos.mjs
//
// Cada camino se define por una lista ordenada de puntos de paso: un id de lugar de
// places.json (con la misma lógica de posición que usa el mapa, core/db.js) o un
// punto suelto [lon, lat] donde el camino se aparta de los pueblos (un paso de
// montaña, un tramo de costa). Así las líneas pasan justo por las ciudades que el
// mapa dibuja. Todos los trazados son aproximados («aprox»: true) y el mapa los
// dibuja siempre punteados.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildAtlasDb } from '../apps/web/src/modules/atlas/core/db.js';

const dataDir = fileURLToPath(new URL('../packages/data/atlas/', import.meta.url));
const read = (f) => JSON.parse(readFileSync(dataDir + f, 'utf8'));
const db = buildAtlasDb({ places: read('places.json'), fichas: read('fichas.json'), historia: read('historia.json') });

// Los ids de OpenBible distinguen homónimos: bethel-1 es Beitin (junto a Hai), jericho-2
// es la Jericó herodiana del Nuevo Testamento, rabbah-1 es Rabá de los amonitas (Ammán), etc.
const ROADS = [
  {
    id: 'via-maris',
    nombre: 'Vía Maris (Camino del Mar)',
    periodos: ['reino-dividido', 'asirio', 'jesus'],
    nota: 'La gran ruta costera entre Egipto y Mesopotamia: bajaba por la llanura filistea, cruzaba la sierra del Carmelo por el paso de Aruna hasta Meguido y seguía por Galilea hacia Hazor y Damasco. Por ella marcharon ejércitos egipcios, asirios y romanos. El nombre «Vía Maris» viene de la Vulgata de Isaías 9:1 («camino del mar») y de la tradición posterior; en los textos antiguos no aparece como una sola calzada con ese nombre.',
    refs: ['Éxodo 13:17', '1 Reyes 9:15', '2 Reyes 15:29', 'Isaías 9:1'],
    pasos: [
      'migdol-1', [33.8, 31.13], 'gaza', 'ashkelon', 'ashdod', 'joppa', 'aphek-2',
      [35.07, 32.5], 'megiddo', [35.4, 32.74], 'capernaum', 'hazor-1', [35.8, 33.12], 'damascus',
    ],
  },
  {
    id: 'camino-del-rey',
    nombre: 'Camino del Rey',
    periodos: ['exodo', 'conquista', 'reino-dividido'],
    nota: 'Ruta de norte a sur por la meseta de Transjordania, desde el golfo de Aqaba hasta Damasco, pasando por Edom, Moab y Amón. Israel pidió permiso para usarla y se lo negaron (Nm 20:17; 21:22). Siglos más tarde los romanos la reconstruyeron como Via Nova Traiana.',
    refs: ['Números 20:17', 'Números 21:22', 'Deuteronomio 2:27'],
    pasos: [
      'elath', [35.5, 30.0], [35.73, 30.2], 'bozrah-1', 'kir-hareseth', 'dibon-1', 'medeba', 'heshbon',
      'rabbah-1', 'ramoth-gilead', 'edrei-1', 'damascus',
    ],
  },
  {
    id: 'camino-cresta',
    nombre: 'Camino de la cresta (de los patriarcas)',
    periodos: ['patriarcas', 'conquista', 'reino-unido'],
    nota: 'El eje norte-sur de la montaña central, sobre la línea divisoria de aguas: evita los valles y las zonas anegadas. Une Beerseba, Hebrón, Belén, Jerusalén, Betel, Silo y Siquem. Génesis 12:6-8 sitúa a Abram en Siquem y Betel, y Jueces 21:19 menciona «el camino que sube de Betel a Siquem».',
    refs: ['Génesis 12:6-8', 'Génesis 13:18', 'Génesis 37:17', 'Jueces 21:19'],
    pasos: [
      'beersheba-1', 'hebron', 'bethlehem-1', 'jerusalem', 'gibeah-1', 'ramah-1', 'bethel-1', 'shiloh', 'shechem', 'dothan',
    ],
  },
  {
    id: 'galilea-judea-jordan',
    nombre: 'De Galilea a Jerusalén por el valle del Jordán',
    periodos: ['jesus'],
    nota: 'Por la enemistad entre judíos y samaritanos (Jn 4:9; Lc 9:52-53), algunos peregrinos de Galilea preferían rodear Samaria: bajaban por el valle del Jordán, cruzaban a Perea y subían a Jerusalén por Jericó. Era más largo y caluroso, pero evitaba roces. Jesús llegó a Jerusalén por Jericó en su último viaje (Lc 18:35; 19:1).',
    refs: ['Lucas 9:51-56', 'Lucas 17:11', 'Lucas 18:35', 'Lucas 19:1', 'Marcos 10:1'],
    relacion: 'galilea-judea-samaria',
    pasos: [
      'nazareth', 'beth-shan', [35.57, 32.38], [35.58, 32.15], [35.56, 31.96], [35.52, 31.88],
      'jericho-2', 'adummim', 'bethany-1', 'jerusalem',
    ],
  },
  {
    id: 'galilea-judea-samaria',
    nombre: 'De Galilea a Jerusalén por Samaria',
    periodos: ['jesus'],
    nota: 'El camino más corto. Josefo cuenta que quien quería llegar rápido pasaba por Samaria y tardaba tres días (Vida 269), y que los galileos solían cruzarla para ir a las fiestas (Antigüedades 20.118). A 30 km por día, el ritmo que usa este atlas, esta línea da unos 4. Juan 4:4 dice que a Jesús «le era necesario pasar por Samaria»: allí habló con la mujer junto al pozo de Jacob, en Sicar. No estaba libre de roces: en Lc 9:52-53 una aldea samaritana no lo recibió.',
    refs: ['Juan 4:3-6', 'Juan 4:43', 'Lucas 9:52-53'],
    relacion: 'galilea-judea-jordan',
    pasos: ['nazareth', 'jezreel-2', 'en-gannim-2', 'sychar', 'bethel-1', 'jerusalem'],
  },
];

const round = (v) => +v.toFixed(4);
const caminos = ROADS.map(({ pasos, ...road }) => {
  const coords = pasos.map((p) => {
    if (Array.isArray(p)) return [round(p[0]), round(p[1])];
    const place = db.byId.get(p);
    if (!place || !place.hasPos) throw new Error(`${road.id}: el lugar «${p}» no existe o no tiene posición`);
    return [round(place.lon), round(place.lat)];
  });
  const quien = pasos.map((p) => (Array.isArray(p) ? '·' : `${db.byId.get(p).name} (${p})`));
  console.log(`${road.id}: ${quien.join(' → ')}`);
  return { ...road, aprox: true, coords };
});
for (const c of caminos) {
  if (c.relacion && !caminos.some((o) => o.id === c.relacion)) throw new Error(`${c.id}: relacion «${c.relacion}» no existe`);
}

const out = {
  fuente: 'Trazados aproximados, curados a mano a partir de las posiciones de OpenBible.info (CC BY 4.0).',
  caminos,
};
writeFileSync(dataDir + 'caminos.json', JSON.stringify(out, null, 1) + '\n');
console.log(`caminos.json: ${caminos.length} caminos`);
