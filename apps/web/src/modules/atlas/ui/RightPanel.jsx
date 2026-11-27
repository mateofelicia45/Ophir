// Panel derecho (400 px): la ficha del lugar elegido o, sin selección, la bienvenida del prototipo.
import PlaceSheet from './PlaceSheet.jsx';
import RoadSheet from './RoadSheet.jsx';

const QUICK = [
  ['Éfeso', { type: 'place', id: 'ephesus' }],
  ['Hechos 16', { type: 'passage', text: 'Hechos 16' }],
  ['Pablo', { type: 'person', id: 'Pablo' }],
  ['Viaje de Pablo a Roma', { type: 'route', id: 'roma' }],
  ['Exilio babilónico', { type: 'period', id: 'babilonico' }],
  ['Monte Sinaí', { type: 'place', id: 'mount-sinai' }],
  ['Éxodo', { type: 'route', id: 'exodo' }],
  ['1 Reyes 18', { type: 'passage', text: '1 Reyes 18' }],
];

function Welcome({ db, onAction }) {
  const st = db.stats;
  const pct = Math.round((st.curated / st.total) * 1000) / 10;
  return (
    <div className="scroll">
      <section className="fs">
        <h2 className="wt">Estudiar las Escrituras a través de su geografía</h2>
        <p className="prose">Busca un lugar, escribe un pasaje («Hechos 16», «1 R 18»), un personaje o un período. Cada lugar tiene una ficha con sus pasajes, su contexto, las propuestas de identificación y espacio para tus notas.</p>
        <div className="chips" style={{ marginTop: 12 }}>
          {QUICK.map(([label, action]) => (
            <button type="button" key={label} className="chip" onClick={() => onAction(action)}>{label}</button>
          ))}
        </div>
      </section>
      <section className="fs">
        <h3 className="h3">Cobertura actual</h3>
        <div className="cov">
          <div className="covbar"><i style={{ width: pct + '%' }} /></div>
          <p><b>{st.total}</b> lugares, <b>{st.curated}</b> con ficha completa y <b>{st.total - st.curated}</b> fichas básicas pendientes de verificar.</p>
        </div>
      </section>
      <section className="fs">
        <h3 className="h3">Precisión</h3>
        <p className="prose sm">Ninguna coordenada se ha escrito a mano: todas proceden de OpenBible.info, que registra las identificaciones propuestas. Cuando hay varias, la ficha las muestra todas. Los territorios antiguos son contornos aproximados, y las rutas unen paradas sin pretender reproducir el camino real. Distingue siempre lo que dice el texto bíblico de las reconstrucciones.</p>
      </section>
    </div>
  );
}

export default function RightPanel({ db, place, road, onClose, onAction, ...sheet }) {
  return (
    <aside className="right" aria-label={road ? 'Ficha del camino' : 'Ficha del lugar'}>
      {road
        ? <RoadSheet db={db} onClose={onClose} onReadRef={sheet.onReadRef} {...road} />
        : place
        ? <PlaceSheet key={place.id} db={db} place={place} onClose={onClose} onAction={onAction} {...sheet} />
        : <Welcome db={db} onAction={onAction} />}
    </aside>
  );
}
