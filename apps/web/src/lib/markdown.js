// Renderizador Markdown mínimo y seguro: escapa HTML antes de aplicar
// transformaciones. Soporta encabezados, negrita, itálica, código, citas,
// listas y enlaces. Suficiente para notas de estudio.

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(
      /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

export function mdToHtml(src) {
  const lines = escapeHtml(String(src || '')).split('\n');
  const out = [];
  let inList = false;
  let inQuote = false;

  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      out.push('</blockquote>');
      inQuote = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (/^###\s+/.test(line)) {
      closeList();
      closeQuote();
      out.push(`<h3>${inline(line.replace(/^###\s+/, ''))}</h3>`);
    } else if (/^##\s+/.test(line)) {
      closeList();
      closeQuote();
      out.push(`<h2>${inline(line.replace(/^##\s+/, ''))}</h2>`);
    } else if (/^#\s+/.test(line)) {
      closeList();
      closeQuote();
      out.push(`<h1>${inline(line.replace(/^#\s+/, ''))}</h1>`);
    } else if (/^>\s?/.test(line)) {
      closeList();
      if (!inQuote) {
        out.push('<blockquote>');
        inQuote = true;
      }
      out.push(`<p>${inline(line.replace(/^>\s?/, ''))}</p>`);
    } else if (/^-\s+/.test(line)) {
      closeQuote();
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inline(line.replace(/^-\s+/, ''))}</li>`);
    } else if (line === '') {
      closeList();
      closeQuote();
    } else {
      closeList();
      closeQuote();
      out.push(`<p>${inline(line)}</p>`);
    }
  }

  closeList();
  closeQuote();
  return out.join('\n');
}
