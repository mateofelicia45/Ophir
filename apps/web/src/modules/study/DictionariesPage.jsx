import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loadDictionary,
  loadTopics,
  DICTIONARIES,
  TOPICAL_SOURCES,
} from '../../lib/dictionaries.js';
import { scanReferences, naveTupleToRef } from '../../lib/refscan.js';
import { BOOKS, formatReference } from '../../lib/references.js';
import { usePassage } from '../../context/PassageContext.jsx';
import '../../styles/dictionaries.css';

const stripAccents = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const MAX_HITS = 120;

export default function DictionariesPage() {
  const [tab, setTab] = useState('easton');
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [loadedKey, setLoadedKey] = useState(0);

  // Datos crudos cargados perezosamente según la pestaña activa.
  const [entries, setEntries] = useState(null); // {id, data: nombre -> [defs]}
  const [topics, setTopics] = useState(null); // Nave: [{slug,name,sub}]
  const [selected, setSelected] = useState(null); // entrada o tema abierto

  const isDict = tab !== 'naves';

  useEffect(() => {
    let alive = true;
    if (isDict) {
      loadDictionary(tab).then((d) => {
        if (alive) setEntries({ id: tab, data: d?.entries || {} });
      });
    } else {
      loadTopics('naves').then((d) => {
        if (alive) setTopics(d?.topics || []);
      });
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, loadedKey]);

  const loading = isDict ? !entries || entries.id !== tab : !topics;

  const DICT_HINT = {
    easton: 'sion · fariseo · maná · urim',
    smith: 'jot · ágora · sinagoga · abejas',
  };

  function switchTab(next) {
    setTab(next);
    setSubmitted('');
    setSelected(null);
    setQuery('');
    setLoadedKey((k) => k + 1);
  }

  const dictData = isDict && entries?.id === tab ? entries.data : null;

  const hits = useMemo(() => {
    const needle = stripAccents(submitted.trim());
    if (!needle) return [];
    if (isDict && dictData) {
      return Object.keys(dictData)
        .filter((k) => stripAccents(k).includes(needle))
        .slice(0, MAX_HITS);
    }
    if (!isDict && topics) {
      return topics
        .filter((t) => stripAccents(t.name).includes(needle))
        .slice(0, MAX_HITS);
    }
    return [];
  }, [submitted, isDict, dictData, topics]);

  function runSearch(e) {
    e.preventDefault();
    setSubmitted(query);
    setSelected(null);
  }

  return (
    <div className="page dic-root">
      <header className="page-header">
        <div className="kicker">Fase 11 · integrado</div>
        <h2>Diccionarios e índice temático</h2>
        <p className="lede">
          Buscá en <em>Easton</em> (4.000 artículos enciclopédicos),{' '}
          <em>Smith</em> (4.500 en un tono más narrativo) y el índice temático
          de <em>Nave</em> (5.300 temas con sus versículos agrupados). Las
          referencias dentro de cada artículo se abren directo en el Lector.
        </p>
      </header>

      <div className="dic-tabs">
        {[...DICTIONARIES, ...TOPICAL_SOURCES].map((src) => (
          <button
            key={src.id}
            className={`dic-tab${tab === src.id ? ' on' : ''}`}
            onClick={() => switchTab(src.id)}
          >
            {src.abbr}
            <small>{src.name}</small>
          </button>
        ))}
      </div>

      <form className="dic-search" onSubmit={runSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            isDict
              ? DICT_HINT[tab] || 'entrada de diccionario'
              : 'gracia · oración · pacto · resurrección'
          }
          autoFocus
        />
        <button type="submit">Buscar</button>
      </form>

      {loading && <div className="col-loading">Cargando…</div>}

      {selected && (
        <button
          className="dic-back"
          onClick={() => {
            setSelected(null);
            setQuery(submitted);
          }}
        >
          ← Volver a los resultados
        </button>
      )}

      {!selected && submitted && !loading && hits.length === 0 && (
        <p className="cc-empty">Sin resultados para «{submitted}».</p>
      )}

      {/* ---------- Lista de resultados ---------- */}
      {!selected && hits.length > 0 && (
        <section className="dic-hits">
          {hits.map((h) =>
            isDict && dictData ? (
              <button
                key={h}
                className="dic-hit"
                onClick={() => setSelected({ kind: 'entry', name: h })}
              >
                <b>{h}</b>
                <span>{dictData[h][0]?.slice(0, 110)}…</span>
              </button>
            ) : (
              <button
                key={h.slug}
                className="dic-hit"
                onClick={() => setSelected({ kind: 'topic', topic: h })}
              >
                <b>{h.name}</b>
                <span>{h.sub.length} grupo(s) de referencias</span>
              </button>
            )
          )}
        </section>
      )}

      {/* ---------- Detalle de diccionario ---------- */}
      {selected?.kind === 'entry' && dictData && (
        <article className="dic-entry">
          <h3 className="dic-title">{selected.name}</h3>
          {(dictData[selected.name] || []).map((def, i) => (
            <LinkedText key={i} text={def} />
          ))}
          <footer className="dic-credit">
            {DICTIONARIES.find((d) => d.id === tab)?.name} — dominio público.
          </footer>
        </article>
      )}

      {/* ---------- Detalle Nave ---------- */}
      {selected?.kind === 'topic' && (
        <article className="dic-topic">
          <h3 className="dic-title">{selected.topic.name}</h3>
          {selected.topic.sub.map((group, gi) => (
            <section key={gi} className="dic-group">
              <h4>
                {group.label || 'General'}{' '}
                <small>({group.refs.length})</small>
              </h4>
              <div className="dic-chips">
                {group.refs
                  .map(naveTupleToRef)
                  .filter(Boolean)
                  .map((r, i) => (
                    <RefChip key={i} refData={r} />
                  ))}
              </div>
            </section>
          ))}
          <footer className="dic-credit">
            Nave&apos;s Topical Bible — dominio público vía BibleData / mega.bible
            (CC BY 4.0).
          </footer>
        </article>
      )}
    </div>
  );
}

// Texto con referencias estilo inglés convertidas en chips clicables.
function LinkedText({ text }) {
  const segments = useMemo(() => scanReferences(text), [text]);
  return (
    <p className="dic-def">
      {segments.map((seg, i) =>
        seg.type === 'ref' ? <RefChip key={i} refData={seg.ref} label={seg.label} /> : seg.text
      )}
    </p>
  );
}

function RefChip({ refData, label }) {
  const navigate = useNavigate();
  const { setPassage } = usePassage();
  const book = BOOKS.find((b) => b.id === refData.bookId);
  if (!book) return null;
  const text =
    label ||
    formatReference({
      book,
      chapter: refData.chapter,
      verseStart: refData.verseStart,
      verseEnd: refData.verseEnd,
    }, 'abbr');
  function open() {
    setPassage({
      book: book.name,
      chapter: refData.chapter,
      verseStart: refData.verseStart ?? null,
      verseEnd: refData.verseEnd ?? null,
    });
    navigate('/lector');
  }
  return (
    <button className="dic-ref" onClick={open} title={`Abrir ${book.name} ${refData.chapter} en el Lector`}>
      {text}
    </button>
  );
}
