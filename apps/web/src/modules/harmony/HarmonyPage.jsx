import { BOOKS } from '../../lib/references.js';
import { useOpenRef } from '../../hooks/useOpenRef.js';
import PERICOPES from '@data/harmony/pericopes.json';
import '../../styles/harmony.css';

export default function HarmonyPage() {
  return (
    <div className="page harm-root">
      <header className="page-header">
        <div className="kicker">Fase 14 · integrado</div>
        <h2>Armonía evangélica</h2>
        <p className="lede">
          Perícopas principales de los cuatro evangelios mostradas en columnas
          paralelas en orden cronológico.
        </p>
      </header>
      <HarmonyGrid />
    </div>
  );
}

/* ---------- Armonía ---------- */

function HarmonyGrid() {
  const openRef = useOpenRef();

  return (
    <section className="harm-full-list">
      {PERICOPES.pericopes.map((per) => (
        <article key={per.id} className="harm-item">
          <header className="harm-item-header">
            <span className="harm-num">{per.order}</span>
            <h3>{per.title}</h3>
            <span className="harm-tags">
              {per.refs.map((r) => r.label).join(' · ')}
            </span>
          </header>
          <div className="harm-cols">
            {['mat', 'mrk', 'luk', 'jhn'].map((bookId) => {
              const book = BOOKS.find((b) => b.id === bookId);
              const refs = per.refs.filter((r) => r.bookId === bookId);
              return (
                <div key={bookId} className="harm-col">
                  <h4>{book?.name}</h4>
                  {refs.length === 0 ? (
                    <p className="harm-none">—</p>
                  ) : (
                    refs.map((ref, i) => (
                      <button
                        key={i}
                        className="harm-ref-chip"
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
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </section>
  );
}
