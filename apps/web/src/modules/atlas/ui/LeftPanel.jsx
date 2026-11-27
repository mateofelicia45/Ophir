// Panel izquierdo (336 px) con las pestañas del prototipo.
import ExplorePanel from './ExplorePanel.jsx';
import RoutesPanel from './RoutesPanel.jsx';
import LayersPanel from './LayersPanel.jsx';
import StudyPanel from './StudyPanel.jsx';

const TABS = [['explorar', 'Explorar'], ['capas', 'Capas'], ['rutas', 'Rutas'], ['estudio', 'Estudio']];


export default function LeftPanel({ tab, onTab, explore, routes, layers, study }) {
  return (
    <aside className="left" aria-label="Exploración, capas, rutas y estudio">
      <nav className="tabs" aria-label="Secciones" role="tablist">
        {TABS.map(([id, label]) => (
          <button type="button" key={id} role="tab" aria-selected={tab === id}
            className={'tab' + (tab === id ? ' on' : '')} onClick={() => onTab(id)}>{label}</button>
        ))}
      </nav>
      <div className="scroll lpad" role="tabpanel" key={tab}>
        {tab === 'explorar' && <ExplorePanel {...explore} />}
        {tab === 'capas' && <LayersPanel {...layers} />}
        {tab === 'rutas' && <RoutesPanel {...routes} />}
        {tab === 'estudio' && <StudyPanel {...study} />}
      </div>
    </aside>
  );
}
