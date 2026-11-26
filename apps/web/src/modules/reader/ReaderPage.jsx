import { useEffect, useRef, useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BOOKS } from '../../lib/references.js';
import {
  subscribe,
  getHighlight,
  setHighlight,
} from '../../lib/highlights.js';
import { usePassage } from '../../context/PassageContext.jsx';
import { PALETTE, PALETTE_BY_ID } from './palette.js';
import {
  VERSIONS, loadVersion, getCachedVersion, getChapterText
} from './bibles.js';
import { COMMENTARIES, loadCommentaryBook } from '../../lib/commentaries.js';
import { useSpeech, available as ttsAvailable } from '../../hooks/useSpeech.js';
import BookPicker from '../../components/BookPicker.jsx';

export default function ReaderPage() {
  const { passage, setPassage } = usePassage();
  const navigate = useNavigate();
  const [versions, setVersions] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ophir.readerVersions'));
      if (
        Array.isArray(saved) &&
        saved.length > 0 &&
        saved.every((v) => VERSIONS.some((x) => x.id === v))
      ) {
        return saved;
      }
    } catch {
      /* localStorage indisponible */
    }
    return ['rv1909'];
  });
  useEffect(() => {
    try {
      localStorage.setItem('ophir.readerVersions', JSON.stringify(versions));
    } catch {
      /* localStorage indisponible */
    }
  }, [versions]);
  const [bookId, setBookId] = useState('gen');
  const [chapter, setChapter] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedBookId, setPickedBookId] = useState(null);
  const [bpQuery, setBpQuery] = useState('');
  const [paletteFor, setPaletteFor] = useState(null);
  const [colorFilter, setColorFilter] = useState(null);
  const [cmtOpen, setCmtOpen] = useState(
    () => localStorage.getItem('ophir.cmtOpen') === '1'
  );
  const [cmtId, setCmtId] = useState('mhc');
  const [cmtData, setCmtData] = useState(null);
  const [, force] = useReducer((x) => x + 1, 0);
  const tts = useSpeech();
  const [ttsOpen, setTtsOpen] = useState(false);
  const [ttsVerId, setTtsVerId] = useState('rv1909');
  const [ttsRate, setTtsRate] = useState(1);

  // Detener la voz si el pasaje se mueve (solo si está activa).
  useEffect(() => {
    if (tts.status !== 'idle') tts.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapter]);

  async function playPauseTts() {
    if (!available()) return;
    const vid = versions.includes(ttsVerId) ? ttsVerId : versions[0];
    const verses = await getChapterText(vid, book.id, chapter);
    if (!verses?.length) return;
    if (tts.status === 'paused') {
      tts.resume();
      return;
    }
    if (tts.status === 'playing') {
      tts.pause();
      return;
    }
    const meta = VERSIONS.find((v) => v.id === vid);
    const startIdx =
      passage.verseStart && passage.verseStart <= verses.length
        ? passage.verseStart - 1
        : 0;
    tts.speak(verses, {
      start: startIdx,
      lang: meta?.lang || 'es',
      rate: ttsRate,
    });
    setTtsOpen(true);
  }

  useEffect(() => {
    localStorage.setItem('ophir.cmtOpen', cmtOpen ? '1' : '0');
  }, [cmtOpen]);

  // Carga perezosa del comentario del libro activo.
  useEffect(() => {
    let alive = true;
    setCmtData(null);
    loadCommentaryBook(cmtId, bookId).then((data) => {
      if (alive) setCmtData(data);
    });
    return () => {
      alive = false;
    };
  }, [cmtId, bookId]);

  useEffect(() => subscribe(force), []);

  useEffect(() => {
    let alive = true;
    for (const v of versions) {
      if (!getCachedVersion(v)) {
        loadVersion(v).then(() => {
          if (alive) force();
        });
      }
    }
    return () => {
      alive = false;
    };
  }, [versions]);

  // El contexto es la fuente de verdad para módulos externos (notas, atlas).
  // Se escribe SOLO desde manejadores de eventos (applyLocation), nunca desde
  // efectos: así no hay ping-pong entre estado local y contexto.
  function applyLocation(nextBookId, nextChapter) {
    setBookId(nextBookId);
    setChapter(nextChapter);
    const book = BOOKS.find((b) => b.id === nextBookId);
    if (book) setPassage({ book: book.name, chapter: nextChapter });
  }

  // Sincronización unidireccional: contexto -> lector (ej. chip de nota)
  useEffect(() => {
    const book = BOOKS.find((b) => b.name === passage.book);
    if (!book) return;
    if (book.id !== bookId || passage.chapter !== chapter) {
      setBookId(book.id);
      setChapter(passage.chapter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage]);

  const book = BOOKS.find((b) => b.id === bookId);
  const pickedBook = BOOKS.find((b) => b.id === pickedBookId) || null;

  function openPicker() {
    setPickerOpen(true);
    setPickedBookId(null);
    setBpQuery('');
  }

  function pickBook(b) {
    if (bpQuery) {
      applyLocation(b.id, 1);
      setPickerOpen(false);
      return;
    }
    setPickedBookId(b.id);
  }

  function pickChapter(n) {
    if (!pickedBook) return;
    applyLocation(pickedBook.id, n);
    setPickerOpen(false);
    setPickedBookId(null);
  }

  function setColumnVersion(idx, id) {
    loadVersion(id);
    setVersions((vs) => vs.map((v, i) => (i === idx ? id : v)));
  }

  function addColumn() {
    setVersions((vs) => {
      if (vs.length >= 3) return vs;
      const next = VERSIONS.find((v) => !vs.includes(v.id));
      if (!next) return vs;
      loadVersion(next.id);
      return [...vs, next.id];
    });
  }

  function removeColumn(idx) {
    setVersions((vs) => (vs.length > 1 ? vs.filter((_, i) => i !== idx) : vs));
  }

  function navigateChapter(delta) {
    const idx = BOOKS.findIndex((b) => b.id === bookId);
    let ch = chapter + delta;
    let bIdx = idx;
    if (ch < 1) {
      bIdx = Math.max(0, idx - 1);
      ch = BOOKS[bIdx].chapters;
    } else if (ch > BOOKS[idx].chapters) {
      bIdx = Math.min(BOOKS.length - 1, idx + 1);
      ch = 1;
    }
    applyLocation(BOOKS[bIdx].id, ch);
  }

  return (
    <div className="reader-root">
      <aside className="reader-sidebar">
        <button
          className="btn-book"
          onClick={openPicker}
          title="Elegir libro y capítulo"
        >
          {book.name} {chapter} <span className="caret">▾</span>
        </button>

        {pickerOpen && (
          <BookPicker
            query={bpQuery}
            setQuery={setBpQuery}
            pickedBook={pickedBook}
            currentBookId={bookId}
            currentChapter={chapter}
            onPickBook={pickBook}
            onPickChapter={pickChapter}
            onBack={() => setPickedBookId(null)}
            onClose={() => {
              setPickerOpen(false);
              setPickedBookId(null);
            }}
          />
        )}

        <div className="chapter-grid">
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={n === chapter ? 'on' : ''}
              onClick={() => applyLocation(book.id, n)}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="reader-filter">
          <span className="rf-label">Ver solo un color</span>
          <div className="rf-dots">
            {PALETTE.map((p) => (
              <button
                key={p.id}
                title={`${p.label}`}
                aria-label={p.label}
                className={`rf-dot${colorFilter === p.id ? ' on' : ''}`}
                style={{ background: p.css }}
                onClick={() =>
                  setColorFilter(colorFilter === p.id ? null : p.id)
                }
              />
            ))}
          </div>
          {colorFilter && (
            <button className="rf-clear" onClick={() => setColorFilter(null)}>
              Ver todo
            </button>
          )}
        </div>
      </aside>

      <div className="reader-main">
        <header className="reader-toolbar">
          <div className="nav-chapter">
            <button onClick={() => navigateChapter(-1)} title="Capítulo anterior">
              ‹
            </button>
            <h2>
              {book.name} {chapter}
            </h2>
            <button onClick={() => navigateChapter(1)} title="Capítulo siguiente">
              ›
            </button>
          </div>
          <div className="version-pills">
            <button
              className="tool-link"
              title="Añadir columna paralela"
              disabled={versions.length >= 3}
              onClick={addColumn}
            >
              ＋ Paralelo
            </button>
            <button
              className="tool-link"
              title="Concordancia Strong de este libro"
              onClick={() => navigate('/concordancia')}
            >
              ≡ Concordancia
            </button>
            <button
              className="tool-link"
              title="Comentario del capítulo"
              onClick={() => setCmtOpen(!cmtOpen)}
            >
              📖 Comentario
            </button>
            <button
              className="tool-link"
              title="Leer este capítulo en voz alta"
              onClick={playPauseTts}
            >
              🔊 Oír
            </button>
            <button
              className="tool-link"
              title="Ver este capítulo en el interlineal"
              onClick={() => navigate('/interlineal')}
            >
              א α Interlineal
            </button>
          </div>
        </header>

        {ttsOpen && (
          <div className="tts-bar">
            <span className="tts-label">
              {tts.status === 'playing'
                ? 'Leyendo…'
                : tts.status === 'paused'
                  ? 'Pausado'
                  : 'Listo'}
            </span>
            <button
              className="tts-btn"
              title={tts.status === 'playing' ? 'Pausar' : 'Reanudar'}
              onClick={playPauseTts}
              disabled={!ttsAvailable()}
            >
              {tts.status === 'playing' ? '❚❚' : '▶'}
            </button>
            <button
              className="tts-btn"
              title="Detener"
              onClick={() => tts.stop()}
              disabled={tts.status === 'idle'}
            >
              ⏹
            </button>
            <select
              className="tts-rate"
              value={ttsRate}
              onChange={(e) => setTtsRate(Number(e.target.value))}
              title="Velocidad"
            >
              {[0.75, 1, 1.25, 1.5].map((r) => (
                <option key={r} value={r}>
                  {r}×
                </option>
              ))}
            </select>
            <select
              className="tts-ver"
              value={versions.includes(ttsVerId) ? ttsVerId : versions[0]}
              onChange={(e) => setTtsVerId(e.target.value)}
              title="Versión que se lee"
            >
              {versions.map((vid) => {
                const m = VERSIONS.find((v) => v.id === vid);
                return (
                  <option key={vid} value={vid}>
                    {m?.name || vid}
                  </option>
                );
              })}
            </select>
            {tts.activeIdx !== null && (
              <span className="tts-progress">
                {tts.activeIdx + 1} / {tts.total}
              </span>
            )}
          </div>
        )}

        <div className={`reader-columns cols-${versions.length}${cmtOpen ? ' with-cmt' : ''}`}>
          {versions.map((vid, i) => (
            <ChapterColumn
              key={`${vid}-${i}`}
              columnIdx={i}
              versionId={vid}
              allVersions={versions}
              book={book}
              chapter={chapter}
              colorFilter={colorFilter}
              paletteFor={paletteFor}
              setPaletteFor={setPaletteFor}
              ttsVerse={tts.activeIdx !== null ? tts.activeIdx + 1 : null}
              targetVerse={passage.verseStart}
              onVersion={(id) => setColumnVersion(i, id)}
              onRemove={() => removeColumn(i)}
              canRemove={versions.length > 1}
            />
          ))}
        </div>
      </div>

      {cmtOpen && (
        <aside className="commentary-panel">
          <header className="cp-bar">
            <select
              value={cmtId}
              onChange={(e) => setCmtId(e.target.value)}
              title="Elegir comentario"
            >
              {COMMENTARIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              className="cp-close-btn"
              title="Cerrar comentario"
              onClick={() => setCmtOpen(false)}
            >
              ×
            </button>
          </header>
          <div className="cp-body">
            {!cmtData && <div className="col-loading">Cargando comentario…</div>}
            {cmtData && (
              <>
                <h3 className="cp-title">
                  {book.name} {chapter}
                </h3>
                {(cmtData.chapters[chapter - 1] || []).length === 0 && (
                  <p className="cp-empty">
                    Sin comentario para este capítulo en esta edición.
                  </p>
                )}
                {(cmtData.chapters[chapter - 1] || []).map((b, i) =>
                  b.t === 'h' ? (
                    <h4 key={i}>{b.x}</h4>
                  ) : (
                    <p key={i}>{b.x}</p>
                  )
                )}
                <footer className="cp-credit">
                  {cmtData.name} · texto en inglés · {cmtData.license.split('—')[0]}
                </footer>
              </>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

function ChapterColumn({
  columnIdx,
  versionId,
  allVersions,
  book,
  chapter,
  colorFilter,
  paletteFor,
  setPaletteFor,
  ttsVerse,
  targetVerse,
  onVersion,
  onRemove,
  canRemove,
}) {
  const colRef = useRef(null);
  const [cmpVerse, setCmpVerse] = useState(null);
  const [verses, setVerses] = useState(null);
  const [loading, setLoading] = useState(false);

  const meta = VERSIONS.find((v) => v.id === versionId);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    // Usamos el nuevo servicio asíncrono
    getChapterText(versionId, book.id, chapter)
      .then((data) => {
        if (alive) {
          setVerses(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(`Error cargando ${versionId}:`, err);
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [versionId, book.id, chapter]);

  useEffect(() => {
    if (!targetVerse || !verses || !colRef.current) return;
    const el = colRef.current.querySelector(`[data-v="${targetVerse}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [targetVerse, verses, chapter]);

  if (loading) {
    return (
      <section className="reader-col">
        <div className="col-head">
          <ColumnSelect
            versionId={versionId}
            allVersions={allVersions}
            onVersion={onVersion}
          />
        </div>
        <div className="col-loading">Cargando {meta?.name}…</div>
      </section>
    );
  }

  if (!verses) {
    return (
      <section className="reader-col">
        <div className="col-loading">Sin texto para {book.name} {chapter}</div>
      </section>
    );
  }

  return (
    <section className="reader-col" ref={colRef}>
      <div className="col-head">
        <ColumnSelect
          versionId={versionId}
          allVersions={allVersions}
          onVersion={onVersion}
        />
        <span
          className={`col-lang ${meta?.lang || 'es'}`}
          title={meta?.lang === 'es' ? 'Español' : 'Inglés'}
        >
          {(meta?.lang || 'es').toUpperCase()}
        </span>
        {canRemove && (
          <button className="col-close" title="Quitar columna" onClick={onRemove}>
            ×
          </button>
        )}
      </div>
      <div className="verses">
        {verses.map((text, i) => {
          const verseNum = i + 1;
          const hl = getHighlight(book.id, chapter, verseNum);
          const dimmed = colorFilter && (!hl || hl.c !== colorFilter);
          const popKey = `${columnIdx}.${verseNum}`;
          const ttsActive = ttsVerse === verseNum;
          return (
            <div
              key={verseNum}
              data-v={verseNum}
              className={`verse${dimmed ? ' dimmed' : ''}${ttsActive ? ' tts-active' : ''}`}
              style={
                hl && !dimmed
                  ? { background: PALETTE_BY_ID[hl.c]?.css }
                  : undefined
              }
            >
              <span className="verse-num">{verseNum}</span>
              <span className="verse-text">{text}</span>
              <button
                className="verse-cmp"
                title={`Comparar ${book.name} ${chapter}:${verseNum} en todas las versiones`}
                onClick={() => setCmpVerse(cmpVerse === popKey ? null : popKey)}
              >
                ⇄
              </button>
              <button
                className="verse-mark"
                title="Resaltar"
                onClick={() =>
                  setPaletteFor(
                    paletteFor === `${book.id}.${chapter}.${verseNum}`
                      ? null
                      : `${book.id}.${chapter}.${verseNum}`
                  )
                }
              >
                ◍
              </button>
              {cmpVerse === popKey && (
                <ComparePopover
                  bookId={book.id}
                  chapter={chapter}
                  verseNum={verseNum}
                  onClose={() => setCmpVerse(null)}
                />
              )}
              {paletteFor === `${book.id}.${chapter}.${verseNum}` && (
                <PalettePopover
                  onPick={(colorId) => {
                    setHighlight(book.id, chapter, verseNum, { c: colorId });
                    setPaletteFor(null);
                  }}
                  onClear={() => {
                    setHighlight(book.id, chapter, verseNum, null);
                    setPaletteFor(null);
                  }}
                  hasHighlight={!!hl}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ColumnSelect({ versionId, allVersions, onVersion }) {
  return (
    <select
      value={versionId}
      onChange={(e) => onVersion(e.target.value)}
      title="Cambiar versión de esta columna"
    >
      {VERSIONS.filter(
        (v) => v.id === versionId || !allVersions.includes(v.id)
      ).map((v) => (
        <option key={v.id} value={v.id}>
          {v.name}
        </option>
      ))}
    </select>
  );
}

function ComparePopover({ bookId, chapter, verseNum, onClose }) {
  const [texts, setTexts] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all(
      VERSIONS.map(async (v) => {
        const data = getCachedVersion(v.id) || (await loadVersion(v.id));
        return [v.id, data.books[bookId]?.[chapter - 1]?.[verseNum - 1] ?? ''];
      })
    ).then((entries) => {
      if (alive) setTexts(Object.fromEntries(entries));
    });
    return () => {
      alive = false;
    };
  }, [bookId, chapter, verseNum]);

  return (
    <div className="compare-pop" onClick={(e) => e.stopPropagation()}>
      <header className="cp-head">
        <span>
          {bookId} {chapter}:{verseNum} — comparación
        </span>
        <button className="cp-close" onClick={onClose}>
          ✕
        </button>
      </header>
      {texts === null ? (
        <div className="col-loading">Cargando versiones…</div>
      ) : (
        VERSIONS.map((v) => (
          <div key={v.id} className="cmp-row">
            <span className={`cmp-abbr ${v.lang}`}>{v.abbr}</span>
            <p className="cmp-text">
              {texts[v.id] || '—'}
            </p>
          </div>
        ))
      )}
      <footer className="cp-foot">
        Para el texto original griego/hebreo usá el módulo Interlineal.
      </footer>
    </div>
  );
}

function PalettePopover({ onPick, onClear, hasHighlight }) {
  return (
    <div className="palette-pop" onClick={(e) => e.stopPropagation()}>
      {PALETTE.map((p) => (
        <button
          key={p.id}
          title={p.label}
          aria-label={p.label}
          style={{ background: p.css }}
          onClick={() => onPick(p.id)}
        />
      ))}
      {hasHighlight && (
        <button className="pp-clear" onClick={onClear}>
          Quitar
        </button>
      )}
    </div>
  );
}
