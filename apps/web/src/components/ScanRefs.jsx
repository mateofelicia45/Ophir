import { useMemo } from 'react';
import { scanReferences } from '../lib/refscan.js';
import { BOOKS } from '../lib/references.js';
import { useOpenRef } from '../hooks/useOpenRef.js';

// Detecta referencias al estilo inglés dentro de texto libre ("Joshua 5:12",
// "Gen. 1:1") y las convierte en chips que abren el Lector.
export function ScanRefs({ text, pClass, refClass }) {
  const segments = useMemo(() => scanReferences(text), [text]);
  const openRef = useOpenRef();

  function open(chip) {
    const book = BOOKS.find((b) => b.id === chip.ref.bookId);
    if (!book) return;
    const parsed = {
      book,
      chapter: chip.ref.chapter,
      verseStart: chip.ref.verseStart ?? null,
      verseEnd: chip.ref.verseEnd ?? null,
    };
    openRef(parsed);
  }

  return (
    <p className={pClass}>
      {segments.map((s, i) =>
        s.type === 'ref' ? (
          <button key={i} className={refClass} onClick={() => open(s)}>
            {s.label}
          </button>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </p>
  );
}