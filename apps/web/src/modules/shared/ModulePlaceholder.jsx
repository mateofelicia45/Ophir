export default function ModulePlaceholder({ kicker, title, lede, phase }) {
  return (
    <div className="page page-narrow">
      <header className="page-header">
        <div className="kicker">{kicker}</div>
        <h2>{title}</h2>
        <p className="lede">{lede}</p>
      </header>
      <div className="placeholder-box">
        Módulo previsto para la <strong>{phase}</strong> del roadmap.
        <br />
        El plan completo está en <code>ophir/docs/ROADMAP.md</code>.
      </div>
    </div>
  );
}
