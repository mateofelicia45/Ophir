// Cartel del foco actual (pasaje, personaje o recorrido), arriba a la izquierda del mapa.
import { IconClose } from './icons.jsx';

export default function FocusCard({ focus, db, periodId, onClose, onSelect, onPeriod, onRoute, onReadPassage }) {
  const period = focus.period && db.periodById[focus.period];
  const routes = (focus.routeIds || []).map((id) => db.routes.find((r) => r.id === id)).filter(Boolean);
  // Un pasaje se titula «Lugares de Juan 4 (n)».
  const title = focus.kind === 'Pasaje' ? `Lugares de ${focus.title} (${focus.items.length})` : focus.title;
  return (
    <section className="focus mui" aria-label="Foco actual del mapa">
      <div className="fhd">
        <div>
          <div className="k">{focus.kind}</div>
          <div className="ft">{title}</div>
          <div className="fsub">{focus.sub}</div>
        </div>
        <button type="button" className="ib sm" onClick={onClose} aria-label="Quitar el foco"><IconClose /></button>
      </div>
      <div className="fbody">
        {focus.note && <p className="fnote">{focus.note}</p>}
        {focus.ref && (
          <button type="button" className="link flink" onClick={() => onReadPassage(focus.ref)}>Leer el pasaje en el Lector</button>
        )}
        {(period && periodId !== focus.period) || routes.length > 0 ? (
          <div className="chips">
            {period && periodId !== focus.period && (
              <button type="button" className="chip" onClick={() => onPeriod(focus.period)}>Mostrar capa: {period.nombre}</button>
            )}
            {focus.kind === 'Pasaje' && routes.map((r) => (
              <button type="button" key={r.id} className="chip" onClick={() => onRoute(r.id)}>{r.name}</button>
            ))}
          </div>
        ) : null}
      </div>
      {focus.items.length > 0 && (
        <div className="flist">
          {focus.items.map((it) => (
            <button type="button" key={it.no + it.id} className="li" onClick={() => onSelect(it.id)}>
              <span className="no">{it.no}</span>
              <span className="nm">{it.name}<small>{it.sub}</small></span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
