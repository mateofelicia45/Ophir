// Pestaña Explorar: filtros, personajes y lista paginada de lugares.
import { useMemo, useState } from 'react';
import { BOOK_NAMES_ES } from '../core/refs.js';
import { norm, displayName } from '../core/text.js';
import { TYPES, typeShort } from '../core/labels.js';
import { PeriodSelect } from './TopBar.jsx';
import { hasFilters } from './filters.js';

const PAGE = 60;

function placeSub(p) {
  return typeShort(p.type) + (p.curated ? '' : ' · ficha básica') + (p.hasPos ? '' : ' · sin coordenadas');
}

export default function ExplorePanel({ db, places, filters, onFilters, periodId, onPeriod, onSelect, onPerson, onClear }) {
  const [personQ, setPersonQ] = useState('');
  const [shown, setShown] = useState(PAGE);
  const set = (k, v) => { setShown(PAGE); onFilters({ ...filters, [k]: v }); };

  const people = useMemo(() => [...db.people.values()]
    .map((e) => ({ name: e.name, n: e.placeIds.size, key: norm(e.name) }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'es')), [db]);
  const pq = norm(personQ);
  const chips = people.filter((e) => !pq || e.key.includes(pq)).slice(0, pq ? 60 : 36);

  const seg = (v, label) => (
    <button type="button" className={filters.testament === v ? 'on' : ''} aria-pressed={filters.testament === v}
      onClick={() => set('testament', v)}>{label}</button>
  );

  return (
    <>
      <section className="sec">
        <h3 className="h3">Filtros</h3>
        <div className="seg" role="group" aria-label="Testamento">
          {seg('', 'Toda la Biblia')}
          {seg('AT', 'Antiguo T.')}
          {seg('NT', 'Nuevo T.')}
        </div>
        <label className="fld"><span>Libro bíblico</span>
          <select value={filters.book} onChange={(e) => set('book', e.target.value)}>
            <option value="">Todos los libros</option>
            <optgroup label="Antiguo Testamento">
              {BOOK_NAMES_ES.slice(0, 39).map((n, i) => <option key={i} value={String(i)}>{n}</option>)}
            </optgroup>
            <optgroup label="Nuevo Testamento">
              {BOOK_NAMES_ES.slice(39).map((n, i) => <option key={i + 39} value={String(i + 39)}>{n}</option>)}
            </optgroup>
          </select>
        </label>
        <label className="fld"><span>Período histórico</span>
          <PeriodSelect db={db} value={periodId} onChange={(v) => { setShown(PAGE); onPeriod(v); }} />
        </label>
        <label className="fld"><span>Tipo de lugar</span>
          <select value={filters.type} onChange={(e) => set('type', e.target.value)}>
            <option value="">Todos los tipos</option>
            {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        <label className="fld"><span>Certeza de la identificación</span>
          <select value={filters.cert} onChange={(e) => set('cert', e.target.value)}>
            <option value="">Cualquiera</option>
            <option value="segura">Segura</option>
            <option value="probable">Probable</option>
            <option value="discutida">Discutida</option>
            <option value="desconocida">Desconocida</option>
          </select>
        </label>
        <label className="chk">
          <input type="checkbox" checked={filters.onlyCurated} onChange={(e) => set('onlyCurated', e.target.checked)} />
          <span>Solo lugares con ficha completa</span>
        </label>
        {hasFilters(filters, periodId) && (
          <button type="button" className="link" onClick={() => { setShown(PAGE); onClear(); }}>Quitar todos los filtros</button>
        )}
      </section>

      <section className="sec">
        <h3 className="h3">Personajes</h3>
        <input className="inp" type="search" placeholder="Filtrar personajes (p. ej., Pablo)" aria-label="Filtrar personajes"
          value={personQ} onChange={(e) => setPersonQ(e.target.value)} />
        <div className="chips" style={{ marginTop: 10 }}>
          {chips.map((p) => (
            <button type="button" key={p.key} className="chip" onClick={() => onPerson(p.name)}>
              {p.name} <small>{p.n}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="sec">
        <h3 className="h3">Lugares <span className="cnt">{places.length}</span></h3>
        <div className="list">
          {places.slice(0, shown).map((p) => (
            <button type="button" key={p.id} className="li" onClick={() => onSelect(p.id)}>
              <i className={'dot ty-' + p.type} />
              <span className="nm">{displayName(p.name)}<small>{placeSub(p)}</small></span>
              <span className="m">{p.refs.length || ''}</span>
            </button>
          ))}
        </div>
        {places.length > shown && (
          <button type="button" className="btn ghost" style={{ marginTop: 12, width: '100%' }} onClick={() => setShown(shown + PAGE)}>
            Mostrar más lugares
          </button>
        )}
      </section>
    </>
  );
}
