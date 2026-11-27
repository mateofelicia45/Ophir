// Pestaña Estudio: cobertura de la base, listas personales, lugares por revisar y exportación.
import { useMemo } from 'react';
import { listOf, verifyLists } from '../core/lists.js';
import { plural } from '../core/labels.js';
import { downloadText } from './download.js';
import { exportMarkdown, exportCsv, exportGeoJSON, exportNotes } from './exporters.js';

const Sec = ({ title, count, children }) => (
  <section className="sec">
    <h3 className="h3">{title}{count !== undefined && <> <span className="cnt">{count}</span></>}</h3>
    {children}
  </section>
);

function PlaceList({ items, onSelect, empty }) {
  if (!items.length) return empty ? <p className="muted sm">{empty}</p> : null;
  return (
    <div className="list">
      {items.map((p) => (
        <button type="button" key={p.id} className="li" onClick={() => onSelect(p.id)}>
          <i className={'dot ty-' + p.type} />
          <span className="nm">{p.name}<small>{p.sub}</small></span>
          {p.m ? <span className="m">{p.m}</span> : null}
        </button>
      ))}
    </div>
  );
}

export default function StudyPanel({ db, store, filtered, selectedId, onSelect }) {
  const st = db.stats;
  const cov = Math.round((st.curated / st.total) * 1000) / 10;
  const lists = useMemo(() => ({
    fav: listOf(db, store.favorites),
    pend: listOf(db, store.pending),
    notes: listOf(db, Object.keys(store.notes).filter((id) => store.notes[id])),
    hist: listOf(db, store.history),
  }), [db, store.favorites, store.pending, store.notes, store.history]);
  const verify = useMemo(() => {
    const v = verifyLists(db);
    const withRefs = (arr, sub) => arr.map((p) => ({ ...listOf(db, [p.id])[0], sub: sub(p), m: String(p.refs.length) }));
    return {
      discussed: withRefs(v.discussed, (p) => p.ob + ' · Discutida'),
      basic: withRefs(v.basic, (p) => p.ob),
      unlocated: v.unlocated.map((p) => ({ ...listOf(db, [p.id])[0], sub: plural(p.refs.length, 'mención', 'menciones') })),
    };
  }, [db]);

  const save = (name, text, mime) => downloadText(name, text, mime);

  return (
    <>
      <Sec title="Cobertura de la base de datos">
        <div className="cov">
          <div className="covbar"><i style={{ width: cov + '%' }} /></div>
          <p><b>{st.curated}</b> fichas completas de <b>{st.total}</b> lugares ({String(cov).replace('.', ',')} %).</p>
        </div>
        <dl className="kv sm">
          <dt>Con coordenadas</dt><dd>{st.withPos}</dd>
          <dt>Identificación discutida</dt><dd>{st.disputed}</dd>
          <dt>Sin ubicación</dt><dd>{st.unknown}</dd>
          <dt>Por verificar</dt><dd>{st.total - st.curated} fichas básicas</dd>
          <dt>Recorridos</dt><dd>{db.routes.length}</dd>
          <dt>Territorios</dt><dd>{db.territories.length}</dd>
        </dl>
        <p className="muted sm">La base no es exhaustiva. Recoge los lugares nombrados en los 66 libros según OpenBible.info; no incluye los deuterocanónicos ni los lugares que el texto no nombra, y los territorios tribales aún no están cargados.</p>
      </Sec>
      <Sec title="Favoritos" count={lists.fav.length}>
        <PlaceList items={lists.fav} onSelect={onSelect} empty="Marca un lugar con ★ en su ficha." />
      </Sec>
      <Sec title="Pendientes de estudio" count={lists.pend.length}>
        <PlaceList items={lists.pend} onSelect={onSelect} empty="Usa «Pendiente» en una ficha para guardarla aquí." />
      </Sec>
      <Sec title="Mis notas" count={lists.notes.length}>
        <PlaceList items={lists.notes} onSelect={onSelect} empty="Las notas que escribas en cada ficha aparecerán aquí." />
        <p className="muted sm">Notas, favoritos y preferencias se guardan en este navegador. Exporta tus notas para no perderlas.</p>
      </Sec>
      <Sec title="Historial">
        <PlaceList items={lists.hist} onSelect={onSelect} empty="Aún no has consultado lugares." />
      </Sec>
      <Sec title="Pendientes de verificar">
        <p className="muted sm" style={{ margin: '0 0 6px' }}>Lugares con ficha cuya identificación es discutida, y fichas básicas con más menciones bíblicas: su tipo y su certeza se estimaron automáticamente.</p>
        <p className="sub">Identificación discutida</p>
        <PlaceList items={verify.discussed} onSelect={onSelect} />
        <p className="sub">Fichas básicas con más menciones</p>
        <PlaceList items={verify.basic} onSelect={onSelect} />
        <h3 className="h3" style={{ marginTop: 16 }}>Sin coordenadas</h3>
        <PlaceList items={verify.unlocated} onSelect={onSelect} />
      </Sec>
      <Sec title="Exportar">
        <div className="btns">
          <button type="button" className="btn ghost" disabled={!selectedId}
            onClick={() => save('ficha-' + selectedId + '.md', exportMarkdown(db, [selectedId], store.notes), 'text/markdown')}>
            Ficha abierta (Markdown)
          </button>
          <button type="button" className="btn ghost" disabled={!store.favorites.length}
            onClick={() => save('atlas-biblico-favoritos.md', exportMarkdown(db, store.favorites, store.notes), 'text/markdown')}>
            Favoritos (Markdown)
          </button>
          <button type="button" className="btn ghost"
            onClick={() => save('atlas-biblico-filtro.csv', exportCsv(db, filtered), 'text/csv')}>CSV (filtro actual)</button>
          <button type="button" className="btn ghost"
            onClick={() => save('atlas-biblico-filtro.geojson', exportGeoJSON(db, filtered), 'application/geo+json')}>GeoJSON (filtro actual)</button>
          <button type="button" className="btn ghost"
            onClick={() => save('atlas-biblico-lugares.csv', exportCsv(db, db.places), 'text/csv')}>CSV (toda la base)</button>
          <button type="button" className="btn ghost"
            onClick={() => save('atlas-biblico-notas.json', exportNotes(store), 'application/json')}>
            Mis notas (JSON)
          </button>
        </div>
      </Sec>
      <Sec title="Fuentes y créditos">
        <p className="sm" style={{ margin: '0 0 6px' }}>Lugares, versículos e identificaciones: <a href="https://www.openbible.info/geo/" target="_blank" rel="noopener noreferrer">OpenBible.info Bible Geocoding</a> (CC BY 4.0), con datos © colaboradores de OpenStreetMap. Costas y fronteras: Natural Earth (dominio público). Fichas, territorios y recorridos: redacción propia de este atlas a partir de las obras de referencia citadas en cada ficha.</p>
        <p className="muted sm" style={{ margin: 0 }}>Los versículos siguen la numeración inglesa (ESV), que coincide casi siempre con la Reina-Valera.</p>
      </Sec>
    </>
  );
}
