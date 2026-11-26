import { useMemo } from 'react';
import { parseReference, formatReference } from '../../lib/references.js';
import { useOpenRef } from '../../hooks/useOpenRef.js';
import { RichText } from '../../components/RichText.jsx';
import HERM from '@data/hermeneutics.json';

function RichTextish({ text }) {
  return <RichText text={text} pClass="hr-p" refClass="hr-ref" />;
}

function RefChip({ refStr }) {
  const openRef = useOpenRef();
  const parsed = useMemo(() => parseReference(refStr), [refStr]);
  if (!parsed) return <span className="hr-ref-raw">{refStr}</span>;
  return (
    <button
      className="hr-ref"
      onClick={() => openRef(parsed)}
      title={`Abrir ${parsed.book.name} ${parsed.chapter} en el Lector`}
    >
      {formatReference(parsed)}
    </button>
  );
}

export default function HermeneuticsPage() {
  return (
    <div className="herm-root">
      <header className="hr-hero">
        <p className="xr-kicker">Herramientas para leer bien</p>
        <h1>Principios de hermenéutica</h1>
        <p className="hr-lede">{HERM.lede}</p>
      </header>

      <section className="hr-shared">
        <h2>Lo que todos los exegetas serios comparten</h2>
        <div className="hr-grid">
          {HERM.shared.map((s) => (
            <article key={s.t} className="hr-card">
              <h3>{s.t}</h3>
              <RichTextish text={s.d} />
            </article>
          ))}
        </div>
      </section>

      <section className="hr-authors">
        {HERM.authors.map((a) => (
          <div key={a.id} className={`hr-author hr-${a.id}`}>
            <header>
              <h2>{a.name}</h2>
              <p className="hr-work">{a.work}</p>
              <p className={`hr-tag tag-${a.id}`}>{a.tag}</p>
            </header>
            <ol className="hr-rules">
              {a.rules.map((r, i) => (
                <li key={r.t}>
                  <span className="hr-rule-num">{i + 1}</span>
                  <div>
                    <h3>{r.t}</h3>
                    <RichTextish text={r.d} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      <section className="hr-parallel">
        <header>
          <p className="xr-kicker">Poesía hebrea</p>
          <h2>Los paralelismos, con ejemplos</h2>
          <p className="hr-lede">{HERM.parallelism.lede}</p>
        </header>
        <div className="hr-par-list">
          {HERM.parallelism.types.map((tp) => (
            <article key={tp.id} className={`hr-type type-${tp.id}`}>
              <h3>{tp.name}</h3>
              <p className="hr-desc">{tp.desc}</p>
              <blockquote className="hr-example">
                {tp.example.lines.map((line, i) => (
                  <p key={i} className="hr-line">
                    {line}
                    {i === tp.example.lines.length - 1 && (
                      <>
                        {' '}
                        <RefChip refStr={tp.example.ref} />
                      </>
                    )}
                  </p>
                ))}
                <footer className="hr-note">{tp.example.note}</footer>
              </blockquote>
            </article>
          ))}
        </div>
        <p className="hr-par-closing">{HERM.parallelism.closing}</p>
      </section>

      <footer className="hr-footer">{HERM.footer}</footer>
    </div>
  );
}
