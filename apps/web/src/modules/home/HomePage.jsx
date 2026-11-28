import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BOOKS, formatReference } from '../../lib/references.js';
import { loadVersion } from '../reader/bibles.js';
import { useOpenRef } from '../../hooks/useOpenRef.js';

// Versículo del día: selección CC0 de MEGA.Bible, texto en RV1909 (español).
function VerseOfDay() {
  const openRef = useOpenRef();
  const [v, setV] = useState(null); // { bookId, chapter, verse, text }

  useEffect(() => {
    let alive = true;
    const today = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
    );
    fetch('https://mega.bible/api/v1/data/votd')
      .then((r) => r.json())
      .then(async (d) => {
        const ref = d?.data?.refs?.[today];
        if (!ref || !alive) return;
        const rv = await loadVersion('rv1909');
        if (!alive) return;
        const text = rv.books[ref.book]?.[ref.chapter - 1]?.[ref.verse - 1];
        if (text) setV({ ...ref, text });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!v) return null;
  const book = BOOKS.find((b) => b.id === v.bookId);
  if (!book) return null;

  function open() {
    openRef({ book, chapter: v.chapter, verseStart: v.verse });
  }

  return (
    <div className="votd">
      <div className="votd-kicker">✠ Versículo del día</div>
      <p className="votd-verse">«{v.text}»</p>
      <button className="votd-ref" onClick={open}>
        {formatReference({ book, chapter: v.chapter, verseStart: v.verse, verseEnd: null })}
      </button>
      <span className="votd-src">calendario CC0 MEGA.Bible · RV1909</span>
    </div>
  );
}

const MODULES = [
  {
    to: '/lector',
    phase: 'Fase 3 · integrado',
    ready: true,
    title: 'Lector multiversión',
    desc: 'RV1909, NBV, Valera 1602, KJV y WEB en columnas paralelas (hasta 3 versiones con selector propio), botón ⇄ que compara cada versículo en todas las versiones, panel 📖 con el comentario completo de Matthew Henry, resaltado personal de 9 colores y filtro por color.',
  },
  {
    to: '/atlas',
    phase: 'Fase 2 · integrado',
    ready: true,
    title: 'Atlas bíblico',
    desc: 'Mapa plano de estudio con más de 1.000 lugares bíblicos, recorridos bíblicos, territorios por período, caminos antiguos, búsqueda por pasaje y fichas con tus notas. La geografía base funciona sin conexión.',
  },
  {
    to: '/referencias',
    phase: 'Fase 5 · integrado',
    ready: true,
    title: 'Referencias cruzadas',
    desc: 'Grafo radial navegable sobre ~240 mil conexiones (OpenBible) más una capa curada y tipificada: cita directa, alusión, tipología, contraste, eco.',
  },
  {
    to: '/interlineal',
    phase: 'Fase 7 · integrado',
    ready: true,
    title: 'Interlineal',
    desc: 'Hebreo/arameo (OSHB) y griego (SBLGNT) palabra por palabra: morfología decodificada, lema, transliteración, número Strong y glosa con definición.',
  },
  {
    to: '/concordancia',
    phase: 'Fase 9 · integrado',
    ready: true,
    title: 'Concordancia Strong',
    desc: 'Todas las ocurrencias de cualquier número Strong (H430, G26) o lema: palabra original, morfología y el versículo en RV1909. Clic abre Interlineal o Lector.',
  },
  {
    to: '/diccionarios',
    phase: 'Fase 11 · integrado',
    ready: true,
    title: 'Diccionarios e índice temático',
    desc: "Easton y Smith (8.500 artículos) y Nave (5.300 temas con sus versículos agrupados). Las referencias dentro de cada artículo se abren directo en el Lector.",
  },
  {
    to: '/devocional',
    phase: 'Extra · integrado',
    ready: true,
    title: 'Devocional diario',
    desc: 'Mañana y Noche, el clásico de Charles Spurgeon: una lectura breve para cada día del año, con sus referencias bíblicas clicables hacia el Lector.',
  },
  {
    to: '/infantil',
    phase: 'Extra · integrado',
    ready: true,
    title: 'Ministerio infantil',
    desc: 'Catorce historias grandes de la Biblia contadas en dos minutos, con versículo para memorizar cada una. Para escuela dominical y familias.',
  },
  {
    to: '/planes',
    phase: 'Fase 13 · integrado',
    ready: true,
    title: 'Planes de lectura',
    desc: 'Biblia en un año, Nuevo Testamento en 90 días, Pentateuco en 60 y Salmos en un mes. Progreso y racha guardados en localStorage.',
  },
  {
    to: '/harmonia',
    phase: 'Fase 14 · integrado',
    ready: true,
    title: 'Armonía evangélica + variantes',
    desc: 'Perícopas de los cuatro evangelios en columnas paralelas, y variantes textuales mayores (final de Marcos, la mujer adúltera…) con honestidad académica.',
  },
  {
    to: '/hermeneutica',
    phase: 'Extra · integrado',
    ready: true,
    title: 'Principios de hermenéutica',
    desc: "Cómo interpretar la Biblia según R. C. Sproul y César Vidal: reglas de contexto, analogía de la fe, método histórico-gramatical y los tipos de paralelismo de la poesía hebrea, con ejemplos clicables.",
  },
  {
    to: '/teologia',
    phase: 'Fase 6 · integrado',
    ready: true,
    title: 'Posturas teológicas',
    desc: 'Panel simétrico en 6 temas disputados: cada posición con sus textos base y las objeciones que recibe. Sin veredictos.',
  },
  {
    to: '/linea-tiempo',
    phase: 'Fase 6 · integrado',
    ready: true,
    title: 'Línea de tiempo',
    desc: 'Doble carril sincronizado con zoom: la historia bíblica arriba y la historia de la Iglesia abajo, sobre el mismo eje.',
  },
  {
    to: '/notas',
    phase: 'Fase 4 · integrado',
    ready: true,
    title: 'Segundo cerebro',
    desc: 'Notas Markdown con detección automática de referencias bíblicas, backlinks por pasaje compartido y export .md compatible con Obsidian.',
  },
];

export default function HomePage() {
  return (
    <div className="page page-narrow">
      <header className="page-header">
        <div className="kicker">Plataforma integral de estudio bíblico</div>
        <h2>Ophir</h2>
        <p className="lede">
          «Escudriñad las Escrituras, porque a vosotros os parece que en ellas
          tenéis la vida eterna» (Jn 5:39). Como la tierra del oro fino de
          1 Reyes 9:28, Ophir busca ser mina y refinería a la vez: extraer y
          pulir el sentido del texto.
        </p>
      </header>

      <VerseOfDay />

      <Link to="/evangelio" className="gospel-cta">
        <span className="gv-cta-cross">☩</span>
        <div>
          <div className="gv-cta-kicker">Empezá por lo esencial</div>
          <h3>El Evangelio, claramente explicado</h3>
          <p>
            Seis pasos con sus citas bíblicas: del pecado que nos condena al
            pago consumado en la cruz, y la vida eterna prometida a todo el que
            cree.
          </p>
        </div>
        <span className="gv-cta-arrow">→</span>
      </Link>

      <div className="card-grid">
        {MODULES.map((m) => (
          <Link key={m.to} to={m.to} className="card">
            <div className={`card-phase${m.ready ? ' ready' : ''}`}>
              {m.phase}
            </div>
            <h3>{m.title}</h3>
            <p>{m.desc}</p>
          </Link>
        ))}
      </div>

      <header className="page-header" style={{ marginTop: 44 }}>
        <div className="kicker">Compromisos del proyecto</div>
        <h2>Lo que Ophir no hace</h2>
      </header>
      <div
        className="placeholder-box"
        style={{ textAlign: 'left', lineHeight: 2 }}
      >
        → No arbitra disputas doctrinales genuinas; presenta el mapa completo de
        posturas.
        <br />
        → No oculta el aparato crítico: variantes textuales y disputas de
        autoría se muestran con honestidad académica.
        <br />→ No mezcla dato arqueológico confirmado con reconstrucción
        especulativa sin distinguirlos.
      </div>
    </div>
  );
}
