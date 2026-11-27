// Leyenda de trazos y territorios (pestaña Capas). Los tramos aproximados, los
// hipotéticos y todo territorio van siempre punteados.
import { CertaintySymbol } from './symbols.jsx';

const CERT = [
  ['segura', 'Identificación segura (símbolo relleno)'],
  ['probable', 'Probable (relleno atenuado)'],
  ['discutida', 'Discutida (símbolo hueco)'],
  ['desconocida', 'Desconocida (hueco discontinuo)'],
];

const Line = ({ dash, style }) => (
  <svg width="40" height="8" aria-hidden="true">
    <line x1="2" y1="4" x2="38" y2="4" strokeDasharray={dash} style={style} />
  </svg>
);
const Terr = ({ color, op, dash, w }) => (
  <svg width="40" height="14" aria-hidden="true">
    <rect x="2" y="2" width="36" height="10" rx="2"
      style={{ fill: color, fillOpacity: op, stroke: color, strokeDasharray: dash, strokeWidth: w }} />
  </svg>
);

export default function LegendList() {
  return (
    <>
      <div className="lgrid">
        {CERT.map(([id, label]) => (
          <span key={id} style={{ display: 'contents' }}><CertaintySymbol level={id} /><span>{label}</span></span>
        ))}
      </div>
      <div className="lline">
        <Line /><span>Etapa de ruta explícita en el texto</span>
        <Line dash="9 6" /><span>Trayecto aproximado</span>
        <Line dash="1.5 5.5" /><span>Ubicación o trayecto hipotético</span>
        <Terr color="var(--c2)" op=".15" dash="8 4" w="1.5" /><span>Territorio antiguo (contorno aproximado)</span>
        <Terr color="var(--c4)" op=".06" dash="2 4" w="1.6" /><span>Territorio de extensión discutida</span>
        <Line style={{ stroke: 'var(--border)', strokeWidth: 1.4, strokeDasharray: '1 3.2' }} /><span>Frontera política moderna</span>
      </div>
    </>
  );
}
