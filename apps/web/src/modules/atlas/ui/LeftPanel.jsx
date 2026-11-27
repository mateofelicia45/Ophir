// Panel izquierdo (336 px) con las pestañas del prototipo. Capas, Rutas y Estudio
// muestran por ahora sus encabezados; los completan las tareas siguientes.
import ExplorePanel from './ExplorePanel.jsx';

const TABS = [['explorar', 'Explorar'], ['capas', 'Capas'], ['rutas', 'Rutas'], ['estudio', 'Estudio']];

const Sec = ({ title, children }) => (
  <section className="sec"><h3 className="h3">{title}</h3>{children}</section>
);
const Note = ({ children }) => <p className="muted sm" style={{ margin: '0 0 8px' }}>{children}</p>;

export default function LeftPanel({ tab, onTab, explore }) {
  return (
    <aside className="left" aria-label="Exploración, capas, rutas y estudio">
      <nav className="tabs" aria-label="Secciones" role="tablist">
        {TABS.map(([id, label]) => (
          <button type="button" key={id} role="tab" aria-selected={tab === id}
            className={'tab' + (tab === id ? ' on' : '')} onClick={() => onTab(id)}>{label}</button>
        ))}
      </nav>
      <div className="scroll lpad" role="tabpanel">
        {tab === 'explorar' && <ExplorePanel {...explore} />}
        {tab === 'capas' && (
          <>
            <Sec title="Capas geográficas" />
            <Sec title="Capas históricas y bíblicas">
              <Note>Cada capa muestra los territorios y recorridos de su época. El selector de período de la barra superior, además, filtra los lugares.</Note>
            </Sec>
            <Sec title="Opciones del mapa" />
            <Sec title="Leyenda" />
          </>
        )}
        {tab === 'rutas' && (
          <Sec title="Recorridos y viajes">
            <Note>Las líneas unen las paradas en el orden del texto: no reproducen el camino exacto.</Note>
          </Sec>
        )}
        {tab === 'estudio' && (
          <>
            <Sec title="Cobertura de la base de datos" />
            <Sec title="Favoritos" />
            <Sec title="Pendientes de estudio" />
            <Sec title="Mis notas" />
            <Sec title="Historial" />
            <Sec title="Exportar" />
            <Sec title="Fuentes y créditos" />
          </>
        )}
      </div>
    </aside>
  );
}
