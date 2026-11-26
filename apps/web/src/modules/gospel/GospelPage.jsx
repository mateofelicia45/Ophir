import { useMemo } from 'react';
import { parseReference, formatReference } from '../../lib/references.js';
import { useOpenRef } from '../../hooks/useOpenRef.js';
import { RichText } from '../../components/RichText.jsx';
import GOSPEL from '@data/gospel.json';

export default function GospelPage() {
  const openRef = useOpenRef();

  const heroParsed = useMemo(
    () => (GOSPEL.heroQuote ? parseReference(GOSPEL.heroQuote.ref) : null),
    []
  );

  return (
    <div className="gospel-root">
      <header className="gv-hero">
        <span className="gv-cross">☩</span>
        <p className="xr-kicker">El punto de partida</p>
        <h1>El Evangelio</h1>
        <p className="gv-hero-sub">claramente explicado</p>
        {GOSPEL.heroQuote && (
          <blockquote className="gv-hero-quote">
            «{GOSPEL.heroQuote.text}»
            {heroParsed && (
              <button
                className="gv-ref"
                onClick={() => openRef(heroParsed)}
              >
                {formatReference(heroParsed)}
              </button>
            )}
          </blockquote>
        )}
      </header>

      <nav className="gv-steps-nav" aria-label="Pasos del evangelio">
        {GOSPEL.sections.map((s) => (
          <a key={s.n} href={`#paso-${s.n}`}>
            <b>{s.n}</b> {s.tag}
          </a>
        ))}
      </nav>

      <main className="gv-body">
        {GOSPEL.sections.map((s) => (
          <section key={s.n} id={`paso-${s.n}`} className="gv-section">
            <div className="gv-num">{s.n}</div>
            <div>
              <p className="gv-tag">{s.tag}</p>
              <h2>{s.title}</h2>
              {s.paras.map((p, i) =>
                typeof p === 'string' ? (
                  <RichText
                    key={i}
                    text={p}
                    pClass="gv-p"
                    refClass="gv-ref"
                  />
                ) : (
                  <blockquote key={i} className="gv-quote">
                    <p>«{p.q}»</p>
                    <footer>
                      {(() => {
                        const parsed = parseReference(p.r);
                        return parsed ? (
                          <button
                            className="gv-ref"
                            onClick={() => openRef(parsed)}
                          >
                            {formatReference(parsed)}
                          </button>
                        ) : (
                          p.r
                        );
                      })()}
                    </footer>
                  </blockquote>
                )
              )}
            </div>
          </section>
        ))}

        <section className="gv-closing">
          <p className="gv-closing-line">«{GOSPEL.closing.line}»</p>
          <p className="gv-closing-sub">{GOSPEL.closing.sub}</p>
        </section>
      </main>

      <footer className="gv-footer">
        Todas las citas están tomadas de Reina-Valera 1909. Tocá cualquier
        referencia para leerla en su contexto en el lector.
      </footer>
    </div>
  );
}
