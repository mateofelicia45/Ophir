import { useEffect, useMemo, useRef, useState } from 'react';
import { usePassage } from '../../context/PassageContext.jsx';
import { findBook, parseReference, formatReference } from '../../lib/references.js';
import {
  loadCrossrefs,
  connectionsMulti,
  keyOf,
  parseKey,
  REF_TYPES,
  typeMeta,
} from '../../lib/crossrefs.js';
import { loadVersion } from '../reader/bibles.js';
import { download } from '../../lib/notes.js';

const DEFAULT_HUB = keyOf('jhn', 3, 16);

const DENSITIES = [
  { value: 24, label: '24' },
  { value: 48, label: '48' },
  { value: 96, label: '96' },
  { value: Infinity, label: 'Todas' },
];

export default function CrossRefsPage() {
  const { passage, setPassage } = usePassage();
  const [ready, setReady] = useState(false);
  const [rv, setRv] = useState(null);
  const [hubKey, setHubKey] = useState(() => {
    const b = findBook(passage.book);
    if (b && passage.verseStart) return keyOf(b.id, passage.chapter, passage.verseStart);
    return DEFAULT_HUB;
  });
  const [scope, setScope] = useState('capitulo');
  const [density, setDensity] = useState(48);
  const [typeFilter, setTypeFilter] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadCrossrefs().then(() => setReady(true));
    loadVersion('rv1909').then(setRv);
  }, []);

  // Nodos de origen según alcance: el versículo del hub, todo su capítulo
  // o todos los capítulos del libro.
  const scopeKeys = useMemo(() => {
    if (!ready || !rv) return [];
    const p = parseKey(hubKey);
    if (!p) return [hubKey];
    if (scope === 'verso') return [hubKey];
    const bookData = rv.books[p.book.id];
    if (scope === 'capitulo') {
      const verses = bookData?.[p.chapter - 1]?.length || 1;
      return Array.from(
        { length: verses },
        (_, i) => keyOf(p.book.id, p.chapter, i + 1)
      );
    }
    const keys = [];
    for (let ch = 1; ch <= p.book.chapters; ch++) {
      const n = bookData?.[ch - 1]?.length || 0;
      for (let v = 1; v <= n; v++) keys.push(keyOf(p.book.id, ch, v));
    }
    return keys.length ? keys : [hubKey];
  }, [ready, rv, hubKey, scope]);

  const all = useMemo(
    () => (scopeKeys.length ? connectionsMulti(scopeKeys) : []),
    [scopeKeys]
  );

  const shown =
    typeFilter === null
      ? all
      : typeFilter === 'ref'
        ? all.filter((c) => !c.type)
        : all.filter((c) => c.type === typeFilter);

  const graphNodes = shown.slice(0, density);

  const hub = parseKey(hubKey);
  const hubLabel = hub
    ? formatReference({ book: hub.book, chapter: hub.chapter, verseStart: hub.verse })
    : '';
  // El título refleja el alcance: «Romanos 8:28», «Romanos 8» o «Romanos».
  const titleText =
    scope === 'libro'
      ? hub?.book.name || ''
      : scope === 'capitulo'
        ? hub
          ? formatReference({ book: hub.book, chapter: hub.chapter })
          : ''
        : hubLabel;
  const typedCount = all.filter((c) => c.type).length;

  function goTo(key) {
    setHubKey(key);
    setExpanded(null);
    const p = parseKey(key);
    if (p) {
      setPassage({
        book: p.book.name,
        chapter: p.chapter,
        verseStart: p.verse,
        verseEnd: null,
      });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const raw = (inputRef.current?.value || '').trim();
    if (!raw) return;

    let nextHub = null;
    let nextScope = null;
    let target = null;

    // 1) Pasaje completo: «Romanos 8:28», «Romanos 8», «Sal 23»
    const parsed = parseReference(raw);
    if (parsed) {
      const verse = parsed.verseStart || 1;
      nextHub = keyOf(parsed.book.id, parsed.chapter, verse);
      nextScope = parsed.verseStart ? 'verso' : 'capitulo';
      target = {
        book: parsed.book.name,
        chapter: parsed.chapter,
        verseStart: parsed.verseStart,
        verseEnd: parsed.verseEnd,
      };
    } else {
      // 2) Libro solo: «Romanos» → conexiones de todo el libro
      const b = findBook(raw);
      if (b) {
        nextHub = keyOf(b.id, 1, 1);
        nextScope = 'libro';
        target = { book: b.name, chapter: 1, verseStart: null, verseEnd: null };
      }
    }

    if (nextHub) {
      setHubKey(nextHub);
      setScope(nextScope);
      setExpanded(null);
      setPassage(target);
      inputRef.current.value = '';
    }
  }

  function verseText(key) {
    if (!rv) return null;
    const p = parseKey(key);
    if (!p) return null;
    return rv.books[p.book.id]?.[p.chapter - 1]?.[p.verse - 1] ?? '(sin texto)';
  }

  function exportObsidian() {
    if (!hub) return;
    const scopeName =
      scope === 'verso'
        ? 'versículo'
        : scope === 'capitulo'
          ? `capítulo ${hub.chapter}`
          : 'libro entero';
    const lines = [
      '---',
      'tags: [ophir, referencias-cruzadas]',
      `pasaje: "${titleText}"`,
      `alcance: "${scopeName}"`,
      '---',
      '',
      `# Referencias cruzadas — ${titleText} (${scopeName})`,
      '',
      '> Texto: ' + (verseText(hubKey) || ''),
      '',
      '| Conexión | Tipo | Nota |',
      '| --- | --- | --- |',
    ];
    for (const c of shown.slice(0, 200)) {
      const p = parseKey(c.to);
      const ref = p
        ? formatReference({ book: p.book, chapter: p.chapter, verseStart: p.verse })
        : c.to;
      lines.push(
        `| [[${ref}]] | ${typeMeta(c.type).label}${c.votes ? ` (${c.votes})` : ''} | ${c.note || ''} |`
      );
    }
    lines.push('', 'Generado con Ophir.');
    download(
      `referencias-${titleText.replace(/[^\w\s-]/g, '')}.md`,
      lines.join('\n'),
      'text/markdown'
    );
  }

  if (!ready || !hub) {
    return (
      <div className="xr-root">
        <div className="xr-loading">
          Tejiendo la red… cargando ~240.000 conexiones.
        </div>
      </div>
    );
  }

  const W = 880;
  const H = 580;
  const CX = W / 2;
  const CY = H / 2;
  const n = graphNodes.length;

  return (
    <div className="xr-root">
      <header className="xr-header">
        <div>
          <p className="xr-kicker">Red semántica · Fase 5</p>
          <h2 className="xr-title">{titleText}</h2>
        </div>
        <form className="xr-jump" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            placeholder='Pasaje o libro: "Romanos 8:28" · "Romanos 8" · "Romanos"'
          />
          <button type="submit">Ir</button>
        </form>
      </header>

      <div className="xr-controls">
        <div className="xr-scope" role="group" aria-label="Alcance">
          <button
            className={scope === 'verso' ? 'on' : ''}
            onClick={() => setScope('verso')}
          >
            Versículo
          </button>
          <button
            className={scope === 'capitulo' ? 'on' : ''}
            onClick={() => setScope('capitulo')}
          >
            Capítulo
          </button>
          <button
            className={scope === 'libro' ? 'on' : ''}
            onClick={() => setScope('libro')}
          >
            Libro entero
          </button>
        </div>

        <label className="xr-density">
          Grafo
          <select
            value={String(density)}
            onChange={(e) => setDensity(Number(e.target.value))}
          >
            {DENSITIES.map((d) => (
              <option key={d.label} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="xr-legend">
        <button
          className={typeFilter === null ? 'on' : ''}
          onClick={() => setTypeFilter(null)}
        >
          Todos ({all.length})
        </button>
        {REF_TYPES.map((t) => (
          <button
            key={t.id}
            className={typeFilter === t.id ? 'on' : ''}
            onClick={() => setTypeFilter(typeFilter === t.id ? null : t.id)}
            style={{ '--c': t.color }}
          >
            <i style={{ background: t.color }} />
            {t.label}
          </button>
        ))}
        <button
          className={typeFilter === 'ref' ? 'on' : ''}
          onClick={() => setTypeFilter(typeFilter === 'ref' ? null : 'ref')}
        >
          Referencia ({all.length - typedCount})
        </button>
      </div>

      <section className="xr-graph" aria-label="Grafo radial de conexiones">
        {n === 0 ? (
          <div className="xr-empty">Sin conexiones para este filtro.</div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} role="img">
            {graphNodes.map((c, i) => {
              const meta = typeMeta(c.type);
              const angle = ((i % Math.ceil(n / 2)) / Math.ceil(n / 2)) * Math.PI * 2 - Math.PI / 2;
              const ring = n <= 32 ? 225 : i % 2 === 0 ? 165 : 240;
              const x = CX + ring * Math.cos(angle);
              const y = CY + ring * Math.sin(angle);
              const p = parseKey(c.to);
              const showFull = n <= 32;
              const showAbbr = showFull || n <= 64;
              return (
                <g key={c.to} className="xr-node" onClick={() => goTo(c.to)}>
                  <title>
                    {p ? `${p.book.name} ${p.chapter}:${p.verse}` : c.to}
                    {c.votes ? `\nReferencia (${c.votes})` : ''}
                    {c.type ? `\n${meta.label}` : ''}
                    {c.note ? `\n${c.note}` : ''}
                  </title>
                  <line
                    x1={CX}
                    y1={CY}
                    x2={x}
                    y2={y}
                    stroke={meta.color}
                    strokeWidth={c.type ? 2 : 1}
                    opacity={n > 64 ? 0.22 : 0.35}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={showFull ? 16 : 11}
                    fill={meta.color}
                    fillOpacity={0.16}
                    stroke={meta.color}
                    strokeWidth={c.type ? 1.8 : 1.1}
                  />
                  {showFull && (
                    <>
                      <text x={x} y={y - 3} textAnchor="middle" className="xr-nlabel">
                        {p ? p.book.abbr : ''}
                      </text>
                      <text x={x} y={y + 9} textAnchor="middle" className="xr-nsub">
                        {p ? `${p.chapter}:${p.verse}` : ''}
                      </text>
                    </>
                  )}
                  {!showFull && showAbbr && (
                    <text x={x} y={y + 3.5} textAnchor="middle" className="xr-nsub">
                      {p ? p.book.abbr : ''}
                    </text>
                  )}
                </g>
              );
            })}
            <circle cx={CX} cy={CY} r={48} fill="var(--bg-3)" stroke="var(--gold)" strokeWidth={1.6} />
            <text x={CX} y={CY - 8} textAnchor="middle" className="xr-hub-abbr">
              {hub.book.abbr}
            </text>
            <text x={CX} y={CY + 10} textAnchor="middle" className="xr-hub-ref">
              {scope === 'verso'
                ? `${hub.chapter}:${hub.verse}`
                : scope === 'capitulo'
                  ? `cap. ${hub.chapter}`
                  : 'libro'}
            </text>
            <text x={CX} y={CY + 30} textAnchor="middle" className="xr-hub-name">
              {hub.book.name}
            </text>
          </svg>
        )}
      </section>

      <div className="xr-actions">
        <span className="hint">
          {shown.length} conexiones · grafo muestra {n} · pasaje activo sincronizado con el lector.
        </span>
        <button onClick={exportObsidian}>Exportar a Obsidian (.md)</button>
      </div>

      <section className="xr-list">
        {shown.map((c) => {
          const meta = typeMeta(c.type);
          const p = parseKey(c.to);
          const label = p
            ? formatReference({ book: p.book, chapter: p.chapter, verseStart: p.verse })
            : c.to;
          const isOpen = expanded === c.to;
          return (
            <article key={c.to} className={`xr-row${isOpen ? ' open' : ''}`}>
              <button
                className="xr-ref"
                style={{ borderColor: meta.color }}
                onClick={() => goTo(c.to)}
                title={`Abrir ${label}`}
              >
                {label}
              </button>
              <span className="xr-type" style={{ color: meta.color }}>
                {meta.label}
              </span>
              {c.votes != null && <span className="xr-votes">· {c.votes}</span>}
              <button
                className="xr-expand"
                onClick={() => setExpanded(isOpen ? null : c.to)}
              >
                {isOpen ? 'Ocultar' : 'Ver texto'}
              </button>
              {c.note && <p className="xr-note">{c.note}</p>}
              {isOpen && (
                <blockquote className="xr-text">
                  {rv ? verseText(c.to) : 'Cargando RV1909…'}
                  <cite>— Reina Valera 1909</cite>
                </blockquote>
              )}
            </article>
          );
        })}
        {shown.length === 0 && (
          <p className="hint">Sin conexiones registradas para este alcance.</p>
        )}
      </section>

      <footer className="xr-credit">
        Base masiva: OpenBible.info Cross References (Treasury of Scripture Knowledge), CC BY 4.0.
        Capa tipificada: curaduría propia Ophir.
      </footer>
    </div>
  );
}
