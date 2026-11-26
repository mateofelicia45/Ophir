import { useState } from 'react';
import { formatReference } from '../../lib/references.js';
import { useOpenRef } from '../../hooks/useOpenRef.js';
import {
  PLANS,
  loadPlan,
  getPlanState,
  startPlan,
  currentDay,
  toggleDay,
  streak,
  resolvePlanRef,
} from '../../lib/plans.js';
import '../../styles/plans.css';

export default function PlansPage() {
  const [openPlanId, setOpenPlanId] = useState(null);
  const plan = openPlanId ? loadPlan(openPlanId) : null;

  if (!plan) return <PlanList onSelect={setOpenPlanId} />;
  return <PlanDetail plan={plan} onBack={() => setOpenPlanId(null)} />;
}

function PlanList({ onSelect }) {
  return (
    <div className="page pl-root">
      <header className="page-header">
        <div className="kicker">Fase 13 · integrado</div>
        <h2>Planes de lectura</h2>
        <p className="lede">
          Elegí un plan y seguí el progreso día a día. Cada lectura abre el
          Lector, y los capítulos visitados se marcan como leídos en tu
          historial local (localStorage).
        </p>
      </header>
      <div className="pl-grid">
        {PLANS.map((p) => {
          const state = getPlanState(p.id);
          const pct = Math.round(((state.done?.length || 0) / p.days) * 100);
          const started = !!state.startedAt;
          return (
            <button
              key={p.id}
              className="pl-card"
              onClick={() => onSelect(p.id)}
            >
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
              <div className="pl-card-footer">
                <span>{p.days} días</span>
                {started && <span className="pl-pct">{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlanDetail({ plan, onBack }) {
  const openRef = useOpenRef();
  // Inicia el plan si es la primera vez que se abre.
  useState(() => {
    const s = getPlanState(plan.id);
    if (!s.startedAt) startPlan(plan.id);
  });
  const today = currentDay(plan.id);
  const [cursor, setCursor] = useState(today);
  const [doneDays, setDoneDays] = useState(() => getPlanState(plan.id).done || []);

  const pct = Math.round(((doneDays.length || 0) / plan.days) * 100);
  const day = plan.daily[cursor - 1];
  const doneSet = new Set(doneDays);

  function go(d) {
    setCursor(Math.max(1, Math.min(plan.days, d)));
  }

  function openRead(ref) {
    const parsed = resolvePlanRef(ref);
    if (parsed) {
      if (!doneSet.has(cursor)) {
        toggleDay(plan.id, cursor);
        setDoneDays((prev) => [...prev, cursor]);
      }
      openRef(parsed);
    }
  }

  function toggleDone() {
    toggleDay(plan.id, cursor);
    setDoneDays((prev) =>
      prev.includes(cursor) ? prev.filter((d) => d !== cursor) : [...prev, cursor]
    );
  }

  return (
    <div className="page pl-root">
      <button className="pl-back" onClick={onBack}>
        ← Todos los planes
      </button>
      <header className="page-header">
        <div className="kicker">Plan de lectura · {plan.theme}</div>
        <h2>{plan.name}</h2>
      </header>

      <div className="pl-nav">
        <button onClick={() => go(cursor - 1)} title="Día anterior">
          ‹
        </button>
        <span className="pl-date">
          Día {cursor} de {plan.days}
        </span>
        <button onClick={() => go(cursor + 1)} title="Día siguiente">
          ›
        </button>
        <button className="pl-today" onClick={() => go(today)}>
          Hoy
        </button>
      </div>

      <div className="pl-stats">
        <span className="pl-bar-label">
          {done.length} de {plan.days} días leídos
        </span>
        <div className="pl-bar">
          <div className="pl-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="pl-pct">{pct}%</span>
      </div>

      {streak(plan.id) > 0 && (
        <div className="pl-streak">🔥 Racha: {streak(plan.id)} día(s)</div>
      )}

      <section className="pl-reads">
        <h3>Lecturas del día</h3>
        <div className="pl-read-chips">
          {day.refs.map((ref, i) => {
            const parsed = resolvePlanRef(ref);
            if (!parsed) return null;
            return (
              <button
                key={i}
                className="pl-read-chip"
                onClick={() => openRead(ref)}
              >
                {formatReference(parsed, 'abbr')}
              </button>
            );
          })}
        </div>
        <button className={`pl-done-btn${doneSet.has(cursor) ? ' done' : ''}`} onClick={toggleDone}>
          {doneSet.has(cursor) ? '✓ Leído' : '○ No leído'}
        </button>
      </section>

      <section className="pl-cal">
        {plan.daily.map((d) => {
          const isDone = doneSet.has(d.d);
          const isCurrent = d.d === cursor;
          return (
            <button
              key={d.d}
              className={`pl-cell${isDone ? ' done' : ''}${isCurrent ? ' cur' : ''}`}
              onClick={() => go(d.d)}
              title={`Día ${d.d}`}
            >
              {d.d}
            </button>
          );
        })}
      </section>
    </div>
  );
}