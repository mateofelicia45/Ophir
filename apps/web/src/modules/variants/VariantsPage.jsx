import { useState } from 'react';
import { BOOKS } from '../../lib/references.js';
import { useOpenRef } from '../../hooks/useOpenRef.js';
import VARIANTS from '@data/harmony/variants.json';
import '../../styles/harmony.css';

export default function VariantsPage() {
  return (
    <div className="page harm-root">
      <header className="page-header">
        <div className="kicker">Fase 14 · integrado</div>
        <h2>Variantes textuales mayores</h2>
        <p className="lede">
          Pasajes cuya inclusión en el texto del Nuevo Testamento es debatida entre los críticos textuales,
          presentados con honestidad académica (sin arbitraje doctrinal, §5 de DESIGN.md).
        </p>
      </header>
      <VariantsList />
    </div>
  );
}

function VariantsList() {
  const openRef = useOpenRef();
  return (
    <section className="var-list">
      {VARIANTS.variants.map((v) => (
        <article key={v.id} className="var-card">
          <h3>{v.title}</h3>
          <div className="var-refs">
            {v.passage.map((ref, i) => {
              const book = BOOKS.find((b) => b.id === ref.bookId);
              return (
                <button
                  key={i}
                  className="var-ref-chip"
                  onClick={() => {
                    openRef({
                      book,
                      chapter: ref.chapter,
                      verseStart: ref.verseStart ?? null,
                      verseEnd: ref.verseEnd ?? null,
                    });
                  }}
                >
                  {ref.label}
                </button>
              );
            })}
          </div>
          <p className="var-note">{v.shortNote}</p>
          <ul className="var-readings">
            {v.mainReadings.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
