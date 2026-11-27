// Símbolos de la leyenda y de las capas (port de symPath y AREA_SYM del prototipo).
const r2 = (v) => Math.round(v * 100) / 100;

function symPath(t, s) {
  if (t === 'sitio') return `M0 ${r2(-s * 1.25)}L${r2(s * 1.25)} 0L0 ${r2(s * 1.25)}L${r2(-s * 1.25)} 0Z`;
  if (t === 'montana') return `M0 ${r2(-s * 1.3)}L${r2(s * 1.25)} ${r2(s * 0.95)}H${r2(-s * 1.25)}Z`;
  if (t === 'fuente') {
    const q = s * 0.95;
    return `M0 ${r2(-q * 1.55)}C${r2(q)} ${r2(-q * 0.3)} ${r2(q)} ${r2(q)} 0 ${r2(q)}C${r2(-q)} ${r2(q)} ${r2(-q)} ${r2(-q * 0.3)} 0 ${r2(-q * 1.55)}Z`;
  }
  const r = t === 'isla' ? s * 1.1 : s;
  return `M${r2(-r)} 0a${r2(r)} ${r2(r)} 0 1 0 ${r2(2 * r)} 0a${r2(r)} ${r2(r)} 0 1 0 ${r2(-2 * r)} 0Z`;
}

const AREA_SYM = {
  rio: ['lstk', 'M-7 1c2-4 4 4 7 0s5 4 7 0'],
  mar: ['lstk', 'M-7 -2c2-2.5 4 2.5 7 0s5 2.5 7 0M-7 3c2-2.5 4 2.5 7 0s5 2.5 7 0'],
  desierto: ['lstk', 'M-5 -3h.5M0 -3h.5M5 -3h.5M-2.5 2h.5M2.5 2h.5'],
  valle: ['lstk', 'M-6 -3L0 4L6 -3'],
  region: ['lstk dash', 'M-7 -5h14v10h-14Z'],
  reino: ['lstk', 'M-7 -5h14v10h-14Z'],
  camino: ['lstk dash', 'M-8 4L8 -4'],
};

export function TypeSymbol({ type }) {
  const a = AREA_SYM[type];
  return (
    <svg className={'lgs ty-' + type} width="18" height="18" aria-hidden="true">
      <path className={a ? a[0] : 'lsym'} d={a ? a[1] : symPath(type, 4.2)} transform="translate(9 9)" />
    </svg>
  );
}

const CIRCLE = 'M-4.5 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0Z';
const CERT = { segura: ['lsym', 1], probable: ['lsym', 0.7], discutida: ['lstk', 1], desconocida: ['lstk dash', 1] };

export function CertaintySymbol({ level }) {
  const [cls, op] = CERT[level];
  return (
    <svg className="lgs ty-ciudad" width="18" height="18" aria-hidden="true">
      <path className={cls} style={op < 1 ? { fillOpacity: op } : undefined} d={CIRCLE} transform="translate(9 9)" />
    </svg>
  );
}
