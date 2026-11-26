import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  subscribe,
  listNotes,
  createNote,
  updateNote,
  deleteNote,
  replaceAll,
  extractRefs,
  refLabel,
  refKey,
  passageIndex,
  toMarkdown,
  download,
} from '../../lib/notes.js';
import { mdToHtml } from '../../lib/markdown.js';
import { usePassage } from '../../context/PassageContext.jsx';

export default function NotesPage() {
  const [, force] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('edit');
  const navigate = useNavigate();
  const { setPassage } = usePassage();

  useEffect(() => subscribe(() => force((x) => x + 1)), []);

  const notes = listNotes();
  const note = notes.find((n) => n.id === selectedId) || null;

  const filtered = query
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.body.toLowerCase().includes(query.toLowerCase())
      )
    : notes;

  const refs = note ? extractRefs(note.body) : [];
  const backlinks = useMemo(() => {
    if (!note) return [];
    const index = passageIndex(notes);
    const myKeys = new Set(refs.map(refKey));
    const result = [];
    for (const [key, ids] of index) {
      if (!myKeys.has(key)) continue;
      for (const id of ids) {
        if (id !== note.id && !result.some((r) => r.id === id)) {
          result.push(notes.find((n) => n.id === id));
        }
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, notes]);

  function openInReader(ref) {
    setPassage({
      book: ref.book.name,
      chapter: ref.chapter,
      verseStart: ref.verseStart,
      verseEnd: ref.verseEnd,
    });
    navigate('/lector');
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error('formato inválido');
        replaceAll(data);
        setSelectedId(null);
      } catch (err) {
        alert(`No se pudo importar: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="notes-root">
      <aside className="notes-list">
        <div className="nl-actions">
          <button
            className="btn-primary"
            onClick={() => setSelectedId(createNote().id)}
          >
            + Nueva nota
          </button>
        </div>
        <input
          className="nl-search"
          type="text"
          placeholder="Buscar en notas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="nl-items">
          {filtered.map((n) => (
            <button
              key={n.id}
              className={`nl-item${n.id === selectedId ? ' on' : ''}`}
              onClick={() => setSelectedId(n.id)}
            >
              <span className="nl-title">{n.title || 'Sin título'}</span>
              <span className="nl-date">
                {new Date(n.updated).toLocaleDateString('es')}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="nl-empty">Sin notas todavía.</div>
          )}
        </div>
        <div className="nl-footer">
          <button onClick={() => download('ophir-notes.json', JSON.stringify(notes, null, 2), 'application/json')}>
            Exportar todo (JSON)
          </button>
          <label className="file-label">
            Importar JSON
            <input type="file" accept=".json" onChange={handleImport} />
          </label>
        </div>
      </aside>

      {note ? (
        <main className="notes-editor">
          <header className="ne-header">
            <input
              className="ne-title"
              value={note.title}
              placeholder="Título de la nota"
              onChange={(e) => updateNote(note.id, { title: e.target.value })}
            />
            <div className="ne-actions">
              <div className="mode-toggle">
                <button
                  className={mode === 'edit' ? 'on' : ''}
                  onClick={() => setMode('edit')}
                >
                  Editar
                </button>
                <button
                  className={mode === 'view' ? 'on' : ''}
                  onClick={() => setMode('view')}
                >
                  Ver
                </button>
              </div>
              <button
                onClick={() =>
                  download(
                    `${(note.title || 'nota').replace(/[^\w\s-]/g, '').trim() || 'nota'}.md`,
                    toMarkdown(note),
                    'text/markdown'
                  )
                }
                title="Descargar como .md con frontmatter YAML"
              >
                Exportar .md
              </button>
              <button
                className="danger"
                onClick={() => {
                  if (confirm('¿Eliminar esta nota?')) {
                    deleteNote(note.id);
                    setSelectedId(null);
                  }
                }}
              >
                Eliminar
              </button>
            </div>
          </header>

          {mode === 'edit' ? (
            <textarea
              className="ne-body"
              value={note.body}
              placeholder={
                'Escribí en Markdown. Las referencias bíblicas se detectan solas.\n\nEjemplo:\nCita clave: Romanos 8:29-30 — los que Dios preconoció...'
              }
              onChange={(e) => updateNote(note.id, { body: e.target.value })}
            />
          ) : (
            <article
              className="ne-preview"
              dangerouslySetInnerHTML={{ __html: mdToHtml(note.body) }}
            />
          )}

          <footer className="ne-meta">
            <div className="ne-refs">
              <h4>Pasajes citados</h4>
              <div className="ref-chips">
                {refs.length === 0 && (
                  <span className="hint">
                    Citá un pasaje (ej. «Romanos 8:29») y aparece acá.
                  </span>
                )}
                {refs.map((r) => (
                  <button key={refLabel(r)} onClick={() => openInReader(r)}>
                    {refLabel(r)}
                  </button>
                ))}
              </div>
            </div>
            <div className="ne-backlinks">
              <h4>Backlinks ({backlinks.length})</h4>
              {backlinks.length === 0 && (
                <span className="hint">
                  Otras notas que citen los mismos pasajes aparecen acá.
                </span>
              )}
              {backlinks.map((b) => (
                <button
                  key={b.id}
                  className="backlink"
                  onClick={() => setSelectedId(b.id)}
                >
                  {b.title || 'Sin título'}
                </button>
              ))}
            </div>
          </footer>
        </main>
      ) : (
        <main className="notes-placeholder">
          <p>
            Elegí o creá una nota. Formato Markdown, con detección automática
            de referencias bíblicas y export compatible con Obsidian.
          </p>
        </main>
      )}
    </div>
  );
}
