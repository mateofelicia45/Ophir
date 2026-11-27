// Ayudas de orientación sobre el mapa: «¿Dónde estoy?», minimapa y su aviso.
import { lazy, Suspense } from 'react';
import LocateButton from './LocateButton.jsx';

const MiniMap = lazy(() => import('./MiniMap.jsx'));

export default function MapOverlays({ orient, mini }) {
  return (
    <>
      <LocateButton onLocate={orient.locate} busy={orient.busy} />
      {mini && (
        <Suspense fallback={null}>
          <MiniMap viewStore={orient.viewStore} onCenter={orient.center} />
        </Suspense>
      )}
      {orient.toast && <div className="toast" role="status">{orient.toast}</div>}
    </>
  );
}
