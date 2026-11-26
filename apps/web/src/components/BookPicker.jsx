import { useEffect } from 'react';
import { BOOKS } from '../lib/references.js';

function normalize(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function BookPicker({
  query,
  setQuery,
  pickedBook,
  currentBookId,
  currentChapter,
  onPickBook,
  onPickChapter,
  onBack,
  onClose,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = normalize(query).replace(/\s+/g, '');
  const filtered = q
    ? BOOKS.filter((b) => {
        const haystack =
          normalize(b.name) + normalize(b.abbr).replace(/\s+/g, '') + b.id;
        return haystack.includes(q);
      })
    : BOOKS;

  function handleSubmit(e) {
    e.preventDefault();
    if (q && filtered.length > 0) onPickBook(filtered[0]);
  }

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pk-header">
          {pickedBook ? (
            <>
              <button className="pk-back" onClick={onBack}>
                ‹ Libros
              </button>
              <h3>{pickedBook.name}</h3>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="pk-search-form">
              <input
                autoFocus
                className="pk-search"
                type="text"
                placeholder="Buscar libro: nombre, abreviatura o sigla (ej. rom, sal, 1co)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
          )}
          <button className="pk-close" onClick={onClose} title="Cerrar">
            ×
          </button>
        </header>

        {pickedBook ? (
          <div className="pk-chapters">
            {Array.from({ length: pickedBook.chapters }, (_, i) => i + 1).map(
              (n) => (
                <button
                  key={n}
                  className={
                    pickedBook.id === currentBookId && n === currentChapter
                      ? 'on'
                      : ''
                  }
                  onClick={() => onPickChapter(n)}
                >
                  {n}
                </button>
              )
            )}
          </div>
        ) : (
          <>
            {filtered.length === 0 && (
              <div className="pk-empty">Sin resultados para «{query}».</div>
            )}
            <div className="pk-columns">
              {['AT', 'NT'].map((t) => {
                const list = filtered.filter((b) => b.testament === t);
                if (list.length === 0) return null;
                return (
                  <div key={t} className="bp-group">
                    <div className="bp-testament">
                      {t === 'AT' ? 'Antiguo Testamento' : 'Nuevo Testamento'}
                    </div>
                    <div className="bp-books">
                      {list.map((b) => (
                        <button
                          key={b.id}
                          className={b.id === currentBookId ? 'on' : ''}
                          onClick={() => onPickBook(b)}
                        >
                          <span className="bp-abbr">{b.abbr}</span>
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
