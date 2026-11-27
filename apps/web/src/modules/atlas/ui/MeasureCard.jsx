// Cartel del modo «Medir»: km por tramo, total y días a pie (30 km por día).
import { IconClose } from './icons.jsx';

const fmt = (km) => (km < 10 ? km.toFixed(1) : String(Math.round(km))).replace('.', ',');

export default function MeasureCard({ points, summary, onUndo, onClear, onClose }) {
  const { legs, totalKm, days } = summary;
  return (
    <section className="measure mui" aria-label="Medir distancias">
      <div className="mh">
        <h3 className="h3" style={{ margin: 0 }}>Medir</h3>
        <button type="button" className="ib sm" onClick={onClose} aria-label="Cerrar la medición (Esc)" title="Cerrar (Esc)">
          <IconClose />
        </button>
      </div>
      {points.length === 0 && <p className="muted sm">Pulsa lugares o puntos del mapa para sumar tramos.</p>}
      {points.length === 1 && <p className="muted sm">Desde {points[0].name}. Pulsa otro punto.</p>}
      {legs.length > 0 && (
        <ol className="mlegs">
          {legs.map((d, i) => (
            <li key={i}>
              <span>{points[i].name} → {points[i + 1].name}</span>
              <b>{fmt(d)} km</b>
            </li>
          ))}
        </ol>
      )}
      {legs.length > 0 && (
        <p className="mtot">
          <b>{fmt(totalKm)} km</b> en línea recta
          <span className="muted"> · ≈ {days === 1 ? '1 día' : days + ' días'} a pie</span>
        </p>
      )}
      {points.length > 0 && (
        <div className="btns">
          <button type="button" className="btn ghost" onClick={onUndo}>Quitar el último</button>
          <button type="button" className="btn ghost" onClick={onClear}>Empezar de nuevo</button>
        </div>
      )}
    </section>
  );
}
