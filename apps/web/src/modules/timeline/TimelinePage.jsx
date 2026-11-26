import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePassage } from '../../context/PassageContext.jsx';
import { parseReference } from '../../lib/references.js';
import TIMELINE from '@data/timeline.json';

const LANE_META = {
  biblia: { label: 'Historia bíblica', color: '#e0be62' },
  iglesia: { label: 'Historia de la Iglesia', color: '#6fb8e0' },
};

const MIN_PX = 0.18;
const MAX_PX = 1.6;
const AXIS_Y = 230;

export default function TimelinePage() {
  const [zoom, setZoom] = useState(0.34);
  const [selected, setSelected] = useState(null);
  const [selCov, setSelCov] = useState(null);
  const scrollRef = useRef(null);
  const didCenter = useRef(false);
  const navigate = useNavigate();
  const { setPassage } = usePassage();

  const events = TIMELINE.events;
  const eras = TIMELINE.eras;
  const covenants = TIMELINE.covenants ?? [];

  const minYear = Math.min(
    ...events.map((e) => e.year),
    ...eras.map((e) => e.from),
    ...covenants.map((c) => c.year)
  );
  const maxYear = Math.max(...events.map((e) => e.year)) + 40;
  const pxPerYear = zoom;
  const x = (year) => (year - minYear) * pxPerYear;
  const canvasWidth = x(maxYear);

  // Escalonar etiquetas por carril para reducir solapamientos.
  const placed = useMemo(() => {
    let bIdx = 0;
    let iIdx = 0;
    return events
      .slice()
      .sort((a, b) => a.year - b.year)
      .map((ev, i) => ({
        ...ev,
        i,
        tier: ev.lane === 'biblia' ? bIdx++ % 3 : iIdx++ % 3,
      }));
  }, [events]);

  // Al primer render, centrar la vista en el siglo XVI.
  useEffect(() => {
    if (didCenter.current || !scrollRef.current) return;
    didCenter.current = true;
    scrollRef.current.scrollLeft = Math.max(0, x(1560) - 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fmtYear(y) {
    return y < 0 ? `~${Math.abs(y)} a.C.` : `~${y} d.C.`;
  }
  function fmtExact(y, approx) {
    const s = y < 0 ? `${Math.abs(y)} a.C.` : `${y} d.C.`;
    return (approx ? 'c. ' : '') + s;
  }

  function openRef(key) {
    const m = String(key).match(/^([a-z0-9]+)\.(\d+)/);
    const parsed = m ? parseReference(`${m[1]} ${m[2]}`) : null;
    if (!parsed) return;
    setPassage({
      book: parsed.book.name,
      chapter: parsed.chapter,
      verseStart: null,
      verseEnd: null,
    });
    navigate('/lector');
  }

  const sel = placed.find((e) => e.i === selected) || null;
  const cov = selCov !== null ? covenants[selCov] || null : null;

  return (
    <div className="timeline-root">
      <header className="tl-header">
        <div>
          <p className="xr-kicker">Doble carril sincronizado · Fase 6</p>
          <h2 className="tl-title">Línea de tiempo</h2>
          <p className="hint">
            Arriba la historia bíblica; abajo la historia de la Iglesia. Mismo eje
            de tiempo; las fechas marcadas «c.» son aproximadas o disputadas. Los
            rombos dorados marcan los pactos que dividen la historia de la
            redención.
          </p>
        </div>
        <div className="tl-zoom">
          <button onClick={() => setZoom((z) => Math.max(MIN_PX, z / 1.5))}>−</button>
          <span>Alejar / acercar</span>
          <button onClick={() => setZoom((z) => Math.min(MAX_PX, z * 1.5))}>+</button>
        </div>
      </header>

      <div className="tl-scroll" ref={scrollRef}>
        <div className="tl-canvas" style={{ width: canvasWidth }}>
          {eras.map((era, i) => (
            <div
              key={era.id}
              className={`tl-era${i % 2 === 0 ? '' : ' alt'}`}
              style={{
                left: x(era.from),
                width: Math.max(2, x(era.to) - x(era.from)),
              }}
            >
              <span>{era.label}</span>
            </div>
          ))}

          <div className="tl-axis" />

          {covenants.map((c, ci) => (
            <div
              key={`covline-${ci}`}
              className="tl-cov-line"
              style={{ left: x(c.year) }}
            />
          ))}

          {placed.map((ev) => {
            const meta = LANE_META[ev.lane];
            const up = ev.lane === 'biblia';
            const stem = 26 + ev.tier * 52;
            const selCls = selected === ev.i ? ' on' : '';
            return (
              <button
                key={ev.i}
                className={`tl-ev${selCls}`}
                style={{ left: x(ev.year), top: AXIS_Y }}
                onClick={() => {
                  setSelected(selected === ev.i ? null : ev.i);
                  setSelCov(null);
                }}
              >
                <span className="tl-dot" style={{ background: meta.color }} />
                <span
                  className="tl-stem"
                  style={{
                    height: stem,
                    background: meta.color,
                    transform: up
                      ? `translateY(-${stem}px)`
                      : 'translateY(10px)',
                  }}
                />
                <span
                  className={`tl-lbl${up ? ' up' : ' down'}`}
                  style={{
                    borderColor: meta.color,
                    transform: `translateX(-50%) translateY(${
                      up ? -(stem + 26) : stem + 16
                    }px)`,
                  }}
                >
                  <b>{fmtYear(ev.year)}</b> {ev.title}
                </span>
              </button>
            );
          })}

          {covenants.map((c, ci) => (
            <button
              key={`cov-${ci}`}
              className={`tl-cov${selCov === ci ? ' on' : ''}`}
              style={{ left: x(c.year), top: AXIS_Y }}
              title={c.name}
              onClick={() => {
                setSelCov(selCov === ci ? null : ci);
                setSelected(null);
              }}
            >
              <span className="tl-cov-glyph">{c.symbol}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tl-legend">
        {Object.entries(LANE_META).map(([id, m]) => (
          <span key={id}>
            <i style={{ background: m.color }} /> {m.label}
          </span>
        ))}
        {covenants.length > 0 && (
          <span>
            <i className="legend-cov" /> Símbolos del pacto (dividen las eras de
            la redención)
          </span>
        )}
      </div>

      {cov ? (
        <section className="tl-detail">
          <div className="tld-head">
            <span className="tld-lane cov">{cov.symbol} {cov.name}</span>
            <time>{fmtExact(cov.year, cov.approx)}</time>
          </div>
          <h3>{cov.name}</h3>
          <p>{cov.desc}</p>
          {cov.ref && (
            <button className="tld-ref" onClick={() => openRef(cov.ref)}>
              Abrir pasaje →
            </button>
          )}
        </section>
      ) : sel && (
        <section className="tl-detail">
          <div className="tld-head">
            <span
              className="tld-lane"
              style={{
                color: LANE_META[sel.lane].color,
                borderColor: LANE_META[sel.lane].color,
              }}
            >
              {LANE_META[sel.lane].label}
            </span>
            <time>{fmtExact(sel.year, sel.approx)}</time>
          </div>
          <h3>{sel.title}</h3>
          <p>{sel.desc}</p>
          {sel.ref && (
            <button className="tld-ref" onClick={() => openRef(sel.ref)}>
              Abrir pasaje →
            </button>
          )}
        </section>
      )}
    </div>
  );
}
