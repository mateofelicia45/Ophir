// «¿Dónde estoy?»: pide la ubicación y el aviso lo muestra MapOverlays.
export default function LocateButton({ onLocate, busy }) {
  return (
    <button type="button" className="ib locate" onClick={onLocate} disabled={busy}
      aria-label="¿Dónde estoy?" title={busy ? 'Buscando tu ubicación…' : '¿Dónde estoy?'}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="6.5" /><circle cx="12" cy="12" r="1.8" fill="currentColor" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    </button>
  );
}
