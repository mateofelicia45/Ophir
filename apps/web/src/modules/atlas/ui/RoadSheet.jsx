// Ficha de un camino antiguo: nota, pasajes (abren el Lector), longitud y comparación.
import { parseRef } from '../core/refs.js';
import { roadStats, fmtDays, fmtKm } from '../core/caminos.js';
import { IconClose } from './icons.jsx';

function Cmp({ road, color, onPick }) {
  const s = roadStats(road);
  return (
    <div className="cmprow">
      <i style={{ background: color }} aria-hidden="true" />
      {onPick
        ? <button type="button" className="mini" onClick={() => onPick(road.id)}>{road.nombre}</button>
        : <span>{road.nombre}</span>}
      <b>≈ {fmtKm(s.km)} · ≈ {fmtDays(s.days)}</b>
    </div>
  );
}

export default function RoadSheet({ db, road, related, comparing, onCompare, onStopCompare, onPick, onClose, onReadRef }) {
  const s = roadStats(road);
  const names = road.periodos.map((id) => (db.periods.find((p) => p.id === id) || {}).nombre).filter(Boolean);
  const diff = related ? roadStats(related).km - s.km : 0;
  return (
    <>
      <div className="fh">
        <div className="fhrow">
          <div className="badges">
            <span className="bd">Camino antiguo</span>
            <span className="bd q-discutida">Trazado aproximado</span>
          </div>
          <button type="button" className="ib sm" onClick={onClose} aria-label="Cerrar la ficha"><IconClose /></button>
        </div>
        <h2>{road.nombre}</h2>
        <p className="sub">≈ {fmtKm(s.km)} · ≈ {fmtDays(s.days)} a pie</p>
      </div>
      <div className="scroll">
        <section className="fs">
          <p className="prose">{road.nota}</p>
          {names.length > 0 && <p className="muted sm" style={{ margin: '10px 0 0' }}>Épocas: {names.join(' · ')}</p>}
        </section>
        <section className="fs">
          <h3 className="h3">Pasajes</h3>
          <p className="muted sm" style={{ margin: '0 0 8px' }}>Pulsa un pasaje para leerlo en el Lector.</p>
          <div>
            {road.refs.map((r) => {
              const ref = parseRef(r);
              return ref
                ? <button type="button" key={r} className="refc" onClick={() => onReadRef(ref)}>{r}</button>
                : <span key={r} className="refc">{r}</span>;
            })}
          </div>
        </section>
        {related && (
          <section className="fs">
            <h3 className="h3">Comparar</h3>
            {!comparing && (
              <button type="button" className="btn ghost" onClick={onCompare}>Comparar con…</button>
            )}
            {comparing && (
              <>
                <Cmp road={road} color="var(--clay)" />
                <Cmp road={related} color="var(--accent)" onPick={onPick} />
                <p className="muted sm" style={{ margin: '8px 0 10px' }}>
                  {diff === 0 ? 'Miden lo mismo.' : `«${diff > 0 ? related.nombre : road.nombre}» es unos ${fmtKm(Math.abs(diff))} más larga.`}
                </p>
                <button type="button" className="btn ghost" onClick={onStopCompare}>Dejar de comparar</button>
              </>
            )}
          </section>
        )}
        <section className="fs">
          <p className="warn">Trazado aproximado, unido por los lugares por donde pasaba. La longitud se mide sobre esa línea (30 km por día, redondeando hacia arriba): el camino real tenía más curvas.</p>
        </section>
      </div>
    </>
  );
}
