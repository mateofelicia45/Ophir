// Mantiene la URL del Lector (/lector/:bookId/:chapter) en paso con el pasaje del contexto.
// - Ruta -> contexto: si la ruta trae un capítulo válido distinto del pasaje, el pasaje pasa a ese
//   capítulo (sin versículo); si coincide, se conserva el versículo. Ruta inválida: se vuelve al pasaje.
// - Contexto -> ruta: solo cuando el pasaje CAMBIA (no al montar), para no pisar la ruta recién abierta.
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BOOKS } from '../../lib/references.js';

export function readerPath(passage) {
  const book = BOOKS.find((b) => b.name === passage.book);
  return book ? `/lector/${book.id}/${passage.chapter}` : '/lector/gen/1';
}

export function parseReaderParams(bookId, chapter) {
  const book = BOOKS.find((b) => b.id === bookId);
  if (!book || !/^\d+$/.test(chapter || '')) return null;
  const ch = Number(chapter);
  return ch >= 1 && ch <= book.chapters ? { book, chapter: ch } : null;
}

export function useReaderUrl(passage, setPassage) {
  const { bookId, chapter } = useParams();
  const navigate = useNavigate();
  const passageRef = useRef(passage);
  useEffect(() => { passageRef.current = passage; });

  // Ruta -> contexto.
  useEffect(() => {
    const target = parseReaderParams(bookId, chapter);
    const cur = passageRef.current;
    if (!target) {
      navigate(readerPath(cur), { replace: true });
    } else if (target.book.name !== cur.book || target.chapter !== cur.chapter) {
      setPassage({ book: target.book.name, chapter: target.chapter });
    }
  }, [bookId, chapter, navigate, setPassage]);

  // Contexto -> ruta, solo ante un cambio real de capítulo.
  const lastKey = useRef(`${passage.book}|${passage.chapter}`);
  useEffect(() => {
    const key = `${passage.book}|${passage.chapter}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    const path = readerPath(passage);
    if (path !== `/lector/${bookId}/${chapter}`) navigate(path, { replace: true });
  }, [passage, bookId, chapter, navigate]);
}
