import { useNavigate } from 'react-router-dom';
import { usePassage } from '../context/PassageContext.jsx';

// Abre una referencia ya parseada en el Lector.
export function useOpenRef() {
  const navigate = useNavigate();
  const { setPassage } = usePassage();
  return (parsed) => {
    setPassage({
      book: parsed.book.name,
      chapter: parsed.chapter,
      verseStart: parsed.verseStart ?? null,
      verseEnd: parsed.verseEnd ?? null,
    });
    navigate('/lector');
  };
}
