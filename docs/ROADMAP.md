# ROADMAP de construcción — Ophir

Orden por dependencias técnicas, no por atractivo. Cada fase debe dejar el proyecto compilando y usable.

## Estado

- [x] Fase 0 — Planificación y decisiones (ver `DESIGN.md` §6)
- [x] Fase 1 — Fundaciones frontend
- [x] Fase 2 — Integración del atlas
- [x] Fase 3 — Lector multiversión + resaltado personal
- [x] Fase 4 — Notas estilo Obsidian
- [x] Fase 5 — Grafo de referencias cruzadas
- [x] Fase 6 — Línea de tiempo + panel teológico
- [x] Fase 7 — Interlineal
- [x] Extra — Página del evangelio
- [x] Extra — Página de hermenéutica (Sproul + Vidal, paralelismos con ejemplos)
- [x] Extra — Devocional diario (Spurgeon, Mañana y Noche)
- [x] Extra — Ministerio infantil (14 historias curadas en español)
- [x] Extra — Versículo del día + biblioteca de recursos (Smith, votd; ISBE y Freeman pendientes)
- [x] Fase 8 — Vista paralela de versiones
- [x] Fase 9 — Concordancia Strong
- [x] Fase 10 — Comentarios clásicos
- [x] Fase 11 — Diccionarios e índice temático
- [x] Fase 12 — Lectura en voz alta (TTS)
- [x] Fase 13 — Planes de lectura
- [x] Fase 14 — Harmonía evangélica + variantes textuales
- [x] Fase 15 — Backend (Flask/SQLAlchemy/MySQL)
- [ ] Fase 16 — Asistente IA

## Detalle por fase

### Fase 1 — Fundaciones frontend
Scaffold Vite + React en `apps/web`. Router con un módulo por ruta. Layout estable (sidebar de módulos + área central). Tema visual propio de Ophir. Estado global mínimo: **pasaje activo** (libro/capítulo/versículo) como contexto compartido que todos los módulos leen.

### Fase 2 — Integración del atlas
Migrar `atlas-biblico` (Three.js, vanilla) a componente React `<AtlasModule />`:
- `globe.js`, `markers.js`, `panel.js`, `search.js`, `data.js` → adaptados a ciclo de vida React (montaje/desmontaje del renderer).
- `locations.json` → `packages/data/atlas/locations.json`.
- Enlaces "versículo → lugar": los `bibleVerses` de cada ubicación se parsean contra el formato canónico de referencia para el modo "compañero de lectura" (futuro).

### Fase 3 — Lector multiversión + resaltado
- Estructura de datos: `{ version, book, chapter, verses[] }` en JSON por versión.
- Versiones iniciales (dominio público): **RV1909, KJV, WEB**. Arquitectura de registro de versiones lista para importar textos con copyright desde archivo local.
- Vista paralela en columnas, filtro por familia de traducción.
- Resaltado por selección con la paleta personal de 9 colores; persistencia en localStorage; vista filtrada por color.

### Fase 4 — Notas estilo Obsidian
Markdown + YAML frontmatter (libro, capítulo, tema). Backlinks automáticos por cita de referencia bíblica. Export/import compatible con vault. Grafo local de notas.

### Fase 5 — Referencias cruzadas ✅
Dataset abierto tipificado (cita directa / alusión / tipología / contraste / eco). Modelo nodo-arista único compartido con notas. Visualización de grafo.

Implementación: base masiva OpenBible.info (~240k aristas, CC BY 4.0, lazy-loaded) + capa curada de ~90 conexiones clásicas tipificadas. Grafo radial SVG navegable (clic = nuevo hub, sincroniza el pasaje activo con el lector), filtros por tipo, texto expandible desde RV1909 y export a Obsidian con wikilinks.

### Fase 6 — Timeline + panel teológico ✅
Doble carril sincronizado (historia bíblica / historia de la Iglesia). Panel simétrico de posturas con textos base y objeciones.

Implementación: timeline con eje compartido, zoom, bandas de era y escalonado de etiquetas; 54 eventos curados con referencias navegables, extendido desde la creación según genealogías masoréticas (cómputo estilo Ussher anclado en Abraham 2166 a.C., marcado como aproximado). Seis símbolos de pacto (✦ edénico, ≋ noético, ◉ abrahámico, ❒ mosaico, ♛ davídico, ☩ nuevo) dibujados como rombos dorados con líneas divisorias a todo lo alto. Panel teológico ampliado a 21 temas organizados según las siete partes de la Teología Sistemática de Wayne Grudem (Palabra de Dios, Dios, Hombre, Cristo/Espíritu, Aplicación de la redención, Iglesia, Futuro) con índice navegable al inicio: 8 de consenso (afirmaciones zanjadas + herejías rechazadas) y 13 de debate en columnas simétricas — cada postura con resumen, textos base clicables que abren el lector, y objeciones recibidas. Sin veredictos (§5); los dones se presentan como debate (continuismo/cesacionismo) sin adoptar la posición del autor.

### Fase 7 — Interlineal ✅
Import OpenScriptures Hebrew/Greek Morphology. Alineación palabra-palabra, lema, morfología, Strong, glosa contextual.

Implementación: pipeline `tools/build-interlinear.mjs` que convierte WLC/OSHB (XML, 471.658 palabras hebreo-arameo) y morphgnt SBLGNT (TXT, 137.554 palabras griegas) en JSON compacto por palabra: superficie + morfología + Strong (griego vía índice lema→Strong del diccionario openscriptures, 98,5% de cobertura). Léxicos Strong hebreo/griego con transliteración, glosa breve y definición completa. UI con selector de libro/capítulo (BookPicker compartido), tarjetas de palabra clicables con RTL automático para el AT, panel de detalle sticky con morfología decodificada al español (gramática OSHB y códigos Robinson), y línea de traducción RV1909 por versículo. Botón «Interlineal» en la barra del lector sincroniza el capítulo activo vía PassageContext. Datos lazy-loaded como chunks separados (~20 MB total).
### Extra — Página del evangelio ✅

Sección principal `/evangelio`: presentación del evangelio en seis pasos numerados (condena → sustituto → entrega voluntaria → definición → respuesta → promesa), con citas RV1909 como bloques destacados y referencias clicables que abren el pasaje en el lector. Banner destacado en Inicio y entrada propia en la barra lateral. Datos en `packages/data/gospel.json`.

### Extra — Página de hermenéutica ✅

Sección `/hermenéutica` (`/hermeneutica`): cuatro principios comunes a toda exégesis seria, las seis reglas de R. C. Sproul («Cómo interpretar la Biblia» / Knowing Scripture: sensus literalis, analogía de la fe, contexto, género, lo claro explica lo oscuro, ley y evangelio) y las seis del método histórico-gramatical de César Vidal (intención del autor, contexto histórico-cultural, lenguas originales, revelación progresiva, biblioteca unificada, centro cristológico). Incluye guía visual de los cinco tipos de paralelismo hebreo (sinónimo, antitético, sintético, escalonado, quiasmo) con ejemplos reales RV1909 clicables hacia el Lector. Contenido en `packages/data/hermeneutics.json` con el mismo marcado [[Referencia]] que El Evangelio; renderizador compartido extraído a `components/RichText.jsx`. Síntesis adaptada declarada en el pie (no citas textuales). Tarjeta en Inicio y entrada «✒ Hermenéutica» en la barra lateral.

### Extra — Devocional diario (Spurgeon) ✅

Página `/devocional`: sección por día del año (por defecto el de hoy) con las lecturas «Mañana ☀» y «Noche ☾» de **C. H. Spurgeon — Morning and Evening** (PD). Datos: `CollierTR/morning-and-evening-json` → `packages/data/devotional/spurgeon.json` (366 días × 2 slots, 732 devocionales; `tools/build-resources.mjs` extrae también la referencia del versículo clave usando el escáner `lib/refscan.js`). El texto (inglés) se renderiza con `components/ScanRefs.jsx`, que detecta las citas "Joshua 5:12", "Gen. 1:1"… y las abre en el Lector. Navegación día anterior/siguiente y botón «Hoy».

### Extra — Ministerio infantil ✅

Página `/infantil` con 14 historias grandes de la Biblia curadas en español (7 del AT, 7 de NT): relato breve en 2 minutos, versículo para memorizar y referencias clicables. Datos: `packages/data/children.json` con el mismo marcado [[Referencia]]. Idea en línea con las «minister resource bibles» de sitios como Crosswalk, pero 100% en español y sin contenido con licencia. Ideal para escuela dominical y familias.

### Extra — Versículo del día + biblioteca de recursos ✅ (y pendientes)

- **Versículo del día** en Inicio: calendario CC0 de `mega.bible/api/v1/data/votd` (366 refs, una por día, cursor estacional) mostrado en **texto RV1909 español** con chip que abre el Lector (`components/…`, widget `VerseOfDay`/`HomePage.jsx`, estilos `votd.css`).
- **Smith's Bible Dictionary** sumado a `/diccionarios` (ver Fase 11).
- Pensando en la paridad de sitios como BibleGateway / BlueLetterBible / e-Sword / OliveTree, constan como **pendientes**: **Enciclopedia ISBE** (sin fuente JSON/texto limpia hallada hoy; candidata: CCEL/Gutenberg) y **Freeman — Manners and Customs of the Bible** (costumbres de tiempos bíblicos; PDF/HTML en bibletruthpublishers.com, requiere scraping). El resto del menú pedido ya está cubierto: Concordancia Strong ✅, Atlas ✅, Diccionarios (Easton+Smith) ✅, Comentarios (Matthew Henry) ✅, Devocional diario ✅, Ministerio infantil ✅.

### Fase 8 — Vista paralela de versiones ✅
Modo paralelo del lector (pendiente de la Fase 3): dos columnas sincronizadas al mismo libro/capítulo, cada una con su selector de versión. Inspiración: Bible Hub.

Implementación: cada columna tiene su propio `<select>` de versión (sin duplicados entre columnas) + etiqueta de idioma y botón de cierre; el botón «＋ Paralelo» agrega hasta 3 columnas y la combinación se persiste en localStorage. Nuevo botón «⇄» por versículo abre un popover de comparación que muestra ese versículo en todas las versiones registradas (lazy-loaded) con enlace conceptual al Interlineal para el texto original.

Catálogo de versiones ampliado con dos españolas abiertas convertidas desde USFM de ebible.org mediante `tools/build-bible.mjs`: **Nueva Biblia Viva** (Biblica Open — español moderno con licencia libre) y **Valera 1602 Purificada** (histórica, dominio público). El conversor limpia notas/crossrefs/marcadores inline, expande rangos `\v 11-12` duplicando el texto para mantener la alineación por índice entre versiones, y elimina atributos de concordancia (`strong="G1063"`).

Versiones con copyright vigente (NVI, NTV, NBLA, DHH…): no se distribuyen con el proyecto; planificado un modo «traé tu clave» vía scripture.api.bible (Sociedad Bíblica Americana) que las descarga bajo demanda del usuario.

### Fase 9 — Concordancia Strong ✅
Búsqueda por número Strong sobre los datasets del interlineal: todas las ocurrencias de un lema/Strong en AT o NT, con superficie, morfología y contexto inmediato; clic abre el versículo en el Interlineal o en el Lector.

Implementación: índice invertido precalculado por `tools/build-strongs-index.mjs` (8638 números hebreos / 4941 griegos, 478.898 ocurrencias) en chunks lazy-loaded; la búsqueda es O(1). Acepta `H430`, `G26`, número suelto (busca en ambos testamentos), lemas y glosas con normalización de acentos (candidatos clicables cuando hay varios). Cada fila muestra referencia (→ Lector), palabra original RTL automático para el AT (→ Interlineal), morfología decodificada al español y el versículo completo en RV1909 cargado perezosamente. Botón «≡ Concordancia» agregado a la barra del lector.

### Fase 10 — Comentarios clásicos ✅
Comentarios de dominio público (Matthew Henry, Jamieson-Fausset-Brown, Barnes, Gill) convertidos a JSON por capítulo y servidos como panel lateral del lector. Pipeline similar al del interlineal (`tools/`).

Implementación: conversor `tools/build-commentary.mjs` que ingiere el repo `lyteword/mhenry-complete` (Markdown, CC0-1.0, 66 libros / 1039 capítulos / 28.547 bloques), limpia frontmatter/markdown y produce **un JSON por libro** en `packages/data/commentaries/mhc/`. El lector agrega botón «📖 Comentario» que abre un panel lateral (360 px, overlay en pantallas chicas) con selector de comentario, subtítulos y párrafos del capítulo activo; carga perezosa por libro (~100-900 KB gzip según tamaño). Registro extensible en `src/lib/commentaries.js` para sumar JFB/Barnes/Gill con el mismo pipeline.

### Fase 11 — Diccionarios e índice temático ✅
Easton, Hitchcock (nombres) y Nave Topical convertidos a JSON; búsqueda con normalización de acentos; entradas con referencias clicables que abren el lector.

Implementación: `tools/build-dictionaries.mjs` convierte dos fuentes: **Easton** (`garydavenport73/eastons-bible-dictionary-json`, PD — 3.961 entradas / 5.919 definiciones → `packages/data/dictionaries/easton.json`) y **Nave** (API `mega.bible/api/v1/data/topics`, CC BY 4.0 vía BibleData — 5.319 temas con refs ya en formato Ophir → `packages/data/naves/topics.json`). Más tarde se sumó **Smith's Bible Dictionary** (4.488 entradas; `tools/build-resources.mjs` filtra la fuente SMI de `neuu-org/bible-dictionary-dataset`). Nueva página `/diccionarios` con pestañas Easton/Smith/Nave, búsqueda sin acentos y detalle con chips de referencia. El escáner `lib/refscan.js` detecta referencias escritas al estilo inglés dentro del texto ("Gen. 1:1", "1 Sam. 17:34-36", "Rev. 1:8") mediante tabla de ~90 alias EN→ES y las convierte en enlaces al Lector; reutilizable para el panel de comentarios en inglés, los devocionales y los futuros recursos. Pendiente: Hitchcock (sin fuente JSON confiable hoy).

### Fase 12 — Lectura en voz alta (TTS) ✅
Web Speech API nativa del navegador, sin datos externos ni licencias: lee el capítulo activo verso a verso, resalta el versículo en reproducción, controles play/pausa/velocidad.

Implementación: hook `src/hooks/useSpeech.js` (Web Speech API): cola de utterances verso a verso del capítulo, selección de voz según idioma de la versión (es-ES/es-MX/…/en-US), velocidad 0.75×–1.5× y resaltado del versículo activo. En el Lector, botón «🔊 Oír» en la barra de herramientas + barra de reproducción (pausa/reanudar, detener, velocidad, versión a leer, progreso `v / total`). Arranca desde el versículo seleccionado del pasaje actual; se detiene sola al cambiar de pasaje. Detección de no-soporte (deshabilita el control).

### Fase 13 — Planes de lectura ✅
Planes curados (Biblia completa en un año, NT en 90 días, Pentateuco en 60 y Salmos en 30) con progreso local en localStorage, racha y día actual calculado.

Implementación: `tools/build-plans.mjs` genera los cuatro planes como JSON secuencial (cada día una lista de referencias {bookId, chapter} repartidas de forma equitativa entre los días → `packages/data/plans/*.json`). La página `/planes` muestra el catálogo de planes en tarjetas (con % de avance), y al abrir uno permite navegar día a día (hoy es calculado automáticamente a partir de la fecha de activación), marcar/desmarcar días completados y retomar en la racha. Las referencias de cada día abren directamente en el Lector vía `useOpenRef` y, al visitarlas, el día se marca automáticamente como leído. Progreso y estado persistidos en `localStorage` (`ophir.plansData`). Pendiente: planes personalizados por el usuario, planes por librería (Plutarco/Catequesis), y notificación de racha rota.

### Fase 14 — Harmonía evangélica + variantes textuales ✅
Perícopas sinópticas en columnas paralelas por evangelio; variantes mayores con honestidad académica y sin arbitraje doctrinal.

Implementación: página `/harmonia` con dos pestañas. **Armonía**: 29 perícopas principales de la vida de Jesús (desde el nacimiento hasta la Gran Comisión) en `packages/data/harmony/pericopes.json`, cada una con sus paralelos en Mateo/Marcos/Lucas/Juan; se muestra en una grilla con columnas por evangelio y chips que abren cada pasaje en el Lector. **Variantes textuales**: `packages/data/harmony/variants.json` lista 8 de las variantes mayores del NT (final largo de Marcos, la mujer adúltera, la Coma Johanneum, Hch 8:37, Lc 23:34, Hch 15:34, 1 Ti 3:16 y Ap 22:14) con sus lecturas manuscritas por tradición, sin inclinar el juicio (§5). Ambas se integran al Lector mediante `useOpenRef`.

### Fase 15 — Backend ✅
Flask + SQLAlchemy + MySQL (con SQLite por defecto para dev offline). Sincronización multi-dispositivo de resaltados/notas y CTEs recursivas para el grafo. La app web sigue funcionando offline-first.

Implementación: nuevo `apps/api` (Flask, `ophir/` package). Modelos SQLAlchemy: `User` (por `X-Device-Id` anónimo), `Highlight` (ref canónica + color, UQ por user/ref), `Note` (Markdown, id uuid del cliente) y `CrossRefEdge` (src→dst tipificado). Endpoints: `GET/POST /api/sync` (pull/push last-write-wins de notas + resaltados), `GET /api/references/neighbors` que consulta el grafo con **`WITH RECURSIVE`** (compatible SQLite y MySQL 8) a N saltos en ambas direcciones. Selección de base: **SQLite por defecto** (`var/ophir.db`, sin servidor); en producción se define `OPHIR_DATABASE_URL=mysql+pymysql://...`. CORS hacia el front Vite (:5173). Verificado: `python -m pytest tests -q` (5/5) + smoke test HTTP real (health, sync pull/push, CTE neighbors depth=2). El front aún no consume el API (queda el paso de integrar un cliente de sync en `lib/`); se documenta en `apps/api/README.md`. Cómo correr: `python -m ophir init-db` y luego `python -m ophir`.

### Fase 16 — Asistente IA
Prompt socrático de `DESIGN.md` §3. Contexto = pasaje activo + notas seleccionadas explícitamente por el usuario. Requiere API key propia.

## Convenciones

- Idioma de UI y datos: español (referencias bíblicas en formato canónico español: `Gn 1:1`, `1 Co 13`).
- Datos curados en `packages/data/` como JSON versionado; nada de contenido generado por IA sin revisión.
- Toda feature nueva debe respetar §5 de DESIGN.md (honestidad académica, no arbitraje doctrinal).
