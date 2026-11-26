import { load, save } from './storage';
import { syncData } from './sync';
import { BOOKS, formatReference } from './references';

let state = load('notes', []);
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function listNotes() {
  return state;
}

export function getNote(id) {
  return state.find((n) => n.id === id) || null;
}

export function createNote() {
  const note = {
    id: crypto.randomUUID(),
    title: 'Sin título',
    body: '',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
  state = [note, ...state];
  save('notes', state);
  emit();
  return note;
}

export function updateNote(id, patch) {
  state = state.map((n) =>
    n.id === id ? { ...n, ...patch, updated: new Date().toISOString() } : n
  );
  save('notes', state);
  emit();
  syncData().catch(e => console.error("Background sync failed", e));
}

export function deleteNote(id) {
  state = state.filter((n) => n.id !== id);
  save('notes', state);
  emit();
  syncData().catch(e => console.error("Background sync failed", e));
}

export function replaceAll(notes) {
  state = notes;
  save('notes', state);
  emit();
  syncData().catch(e => console.error("Background sync failed", e));
}

// ---------- Detección de referencias bíblicas citadas ----------

const WORD_CHAR = '\\wÁÉÍÓÚÜÑáéíóúüñ';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const BOOK_PATTERNS = BOOKS.map((b) => ({
  book: b,
  re: new RegExp(
    `(?<![${WORD_CHAR}])(?:${esc(b.name)}|${esc(b.abbr)})\\.?\\s+` +
      `(\\d{1,3})(?::(\\d{1,3})(?:[-–](\\d{1,3}))?)?`,
    'gi'
  ),
}));

export function extractRefs(text) {
  if (!text) return [];
  const found = new Map();
  for (const { book, re } of BOOK_PATTERNS) {
    let m;
    while ((m = re.exec(text))) {
      const chapter = Number(m[1]);
      if (chapter < 1 || chapter > book.chapters) continue;
      const verseStart = m[2] ? Number(m[2]) : null;
      const verseEnd = m[3] ? Number(m[3]) : null;
      const key = `${book.id}.${chapter}.${verseStart || ''}.${verseEnd || ''}`;
      if (!found.has(key)) {
        found.set(key, { book, chapter, verseStart, verseEnd });
      }
    }
  }
  return [...found.values()];
}

export function refLabel(ref) {
  return formatReference(ref, 'long');
}

export function refKey(ref) {
  return `${ref.book.id}.${ref.chapter}`;
}

// Mapa pasaje -> ids de notas que lo citan (base de los backlinks)
export function passageIndex(notes) {
  const map = new Map();
  for (const n of notes) {
    for (const r of extractRefs(n.body)) {
      const k = refKey(r);
      if (!map.has(k)) map.set(k, new Set());
      map.get(k).add(n.id);
    }
  }
  return map;
}

// ---------- Export / import estilo Obsidian ----------

export function toMarkdown(note) {
  const refs = extractRefs(note.body).map((r) => refLabel(r));
  const fm = [
    '---',
    `title: "${note.title.replace(/"/g, '\\"')}"`,
    `created: ${note.created}`,
    `updated: ${note.updated}`,
    'tags: [ophir]',
    refs.length ? `refs: [${refs.map((r) => `"${r}"`).join(', ')}]` : null,
    '---',
    '',
  ]
    .filter((l) => l !== null)
    .join('\n');
  return `${fm}\n${note.body}\n`;
}

export function download(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
