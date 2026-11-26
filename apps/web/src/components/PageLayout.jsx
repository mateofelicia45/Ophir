import React from 'react';
import { Outlet } from 'react-router-dom';

export default function PageLayout({ children, title, subtitle, kicker }) {
  return (
    <div className="page-container">
      {title && (
        <header className="page-header">
          {kicker && <div className="page-kicker">{kicker}</div>}
          <h1>{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </header>
      )}
      <div className="scroll-pane">
        {children}
        <Outlet />
      </div>
    </div>
  );
}