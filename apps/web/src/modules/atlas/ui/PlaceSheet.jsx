// Ficha del lugar: encabezado con acciones y las secciones de estudio en el orden
// del prototipo. Toda referencia bíblica abre el Lector de Ophir.
import { useEffect, useMemo, useRef, useState } from 'react';
import { fichaVM } from '../core/ficha.js';
import { Q_SHORT, typeShort } from '../core/labels.js';
import { IconClose } from './icons.jsx';

const SVG = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const IconStar = () => <svg {...SVG}><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z" /></svg>;
const IconMark = () => <svg {...SVG}><path d="M6 3h12v18l-6-4-6 4z" /></svg>;
const IconCenter = () => <svg {...SVG}><circle cx="12" cy="12" r="7" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>;

const NOTE_DELAY = 600;

function Notes({ placeId, initial, onSave }) {
  const [text, setText] = useState(initial);
  const timer = useRef(null);
  const latest = useRef({ text: initial, saved: initial });
  const save = useRef(onSave);
  useEffect(() => { save.current = onSave; });

  const flush = () => {
    clearTimeout(timer.current);
    const l = latest.current;
    if (l.text !== l.saved) {
      l.saved = l.text;
      save.current(placeId, l.text);
    }
  };
  // Al salir de la ficha (cambio de lugar o cierre) no se pierde lo escrito.
  useEffect(() => () => flush(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="fs note">
      <h3 className="h3">Mis notas de estudio</h3>
      <textarea
        aria-label="Notas personales sobre este lugar"
        placeholder="Observaciones, preguntas, conexiones teológicas, descubrimientos…"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          latest.current.text = e.target.value;
          clearTimeout(timer.current);
          timer.current = setTimeout(flush, NOTE_DELAY);
        }}
        onBlur={flush}
      />
      <p className="muted sm" style={{ margin: '6px 0 0' }}>Las notas se guardan en este navegador.</p>
    </section>
  );
}

function CopyButton({ value, children }) {
  const [done, setDone] = useState(false);
  const copy = () => {
    try {
      navigator.clipboard.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }, () => {});
    } catch { /* sin portapapeles */ }
  };
  return <button type="button" className="mini" onClick={copy}>{done ? 'copiado' : children}</button>;
}

function Section({ title, count, children }) {
  return (
    <section className="fs">
      <h3 className="h3">{title}{count != null && <span className="cnt">{count}</span>}</h3>
      {children}
    </section>
  );
}

export default function PlaceSheet({
  db, place, store, onUpdateStore, onClose, onSelectPlace, onAction, onFlyTo, onReadRef,
}) {
  const vm = useMemo(() => fichaVM(db, place), [db, place]);
  const [showAll, setShowAll] = useState(false);

  const isFav = store.favorites.includes(place.id);
  const isPend = store.pending.includes(place.id);
  const toggle = (key) => onUpdateStore((s) => ({
    ...s,
    [key]: s[key].includes(place.id) ? s[key].filter((x) => x !== place.id) : s[key].concat(place.id),
  }));
  const saveNote = (id, text) => onUpdateStore((s) => {
    const notes = { ...s.notes };
    if (text.trim()) notes[id] = text; else delete notes[id];
    return { ...s, notes };
  });
  const showRefs = showAll || !vm.canShowRefs;

  return (
    <>
      <div className="fh">
        <div className="fhrow">
          <div className="badges">
            <span className={'bd ty-' + place.type}><i className="dot" />{typeShort(place.type) || place.type}</span>
            <span className={'bd q-' + place.certainty}>{Q_SHORT[place.certainty] || place.certainty}</span>
            {vm.basic && <span className="bd basic">Ficha básica</span>}
          </div>
          <button type="button" className="ib sm" onClick={onClose} aria-label="Cerrar la ficha"><IconClose /></button>
        </div>
        <h2>{vm.name}</h2>
        {vm.subtitle && <p className="sub">{vm.subtitle}</p>}
        {vm.variants.length > 0 && (
          <p className="var">{vm.basic ? 'Variantes (ESV): ' : 'También: '}{vm.variants.join(' · ')}</p>
        )}
        <div className="acts">
          <button type="button" className={'ab' + (isFav ? ' on' : '')} aria-pressed={isFav} onClick={() => toggle('favorites')}><IconStar />Favorito</button>
          <button type="button" className={'ab' + (isPend ? ' on' : '')} aria-pressed={isPend} onClick={() => toggle('pending')}><IconMark />Pendiente</button>
          {vm.hasPos && <button type="button" className="ab" onClick={() => onFlyTo(place.lon, place.lat)}><IconCenter />Centrar</button>}
        </div>
      </div>
      <div className="scroll">
        <section className="fs">
          <dl className="kv">
            <dt>Nombre moderno</dt><dd>{vm.modern}</dd>
            <dt>Coordenadas</dt>
            <dd>
              <span className="mono">{vm.coords}</span>{' '}
              {vm.hasPos && <CopyButton value={vm.coordsCopy}>copiar</CopyButton>}
            </dd>
            <dt>Región y territorio</dt><dd>{vm.region}</dd>
            <dt>Testamento</dt><dd>{vm.testaments}</dd>
            <dt>Períodos</dt><dd>{vm.periods}</dd>
            <dt>Menciones</dt><dd>{vm.mentions}</dd>
            {vm.basic && <><dt>Nombre en la fuente</dt><dd>{vm.sourceName} (OpenBible, ESV)</dd></>}
          </dl>
        </section>

        <Section title="Identificación geográfica">
          <p className={'cert q-' + place.certainty}><b>{vm.qLabel}.</b> {vm.qNote}</p>
          {!vm.hasPos && <p className="muted sm" style={{ margin: 0 }}>Sin ubicación conocida: el lugar no se puede situar en el mapa.</p>}
          {vm.cands.length > 0 && (
            <>
              <p className="muted sm" style={{ margin: '0 0 4px' }}>Propuestas de identificación registradas (pulsa para verlas en el mapa):</p>
              <div className="list">
                {vm.cands.map((c) => (
                  <button type="button" key={c.no} className="li" onClick={() => onFlyTo(c.lon, c.lat)}>
                    <span className="no">{c.no}</span>
                    <span className="nm">{c.label}<small>{c.coords}</small></span>
                    <span className="m">{c.tag || 'volar'}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </Section>

        {vm.nbp.length > 0 && (
          <Section title="Nombres según el período">
            <ul className="ul">{vm.nbp.map((n) => <li key={n.per}><b>{n.per}:</b> {n.name}</li>)}</ul>
          </Section>
        )}
        <Section title="Descripción"><p className="prose">{vm.desc}</p></Section>
        {vm.ctx && <Section title="Contexto histórico y geográfico"><p className="prose">{vm.ctx}</p></Section>}
        {vm.hasEvents && (
          <Section title="Acontecimientos">
            <ul className="ul">{vm.events.map((e) => <li key={e}>{e}</li>)}</ul>
          </Section>
        )}
        {vm.hasPeople && (
          <Section title="Personajes vinculados">
            <div className="chips">
              {vm.people.map((n) => (
                <button type="button" key={n} className="chip" onClick={() => onAction({ type: 'person', id: n })}>{n}</button>
              ))}
            </div>
          </Section>
        )}
        {vm.hasKeyRefs && (
          <Section title="Referencias clave">
            <p className="muted sm" style={{ margin: '0 0 8px' }}>Pulsa un pasaje para leerlo en el Lector.</p>
            <div>
              {vm.keyRefs.map((r) => (r.ref
                ? <button type="button" key={r.label} className="refc" onClick={() => onReadRef(r.ref)}>{r.label}</button>
                : <span key={r.label} className="refc">{r.label}</span>))}
            </div>
            <CopyButton value={vm.refsCopy}>Copiar las referencias</CopyButton>
          </Section>
        )}
        <Section title="Todas las menciones" count={vm.nRefs}>
          <p className="muted sm" style={{ margin: '0 0 8px' }}>{vm.mentions} · versículos donde el lugar aparece nombrado (OpenBible).</p>
          {showRefs && vm.groups.map((g) => (
            <div className="rg" key={g.book}>
              <b>{g.book}</b>
              {g.items.map((it) => (
                <button type="button" key={it.t} onClick={() => onReadRef(it.ref)} aria-label={g.book + ' ' + it.t}>{it.t}</button>
              ))}
            </div>
          ))}
          {vm.canShowRefs && (
            <button type="button" className="mini" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Ocultar la lista' : 'Mostrar los ' + vm.nRefs + ' versículos'}
            </button>
          )}
        </Section>
        {vm.routes.length > 0 && (
          <Section title="Recorridos que pasan por aquí">
            <div className="chips">
              {vm.routes.map((r) => (
                <button type="button" key={r.id} className="chip" onClick={() => onAction({ type: 'route', id: r.id })}>{r.name}</button>
              ))}
            </div>
          </Section>
        )}
        {vm.near.length > 0 && (
          <Section title="Lugares cercanos">
            <div className="list">
              {vm.near.map((n) => (
                <button type="button" key={n.id} className="li" onClick={() => onSelectPlace(n.id)}>
                  <i className={'dot ty-' + n.type} />
                  <span className="nm">{n.name}<small>{n.sub}</small></span>
                  <span className="m">{n.d}</span>
                </button>
              ))}
            </div>
          </Section>
        )}
        <Section title="Fuentes y verificación">
          <ul className="ul sm">{vm.sources.map((s) => <li key={s}>{s}</li>)}</ul>
        </Section>
        <Notes placeId={place.id} initial={store.notes[place.id] || ''} onSave={saveNote} />
      </div>
    </>
  );
}
