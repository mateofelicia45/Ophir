# Mapa bíblico de estudio — diseño

Fecha: 2026-11-26 · Pedido por Mateo · Reemplaza el módulo `/atlas` (globo 3D)

## 1. Intención

En palabras de Mateo: **"un mapa para estudiar y entender eventos y geografía bíblica"**. Es una herramienta de estudio, no un adorno. Mientras lee un pasaje, Mateo necesita ver *dónde* ocurrió, *cuándo* ocurrió y *cómo se mueve* la historia: quién viajó de dónde a dónde, qué poder dominaba la región en esa época y qué tan lejos queda un lugar de otro.

El globo 3D actual no sirve para eso. Israel ocupa un punto en una esfera, las "historias" son listas de lugares sin recorrido ni época, la línea de tiempo vive aparte y la textura de la Tierra se descarga de unpkg, así que sin conexión el globo se ve vacío.

## 2. Objetivos

1. **Escala correcta.** El mapa abre centrado en el Levante, con el Cercano Oriente y el Mediterráneo oriental a un zoom de distancia.
2. **Geografía legible.** Costas, ríos, lagos y relieve, con los nombres bíblicos de mares y regiones: Mar Grande, Mar de Cineret, Mar Salado, Neguev, Sefela, Galilea, Samaria, Judea, Decápolis y otros.
3. **Rutas como relatos.** Cada ruta tiene tramos con su pasaje y se puede recorrer parada por parada (anterior/siguiente), con el texto del versículo y la línea animada del tramo.
4. **Tiempo.** Un selector de época, basado en las `eras` de `timeline.json`, filtra los lugares, las rutas y los eventos, y muestra fronteras aproximadas de los poderes de cada época.
5. **Conexión con el resto de Ophir.**
   - Desde el **Lector**, un botón «Ver en el mapa» abre el mapa con los lugares y rutas del capítulo activo.
   - Desde la **Línea de tiempo**, cada evento con lugar tiene un botón «Ver en el mapa».
   - En la ficha de un lugar, los versículos abren el **Lector de Ophir**. Hoy abren BibleGateway.
6. **Medir distancias.** Lo que hoy hacen los "fijados" pasa a ser una herramienta de medición clara: km en línea recta y días de camino aproximados (unos 30 km por día a pie).
7. **Funciona sin conexión.** La geografía base viaja dentro del proyecto. Solo el relieve fino puede depender de internet, y si falta el mapa sigue siendo legible.
8. **Poder ubicarse.** Mateo pidió "todo, poder ubicarme": orientarse en la geografía aunque no la conozca de memoria. Para eso el mapa ofrece:
   - una barra de escala y un mini-mapa de ubicación que muestra dónde está la vista dentro del Mediterráneo;
   - un interruptor «nombres modernos», que superpone ciudades y países actuales (Tel Aviv, Ammán, Damasco, Israel, Jordania…) en un tono tenue;
   - un botón «¿Dónde estoy?» que, con permiso del navegador, ubica al usuario o, si está lejos del área, muestra la distancia y la dirección hasta Jerusalén.
9. **Caminos antiguos con su contexto.** Una capa de rutas de la época (Vía Maris, Camino del Rey, camino de la cresta o de los patriarcas, valle del Jordán) muestra *por qué* la gente viajaba como viajaba. Ejemplo pedido por Mateo: los judíos que iban de Galilea a Judea solían bordear Samaria por el valle del Jordán, mientras que la ruta directa cruzaba Samaria. Ese contraste ilumina Juan 4:4, «le era necesario pasar por Samaria». Cada camino tiene una nota y sus pasajes.
10. **Usable en celular.** En pantallas chicas, los paneles pasan a una hoja inferior deslizable.

## 3. No-objetivos

- Vista 3D o globo terráqueo.
- Fotos satelitales.
- Una base de datos arqueológica completa.
- Editar lugares o rutas desde la interfaz: los datos siguen siendo JSON curado en `packages/data/atlas/`.

## 4. Anti-objetivos (sería un fracaso aunque funcione)

- **Presentar una conjetura como un hecho.** Fronteras, rutas disputadas (como el Éxodo) y lugares de ubicación incierta se marcan visualmente como aproximados. Esto sigue la regla de `DESIGN.md` §5. El campo `confidence` que ya existe se muestra en el mapa.
- **Perder lo que ya funciona:** búsqueda, filtros por región, categoría y libro, lista de lugares, fijados y ficha de lugar.
- **Un mapa en blanco sin internet.**
- **Una carga lenta:** el mapa base no debe sumar más de unos 3 MB comprimidos a la carga del módulo.

## 5. Enfoques considerados

| Enfoque | Qué ofrece | Qué cuesta |
|---|---|---|
| **A. Mapa plano interactivo (MapLibre GL) con datos propios** ✅ elegido | Escala correcta, zoom fluido, capas, rutas animadas y relieve | Reemplaza el globo; es el trabajo más grande |
| B. Mapa ilustrado estilo pergamino (SVG + D3) | Muy artístico y 100 % sin conexión | Pierde detalle con el zoom; cada capa se dibuja a mano |
| C. Mejorar el globo 3D | Lo más rápido | La escala sigue sin servir para estudiar el Levante |

Mateo eligió **A**.

## 6. Diseño

### 6.1 Motor y mapa base
- **MapLibre GL JS** (open source, sin API key) en lugar de Three.js. Three.js sale del bundle si ningún otro módulo lo usa.
- **Geografía base local:** `tools/build-basemap.mjs` descarga Natural Earth (dominio público, escala 10m), lo recorta al área de lon −12…65 y lat 10…48, simplifica geometrías y genera `packages/data/atlas/basemap/*.geojson`: tierra, costas, ríos, lagos. Esos archivos se versionan en el repo.
- **Estilo propio de Ophir:** tierra en tonos arena o pergamino oscuro, agua en azul petróleo profundo y tipografía Playfair para los nombres antiguos, en armonía con `tokens.css`.
- **Relieve:** hillshade a partir de un DEM raster público y gratuito, sin key, cuando hay conexión. Sin conexión, la capa se omite sin errores.

### 6.2 Datos nuevos (en `packages/data/atlas/`)
- `labels.json`: mares, regiones y accidentes con su nombre bíblico, el nombre moderno y las eras en que aplica.
- `routes.json`: rutas con `id`, `title`, `era`, `color`, `disputed`, `note` y `legs[]`. Cada tramo tiene `from`, `to` (ids de `locations.json`), `ref` (formato canónico de Ophir) y `summary`. Set inicial:
  - Abraham (Ur → Harán → Canaán → Egipto → Canaán)
  - Éxodo, marcado `disputed` y con nota sobre las rutas alternativas
  - Ministerio de Jesús
  - Los tres viajes misioneros de Pablo
  - El viaje de Pablo a Roma
- `roads.json`: caminos antiguos como líneas con `id`, `name`, `eras`, `note`, `refs[]` y `coords` (polilínea curada a mano). Las variantes de ruta, como «rodeo por el Jordán» y «directo por Samaria», se modelan como caminos separados con una nota que los relaciona.
- `modern.json`: ciudades y países actuales para el interruptor «nombres modernos».
- `eras-borders.json`: polígonos aproximados de los poderes principales por era (Egipto, Asiria, Babilonia, Persia, Grecia/seléucidas, Roma, Israel/Judá unidos y divididos). Siempre se dibujan con borde punteado y la etiqueta «aproximado».
- `locations.json`: se agrega un campo opcional `eras[]`. Los lugares sin `eras` aparecen en todas.
- `timeline.json`: los eventos ganan un campo opcional `places[]` con ids de lugares.

### 6.3 Interfaz
Todo el módulo vive en `/atlas`. La URL acepta `?lugar=`, `?ruta=`, `?era=` y `?cap=libro.capítulo`, así cada vista se puede abrir desde otros módulos o compartir.

```
┌──────────────────────────────────────────────────────────────┐
│ [Buscar lugar…]  [Época ▾ Monarquía unida]  [Rutas] [Medir] │
├───────────────┬──────────────────────────────────────────────┤
│ Panel lateral │                                              │
│ · Rutas       │                MAPA                          │
│ · Eventos de  │     (relieve, nombres antiguos, lugares,     │
│   la época    │      ruta activa animada)                    │
│ · Lugares     │                                              │
│               │   ┌──── Ficha del lugar / Parada de ruta ──┐ │
│               │   │ Betel · confianza alta                 │ │
│               │   │ Gn 28:19 → abre el Lector              │ │
│               │   │ ◀ parada 3 de 7 ▶                      │ │
└───────────────┴──────────────────────────────────────────────┘
```

- **Lugares:** círculos por categoría. A poco zoom se agrupan en clusters (MapLibre lo hace nativamente). Al acercarse aparecen las etiquetas.
- **Ruta activa:** la línea se dibuja tramo a tramo. Las flechas ◀ ▶ avanzan de parada y muestran el versículo del tramo, en RV1909 desde `bibleService`.
- **Medir:** clic en dos o más lugares para ver la distancia por tramo, el total y los días de camino.
- **Leyenda** de categorías y de confianza, plegable.
- **Orientación:** barra de escala, mini-mapa, interruptor «nombres modernos» y botón «¿Dónde estoy?».
- **Capa «Caminos antiguos»:** al tocar un camino se abre su nota y sus pasajes.

### 6.4 Integraciones
- `ReaderPage`: botón «🗺 Mapa» en la barra, que navega a `/atlas?cap=<libro>.<cap>`. El mapa resalta los lugares cuyo `bibleVerses` cae en ese capítulo y las rutas con algún tramo en ese capítulo.
- `TimelinePage`: los eventos con `places` muestran «Ver en el mapa», que navega a `/atlas?era=…&lugar=…`.
- `LocationPanel`: los versículos usan `useOpenParsedRef` para abrir el Lector en vez de BibleGateway.
- Sidebar: «Atlas 3D» pasa a llamarse «Atlas bíblico».

### 6.5 Calidad
- Se agrega Vitest con tests de datos. Todo `from` y `to` de `routes.json` debe existir en `locations.json`. Todo `ref` debe parsear con `lib/references.js`. Todo id de `places[]` debe existir. Las coordenadas deben caer dentro del área del mapa base.
- Test de la función «lugares de un capítulo».
- Smoke con Playwright: `/atlas` renderiza el canvas sin errores de consola, con la red externa bloqueada para probar el modo sin conexión.

## 7. Decisiones del constructor (Claude), revisables por Mateo
- MapLibre GL en vez de Leaflet, por las rutas animadas, los clusters y el estilo vectorial.
- Natural Earth 10m como fuente de la geografía base.
- 30 km por día como velocidad de caminata para estimar días de viaje.
- Set inicial de rutas y fronteras de la §6.2. Se curan a partir de atlas bíblicos de referencia general, y lo dudoso se marca `approx` o `disputed`.
- El relieve online es opcional. El proveedor concreto queda a elección del implementador entre los gratuitos sin key.

## 8. Fuera de este diseño (después)
- Renovar la estética general: Inicio, tipografía y espaciado comunes a todos los módulos.
- Mejoras de práctica en los demás módulos.
- Modo «compañero de lectura» automático, donde el mapa sigue al Lector en vivo en pantalla dividida.
