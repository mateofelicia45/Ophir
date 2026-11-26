import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loadOriginal,
  loadStrongs,
  loadStrongIndex,
  decodeHebrewMorph,
  decodeGreekMorph,
} from '../../lib/interlinear.js';
import { usePassage } from '../../context/PassageContext.jsx';
import { BOOKS, formatReference } from '../../lib/references.js';
import { loadVersion } from '../reader/bibles.js';
import '../../styles/concordance.css';

// Normaliza la entrada del usuario a una lista de búsquedas Strong.
// "H430" -> [{t:'hb', n:'430'}] · "G26" -> gr · "430" -> ambos testamentos.
function parseStrongQuery(q) {
  const m = q.trim().match(/^([HG])?\s*(\d+)$/i);
  if (!m) return null;
  const num = String(parseInt(m[2], 10));
  if (!m[1]) return [
    { t: 'gr', n: num },
    { t: 'hb', n: num },
  ];
  return [m[1] === 'H' ? { t: 'hb', n: num } : { t: 'gr', n: num }];
}

const stripAccents = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function ConcordancePage() {
  const navigate = useNavigate();
  const { setPassage } = usePassage();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [loading, setLoading] = useState(false);

  // Estado del resultado activo: lista de entradas Strong con ocurrencias.
  const [results, setResults] = useState(null);
  // Diccionario de candidatos cuando la búsqueda es por palabra, no número.
  const [candidates, setCandidates] = useState(null);

  async function runQuery(raw) {
    const q = raw.trim();
    if (!q) return;
    setSubmitted(q);
    setLoading(true);
    setCandidates(null);
    setResults(null);
    try {
      const strongHits = parseStrongQuery(q);
      if (strongHits) {
        await showStrongEntries(strongHits);
      } else {
        await searchLexicons(q);
      }
    } finally {
      setLoading(false);
    }
  }

  async function searchLexicons(q) {
    const needle = stripAccents(q);
    const found = [];
    for (const t of ['gr', 'hb']) {
      const dict = await loadStrongs(t);
      for (const [num, e] of Object.entries(dict)) {
        if (found.length >= 24) break;
        const hay = stripAccents(
          `${e.l || ''} ${e.x || ''} ${e.g || ''}`
        );
        if (hay.includes(needle)) {
          found.push({ t, n: num, entry: e });
        }
      }
    }
    if (found.length === 1) {
      await showStrongEntries([found[0]]);
    } else {
      setCandidates(found);
    }
  }

  async function showStrongEntries(entries) {
    const loaded = [];
    for (const { t, n } of entries) {
      const index = await loadStrongIndex(t);
      const dict = await loadStrongs(t);
      const original = await loadOriginal(t);
      if (!index[n]) continue;
      loaded.push({
        t,
        n,
        entry: dict[n] || {},
        occ: index[n],
        original,
      });
    }
    setResults(loaded.length ? loaded : []);
  }

  function openOccurrence(bookId, chapter, verse) {
    const book = BOOKS.find((b) => b.id === bookId);
    if (!book) return;
    setPassage({
      book: book.name,
      chapter,
      verseStart: verse,
      verseEnd: null,
    });
    navigate('/interlineal');
  }

  function openInReader(bookId, chapter, verse) {
    const book = BOOKS.find((b) => b.id === bookId);
    if (!book) return;
    setPassage({
      book: book.name,
      chapter,
      verseStart: verse,
      verseEnd: null,
    });
    navigate('/lector');
  }

  return (
    <div className="page concord-root">
      <header className="page-header">
        <div className="kicker">Fase 9 · integrado</div>
        <h2>Concordancia Strong</h2>
        <p className="lede">
          Buscá por número (<code>H430</code>, <code>G26</code>), por lema
          griego/hebreo o por su glosa en español (<em>amor</em>,{' '}
          <em>agape</em>). Cada resultado muestra la palabra original, su
          morfología y el versículo en RV1909.
        </p>
      </header>

      <form
        className="cc-search"
        onSubmit={(e) => {
          e.preventDefault();
          runQuery(query);
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='H430 · G26 · agape · אהבה · amor'
          autoFocus
        />
        <button type="submit">Buscar</button>
      </form>

      {loading && <div className="col-loading">Cargando índices…</div>}

      {!results && !candidates && !loading && submitted && (
        <p className="cc-empty">Sin resultados para «{submitted}».</p>
      )}

      {candidates && candidates.length > 0 && (
        <section className="cc-candidates">
          <h3>Lemas que coinciden con «{submitted}»</h3>
          {candidates.map((c) => (
            <button
              key={`${c.t}${c.n}`}
              className="cc-cand"
              onClick={() => showStrongEntries([c])}
            >
              <span className={`cc-tag ${c.t}`}>
                {c.t === 'hb' ? 'AT' : 'NT'} H/G{c.n}
              </span>
              <b className="cc-lemma">{c.entry.l}</b>
              <i className="cc-translit">{c.entry.x}</i>
              <span className="cc-gloss">{c.entry.g}</span>
            </button>
          ))}
        </section>
      )}

      {results &&
        results.map((r) => (
          <StrongResult
            key={`${r.t}${r.n}`}
            result={r}
            onOpenInterlinear={openOccurrence}
            onOpenReader={openInReader}
          />
        ))}
    </div>
  );
}

function StrongResult({ result, onOpenInterlinear, onOpenReader }) {
  const { t, n, entry, occ, original } = result;
  const total = useMemo(
    () => Object.values(occ).reduce((a, c) => a + c.length, 0),
    [occ]
  );

  // Texto RV1909 por versículo, resuelto perezosamente.
  const [rvTexts, setRvTexts] = useState({});
  useEffect(() => {
    let alive = true;
    loadVersion('rv1909').then((rv) => {
      if (!alive) return;
      const texts = {};
      for (const [bookId, spots] of Object.entries(occ)) {
        texts[bookId] = {};
        for (const [c] of spots) {
          if (!(c in texts[bookId])) {
            texts[bookId][c] = rv.books[bookId]?.[c - 1] || [];
          }
        }
      }
      setRvTexts(texts);
    });
    return () => {
      alive = false;
    };
  }, [occ]);

  const rows = [];
  for (const book of BOOKS) {
    const spots = occ[book.id];
    if (!spots) continue;
    for (const [c, v, w] of spots) {
      rows.push({ book, c, v, w });
    }
  }

  return (
    <section className={`cc-result ${t}`}>
      <header className="cc-head">
        <span className={`cc-big ${t}`}>{t === 'hb' ? 'א' : 'α'}</span>
        <div>
          <h3>
            <span className={`cc-num ${t}`}>
              {t === 'hb' ? 'H' : 'G'}
              {n}
            </span>{' '}
            {entry.l}
          </h3>
          <p className="cc-sub">
            {entry.x && <i>{entry.x} — </i>}
            {entry.g}
            {' · '}
            <b>{total}</b> ocurrencia{total !== 1 ? 's' : ''} en{' '}
            {t === 'hb' ? 'el AT (OSHB)' : 'el NT (SBLGNT)'}
          </p>
        </div>
      </header>

      <div className="cc-list">
        {rows.slice(0, 400).map(({ book, c, v, w }, i) => {
          const word = original.books[book.id]?.[c - 1]?.[v - 1]?.[w];
          if (!word) return null;
          const surface = word[0];
          const morph =
            t === 'hb'
              ? decodeHebrewMorph(word[1])
              : decodeGreekMorph(word[1], word[2]);
          const verseArr = rvTexts[book.id]?.[c];
          const rvVerse = verseArr?.[v - 1];
          return (
            <div key={i} className={`cc-row${t === 'hb' ? ' rtl' : ''}`}>
              <div className="cc-row-main">
                <button
                  className="cc-ref"
                  onClick={() => onOpenReader(book.id, c, v)}
                  title="Abrir en el Lector"
                >
                  {formatReference({
                    book,
                    chapter: c,
                    verseStart: v,
                    verseEnd: null,
                  })}
                </button>
                <button
                  className="cc-word"
                  onClick={() => onOpenInterlinear(book.id, c, v)}
                  title="Abrir en el Interlineal"
                >
                  {surface}
                </button>
                <span className="cc-morph">{morph}</span>
              </div>
              {rvVerse && (
                <p
                  className="cc-verse"
                  onClick={() => onOpenReader(book.id, c, v)}
                >
                  {rvVerse}
                </p>
              )}
            </div>
          );
        })}
        {rows.length > 400 && (
          <p className="cc-more">
            Mostrando 400 de {rows.length} — afiná la búsqueda o abrí un libro
            específico desde el Interlineal.
          </p>
        )}
      </div>
    </section>
  );
}
