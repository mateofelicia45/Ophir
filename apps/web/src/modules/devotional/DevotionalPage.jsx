import { useEffect, useMemo, useState } from 'react';
import { DEVOTIONALS, loadDevotional } from '../../lib/devotional.js';
import { ScanRefs } from '../../components/ScanRefs.jsx';
import { useOpenParsedRef } from '../../hooks/useOpenParsedRef.js';
import { fmtRef } from '../../lib/refscan.js';
import '../../styles/devotional.css';

function dayOfYear(now) {
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000); // 0..365
}

export default function DevotionalPage() {
  const [data, setData] = useState(null);
  const [slot, setSlot] = useState('morning');
  const [dow, setDow] = useState(() => dayOfYear(new Date()));
  const openRef = useOpenParsedRef();

  useEffect(() => {
    let alive = true;
    loadDevotional('spurgeon').then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, []);

  const dayEntries = useMemo(() => {
    if (!data) return [];
    const mine = data.entries.filter((e) => e.dow === dow);
    return mine.length ? mine : [];
  }, [data, dow]);

  const morning = dayEntries.find((e) => e.slot === 'morning');
  const evening = dayEntries.find((e) => e.slot === 'evening');
  const entry = slot === 'morning' ? morning : evening;

  const dateLabel = morning?.dateLabel || `${dow + 1}° día`;

  function go(delta) {
    setDow((d) => {
      const next = d + delta;
      const max = data ? data.entries[data.entries.length - 1].dow : 365;
      return Math.max(0, Math.min(max, next));
    });
  }

  return (
    <div className="page dev-root">
      <header className="page-header">
        <div className="kicker">Devocional diario · dominio público</div>
        <h2>Mañana y Noche</h2>
        <p className="lede">
          Charles Haddon Spurgeon (1834-1892), «el príncipe de los
          predicadores», escribió una lectura para cada mañana y cada noche del
          año. Las referencias del texto se abren directo en el Lector.
        </p>
      </header>

      <div className="dev-nav">
        <button onClick={() => go(-1)} title="Día anterior">‹</button>
        <span className="dev-date">{dateLabel}</span>
        <button onClick={() => go(1)} title="Día siguiente">›</button>
        <button className="dev-today" onClick={() => setDow(dayOfYear(new Date()))}>
          Hoy
        </button>
      </div>

      <div className="dev-slots">
        <button
          className={`dev-slot${slot === 'morning' ? ' on' : ''}`}
          onClick={() => setSlot('morning')}
        >
          {morning ? '☀ Mañana' : '—'}
        </button>
        <button
          className={`dev-slot${slot === 'evening' ? ' on' : ''}`}
          onClick={() => setSlot('evening')}
        >
          {evening ? '☾ Noche' : '—'}
        </button>
      </div>

      {!data && <div className="col-loading">Cargando devocional…</div>}

      {data && entry ? (
        <article className="dev-card">
          <header className="dev-head">
            <p className="dev-slot-label">{entry.slotLabel}</p>
            <h3>
              {dateLabel} <small>· C. H. Spurgeon</small>
            </h3>
          </header>
          <blockquote className="dev-keyverse">
            «{entry.keyverse.replace(/^["“]|["”]$/g, '')}»
            {entry.ref && (
              <button
                className="dev-reflink"
                onClick={() => openRef(entry.ref)}
              >
                {fmtRef(entry.ref)}
              </button>
            )}
          </blockquote>
          <div className="dev-body">
            {entry.body.length ? (
              <ScanRefs
                text={entry.body}
                pClass="dev-p"
                refClass="dev-ref"
              />
            ) : (
              <p className="dev-p">—</p>
            )}
          </div>
          <footer className="dev-credit">
            {DEVOTIONALS[0]?.name} · texto en inglés · dominio público.
          </footer>
        </article>
      ) : (
        data && <p className="cc-empty">Sin lectura para este día.</p>
      )}
    </div>
  );
}