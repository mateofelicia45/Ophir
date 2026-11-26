import { api } from './api';
import { load, save } from './storage';

export async function syncData() {
  try {
    // 1. Collect local state
    const localHighlights = load('highlights', {});
    const localNotes = load('notes', {});
    
    // Format highlights for API: { ref: 'gen.1.1', color: 'dorado' }
    const highlightsPayload = Object.entries(localHighlights).map(([ref, val]) => ({
      ref,
      color: val.c,
      updated_at: val.updated || new Date().toISOString()
    }));

    // Format notes for API
    const notesPayload = Object.values(localNotes).map(note => ({
      id: note.id,
      title: note.title,
      body: note.body,
      created: note.created,
      updated: note.updated
    }));

    // 2. Push to server
    const serverState = await api.pushSync({
      notes: notesPayload,
      highlights: highlightsPayload
    });

    // 3. Merge server state back to local
    // Server returns consolidated state
    const mergedHighlights = {};
    serverState.highlights.forEach(hl => {
      mergedHighlights[hl.ref] = { c: hl.color, updated: hl.updated_at };
    });
    save('highlights', mergedHighlights);

    const mergedNotes = {};
    serverState.notes.forEach(n => {
      mergedNotes[n.id] = {
        id: n.id,
        title: n.title,
        body: n.body,
        created: n.created_at,
        updated: n.updated_at
      };
    });
    save('notes', mergedNotes);

    return { success: true };
  } catch (e) {
    console.error('Sync failed:', e);
    return { success: false, error: e.message };
  }
}
