# Proyecto "Ophir" — Plataforma Integral de Estudio Bíblico

### Documento de diseño + prompt de sistema para el asistente de IA embebido

> *"Escudriñad las Escrituras, porque a vosotros os parece que en ellas tenéis la vida eterna"* (Juan 5:39, RV60).
> El nombre **Ophir** evoca la tierra bíblica del oro fino (1 Reyes 9:28): una app que busca ser mina y refinería a la vez, extrayendo y puliendo el sentido del texto.

---

## 1. Visión general

Ophir no es un lector de Biblia más: es un **entorno de investigación** que trata el texto bíblico como un objeto tridimensional — lingüístico, geográfico y teológico — y le da al usuario las herramientas de un exégeta, un historiador y un cartógrafo al mismo tiempo, sin sacrificar la devoción personal por la erudición.

Módulos núcleo:

| Módulo | Función |
|---|---|
| **Lector multiversión** | Comparación simultánea de traducciones |
| **Interlineal** | Hebreo/Arameo/Griego con análisis morfológico |
| **Motor de referencias cruzadas** | Red semántica navegable, no solo lista |
| **Atlas dinámico** | Mapa mundial con capas históricas y rutas |
| **Panel de posturas teológicas** | Comparador de doctrinas por tradición |
| **Línea de tiempo** | Historia bíblica + historia de la Iglesia integradas |
| **Sistema de resaltado personal** | Tu paleta de colores, digitalizada |
| **Segundo cerebro (grafo de notas)** | Estilo Obsidian, con vínculos automáticos |
| **Asistente de estudio (IA)** | Tutor socrático, no oráculo de respuestas |

---

## 2. Módulo por módulo

### 2.1 Lector multiversión
- Vista en columnas o superpuesta (toggle) con: **RV60, NBLA, NVI, NTV, TLA, LBLA**, más **KJV, ESV, NASB** para cotejo con el mundo anglosajón.
- Resaltado de **divergencias léxicas** entre versiones (ej. *"propiciación"* vs *"sacrificio expiatorio"* en Romanos 3:25) con nota breve del porqué.
- Filtro por "familia de traducción": literal (LBLA/NASB), equivalencia dinámica (NVI/NTV), lenguaje sencillo (TLA).

### 2.2 Interlineal
- Texto original (TR/NA28 para griego, BHS para hebreo/arameo) alineado palabra por palabra.
- Por cada palabra: lema, análisis morfológico (caso, tiempo, voz, modo), número Strong, y **glosa contextual** (no solo la definición de diccionario, sino el matiz en *ese* uso).
- Enlace directo a otras ocurrencias del mismo lema en todo el canon, con frecuencia y distribución.
- Modo "raíz semántica": agrupa palabras por raíz para ver campos semánticos completos (útil para rastrear vocabulario).

### 2.3 Motor de referencias cruzadas
- No es una lista estática tipo Tesoro de Escrituras: es un **grafo navegable**. Cada versículo es un nodo; las aristas se tipifican como:
  - Cita directa (NT cita AT)
  - Alusión temática
  - Tipología (figura → cumplimiento)
  - Contraste doctrinal
  - Eco litúrgico o litúrgico-profético
- Vista de grafo interactivo (útil para ver, por ejemplo, cómo Isaías 53 se ramifica en los cuatro evangelios y las epístolas).
- Exportable como nota a Obsidian con `[[wikilinks]]` ya generados.

### 2.4 Atlas dinámico
- Mapa mundial (proyección histórica del Cercano Oriente y Mediterráneo) con capas activables:
  - Rutas de patriarcas, éxodo, conquista
  - Reinos divididos (Israel/Judá) con fronteras cambiantes por período
  - Viajes misioneros paulinos (con fechas estimadas por tramo)
  - Imperios circundantes (Egipto, Asiria, Babilonia, Persia, Grecia, Roma) superpuestos cronológicamente
- Cada punto del mapa vinculado a sus referencias bíblicas y a datos arqueológicos/extrabíblicos relevantes (con distinción clara entre lo atestiguado arqueológicamente y lo inferido).
- Modo "compañero de lectura": al leer un pasaje narrativo, el mapa se actualiza solo, mostrando la ubicación en tiempo real.

### 2.5 Panel de posturas teológicas
- Para temas disputados (predestinación/libre albedrío, escatología, dones espirituales, bautismo, gobierno eclesiástico, mileño), presentación **simétrica** de las posiciones principales:
  - Nombre de la postura y tradición asociada (reformada, arminiana, luterana, dispensacionalista, etc.)
  - Textos base que cada postura enfatiza
  - Argumento central en una versión fuerte (no *hombre de paja*)
  - Objeción principal de las otras posturas
- Objetivo explícito: **no** decirte qué creer, sino mostrarte el mapa de opciones con honestidad intelectual, para que vos hagas la exégesis. El panel señala explícitamente cuándo una lectura *coincide* o *diverge* de una tradición declarada, sin presentarla como la "por defecto".

### 2.6 Línea de tiempo integrada
- Doble carril: **historia bíblica** (patriarcas → exilio → intertestamentario → NT) y **historia de la Iglesia** (padres apostólicos → concilios → Reforma → misiones modernas), sincronizados para ver paralelos (ej. qué pasaba en Roma cuando se escribía Apocalipsis).
- Nodos vinculados a personajes, concilios, herejías refutadas y credos.

### 2.7 Sistema de resaltado personal (digitalización de tu paleta)

| Color | Categoría |
|---|---|
| Rojo | Cosas fuertes |
| Celeste | Celestial, poder y autoridad |
| Dorado | Atributos de Dios |
| Naranja | Datos históricos |
| Rosa | Profecía |
| Amarillo | Felicidad o buenas noticias |
| Verde | Aspectos positivos |
| Violeta | Tristeza, juicio, aspectos negativos |
| Naranja suave | Asuntos pendientes / aplicación personal |

- Resaltado por selección de texto, con capa de "notas al margen" digitales ancladas al versículo exacto.
- Vista de "solo dorado" o "solo rosa", etc., para armar rápidamente, por ejemplo, un catálogo personal de atributos de Dios o de profecías mesiánicas.

### 2.8 Segundo cerebro / grafo de notas
- Notas en Markdown, compatibles con Obsidian (import/export directo a vault), con YAML frontmatter automático (libro, capítulo, tema, tradición teológica).
- Backlinks automáticos: si citás Romanos 8:29-30 en una nota sobre predestinación, la nota se enlaza sola con cualquier otra nota que toque esos versículos.
- Vista de grafo global de *tus* notas, no solo del texto bíblico.

### 2.9 Asistente de estudio (IA)
Ver prompt de sistema completo en la sección 3. Rol: tutor mayéutico, no fuente de veredictos doctrinales.

---

## 3. Prompt de sistema para el asistente de IA embebido

```
Sos el asistente de estudio de Ophir, una plataforma de estudio bíblico.
Tu función es actuar como tutor mayéutico, no como autoridad doctrinal.

PRINCIPIOS:
1. Nunca resuelvas por el usuario una disputa teológica genuina (ej.
   predestinación vs. libre albedrío, escatología, dones espirituales).
   Presentá las posturas principales con su mejor argumento y sus fuentes
   bíblicas, y devolvé la pregunta: "¿qué texto te parece que pesa más
   y por qué?"
2. Distinguí siempre tres niveles de certeza:
   - Lo que el texto dice explícitamente (exégesis)
   - Lo que se infiere razonablemente (teología bíblica/sistemática)
   - Lo que es interpretación de tradición específica (denominacional)
3. Al citar el texto original (hebreo/griego/arameo), siempre dá
   transliteración y glosa, nunca solo el término en alfabeto original
   sin contexto.
4. Fomentá la conexión intertextual: cuando el usuario pregunte por un
   pasaje, sugerí (sin imponer) 2-3 referencias cruzadas relevantes con
   el TIPO de conexión (cita directa, tipología, eco temático).
5. Cuando el usuario pida un versículo, citalo en NBLA por defecto.
   Si pide varios, ofrecé RV60, NBLA, NVI, NTV y TLA en paralelo.
6. Mantené rigor histórico: distinguí entre dato arqueológico
   confirmado, consenso académico y conjetura.
7. No evangelices al usuario ni asumas su postura teológica salvo que
   la haya declarado. No presupongas que es creyente.
8. Cuando el usuario declare su tradición (ej. reformada), podés
   señalar dónde una lectura coincide o diverge de esa tradición,
   pero siempre marcando la fuente de esa tensión en el texto mismo,
   no solo en la tradición.
9. Evitá el tono de "voz en off de documental" en temas sensibles
   (juicio, sufrimiento, muerte, herejías perseguidas históricamente):
   sobriedad, no dramatismo.
10. Si el usuario pide ayuda para preparar una enseñanza o prédica,
    ayudalo a estructurar el argumento y a verificar la exégesis, pero
    la voz final del mensaje debe seguir siendo la suya.

FORMATO:
- Preferí respuestas estructuradas cuando el tema lo amerite (tablas
  para comparar posturas o traducciones, listas para pasos exegéticos).
- Usá vocabulario técnico (exégetis, hermenéutica, tipología,
  quiasmo, inclusio) con naturalidad, sin sobreexplicar términos que
  el usuario ya demostró conocer.
- Cuando compares traducciones, mostrá el matiz semántico concreto,
  no una opinión sobre cuál es "mejor".
```

---

## 4. Consideraciones técnicas

Reparto previsto sobre stack existente (Flask/SQLAlchemy, Django, React/Vite, MySQL):

- **Backend de datos bíblicos**: modelo relacional para libro/capítulo/versículo/versión, con tabla separada de referencias cruzadas tipificadas (origen, destino, tipo de relación) — un grafo dirigido guardado en tablas de nodos y aristas, consultable con recursión (CTEs en MySQL 8+).
- **Interlineal**: requiere dataset morfológico (corpus abiertos como *OpenScriptures Hebrew/Greek Morphology*) — no se genera con IA, se importa y se indexa.
- **Mapa**: Three.js/Leaflet con capas GeoJSON por período histórico; las rutas como líneas animadas por versículo.
- **Grafo de notas y referencias cruzadas**: librería de grafos (react-force-graph/D3) para visualización; el modelo de datos subyacente es el mismo para ambos casos de uso.
- **IA embebida**: llamadas a la API con el prompt de la sección 3, pasando siempre el pasaje activo y las notas del usuario como contexto — nunca como "memoria" persistente sin que el usuario lo sepa.

---

## 5. Lo que la app *no* debería hacer

- No posicionarse como árbitro final en disputas doctrinales genuinas.
- No ocultar el aparato crítico (variantes textuales, disputas de autoría) para simplificar: mostrarlo con honestidad académica.
- No mezclar el dato arqueológico confirmado con la reconstrucción especulativa sin distinguirlos visualmente.

---

## 6. Decisiones registradas (sesión de planificación)

| Decisión | Elección | Motivo |
|---|---|---|
| Frontend | React + Vite | Stack declarado; app modular necesita estado global compartido (pasaje activo, resaltados, notas) |
| Alcance inicial | Solo frontend | localStorage + JSON locales; backend recién cuando haya multi-dispositivo |
| Textos bíblicos | Dominio público primero | RV60/NBLA/NVI/NTV/TLA/LBLA tienen copyright; arrancamos con RV1909, KJV, WEB y arquitectura lista para versiones importadas localmente |
| Ubicación | Monorepo `ophir/` nuevo | `atlas-biblico` queda intacto como referencia; su código migra adaptado a `apps/web` |
