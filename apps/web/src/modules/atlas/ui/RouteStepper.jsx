// Cartel «◀ Parada n de N ▶» del recorrido abierto: nombre, referencia (abre el
// Lector), nota, tipo de tramo y distancia acumulada.
import { IconClose } from './icons.jsx';
import { displayName } from '../core/text.js';
import { parseRef } from '../core/refs.js';
import { LEG_LABEL } from '../core/routes.js';

const km = (v) => Math.round(v).toLocaleString('es-AR');

export default function RouteStepper({ db, route, step, progress, onStep, onClose, onReadRef }) {
  const stop = route.stops[step];
  const place = stop.placeId != null ? db.byId.get(stop.placeId) : null;
  const pr = progress[step];
  const ref = stop.ref ? parseRef(stop.ref) : null;
  const total = route.stops.length;
  const days = pr.cumDays === 1 ? '1 día' : pr.cumDays + ' días';
  return (
    <section className={'rstep mui rc' + route.colorIndex} aria-label={'Recorrido: ' + route.name}>
      <div className="rs-top">
        <span className="rs-title">{route.name}</span>
        <button type="button" className="ib sm" onClick={onClose} aria-label="Cerrar el recorrido"><IconClose /></button>
      </div>
      <div className="rs-nav">
        <button type="button" className="ib" onClick={() => onStep(step - 1)} disabled={step === 0} aria-label="Parada anterior">◀</button>
        <div className="rs-count" aria-live="polite">Parada {step + 1} de {total}</div>
        <button type="button" className="ib" onClick={() => onStep(step + 1)} disabled={step === total - 1} aria-label="Parada siguiente">▶</button>
      </div>
      <div className="rs-body">
        <h4 className="rs-name"><span className="no">{step + 1}</span>{place ? displayName(place.name) : 'Lugar sin identificar'}</h4>
        {stop.note && <p className="rs-note">{stop.note}</p>}
        <div className="rs-meta">
          {stop.ref && (ref
            ? <button type="button" className="refc" onClick={() => onReadRef(ref)}>{stop.ref}</button>
            : <span className="refc">{stop.ref}</span>)}
          {stop.leg && step > 0 && <span className={'tb ' + stop.leg}>{LEG_LABEL[stop.leg] || stop.leg}</span>}
        </div>
        <p className="rs-dist muted sm">
          {pr.hasPos
            ? <>Distancia acumulada: <b>{km(pr.cumKm)} km</b> · unos {days} a pie</>
            : 'Sin ubicación conocida: no suma distancia.'}
        </p>
      </div>
    </section>
  );
}
