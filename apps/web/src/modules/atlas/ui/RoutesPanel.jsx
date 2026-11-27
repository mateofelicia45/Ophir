// Pestaña Rutas: recorridos agrupados por período y detalle del recorrido abierto.
import { useMemo } from 'react';
import { displayName } from '../core/text.js';
import { parseRef } from '../core/refs.js';
import { groupRoutesByPeriod, LEG_LABEL } from '../core/routes.js';

const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);

function Legend() {
  const line = (dash) => (
    <svg width="40" height="8" aria-hidden="true"><line x1="2" y1="4" x2="38" y2="4" strokeDasharray={dash} /></svg>
  );
  return (
    <div className="lline">
      {line()}<span>{LEG_LABEL.texto[0].toUpperCase() + LEG_LABEL.texto.slice(1)}</span>
      {line('9 6')}<span>{LEG_LABEL.aprox[0].toUpperCase() + LEG_LABEL.aprox.slice(1)}</span>
      {line('1.5 5.5')}<span>{LEG_LABEL.hipotetico[0].toUpperCase() + LEG_LABEL.hipotetico.slice(1)}</span>
    </div>
  );
}

function RouteDetail({ db, route, step, onStep, onClose, onReadRef }) {
  const per = db.periodById[route.periodId];
  return (
    <section className={'sec rc' + route.colorIndex}>
      <h3 className="h3">Recorrido seleccionado</h3>
      <h4 className="rvt">{route.name}</h4>
      <p className="muted sm" style={{ margin: '0 0 6px' }}>{route.refsLabel}{per ? ' · ' + per.nombre : ''}</p>
      {route.summary && <p className="prose sm">{route.summary}</p>}
      {route.note && <p className="warn">{route.note}</p>}
      <ol className="stages">
        {route.stops.map((s, i) => {
          const p = s.placeId != null ? db.byId.get(s.placeId) : null;
          const ref = s.ref ? parseRef(s.ref) : null;
          return (
            <li key={i} className={'st' + (i === step ? ' cur' : '')} aria-current={i === step ? 'step' : undefined}>
              <span className="no">{i + 1}</span>
              <div>
                <button type="button" className="stn" onClick={() => onStep(i)}>{p ? displayName(p.name) : 'Lugar sin identificar'}</button>
                {s.note && <p>{s.note}</p>}
                {s.ref && (ref
                  ? <button type="button" className="refc" onClick={() => onReadRef(ref)}>{s.ref}</button>
                  : <span className="refc">{s.ref}</span>)}
                {s.leg && i > 0 && <span className={'tb ' + s.leg}>{LEG_LABEL[s.leg] || s.leg}</span>}
                {!(p && p.hasPos) && <span className="muted sm"> sin ubicación conocida</span>}
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="link" onClick={onClose}>Cerrar recorrido</button>
    </section>
  );
}

export default function RoutesPanel({ db, routeId, step, onOpen, onStep, onClose, onReadRef }) {
  const groups = useMemo(() => groupRoutesByPeriod(db), [db]);
  const route = routeId ? db.routes.find((r) => r.id === routeId) : null;
  return (
    <>
      {route && <RouteDetail db={db} route={route} step={step} onStep={onStep} onClose={onClose} onReadRef={onReadRef} />}
      <section className="sec">
        <h3 className="h3">Recorridos y viajes</h3>
        <p className="muted sm" style={{ margin: '0 0 4px' }}>Las líneas unen las paradas en el orden del texto: no reproducen el camino exacto.</p>
        <Legend />
        {groups.map((g) => (
          <div key={g.id || 'otros'} className="rgrp">
            <h4 className="rgh">{g.name}</h4>
            {g.routes.map((r) => (
              <div key={r.id} className={'rrow rc' + r.colorIndex + (r.id === routeId ? ' on' : '')}>
                <i className="rsw" />
                <button type="button" className="rname" onClick={() => onOpen(r.id)} aria-pressed={r.id === routeId}>
                  {r.name}
                  <small>{plural(r.stops, 'parada', 'paradas')}{r.people.length ? ' · ' + r.people.join(', ') : ''}</small>
                </button>
              </div>
            ))}
          </div>
        ))}
      </section>
    </>
  );
}
