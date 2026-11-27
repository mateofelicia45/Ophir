// Descarga de un texto como archivo (Blob + enlace con download).
export function downloadText(name, text, mime = 'text/plain') {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
    return true;
  } catch {
    return false;
  }
}
