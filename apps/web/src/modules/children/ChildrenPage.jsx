import { RichText } from '../../components/RichText.jsx';
import { useOpenRef } from '../../hooks/useOpenRef.js';
import { parseReference, formatReference } from '../../lib/references.js';
import CHILDREN from '@data/children.json';
import '../../styles/children.css';

export default function ChildrenPage() {
  const openRef = useOpenRef();

  return (
    <div className="page chd-root">
      <header className="page-header">
        <div className="kicker">Ministerio infantil · curado</div>
        <h2>Historias grandes para chicos</h2>
        <p className="lede">{CHILDREN.lede}</p>
      </header>

      {Object.entries(CHILDREN.groups).map(([key, label]) => (
        <section key={key} className="chd-group">
          <h3 className="chd-group-title">{label}</h3>
          <div className="chd-grid">
            {CHILDREN.stories
              .filter((s) => s.g === key)
              .map((s) => {
                const memParsed = parseReference(s.mem.ref);
                return (
                  <article key={s.n} className="chd-card">
                    <header className="chd-head">
                      <span className="chd-num">{s.n}</span>
                      <h4>{s.title}</h4>
                    </header>
                    <RichText
                      text={s.text}
                      pClass="chd-text"
                      refClass="chd-ref"
                    />
                    <footer className="chd-mem">
                      <span className="chd-mem-label">Para memorizar</span>
                      <p className="chd-mem-text">«{s.mem.text}»</p>
                      {memParsed && (
                        <button
                          className="chd-ref"
                          onClick={() => openRef(memParsed)}
                          title="Abrir en el Lector"
                        >
                          {formatReference(memParsed)}
                        </button>
                      )}
                    </footer>
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}