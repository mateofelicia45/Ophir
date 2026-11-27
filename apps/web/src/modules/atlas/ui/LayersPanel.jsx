// Pestaña Capas: tipos de lugar (con conteo), capas históricas y opciones del mapa.
import { TYPES } from '../core/labels.js';
import { TypeSymbol } from './symbols.jsx';
import { EXTRAS, typeOn, histOn, extraOn } from './layers.js';
import LegendList from './LegendList.jsx';

const Sec = ({ title, children }) => (
  <section className="sec"><h3 className="h3">{title}</h3>{children}</section>
);

export default function LayersPanel({ db, layers, extras, periodId, onType, onHist, onExtra }) {
  const count = {};
  db.places.forEach((p) => { count[p.type] = (count[p.type] || 0) + 1; });
  return (
    <>
      <Sec title="Capas geográficas">
        {TYPES.map((t) => (
          <label className="chk" key={t.id}>
            <input type="checkbox" checked={typeOn(layers, t.id)} onChange={(e) => onType(t.id, e.target.checked)} />
            <TypeSymbol type={t.id} />
            <span>{t.label}</span>
            <span className="m">{count[t.id] || 0}</span>
          </label>
        ))}
      </Sec>
      <Sec title="Capas históricas y bíblicas">
        <p className="muted sm" style={{ margin: '0 0 8px' }}>Cada capa muestra los territorios y recorridos de su época. El selector de período de la barra superior, además, filtra los lugares.</p>
        {db.periods.map((p) => {
          const chosen = periodId === p.id;
          return (
            <label className="chk" key={p.id} title={chosen ? 'Es el período elegido en la barra superior' : undefined}>
              <input type="checkbox" checked={chosen || histOn(layers, p.id)} disabled={chosen}
                onChange={(e) => onHist(p.id, e.target.checked)} />
              <span>{p.nombre}<small>{p.fechas}</small></span>
            </label>
          );
        })}
      </Sec>
      <Sec title="Opciones del mapa">
        {EXTRAS.map((x) => (
          <label className="chk" key={x.id}>
            <input type="checkbox" checked={extraOn(extras, x.id)} onChange={(e) => onExtra(x.id, e.target.checked)} />
            <span>{x.label}</span>
          </label>
        ))}
      </Sec>
      <Sec title="Leyenda"><LegendList /></Sec>
    </>
  );
}
