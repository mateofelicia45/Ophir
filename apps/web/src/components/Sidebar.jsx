import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV_GROUPS = [
  {
    label: 'FUNDAMENTOS',
    items: [
      { to: '/', icon: '◈', label: 'Inicio', exact: true },
      { to: '/evangelio', icon: '☩', label: 'El Evangelio' },
      { to: '/lector', icon: '❖', label: 'Lector bíblico' },
    ],
  },
  {
    label: 'ESTUDIO EXEGÉTICO',
    items: [
      { to: '/interlineal', icon: 'א', label: 'Interlineal G/H' },
      { to: '/concordancia', icon: '≡', label: 'Concordancia Strong' },
      { to: '/diccionarios', icon: '❡', label: 'Diccionarios' },
      { to: '/hermeneutica', icon: '✒', label: 'Hermenéutica' },
      { to: '/teologia', icon: '⚖', label: 'Teología sistemática' },
    ],
  },
  {
    label: 'HERRAMIENTAS DE TEXTO',
    items: [
      { to: '/referencias', icon: '⇄', label: 'Referencias cruzadas' },
      { to: '/variantes', icon: '⚖', label: 'Variantes textuales' },
      { to: '/harmonia', icon: '♻', label: 'Armonía evangélica' },
    ],
  },
  {
    label: 'CONTEXTO HISTÓRICO',
    items: [
      { to: '/atlas', icon: '◉', label: 'Atlas 3D' },
      { to: '/linea-tiempo', icon: '⟷', label: 'Línea de tiempo' },
    ],
  },
  {
    label: 'VIDA CRISTIANA',
    items: [
      { to: '/planes', icon: '☰', label: 'Planes de lectura' },
      { to: '/devocional', icon: '☀', label: 'Devocional diario' },
      { to: '/infantil', icon: '⚘', label: 'Ministerio infantil' },
    ],
  },
  {
    label: 'PERSONAL',
    items: [
      { to: '/notas', icon: '✎', label: 'Mis notas' },
      { to: '/asistente', icon: '✦', label: 'Asistente IA' },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        {!collapsed && (
          <>
            <h1>Ophir</h1>
            <p>Estudio bíblico</p>
          </>
        )}
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? '◀' : '▶'}
        </button>
      </div>
      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="nav-group">
            {!collapsed && (
              <div className="nav-group-label">{group.label}</div>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `nav-item${isActive ? ' active' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
                {isActive && !collapsed && <span className="nav-indicator" />}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        {!collapsed && (
          <>
            <p>Oro fino de Ofir (1 R 9:28): mina y refinería del texto.</p>
            <div className="sidebar-version">v0.1.0</div>
          </>
        )}
        {collapsed && <span className="footer-collapsed">Ophir</span>}
      </div>
    </aside>
  );
}