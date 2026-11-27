// Barra superior del atlas (58 px): paneles, marca, búsqueda, período y tema.
import SearchBox from './SearchBox.jsx';
import { IconLeftPanel, IconRightPanel, IconSun, IconMoon, IconRuler, Logo } from './icons.jsx';

export function PeriodSelect({ db, value, onChange, className }) {
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Todos los períodos</option>
      {(db ? db.periods : []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
    </select>
  );
}

export default function TopBar({
  db, theme, onTheme, periodId, onPeriod, leftOpen, rightOpen, onToggleLeft, onToggleRight, onAction, measuring, onMeasure,
}) {
  const themeLabel = theme === 'dark' ? 'Tema: oscuro (pulsa para claro)' : 'Tema: claro (pulsa para oscuro)';
  return (
    <header className="top">
      <button type="button" className={'ib' + (leftOpen ? ' on' : '')} onClick={onToggleLeft}
        aria-label="Mostrar u ocultar el panel de exploración" aria-pressed={leftOpen}>
        <IconLeftPanel />
      </button>
      <div className="brand">
        <Logo />
        <div className="bt"><h1>Atlas Bíblico</h1><small>Geografía de las Escrituras</small></div>
      </div>
      <SearchBox db={db} onAction={onAction} />
      <div className="ctl">
        <label className="psel">
          <span className="sr-only">Período histórico</span>
          <PeriodSelect db={db} value={periodId} onChange={onPeriod} className="sel" />
        </label>
        <button type="button" className={'ib' + (measuring ? ' on' : '')} onClick={onMeasure} aria-pressed={!!measuring}
          aria-label="Medir distancias (Esc para cerrar)" title="Medir distancias">
          <IconRuler />
        </button>
        <button type="button" className="ib" onClick={onTheme} aria-label={themeLabel} title={themeLabel}>
          {theme === 'dark' ? <IconMoon /> : <IconSun />}
        </button>
        <button type="button" className={'ib' + (rightOpen ? ' on' : '')} onClick={onToggleRight}
          aria-label="Mostrar u ocultar la ficha" aria-pressed={rightOpen}>
          <IconRightPanel />
        </button>
      </div>
    </header>
  );
}
