import { useEffect, useMemo, useReducer, useState } from 'react';
import { BOOKS } from '../../lib/references.js';
import { usePassage } from '../../context/PassageContext.jsx';
import {
  loadOriginal,
  loadStrongs,
  getCachedOriginal,
  getCachedStrongs,
  decodeHebrewMorph,
  decodeGreekMorph,
  testamentOf,
} from '../../lib/interlinear.js';
import {
  loadVersion,
  getCachedVersion,
} from '../reader/bibles.js';
import BookPicker from '../../components/BookPicker.jsx';

export default function InterlinearPage() {
  const { passage } = usePassage();
  const [, force] = useReducer((x) => x + 1, 0);

  // Sincronización unidireccional: contexto -> interlineal.
  const [bookId, setBookId] = useState('gen');
  const [chapter, setChapter] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedBookId, setPickedBookId] = useState(null);
  const [bpQuery, setBpQuery] = useState('');
  const [sel, setSel] = useState(null); // { v: verseIdx, w: wordIdx }
  const [showTranslit, setShowTranslit] = useState(true);

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
  const testament = testamentOf(bookId);
  const rtl = testament === 'hb';

  useEffect(() => {
    let alive = true;
    Promise.all([
      loadOriginal(testament),
      loadStrongs(testament),
      loadVersion('rv1909'),
    ]).then(() => {
      if (alive) force();
    });
    return () => {
      alive = false;
    };
  }, [testament]);

  function applyLocation(nextBookId, nextChapter) {
    setBookId(nextBookId);
    setChapter(nextChapter);
    setSel(null);
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

  const data = getCachedOriginal(testament);
  const strongs = getCachedStrongs(testament) || {};
  const rv = getCachedVersion('rv1909');
  const verses = data ? data.books[bookId]?.[chapter - 1] : null;

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

  const detailWord = useMemo(() => {
    if (!sel || !data) return null;
    return data.books[bookId]?.[chapter - 1]?.[sel.v]?.[sel.w] ?? null;
  }, [sel, data, bookId, chapter]);

  return (
    <div className="interlinear-root">
      <aside className="il-sidebar">
        <button className="btn-book" onClick={openPicker}>
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

        <div className="il-options">
          <label className="il-check">
            <input
              type="checkbox"
              checked={showTranslit}
              onChange={(e) => setShowTranslit(e.target.checked)}
            />
            Transliteración
          </label>
          <p className="hint">
            {rtl
              ? 'Hebreo/arameo — se lee de derecha a izquierda.'
              : 'Griego koiné (SBLGNT) — de izquierda a derecha.'}
          </p>
        </div>

        {detailWord && (
          <WordDetail
            testament={testament}
            word={detailWord}
            strongs={strongs}
            onClose={() => setSel(null)}
          />
        )}
      </aside>

      <div className="il-main">
        <header className="il-toolbar">
          <div className="nav-chapter">
            <button onClick={() => navigateChapter(-1)} title="Capítulo anterior">‹</button>
            <h2>{book.name} {chapter}</h2>
            <button onClick={() => navigateChapter(1)} title="Capítulo siguiente">›</button>
          </div>
          <span className={`il-lang${rtl ? '' : ' gr'}`}>
            {rtl ? 'עִבְרִית · אֲרָמִית' : 'Ἑλληνική'}
          </span>
        </header>

        <div className="il-scroll" ref={undefined}>
          {!verses && (
            <div className="col-loading">
              Tejiendo el texto original… cargando morfología y léxico Strong.
            </div>
          )}
          {verses &&
            verses.map((words, vi) => (
              <section key={vi} className="il-verse">
                <header className="ilv-head">
                  <span className="ilv-num">{vi + 1}</span>
                  {rv?.books[bookId]?.[chapter - 1]?.[vi] && (
                    <p className="ilv-es">{rv.books[bookId][chapter - 1][vi]}</p>
                  )}
                </header>

                <div className="ilv-words" dir={rtl ? 'rtl' : 'ltr'}>
                  {words.map((w, wi) => (
                    <WordCard
                      key={wi}
                      w={w}
                      testament={testament}
                      strongs={strongs}
                      showTranslit={showTranslit}
                      on={sel && sel.v === vi && sel.w === wi}
                      onClick={() =>
                        setSel(
                          sel && sel.v === vi && sel.w === wi
                            ? null
                            : { v: vi, w: wi }
                        )
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
        </div>
      </div>
    </div>
  );
}

function WordCard({ w, testament, strongs, showTranslit, on, onClick }) {
  const isGr = testament === 'gr';
  const surf = isGr ? w[0] : w[0];
  const entry = w[isGr ? 3 : 2] ? strongs[w[isGr ? 3 : 2]] : null;
  const morph = isGr
    ? decodeGreekMorph(w[1], w[2])
    : decodeHebrewMorph(w[1]);
  return (
    <button
      className={`il-w${on ? ' on' : ''}`}
      title={morph}
      onClick={onClick}
    >
      <span className="il-w-surf">{surf}</span>
      {entry && showTranslit && (
        <span className="il-w-translit" dir="ltr">{entry.x}</span>
      )}
      <span className="il-w-gloss" dir="ltr">{entry ? entry.g : '—'}</span>
    </button>
  );
}

function WordDetail({ testament, word, strongs, onClose }) {
  const isGr = testament === 'gr';
  const surf = word[0];
  const num = isGr ? word[3] : word[2];
  const strongId = num ? (isGr ? `G${num}` : `H${num}`) : '';
  const entry = num ? strongs[num] : null;
  const morph = isGr
    ? decodeGreekMorph(word[1], word[2])
    : decodeHebrewMorph(word[1]);

  return (
    <div className="il-detail">
      <header>
        <b>{strongId || 'sin Strong'}</b>
        <button className="pk-close" onClick={onClose} title="Cerrar">×</button>
      </header>
      <p className="ild-surf" dir={isGr ? 'ltr' : 'rtl'}>{surf}</p>
      {entry && (
        <p className="ild-lemma">
          <span dir={isGr ? 'ltr' : 'rtl'}>{entry.l}</span>{' '}
          <span dir="ltr">({entry.x})</span>
        </p>
      )}
      <p className="ild-morph">{morph || '—'}</p>
      {entry && (
        <>
          <h5>Glosa</h5>
          <p>{entry.g}</p>
          <h5>Definición</h5>
          <p className="ild-def">{entry.d}</p>
        </>
      )}
    </div>
  );
}
