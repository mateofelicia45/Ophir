import { useMemo } from 'react';
import { parseReference, formatReference } from '../lib/references.js';
import { useOpenRef } from '../hooks/useOpenRef.js';

// Divide un texto en texto plano y marcas [[Referencia]] clicables.
export function RichText({ text, as: Tag = 'p', pClass, refClass }) {
  const openRef = useOpenRef();
  const parts = useMemo(() => text.split(/(\[\[[^\]]+\]\])/g), [text]);
  return (
    <Tag className={pClass}>
      {parts.map((part, i) => {
        const m = part.match(/^\[\[([^\]]+)\]\]$/);
        if (!m) return <span key={i}>{part}</span>;
        const parsed = parseReference(m[1]);
        if (!parsed) return <span key={i}>{m[1]}</span>;
        return (
          <button
            key={i}
            className={refClass}
            onClick={() => openRef(parsed)}
          >
            {formatReference(parsed)}
          </button>
        );
      })}
    </Tag>
  );
}
