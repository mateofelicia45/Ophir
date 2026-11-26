# Mapa bíblico de estudio — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el globo 3D de `/atlas` por un mapa bíblico de estudio en MapLibre que porta el prototipo «Atlas Bíblico» de Mateo y le suma caminos antiguos, orientación e integración con el Lector y la Línea de tiempo.

**Architecture:** Los datos del prototipo (OpenBible + fichas + historia) se versionan en `packages/data/atlas/` y se cargan perezosamente. Una capa pura en `modules/atlas/core/` (sin React ni MapLibre) arma la base en memoria, busca, filtra y genera GeoJSON. Esa capa se prueba con Vitest. Encima van un componente `AtlasMap` que envuelve MapLibre y una UI React que porta los paneles del prototipo.

**Tech Stack:** React 19, Vite 8, react-router-dom 7, `maplibre-gl@^6.19.0`, `topojson-client@^3.1.0` y `world-atlas@2.0.2` (solo en el script de build), `vitest@^5.1.2`, Playwright (preinstalado) para el smoke.

**Spec:** `docs/superpowers/specs/2026-11-26-mapa-biblico-design.md`

**Referencia visual y de lógica:** `docs/prototipos/atlas-biblico/Main.dc.html`, el prototipo de Mateo copiado en la Tarea 1. Su CSS (variables `--paper`, `--ink`, `--accent`, `--t-*`, `--c1..5`, `--r0..7`, `--q*`) y sus textos de interfaz se portan tal cual. Cuando una tarea dice «portar `_metodo`», es ese método del `<script data-dc-script>` del prototipo.

## Global Constraints

- Todo el texto de la interfaz va en español rioplatense neutro, como el resto de Ophir. Las etiquetas se copian del prototipo.
- Certeza: `segura | probable | discutida | desconocida`. Tipo de tramo: `inicio | texto | aprox | hipotetico`. Nunca dibujar un tramo `aprox` o `hipotetico`, ni un territorio, con trazo continuo: siempre punteado (DESIGN.md §5).
- La geografía base no puede depender de la red. Solo el relieve (raster-dem) es online y opcional.
- Los datos nuevos del mapa base no deben sumar más de unos 3 MB gzip al módulo `/atlas`.
- Velocidad de caminata: 30 km por día.
- Créditos visibles en el mapa: «OpenBible.info (CC BY 4.0) · Natural Earth · © colaboradores de OpenStreetMap (ODbL)».
- Persistencia local con la clave `ophir.atlas.v1`. Todo acceso a `localStorage` va envuelto en try/catch.
- Commits con autor `Mateo Felicia <361361512+mateofelicia45@users.noreply.github.com>` y el trailer de co-autoría de la sesión.

## Review Focus

1. **Lugar sin coordenadas** (7 en la base, `q: 'desconocida'`): la ficha abre igual y muestra «sin ubicación conocida», sin volar a 0,0. Test en Tarea 2.
2. **Búsqueda con acentos o grafía inglesa** («jerusalen», «Philippi», «hch 16», «1 sam 17»): devuelve el lugar o el pasaje correcto. Test en Tarea 3.
3. **URL inválida** (`?lugar=noexiste`, `?cap=xyz.99`, `?periodo=foo`): el mapa abre en la vista inicial, sin error. Test en Tarea 6.
4. **Sin red**: con la red externa bloqueada, `/atlas` muestra costas, lagos y lugares, sin errores de consola no capturados. Test en Tarea 13.
5. **Celular, 390 px de ancho**: la ficha y los paneles no tapan los controles de zoom y se pueden cerrar. Test en Tarea 13.

---

### Task 1: Datos del prototipo en el repo y Vitest

**Files:**
- Create: `packages/data/atlas/places.json`, copiado del asset `91ee8a88ea583b04f1da4db9cce3aa5b.json` del artifact `U3L1Dcw5PNdhBkUBfhsezh`
- Create: `packages/data/atlas/fichas.json`, del asset `cb0d46a6c5092d3297d76d1a7776e6db.json`
- Create: `packages/data/atlas/historia.json`, del asset `81749c36a9f67d6f19041917d8c41370.json`
- Create: `docs/prototipos/atlas-biblico/Main.dc.html`, copia del prototipo
- Modify: `apps/web/package.json`: agregar el script `"test": "vitest run"` y la devDependency `vitest@^5.1.2`
- Modify: `apps/web/vite.config.js`: bloque `test: { environment: 'node', include: ['src/**/*.test.js'] }`
- Test: `apps/web/src/modules/atlas/core/data.test.js`

Los assets se bajan con la herramienta Artifact (`action: read`, `path: <id>`). Si la sesión ya los tiene en el scratchpad, se copian de ahí.

- [ ] **Step 1: Escribir los tests de integridad de datos** (`data.test.js`):
  - `every route stop ob exists in places`: todo `historia.rutas[].paradas[].ob` está en `places.places[].n`.
  - `every territory ob exists`: todo `territorios[].ob` presente existe; los que no tienen `ob` traen `c` o `rings`.
  - `every ficha ob exists`.
  - `every stop ref parses`: `parseRef(stop.ref)` (Tarea 2) no es null para las 180 paradas.
  - `counts`: 1342 lugares, 227 fichas, 12 períodos, 17 rutas, 61 territorios.
- [ ] **Step 2: Correr `npm test` y verificar que falla** porque no existen los archivos o `parseRef`.
- [ ] **Step 3: Copiar los JSON y el prototipo, e instalar vitest.**
- [ ] **Step 4: Correr `npm test`.** Esperado: pasan todos menos `every stop ref parses`, que pasa al cerrar la Tarea 2.
- [ ] **Step 5: Commit** «Atlas: importar datos del prototipo y configurar Vitest».

### Task 2: Base en memoria (`buildAtlasDb`) y referencias

**Files:**
- Create: `apps/web/src/modules/atlas/core/refs.js`
- Create: `apps/web/src/modules/atlas/core/db.js`
- Create: `apps/web/src/modules/atlas/core/text.js` (`norm`)
- Test: `apps/web/src/modules/atlas/core/db.test.js`, `refs.test.js`

**Interfaces (Produces):**
```js
// text.js
export function norm(s: string): string // minúsculas, sin acentos ni signos, espacios colapsados

// refs.js — RefCode = book0*1e6 + chapter*1e3 + verse (book0 = índice 0..65 del canon protestante; igual al prototipo)
export const BOOK_NAMES_ES: string[66]
export function parseRef(text: string): { b, c1, v1, c2, v2 } | null   // portar parseRef + bookOf + BOOK_ALIAS del prototipo
export function refLabel(r): string                                    // portar refLabel
export function refToCode(b, c, v): number
export function toOphirRef(r): { bookId, chapter, verseStart, verseEnd } // bookId = BOOKS[b].id de lib/references.js

// db.js
export function buildAtlasDb({ places, fichas, historia }): AtlasDb
/* AtlasDb = {
  places: Place[], byId: Map<id,Place>, byOb: Map<obName,Place>,
  periods: {id,nombre,fechas,texto,i}[], periodById: Record<id,Period>,
  chapterPeriods: Map<b*1000+c, string[]>,
  routes: Route[], territories: Territory[],
  people: Map<normName,{name, placeIds:Set<string>}>,
  stats: { total, curated, withPos, disputed, unknown }
}
Place = { id, ob, name, alt:string[], type, certainty, curated:Ficha|null, refs:number[], books:Set<number>,
  at:boolean, nt:boolean, periods:Set<string>, lon?, lat?, hasPos:boolean, approxPos:boolean,
  candidates, polys, lines, importance:1|2|3|4, routeIds:string[] }
Route = { id, name, periodId, people:string[], refsLabel, summary, note, colorIndex:number, stops: {placeId, ref, note, leg}[] }
Territory = { id, periodId, name, colorIndex, note, kind:'disc'|'solid', rings: [lon,lat][][] } */
```

- [ ] **Step 1: Tests.**
  - `parseRef('Hch 16')` → `{b:43,c1:16,…}`; `parseRef('1 Sam 17:4')` → `b:8,c1:17,v1:4`; `parseRef('Philippians 1')` → `b:49`; `parseRef('xyz')` → `null`.
  - `buildAtlasDb`: `byOb.get('Jerusalem').name === 'Jerusalén'`; `.certainty === 'segura'`; `.importance === 1`.
  - Toda ruta tiene `stops.length` igual a sus `paradas`, y todo `placeId` resuelve.
  - El lugar con `cands`, `g` y `l` vacíos tiene `hasPos === false` y `certainty === 'desconocida'` (Review Focus 1).
  - `chapterPeriods.get(0*1000+12)` incluye `'patriarcas'`.
  - El territorio sin `c` hereda los anillos de su lugar `ob`: polígonos `g` del lugar o, si no tiene, un círculo de radio 0,35° en su posición.
- [ ] **Step 2: Verificar que fallan.**
- [ ] **Step 3: Implementar.** Portar `_build` y `_esName`: misma prioridad de nombre, cálculo de `imp` y de períodos por capítulo. `id` = `places[].id`.
- [ ] **Step 4: `npm test` en verde**, incluida `every stop ref parses` de la Tarea 1.
- [ ] **Step 5: Commit.**

### Task 3: Búsqueda y filtros

**Files:**
- Create: `apps/web/src/modules/atlas/core/search.js`, `filter.js`
- Test: `search.test.js`, `filter.test.js`

**Interfaces (Produces):**
```js
export function searchAtlas(db, q: string, limit = 12): { kind: 'Lugar'|'Pasaje'|'Personaje'|'Período'|'Recorrido', label, sub, action: {type:'place'|'passage'|'person'|'period'|'route', id?, ref?} }[]
export function filterPlaces(db, { testament: ''|'AT'|'NT', book: number|null, periodId: string|'', types: Set<string>, focus: null|{placeIds:Set<string>} }): Place[]  // ordenados por importancia
export function placesForChapter(db, b: number, c: number): Place[]
export function routesForChapter(db, b: number, c: number): Route[]
```
- [ ] **Step 1: Tests.**
  - `searchAtlas(db,'jerusalen')[0].label === 'Jerusalén'`.
  - `searchAtlas(db,'Philippi')` incluye «Filipos».
  - `searchAtlas(db,'hch 16')[0].kind === 'Pasaje'`, y `placesForChapter(db,43,16)` incluye Filipos y Troas.
  - `searchAtlas(db,'Pablo')` incluye un `Personaje` y el recorrido `pablo2`.
  - `filterPlaces` con `testament:'NT'` no devuelve Ur.
  - `routesForChapter(db,42,4)` (Juan 4) incluye `jesus`.
- [ ] **Step 2: Verificar que fallan.**
- [ ] **Step 3: Implementar.** Portar `_search` y `_filtered`.
- [ ] **Step 4: En verde.**
- [ ] **Step 5: Commit.**

### Task 4: Mapa base local

**Files:**
- Create: `tools/build-basemap.mjs`
- Create: `packages/data/atlas/basemap/land.json`, `borders.json`, `lakes.json` (GeoJSON FeatureCollection)
- Test: `apps/web/src/modules/atlas/core/basemap.test.js`

- [ ] **Step 1: Test.** Los tres archivos existen; todas las coordenadas caen en lon −12…65 y lat 10…48; el tamaño sumado es menor a 2,5 MB sin comprimir; `lakes` incluye un feature con `name: 'Mar Muerto'`.
- [ ] **Step 2: Verificar que falla.**
- [ ] **Step 3: Implementar el script.**
  - Fuentes: `world-atlas/countries-10m.json`, instalado como devDependency en la raíz del repo o con `npx -p world-atlas`, más `topojson-client`.
  - `land` = `feature(topo, topo.objects.land)`; `borders` = `mesh(topo, topo.objects.countries, (a,b)=>a!==b)`.
  - Recortar al bbox y redondear las coordenadas a 3 decimales.
  - `lakes` = los polígonos `g` de `places.json` con tipo `mar` y los nombres `Dead Sea`, `Sea of Galilee` y `Bitter Lakes`, con `name` en español.
- [ ] **Step 4: Correr `node tools/build-basemap.mjs && npm test`.** Esperado: PASS.
- [ ] **Step 5: Commit** del script y de los archivos generados.

### Task 5: Conversión a GeoJSON y medición

**Files:**
- Create: `apps/web/src/modules/atlas/core/geo.js`
- Test: `geo.test.js`

**Interfaces (Produces):**
```js
export function placesToGeoJSON(places: Place[], { selectedId, focusIds }): FeatureCollection // props: id, name, type, certainty, importance, sel:0|1, dim:0|1
export function routeToGeoJSON(route, db): { legs: FeatureCollection /* props: leg, i */, stops: FeatureCollection /* props: n (1..), placeId */ }
export function territoriesToGeoJSON(territories: Territory[]): FeatureCollection // props: id, name, colorIndex, kind
export function roadsToGeoJSON(roads): FeatureCollection
export function haversineKm(a:[lon,lat], b:[lon,lat]): number
export function measure(points: [lon,lat][]): { legs: number[], totalKm: number, days: number } // days = ceil(totalKm/30)
```
- [ ] **Step 1: Tests.**
  - `haversineKm` Jerusalén→Belén está entre 8 y 10 km.
  - `measure` de Dan→Beerseba da un total entre 220 y 250 km y `days === Math.ceil(total/30)`.
  - El tramo 6 de `abraham` (hacia Egipto) tiene `leg === 'hipotetico'`.
  - `placesToGeoJSON` omite los lugares con `hasPos === false`.
- [ ] **Step 2–4:** fallan, implementar, en verde.
- [ ] **Step 5: Commit.**

### Task 6: Estado en la URL y persistencia

**Files:**
- Create: `apps/web/src/modules/atlas/core/urlState.js`, `store.js`
- Create: `apps/web/src/modules/atlas/core/legacyIds.js`: mapa de los 143 ids viejos de `locations.json` a ids nuevos, generado por un script único y versionado
- Test: `urlState.test.js`, `store.test.js`

**Interfaces (Produces):**
```js
export function parseAtlasParams(search: string, db): { placeId: string|null, routeId: string|null, periodId: string, chapter: {b,c}|null }
export function toAtlasSearch(state): string
// ?lugar=<id|idViejo> ?ruta=<id> ?periodo=<id> ?cap=<bookId>.<cap> (bookId de lib/references.js, ej. jhn.4)
export function loadStore(): Store
export function saveStore(s: Store): void
// Store = { v:1, theme:'dark'|'light', favorites:string[], pending:string[], notes:Record<placeId,string>, history:string[] /* máx. 30 */, layers:Record<string,boolean>, extras:Record<string,boolean> }
```
- [ ] **Step 1: Tests.**
  - `?cap=jhn.4` → `chapter {b:42,c:4}`.
  - `?lugar=jerusalem` resuelve con el id viejo o el nuevo.
  - Review Focus 3: `?lugar=noexiste&cap=xyz.99&periodo=foo` → todo null o `''`, sin lanzar errores.
  - `loadStore` con `localStorage` que lanza una excepción devuelve los valores por defecto.
  - `history` nunca supera 30 elementos.
- [ ] **Step 2–4:** fallan, implementar, en verde.
- [ ] **Step 5: Commit.**

### Task 7: Componente `AtlasMap` (MapLibre) y estilo

**Files:**
- Create: `apps/web/src/modules/atlas/map/mapStyle.js`, `AtlasMap.jsx`
- Modify: `apps/web/package.json`: agregar `maplibre-gl@^6.19.0`
- Test: `apps/web/src/modules/atlas/map/mapStyle.test.js`

**Interfaces (Produces):**
```js
export function buildStyle({ theme:'dark'|'light', basemap:{land,borders,lakes}, relief:boolean }): StyleSpecification
// capas, de abajo hacia arriba: sea(background) → hillshade? → land → lakes → borders(si extras.borders) → territories-fill/line
// → roads → route-legs → places-cluster/places-circle → place-labels → route-stops
<AtlasMap
  theme places={FeatureCollection} territories routeGeo roadsGeo measureGeo
  selectedId focusBounds extras={{labels,cluster,borders}}
  onSelectPlace={(id)=>void} onSelectRoad={(id)=>void} onMapClick={([lon,lat])=>void}
  flyTo={{lon,lat,zoom}|null} fitBounds={[[w,s],[e,n]]|null}
/>
```
- Colores tomados de las variables CSS del prototipo, tema claro y oscuro. Las tipografías se cargan por Google Fonts en `index.html`: Source Serif 4 para nombres de lugar y de mar, IBM Plex Sans para la interfaz.
- Relieve: fuente `raster-dem`, encoding `terrarium`, tiles `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`, maxzoom 12. En el evento `error` de esa fuente se oculta la capa `hillshade`.
- Estilo de tramos con `line-dasharray` según `leg`: `texto` continuo, `aprox` `[3,2]`, `hipotetico` `[0.5,2.5]`. Territorios con `line-dasharray` siempre.
- Vista inicial: centro `[35.3, 31.8]`, zoom 6,3. `maxBounds` con el bbox de la Tarea 4.
- Controles: `NavigationControl`, `ScaleControl({unit:'metric'})` y `AttributionControl` con el texto de créditos.
- [ ] **Step 1: Test de `buildStyle`.** El orden de las capas es el de arriba. Con `relief:false` no existe `hillshade`. Ninguna capa `territories-line` ni de tramo `aprox` o `hipotetico` carece de `line-dasharray`.
- [ ] **Step 2–4:** fallan, implementar, en verde.
- [ ] **Step 5: Commit.**

### Task 8: Página del atlas, búsqueda y Explorar

**Files:**
- Replace: `apps/web/src/modules/atlas/AtlasPage.jsx`
- Create: `apps/web/src/modules/atlas/ui/TopBar.jsx`, `SearchBox.jsx`, `ExplorePanel.jsx`, `useAtlasDb.js`
- Replace: `apps/web/src/styles/atlas.css`, con el CSS portado del prototipo y las variables bajo `.atlas-app` y `.atlas-app.dark`
- Delete: `apps/web/src/modules/atlas/globe/`, `atlasData.js`, `LocationPanel.jsx`. Quitar `three` de `package.json` si ya no hay importadores (`grep -r "from 'three'" src`).

**Interfaces:**
- `useAtlasDb(): { db: AtlasDb|null, error: string|null }`: hace `import()` dinámico de los tres JSON y `buildAtlasDb`.
- Consumes: Tareas 2, 3, 6 y 7.

Layout: el del prototipo, es decir barra superior de 58 px, panel izquierdo de 336 px con pestañas Explorar / Capas / Rutas / Estudio, mapa y ficha derecha de 400 px. La URL se sincroniza con `toAtlasSearch` usando `useSearchParams`.

- [ ] **Step 1:** Implementar TopBar: búsqueda con desplegable navegable por teclado (↑ ↓ Enter Esc), selector de período, tema y botones de paneles. Implementar también ExplorePanel: filtros por testamento, libro y tipo, chips de personajes y lista de lugares paginada de a 60 (portar `_listOf` y `_toggleList`).
- [ ] **Step 2: Verificación manual con Playwright.** `npm run build && npx vite preview`. Capturar `/atlas` a 1440×900: se ven el mapa base y los lugares, y buscar «hch 16» enfoca Filipos. Sin errores de consola.
- [ ] **Step 3: Commit.**

### Task 9: Ficha del lugar

**Files:**
- Create: `apps/web/src/modules/atlas/ui/PlaceSheet.jsx`

Portar `_fichaVM` y las secciones del prototipo en su orden: Identificación geográfica (candidatos, con botón para volar a cada uno), Nombres según el período, Descripción, Contexto, Acontecimientos, Personajes, Referencias clave, Todas las menciones agrupadas por libro (portar `_refGroups`), Recorridos que pasan por aquí, Lugares cercanos (los 8 más próximos con km), Fuentes y verificación, Mis notas.

Cambio respecto del prototipo: **toda referencia abre el Lector de Ophir** con `useOpenParsedRef()` y `toOphirRef`. No usa BibleGateway.

- [ ] **Step 1: Implementar.** Badge de certeza con los colores `--q*`. Si `hasPos` es false, mostrar «Sin ubicación conocida» y no volar (Review Focus 1).
- [ ] **Step 2: Verificación con Playwright.** Clic en Jerusalén abre la ficha y «2 Samuel 5:6-9» navega a `/lector`.
- [ ] **Step 3: Commit.**

### Task 10: Rutas parada por parada

**Files:**
- Create: `apps/web/src/modules/atlas/ui/RoutesPanel.jsx`, `RouteStepper.jsx`

- Panel con los 17 recorridos agrupados por período, color `--r{colorIndex}`, cantidad de paradas y personajes.
- Al abrir uno: `fitBounds` al recorrido y stepper `◀ Parada n de N ▶` con nombre, referencia (abre el Lector), nota, tipo de tramo con leyenda («según el texto», «aproximado», «hipotético») y distancia acumulada con `measure`.
- Animación: el tramo activo se dibuja progresivamente en unos 600 ms, interpolando `line-gradient` o recortando la geometría por frames. Con `prefers-reduced-motion` aparece sin animación.
- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Verificación con Playwright.** Abrir `pablo2`, avanzar 3 paradas y llegar a «Filipos». Captura.
- [ ] **Step 3: Commit.**

### Task 11: Capas, leyenda, territorios y Estudio

**Files:**
- Create: `apps/web/src/modules/atlas/ui/LayersPanel.jsx`, `Legend.jsx`, `StudyPanel.jsx`, `exporters.js`
- Test: `apps/web/src/modules/atlas/ui/exporters.test.js`

- **LayersPanel:** tipos de lugar con conteo, capas históricas (territorios por período) y `EXTRAS` del prototipo. Agrega dos interruptores: «Caminos antiguos» y «Nombres modernos», ambos de la Tarea 12.
- **Legend:** tipos y certeza, plegable.
- **Modo «Medir»** (botón en TopBar): cada clic en un lugar lo agrega a la medición; se dibuja la polilínea (`measureGeo`) y un cartel con km por tramo, total y «≈ N días a pie» (`measure`). Esc o el botón lo cierran.
- **StudyPanel:** Favoritos, Pendientes de estudio, Mis notas, Historial, Pendientes de verificar (lugares `discutida` con ficha) y Exportar. Portar `_exportMd`, `_exportCsv`, `_exportGeo` y `_exportNotes` como funciones puras en `exporters.js` que devuelven un string.
- [ ] **Step 1: Test de exporters.** Además, test de `measure` vía el modo: `measure([])` → `{legs:[],totalKm:0,days:0}`. `exportMarkdown(db,['jerusalem'],notes)` empieza con `---\n` (frontmatter compatible con Obsidian) y contiene `# Jerusalén`. `exportGeoJSON` es JSON válido con `type: 'FeatureCollection'`.
- [ ] **Step 2–4:** fallan, implementar, en verde.
- [ ] **Step 5: Commit.**

### Task 12: Caminos antiguos y orientación

**Files:**
- Create: `packages/data/atlas/caminos.json`, `packages/data/atlas/modernos.json`
- Create: `apps/web/src/modules/atlas/ui/MiniMap.jsx`, `LocateButton.jsx`
- Modify: el test de datos de la Tarea 1, con validación de `caminos.json`

- **`caminos.json`:** `{ id, nombre, periodos:string[], nota, refs:string[], relacion?: string, coords:[lon,lat][] }`. Contenido inicial, curado a mano y marcado `"aprox": true`:
  - `via-maris`: Vía Maris, costa desde Egipto por Gaza, Afec y Meguido hasta Hazor y Damasco.
  - `camino-del-rey`: Camino del Rey, de Elat a Damasco por Bosra, Dibón, Hesbón y Rabá.
  - `camino-cresta`: camino de la cresta o de los patriarcas, de Beerseba a Siquem pasando por Hebrón, Belén, Jerusalén y Betel.
  - `galilea-judea-jordan`: rodeo por el valle del Jordán (Galilea → Bet-seán → Jericó → Jerusalén). Nota: «Muchos judíos evitaban Samaria por la enemistad entre ambos pueblos (Jn 4:9) y bajaban por el valle del Jordán», refs `Lucas 9:51-56`, `Lucas 17:11`, `Lucas 19:1`, relación `galilea-judea-samaria`.
  - `galilea-judea-samaria`: ruta directa por Samaria (Nazaret → Siquem/Sicar → Betel → Jerusalén), unos 3 días. Nota sobre Juan 4:4, «le era necesario pasar por Samaria», refs `Juan 4:3-5`, `Juan 4:43`.
- **`modernos.json`:** unas 25 ciudades y 10 países actuales con `[lon,lat]`, en tono tenue y nunca con más prioridad de etiqueta que un lugar bíblico.
- **MiniMap:** SVG de 160×110 con `land` simplificado del área y un rectángulo con los bounds visibles. Clic en el minimapa centra el mapa ahí.
- **LocateButton** «¿Dónde estoy?»: `navigator.geolocation`. Si la posición cae dentro del bbox, vuela ahí. Si cae fuera, toast «Estás a N km de Jerusalén, hacia el <rumbo>» (rumbo en 8 puntos cardinales). Si el permiso se deniega, toast explicativo.
- Al tocar un camino se abre una ficha simple con nota, refs (abren el Lector) y botón «Comparar con…» que muestra la `relacion` resaltada.
- [ ] **Step 1: Test.** Cada camino tiene al menos 2 coords dentro del bbox y refs que parsean; `relacion` apunta a un id existente.
- [ ] **Step 2–4:** fallan, implementar, en verde.
- [ ] **Step 5: Commit.**

### Task 13: Integraciones, celular y smoke

**Files:**
- Modify: `apps/web/src/modules/reader/ReaderPage.jsx`: botón «🗺 Mapa» en la barra que navega a `/atlas?cap=<bookId>.<cap>`. El mapa enfoca `placesForChapter` y `routesForChapter`, y muestra un banner «Lugares de Juan 4 (n)».
- Modify: `apps/web/src/modules/timeline/TimelinePage.jsx` y `packages/data/timeline.json`: cada `eras[]` gana `periodo` (id de mapa o null), y cada evento con lugar gana `places[]`. Esto se completa para los eventos bíblicos que tengan un lugar claro. Botón «Ver en el mapa» → `/atlas?periodo=…&lugar=…`.
- Modify: `apps/web/src/components/Sidebar.jsx`: «Atlas 3D» pasa a «Atlas bíblico».
- Modify: `apps/web/src/modules/home/HomePage.jsx`: la tarjeta del atlas describe el nuevo mapa.
- Modify: `apps/web/src/styles/atlas.css`: debajo de 760 px, los paneles pasan a una hoja inferior con asa y botón cerrar, y los controles de zoom suben por encima de la hoja (Review Focus 5).
- Create: `apps/web/e2e/atlas.smoke.mjs`, un script Playwright con `node`.

- [ ] **Step 1: Escribir el smoke.**
  1. Con `page.route(/^https?:\/\/(?!localhost)/, r=>r.abort())`, `/atlas` muestra el canvas, la capa `land` tiene features renderizadas (`map.queryRenderedFeatures({layers:['land']}).length>0`, expuesto como `window.__atlasMap` solo en dev o preview) y no hay `pageerror` (Review Focus 4).
  2. `/atlas?cap=jhn.4` muestra el banner con «Juan 4».
  3. Con viewport 390×844, abrir una ficha, cerrarla y ver que el botón de zoom sea clickeable (Review Focus 5).
  4. `/lector/jhn/4` → botón «Mapa» → la URL contiene `cap=jhn.4`.
- [ ] **Step 2: Correr el smoke contra `vite preview`** y verificar que falla antes de los cambios.
- [ ] **Step 3: Implementar las integraciones y el responsive.**
- [ ] **Step 4: Correr el smoke y `npm test`, ambos en verde.** Medir con `npm run build` el tamaño gzip de los chunks del atlas y anotarlo en el PR; debe cumplir el límite de Global Constraints.
- [ ] **Step 5: Commit, push y PR**, con capturas en claro y oscuro, de escritorio y de celular.
