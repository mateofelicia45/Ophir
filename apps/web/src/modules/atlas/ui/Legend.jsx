// Leyenda del mapa, plegable: tipos de lugar y certeza de la identificación.
import { Fragment } from 'react';
import { TYPES } from '../core/labels.js';
import { TypeSymbol, CertaintySymbol } from './symbols.jsx';

const CERT = [
  ['segura', 'Segura'],
  ['probable', 'Probable'],
  ['discutida', 'Discutida'],
  ['desconocida', 'Desconocida'],
];

export default function Legend({ open, onToggle }) {
  return (
    <div className="maptools">
      <button type="button" className={'ib' + (open ? ' on' : '')} onClick={onToggle}
        aria-label="Leyenda del mapa" aria-expanded={open} title="Leyenda">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="6" cy="7" r="2" /><path d="M11 7h9M11 12h9M11 17h9" /><path d="M4 14l2-2 2 2-2 2z" /><path d="M4.5 18.5h3" />
        </svg>
      </button>
      {open && (
        <div className="legend mui" role="dialog" aria-label="Leyenda">
          <h3 className="h3">Tipos de lugar</h3>
          <div className="lgrid">
            {TYPES.map((t) => (
              <Fragment key={t.id}><TypeSymbol type={t.id} /><span>{t.label}</span></Fragment>
            ))}
          </div>
          <h3 className="h3">Certeza</h3>
          <div className="lgrid">
            {CERT.map(([id, label]) => (
              <Fragment key={id}><CertaintySymbol level={id} /><span>{label}</span></Fragment>
            ))}
            <Fragment>
              <svg width="18" height="18" aria-hidden="true"><circle cx="9" cy="9" r="7" style={{ fill: 'var(--accent)' }} /></svg>
              <span>Grupo de lugares: pulsa para acercar</span>
            </Fragment>
          </div>
          <p className="muted sm" style={{ margin: 0 }}>Las rutas y los territorios se explican en la pestaña Capas. Los nombres aparecen progresivamente al acercar el mapa.</p>
        </div>
      )}
    </div>
  );
}

