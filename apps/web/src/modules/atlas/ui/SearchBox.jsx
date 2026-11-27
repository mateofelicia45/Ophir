// Búsqueda del atlas: desplegable navegable con ↑ ↓ Enter Esc (patrón combobox).
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { searchAtlas } from '../core/search.js';
import { displayName } from '../core/text.js';
import { IconSearch } from './icons.jsx';

export default function SearchBox({ db, onAction }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const boxRef = useRef(null);
  const listRef = useRef(null);
  const id = useId();

  const results = useMemo(() => (db && q.trim() ? searchAtlas(db, q, 14) : []), [db, q]);
  const show = open && q.trim().length > 0;
  const active = Math.min(idx, Math.max(results.length - 1, 0));

  // Cerrar al tocar fuera.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Mantener visible la opción activa.
  useEffect(() => {
    const el = listRef.current && listRef.current.querySelector('[aria-selected="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [active, show]);

  const run = (r) => {
    if (!r) return;
    setOpen(false);
    onAction(r.action);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setIdx(Math.min(results.length - 1, active + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx(Math.max(0, active - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length) run(results[active]);
    } else if (e.key === 'Escape') {
      if (show) {
        e.preventDefault();
        setOpen(false);
      } else if (q) setQ('');
    }
  };

  const optId = (i) => `${id}-o${i}`;

  return (
    <div className="search" ref={boxRef}>
      <IconSearch />
      <input
        type="search"
        placeholder="Lugar, pasaje (Hechos 16), personaje, período…"
        aria-label="Buscar en el atlas"
        role="combobox"
        aria-expanded={show}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={show && results.length ? optId(active) : undefined}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setIdx(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        autoComplete="off"
        spellCheck="false"
        disabled={!db}
      />
      {show && (
        <div className="dd" role="listbox" id={`${id}-list`} aria-label="Resultados de búsqueda" ref={listRef}>
          {results.map((r, i) => (
            <button
              type="button"
              key={i}
              id={optId(i)}
              role="option"
              aria-selected={i === active}
              tabIndex={-1}
              className={'sr' + (i === active ? ' on' : '')}
              onMouseEnter={() => setIdx(i)}
              onClick={() => run(r)}
            >
              <span className="k">{r.kind}</span>
              <b>{r.kind === 'Lugar' ? displayName(r.label) : r.label}</b>
              <span className="s">{r.sub}</span>
            </button>
          ))}
          {!results.length && (
            <div className="empty">Sin resultados. Prueba con otra grafía, con el nombre en inglés o con un pasaje («Hch 16»).</div>
          )}
        </div>
      )}
    </div>
  );
}
