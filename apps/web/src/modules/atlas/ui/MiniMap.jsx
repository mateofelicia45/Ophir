// Minimapa de orientación: la tierra del área, Jerusalén y un rectángulo con lo que se ve.
// Un clic centra el mapa en ese punto.
import land from '@data/atlas/basemap/land.json';
import { MINI, landPath, viewRect, fromMini, toMini } from '../core/minimap.js';
import { JERUSALEM } from '../core/locate.js';

const LAND_D = landPath(land);
const [JX, JY] = toMini(JERUSALEM);

export default function MiniMap({ view, onCenter }) {
  const r = view ? viewRect(view) : null;
  const click = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (!box.width) return;
    const x = ((e.clientX - box.left) / box.width) * MINI.w;
    const y = ((e.clientY - box.top) / box.height) * MINI.h;
    onCenter(fromMini(x, y));
  };
  return (
    <button type="button" className="minimap mui" onClick={click}
      aria-label="Minimapa de orientación: pulsa un punto para centrar el mapa allí" title="Minimapa">
      <svg viewBox={`0 0 ${MINI.w} ${MINI.h}`} width={MINI.w} height={MINI.h} aria-hidden="true">
        <rect className="mm-sea" width={MINI.w} height={MINI.h} />
        <path className="mm-land" d={LAND_D} />
        <circle className="mm-jer" cx={JX} cy={JY} r="1.8" />
        {r && <rect className="mm-view" x={r.x} y={r.y} width={r.w} height={r.h} />}
      </svg>
    </button>
  );
}
