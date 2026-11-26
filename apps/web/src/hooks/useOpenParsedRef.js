import { useOpenRef } from './useOpenRef.js';
import { BOOKS } from '../lib/references.js';

// Abre en el Lector una referencia en formato {bookId, chapter, verseStart, verseEnd}.
export function useOpenParsedRef() {
  const openRef = useOpenRef();
  return (ref) => {
    if (!ref?.bookId) return;
    const book = BOOKS.find((b) => b.id === ref.bookId);
    if (!book) return;
    openRef({
      book,
      chapter: ref.chapter,
      verseStart: ref.verseStart ?? null,
      verseEnd: ref.verseEnd ?? null,
    });
  };
}