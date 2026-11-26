import { useNavigate } from 'react-router-dom';
import { usePassage } from '../../context/PassageContext.jsx';
import { parseReference, formatReference } from '../../lib/references.js';
import THEOLOGY from '@data/theology.json';

function parseRefs(textosBase) {
  return textosBase
    .map((t) => ({ raw: t, parsed: parseReference(t.replace(/\./g, ' ')) }))
    .map((r) =>
      r.parsed
        ? { ok: true, label: formatReference(r.parsed), value: r.parsed }
        : { ok: false, label: r.raw }
    );
}

function RefChips({ refs, onOpen }) {
  return (
    <div className="th-refs">
      {refs.map((r) =>
        r.ok ? (
          <button key={r.label} onClick={() => onOpen(r.value)}>
            {r.label}
          </button>
        ) : (
          <span key={r.label} className="th-refraw" title="Cita externa">
            {r.label}
          </span>
        )
      )}
    </div>
  );
}

function goToTopic(id) {
  document
    .getElementById(`tema-${id}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function TheologyPage() {
  const navigate = useNavigate();
  const { setPassage } = usePassage();

  const consensos = THEOLOGY.topics.filter((t) => t.kind === 'consenso');
  const debates = THEOLOGY.topics.filter((t) => t.kind !== 'consenso');

  function openRef(p) {
    setPassage({
      book: p.book.name,
      chapter: p.chapter,
      verseStart: p.verseStart,
      verseEnd: p.verseEnd,
    });
    navigate('/lector');
  }

  return (
    <div className="theology-root">
      <header className="th-header">
        <p className="xr-kicker">Panel teológico · 7 loci sistemáticos</p>
        <h2 className="th-title">Lo zanjado y lo debatido</h2>
        <p className="th-disclaimer">
          Dos secciones. El consenso es lo que la Escritura enseña y los
          concilios ecuménicos definieron — no está abierto a votación. El
          debate reúne posturas entre cristianos presentadas en columnas
          simétricas: Ophir no arbitra, cada una con sus mejores textos y las
          objeciones que recibe (§5).
        </p>
      </header>

      <nav className="th-index" aria-label="Índice de temas">
        <div className="th-index-head">
          <h2>
            Índice <span>según la estructura de la Teología Sistemática de Wayne Grudem</span>
          </h2>
          <div className="th-index-key">
            <span><i className="dot consenso" /> Consenso</span>
            <span><i className="dot debate" /> Debate</span>
          </div>
        </div>

        {THEOLOGY.loci.map((locus) => (
          <div key={locus.id} className="th-index-row">
            <div className="th-index-part">
              <b>{locus.parte}</b>
              <div>
                <strong>{locus.label}</strong>
                <small>{locus.desc}</small>
              </div>
            </div>
            <div className="th-index-topics">
              {locus.topics.map((id) => {
                const t = THEOLOGY.topics.find((x) => x.id === id);
                if (!t) return null;
                return (
                  <button
                    key={id}
                    className={`th-chip ${t.kind}`}
                    onClick={() => goToTopic(id)}
                  >
                    {t.titulo}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <section className="th-section">
        <h2 className="th-section-title">
          Consenso cristiano
          <span>definido por la Escritura y los concilios ecuménicos</span>
        </h2>

        {consensos.map((topic) => (
          <article key={topic.id} id={`tema-${topic.id}`} className="th-consensus">
            <h3>{topic.titulo}</h3>
            <p className="th-question">{topic.pregunta}</p>

            <ol className="th-affirmations">
              {topic.afirmaciones.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>

            <h4>Textos base</h4>
            <RefChips refs={parseRefs(topic.textosBase)} onOpen={openRef} />

            <h4>Aclaraciones históricas</h4>
            <ul className="th-clarifications">
              {topic.aclaraciones.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="th-section">
        <h2 className="th-section-title">
          Debate entre cristianos
          <span>columnas deliberadamente simétricas — juzgá vosotros</span>
        </h2>

        {debates.map((topic) => (
          <article key={topic.id} id={`tema-${topic.id}`} className="th-topic">
            <h3>{topic.titulo}</h3>
            <p className="th-question">{topic.pregunta}</p>

            <div
              className="th-grid"
              style={{ '--cols': Math.min(topic.posiciones.length, 4) }}
            >
              {topic.posiciones.map((p) => (
                <article key={p.nombre} className="th-pos">
                  <h4>{p.nombre}</h4>
                  <p className="th-summary">{p.resumen}</p>

                  <h5>Textos base</h5>
                  <RefChips refs={parseRefs(p.textosBase)} onOpen={openRef} />

                  <h5>Objeciones que recibe</h5>
                  <ul className="th-objections">
                    {p.objecionesRecibidas.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </article>
        ))}

        <footer className="th-footer">
          Si una postura parece más débil, leé a sus propios autores antes de
          descartarla.
        </footer>
      </section>
    </div>
  );
}
